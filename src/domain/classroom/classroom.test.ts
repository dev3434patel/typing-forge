import { beforeEach, describe, expect, it } from 'vitest';
import { classroomAlias, classroomReport, importClassroomReport, newPrivateClassCode, validAggregate, type ClassAggregate } from './model';
import { LocalClassroomAdapter, classroomStorageKey, forgetClassroomMemory } from './local-adapter';
import { certificateFacts, certificateHtml } from './certificate';

const aggregate: ClassAggregate = { alias: 'Student-01', sessions: 1, activeMs: 60000, insertionAttempts: 100, correctAttempts: 98, bestWpm: 40, verification: 'manual-unverified' };
function storage() { const values = new Map<string, string>(); return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } }; }
beforeEach(() => { for (const owner of ['alice', 'bob', 'memory', 'full', 'broken']) forgetClassroomMemory(owner); });
describe('private bounded classroom data', () => {
  it.each(['Student-01', 'Quiet Typist', 'विद्यार्थी', 'વિદ્યાર્થી', 'Pupil.12'])('accepts a pseudonymous alias%s', alias => expect(classroomAlias(alias)).toBe(alias));
  it.each(['a', 'test@example.test', '<script>', 'https://site', 'x\nname', 'x'.repeat(33)])('rejects identifying or malformed alias%s', alias => expect(() => classroomAlias(alias)).toThrow());
  it('uses exactly128bits for local code labels', () => {
    expect(newPrivateClassCode(new Uint8Array(16).fill(17))).toBe('1111-1111-1111-1111-1111-1111-1111-1111');
    expect(() => newPrivateClassCode(new Uint8Array(15))).toThrow();
  });
  it.each([{ sessions: -1 }, { sessions: 1001 }, { correctAttempts: 101 }, { activeMs: Infinity }, { insertionAttempts: 1.5 }, { bestWpm: 1001 }])('bounds aggregate mutation%j', patch => expect(validAggregate({ ...aggregate, ...patch })).toBe(false));
  it('isolates local owner records and strips unexpected fields', () => {
    const disk = storage(), alice = new LocalClassroomAdapter('alice', disk), bob = new LocalClassroomAdapter('bob', disk);
    const room = alice.create('Evening practice'); alice.replaceMembers(room.id, [{ ...aggregate, email: 'not-retained@example.test' } as ClassAggregate]);
    expect(bob.snapshot().classes).toHaveLength(0);
    expect(JSON.stringify(alice.snapshot())).not.toContain('not-retained');
    expect(classroomStorageKey('alice')).not.toBe(classroomStorageKey('bob'));
  });
  it('exports no code or member/session identity and forces imports to manual provenance', () => {
    const adapter = new LocalClassroomAdapter('alice', storage()), room = adapter.create('Class one');
    adapter.replaceMembers(room.id, [{ ...aggregate, verification: 'replay-checked-not-human-verified' }]);
    const exported = JSON.stringify(classroomReport(adapter.snapshot().classes[0]));
    expect(exported).not.toContain(room.localCode!); expect(exported).not.toContain(room.id);
    expect(importClassroomReport(exported)[0].verification).toBe('manual-unverified');
  });
  it('rejects duplicate aliases, oversized reports and impossible counts', () => {
    expect(() => importClassroomReport('x'.repeat(64001))).toThrow();
    expect(() => importClassroomReport(JSON.stringify({ format: 'sparowtype-classroom-report-v1', members: [aggregate, aggregate] }))).toThrow();
    expect(() => importClassroomReport(JSON.stringify({ format: 'sparowtype-classroom-report-v1', members: [{ ...aggregate, correctAttempts: 999 }] }))).toThrow();
  });
  it('never overwrites corrupt persisted data or makes partial in-memory mutations', () => {
    const disk = storage(), original = '{broken'; disk.setItem(classroomStorageKey('broken'), original);
    const adapter = new LocalClassroomAdapter('broken', disk);
    expect(() => adapter.create('New classroom')).toThrow();
    expect(adapter.snapshot().classes).toHaveLength(0);
    expect(disk.getItem(classroomStorageKey('broken'))).toBe(original);
  });
  it('keeps memory-only records available to another adapter during the same visit', () => {
    const first = new LocalClassroomAdapter('memory', null); first.create('Memory class');
    expect(first.error).toContain('in-memory');
    expect(new LocalClassroomAdapter('memory', null).snapshot().classes).toHaveLength(1);
  });
  it('keeps full-storage fallback without pretending persistence succeeded', () => {
    const disk = { getItem: () => null, setItem: () => { throw new Error('full'); }, removeItem() {} };
    const first = new LocalClassroomAdapter('full', disk); first.create('Full class');
    expect(first.error).toContain('export before closing');
    expect(new LocalClassroomAdapter('full', disk).snapshot().classes).toHaveLength(1);
  });
  it('continues with an explicit memory fallback if storage access is revoked during a visit', () => {
    const disk = storage(); let blocked = false;
    const guarded = { ...disk, getItem: (key: string) => { if (blocked) throw new Error('blocked'); return disk.getItem(key); } };
    const first = new LocalClassroomAdapter('alice', guarded); first.create('First class'); blocked = true;
    first.create('Memory class'); expect(first.snapshot().classes).toHaveLength(2); expect(first.error).toContain('in-memory');
    expect(new LocalClassroomAdapter('alice', null).snapshot().classes).toHaveLength(2);
  });
  it('clears owner memory and invalidates stale adapters even when persistent deletion fails', () => {
    const disk = storage(), first = new LocalClassroomAdapter('alice', disk); first.create('Private class');
    const clearing = new LocalClassroomAdapter('alice', { ...disk, removeItem: () => { throw new Error('blocked'); } });
    expect(() => clearing.clear()).toThrow('memory was cleared');
    expect(clearing.snapshot().classes).toHaveLength(0);
    expect(new LocalClassroomAdapter('alice', null).snapshot().classes).toHaveLength(0);
    expect(() => first.create('Resurrection')).toThrow('was cleared');
    expect(disk.getItem(classroomStorageKey('alice'))).not.toBeNull();
  });
  it('prevents a stale adapter from resurrecting owner-cleared data', () => {
    const disk = storage(), first = new LocalClassroomAdapter('alice', disk); first.create('Old class');
    new LocalClassroomAdapter('alice', disk).clear();
    expect(() => first.create('Resurrection')).toThrow();
    expect(disk.getItem(classroomStorageKey('alice'))).toBeNull();
  });
  it('refuses to overwrite another tab’s updated class', () => {
    const disk = storage(), first = new LocalClassroomAdapter('alice', disk), stale = new LocalClassroomAdapter('alice', disk);
    first.create('First'); expect(() => stale.create('Stale')).toThrow();
    expect(new LocalClassroomAdapter('alice', disk).snapshot().classes).toHaveLength(1);
  });
  it('omits alias from participation summaries unless explicitly opted in', () => {
    expect(certificateFacts(aggregate).alias).toBeNull(); expect(certificateHtml(aggregate)).not.toContain(aggregate.alias);
    expect(certificateFacts(aggregate, true).alias).toBe(aggregate.alias);
    expect(certificateHtml(aggregate, true)).toContain('Not a verified speed certificate');
  });
  it('escapes certificate text even when handed an unvalidated alias', () => {
    const html = certificateHtml({ ...aggregate, alias: '<img src=x onerror=alert(1)>' }, true);
    expect(html).not.toContain('<img'); expect(html).toContain('&lt;img');
  });
});
