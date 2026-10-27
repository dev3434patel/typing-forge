export interface ClassAggregate {
  alias: string; sessions: number; activeMs: number; insertionAttempts: number; correctAttempts: number;
  bestWpm: number; verification: 'manual-unverified' | 'replay-checked-not-human-verified';
}
export interface Classroom { id: string; title: string; createdAt: string; members: Array<ClassAggregate & { id: string }>; localCode?: string }
export interface LocalClassroomState { version: 1; ownerId: string; classes: Classroom[] }
export function classroomAlias(value: string): string {
  const alias = value.normalize('NFC').trim();
  if (!/^[\p{L}\p{N}][\p{L}\p{M}\p{N} _.-]{1,31}$/u.test(alias)) throw new Error('Use a 2–32 character alias, without an email address or markup.');
  return alias;
}
export function validAggregate(value: unknown): value is ClassAggregate {
  if (!value || typeof value !== 'object') return false;
  const item = value as ClassAggregate;
  try { if (classroomAlias(item.alias) !== item.alias) return false; } catch { return false; }
  return Number.isInteger(item.sessions) && item.sessions >= 0 && item.sessions <= 1000 && Number.isFinite(item.activeMs) && item.activeMs >= 0 && item.activeMs <= 600000000 && Number.isInteger(item.insertionAttempts) && item.insertionAttempts >= 0 && item.insertionAttempts <= 20000000 && Number.isInteger(item.correctAttempts) && item.correctAttempts >= 0 && item.correctAttempts <= item.insertionAttempts && Number.isFinite(item.bestWpm) && item.bestWpm >= 0 && item.bestWpm <= 1000 && ['manual-unverified', 'replay-checked-not-human-verified'].includes(item.verification);
}
export function aggregateAccuracy(item: ClassAggregate): number | null { return item.insertionAttempts ? item.correctAttempts / item.insertionAttempts * 100 : null; }
export function newPrivateClassCode(bytes: Uint8Array = crypto.getRandomValues(new Uint8Array(16))): string {
  if (bytes.length !== 16) throw new Error('Class codes require128 random bits.');
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase().match(/.{4}/g)!.join('-');
}
/** A bounded report exchange never includes private codes, names, emails or input text. */
export function classroomReport(item: Classroom) {
  return { format: 'sparowtype-classroom-report-v1', title: item.title, source: 'device-only-manual-unverified', members: item.members.map(({ alias, sessions, activeMs, insertionAttempts, correctAttempts, bestWpm }) => ({ alias, sessions, activeMs, insertionAttempts, correctAttempts, bestWpm, verification: 'manual-unverified' as const })) };
}
export function importClassroomReport(text: string): ClassAggregate[] {
  if (text.length > 64000) throw new Error('Class reports are limited to64KB.');
  const data = JSON.parse(text) as { format?: string; members?: unknown[] };
  if (data.format !== 'sparowtype-classroom-report-v1' || !Array.isArray(data.members) || data.members.length > 100) throw new Error('Use a bounded SparowType classroom report with at most100 aliases.');
  const aliases = new Set<string>();
  return data.members.map(member => {
    if (!validAggregate(member)) throw new Error('A class aggregate has invalid counts, identity or bounds.');
    const alias = classroomAlias(member.alias);
    if (aliases.has(alias.toLocaleLowerCase())) throw new Error('Each classroom alias must be unique.');
    aliases.add(alias.toLocaleLowerCase());
    // Explicit allowlist discards unexpected fields instead of retaining imported text.
    return { alias, sessions: member.sessions, activeMs: member.activeMs, insertionAttempts: member.insertionAttempts, correctAttempts: member.correctAttempts, bestWpm: member.bestWpm, verification: 'manual-unverified' };
  });
}
