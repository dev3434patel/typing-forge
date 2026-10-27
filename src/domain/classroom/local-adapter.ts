import { classroomAlias, classroomReport, newPrivateClassCode, type ClassAggregate, type Classroom, type LocalClassroomState, validAggregate } from './model';
export const classroomStorageKey = (owner: string) => `sparowtype:classroom:v1:${encodeURIComponent(owner)}`;
const ephemeral = new Map<string, LocalClassroomState>();
const fallbackOwners = new Set<string>();
const durableSnapshots = new Map<string, string | null>();
const revisions = new Map<string, number>();
export const CLASSROOM_CLEAR_EVENT = 'sparowtype:classroom-cleared';
export class LocalClassroomAdapter {
  private memory: LocalClassroomState;
  private lastStored: string | null = null;
  private revision: number;
  error: string | null = null;
  constructor(private owner: string, private storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null) {
    this.memory = structuredClone(ephemeral.get(owner) ?? { version: 1, ownerId: owner, classes: [] });
    this.revision = revisions.get(owner) ?? 0;
    if (this.storage === undefined) { try { this.storage = globalThis.localStorage ?? null; } catch { this.storage = null; } }
    let raw: string | null = null;
    try { raw = this.storage?.getItem(classroomStorageKey(owner)) ?? null; }
    catch { this.storage = null; }
    try {
      this.lastStored = raw ?? null;
      const retainedFallback = fallbackOwners.has(owner) && durableSnapshots.get(owner) === raw;
      if (this.storage && !raw && !retainedFallback) this.memory = { version: 1, ownerId: owner, classes: [] };
      if (raw) {
        if (raw.length > 256000) throw new Error('Oversized class data');
        const parsed = JSON.parse(raw) as LocalClassroomState;
        if (parsed.version !== 1 || parsed.ownerId !== owner || !Array.isArray(parsed.classes) || parsed.classes.length > 20 || parsed.classes.some(item => typeof item.id !== 'string' || typeof item.title !== 'string' || !Array.isArray(item.members) || item.members.length > 100 || item.members.some(member => !validAggregate(member)))) throw new Error('Invalid class data');
        if (!retainedFallback) this.memory = parsed;
      }
    } catch { this.error = 'Stored classroom data could not be read. It was preserved; export or recover it before replacing it.'; }
    if (!this.storage) this.error = 'Classroom storage is unavailable. This visit keeps an in-memory copy; export before closing.';
  }
  snapshot(): LocalClassroomState { return structuredClone(this.memory); }
  private persist() {
    if (this.error?.startsWith('Stored classroom')) throw new Error(this.error);
    ephemeral.set(this.owner, structuredClone(this.memory));
    durableSnapshots.set(this.owner, this.lastStored);
    try { const text = JSON.stringify(this.memory); this.storage?.setItem(classroomStorageKey(this.owner), text); this.lastStored = this.storage ? text : null; durableSnapshots.set(this.owner, this.lastStored); if (this.storage) fallbackOwners.delete(this.owner); else fallbackOwners.add(this.owner); }
    catch { fallbackOwners.add(this.owner); this.error = 'Classroom storage is unavailable. This visit keeps an in-memory copy; export before closing.'; }
  }
  private writable() {
    if (this.error?.startsWith('Stored classroom')) throw new Error(this.error);
    if ((revisions.get(this.owner) ?? 0) !== this.revision) throw new Error('This owner’s classroom data was cleared. Reopen the classroom workspace.');
    if (this.storage) {
      let current: string | null;
      try { current = this.storage.getItem(classroomStorageKey(this.owner)); }
      catch { this.storage = null; this.error = 'Classroom storage is unavailable. This visit keeps an in-memory copy; export before closing.'; return; }
      if (current !== this.lastStored) throw new Error('Classroom data changed in another tab. Reload before editing.');
    }
  }
  create(title: string): Classroom {
    this.writable();
    title = title.trim();
    if (title.length < 2 || title.length > 80 || [...title].some(character => character === '<' || character === '>' || character.codePointAt(0)! < 32)) throw new Error('Use a title of2–80 characters without markup.');
    if (this.memory.classes.length >= 20) throw new Error('The local workspace has reached20 classrooms.');
    const item: Classroom = { id: crypto.randomUUID(), title, createdAt: new Date().toISOString(), members: [], localCode: newPrivateClassCode() };
    this.memory.classes.push(item); this.persist(); return structuredClone(item);
  }
  replaceMembers(classId: string, members: readonly ClassAggregate[]) {
    this.writable();
    if (members.length > 100 || members.some(member => !validAggregate(member))) throw new Error('Use at most100 valid aggregate reports.');
    const item = this.memory.classes.find(room => room.id === classId); if (!item) throw new Error('Classroom not found.');
    const aliases = members.map(member => classroomAlias(member.alias).toLocaleLowerCase());
    if (new Set(aliases).size !== aliases.length) throw new Error('Each alias must be unique.');
    item.members = members.map(member => ({ alias: member.alias, sessions: member.sessions, activeMs: member.activeMs, insertionAttempts: member.insertionAttempts, correctAttempts: member.correctAttempts, bestWpm: member.bestWpm, id: crypto.randomUUID(), verification: 'manual-unverified' })); this.persist();
  }
  remove(id: string) { this.writable(); this.memory.classes = this.memory.classes.filter(item => item.id !== id); this.persist(); }
  clear() {
    let failed = false;
    try { this.storage?.removeItem(classroomStorageKey(this.owner)); } catch { failed = true; }
    finally { forgetClassroomMemory(this.owner); this.revision = revisions.get(this.owner)!; this.lastStored = null; this.memory = { version: 1, ownerId: this.owner, classes: [] }; this.error = null; }
    if (failed) throw new Error('Classroom memory was cleared, but browser storage refused deletion. Stored reports may remain; restore storage access and retry.');
  }
}
export function forgetClassroomMemory(owner: string) { ephemeral.delete(owner); fallbackOwners.delete(owner); durableSnapshots.delete(owner); revisions.set(owner, (revisions.get(owner) ?? 0) + 1); }
export function exportLocalClassrooms(owner: string) {
  const adapter = new LocalClassroomAdapter(owner);
  if (adapter.error?.startsWith('Stored classroom')) throw new Error(adapter.error);
  return { version: 1, ownerId: owner, storage: 'device-only-manual', classes: adapter.snapshot().classes.map(classroomReport) };
}
export function clearLocalClassrooms(owner: string) {
  const adapter = new LocalClassroomAdapter(owner);
  try { adapter.clear(); }
  finally { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CLASSROOM_CLEAR_EVENT, { detail: { ownerId: owner } })); }
}
