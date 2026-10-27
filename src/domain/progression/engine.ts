import { dateInZone, dayNumber, weekKey } from './calendar';
import { badgeCatalog, COSMETICS, FREEZE_PRICE, levelForXp, titleForLevel } from './catalog';
import { advanceQuest, dailyQuests, questPeriod, weeklyQuest } from './quests';
import { applySkillContributions, emptySkills } from './skills';
import { advanceStreak, earnFreeze, emptyStreak } from './streak';
import type { ActivityFact, KeysEntry, Profile, ProgressionCommand, Verification } from './types';

export function accuracyMultiplier(correct: number, attempts: number): number { const accuracy = attempts > 0 ? correct / attempts * 100 : 0; return accuracy >= 98 ? 1 : accuracy >= 95 ? .8 : accuracy >= 90 ? .6 : .3; }
export function baseXp(fact: Pick<ActivityFact, 'completedChars' | 'correctAttempts' | 'attempts' | 'kind'>): number { return Math.round(fact.completedChars * accuracyMultiplier(fact.correctAttempts, fact.attempts) * (fact.kind === 'game' ? .4 : 1)); }
export function emptyProfile(ownerId: string, verification: Verification = 'local'): Profile { return { version: 1, ownerId, verification, xp: 0, level: 1, title: 'Hunter', completedChars: 0, skills: emptySkills(), skillMaps: {}, skillScope: null, streak: emptyStreak(), quests: [], ledger: [], keys: 0, badges: badgeCatalog(), receipts: [], commands: [], cosmetics: [], equipped: null, weeklyXp: {}, gameXp: {} }; }
function award(profile: Profile, entry: KeysEntry): void { if (profile.ledger.some(item => item.id === entry.id)) return; if (profile.keys + entry.delta < 0) throw new Error('Not enough Keys'); profile.ledger.push(entry); profile.keys += entry.delta; }
function ensureQuests(profile: Profile, date: string): void {
  if (!profile.quests.some(quest => quest.date === date && quest.template !== 'weekly')) profile.quests.push(...dailyQuests(profile.ownerId, date, profile.skills, false, profile.skillScope));
  if (!profile.quests.some(quest => quest.id === `weekly:${weekKey(date)}`)) profile.quests.push(weeklyQuest(date));
}
export function validateFact(fact: ActivityFact, ownerId: string, verification: Verification): void {
  if (fact.version !== 1 || fact.ownerId !== ownerId || fact.verification !== verification || !fact.id || fact.id.length > 128 || typeof fact.payloadHash !== 'string' || !fact.payloadHash || !['practice', 'lesson', 'race', 'game'].includes(fact.kind)) throw new Error('Invalid progression receipt identity');
  dateInZone(fact.at, fact.timeZone);
  if (fact.startedAt !== undefined) dateInZone(fact.startedAt, fact.timeZone);
  for (const value of [fact.completedChars, fact.correctAttempts, fact.attempts]) if (!Number.isSafeInteger(value) || value < 0 || value > 1000000) throw new Error('Invalid progression receipt counts');
  if (fact.correctAttempts > fact.attempts || fact.completedChars > fact.correctAttempts || !Array.isArray(fact.skills) || fact.skills.length > 20000) throw new Error('Invalid canonical progression counts');
  if ([fact.lessonQualified, fact.raceWin, fact.personalBest30].some(value => typeof value !== 'boolean')) throw new Error('Invalid progression qualification flags');
  if (fact.skillScope !== undefined && (typeof fact.skillScope !== 'string' || !fact.skillScope || fact.skillScope.length > 200)) throw new Error('Invalid skill scope');
  for (const sample of fact.skills) if (!['keys', 'fingers', 'bigrams', 'trigrams'].includes(sample.group) || typeof sample.key !== 'string' || !sample.key || sample.key.length > 100 || !Number.isSafeInteger(sample.n) || sample.n < 1 || !Number.isSafeInteger(sample.correct) || sample.correct < 0 || sample.correct > sample.n || !Number.isSafeInteger(sample.timingN) || sample.timingN < 0 || sample.timingN > sample.correct || !Number.isFinite(sample.weighted) || sample.weighted < 0 || sample.weighted > 2000 || (sample.ewma !== null && (!Number.isFinite(sample.ewma) || sample.ewma <= 0 || sample.ewma > 2000)) || (sample.lastLatency !== null && (!Number.isFinite(sample.lastLatency) || sample.lastLatency <= 0 || sample.lastLatency > 2000))) throw new Error('Invalid skill sufficient statistics');
}
function applyFact(profile: Profile, fact: ActivityFact): void {
  const scope = fact.skillScope ?? 'en|qwerty|keyboard|prose';
  if (!Object.prototype.hasOwnProperty.call(profile.skillMaps, scope)) Object.defineProperty(profile.skillMaps, scope, { value: emptySkills(), enumerable: true, writable: true, configurable: true });
  profile.skillScope ??= scope;
  const date = dateInZone(fact.at, profile.streak.zone ?? fact.timeZone);
  ensureQuests(profile, date);
  let xp = baseXp(fact);
  if (fact.kind === 'game') { xp = Math.min(xp, Math.max(0, 1500 - (profile.gameXp[date] ?? 0))); profile.gameXp[date] = (profile.gameXp[date] ?? 0) + xp; }
  profile.xp += xp;
  if (!Number.isSafeInteger(profile.xp)) throw new Error('Progression XP limit exceeded');
  const week = weekKey(date); profile.weeklyXp[week] = (profile.weeklyXp[week] ?? 0) + xp;
  applySkillContributions(profile.skillMaps[scope], fact.skills);
  profile.skills = profile.skillMaps[profile.skillScope];
  const oldStreak = profile.streak.count;
  advanceStreak(profile.streak, fact);
  for (const quest of profile.quests) if (questPeriod(quest, date)) {
    const completed = quest.completedBy; advanceQuest(quest, fact);
    if (!completed && quest.completedBy) { award(profile, { id: `quest:${quest.id}`, at: fact.at, delta: quest.reward, reason: 'Quest completed', sourceId: fact.id }); earnFreeze(profile.streak, `freeze:${quest.id}`, 'quest', date); }
  }
  if (fact.lessonQualified) award(profile, { id: `lesson:${fact.id}`, at: fact.at, delta: 10, reason: 'Qualified lesson', sourceId: fact.id });
  if (fact.raceWin && fact.verification === 'server-verified') award(profile, { id: `race:${fact.id}`, at: fact.at, delta: 15, reason: 'Verified race win', sourceId: fact.id });
  if (fact.kind === 'game' && fact.completedChars >= 25) {
    const daily = profile.ledger.filter(entry => entry.reason === 'Arcade practice' && dateInZone(entry.at, profile.streak.zone ?? fact.timeZone) === date).reduce((sum, entry) => sum + entry.delta, 0);
    const reward = Math.min(20, 5 + Math.floor(fact.completedChars / 50), Math.max(0, 100 - daily));
    if (reward) award(profile, { id: `game:${fact.id}`, at: fact.at, delta: reward, reason: 'Arcade practice', sourceId: fact.id });
  }
  for (const milestone of [7, 30, 100, 365]) if (oldStreak < milestone && profile.streak.count >= milestone) award(profile, { id: `streak:${milestone}`, at: fact.at, delta: 50, reason: `${milestone}-day milestone`, sourceId: fact.id });
  profile.completedChars += fact.completedChars;
  const chars = profile.completedChars;
  const predicates = [chars >= 1000, chars >= 10000, chars >= 100000, fact.completedChars >= 100 && fact.correctAttempts / fact.attempts >= .98, profile.streak.longest >= 7, profile.streak.longest >= 30];
  profile.badges.forEach((badge, index) => { if (!badge.earnedBy && predicates[index]) badge.earnedBy = fact.id; });
}
function applyCommand(profile: Profile, command: ProgressionCommand): void {
  const date = dateInZone(command.at, profile.streak.zone ?? 'UTC'); ensureQuests(profile, date);
  if (command.kind === 'reroll') {
    if (profile.commands.some(other => other.id !== command.id && other.kind === 'reroll' && other.at <= command.at && dateInZone(other.at, profile.streak.zone ?? 'UTC') === date)) throw new Error('One free reroll per calendar day');
    const existing = profile.quests.filter(quest => quest.date === date && quest.template !== 'weekly');
    if (existing.some(quest => quest.completedBy)) throw new Error('Completed daily quests cannot be rerolled');
    profile.quests = profile.quests.filter(quest => !existing.includes(quest)); profile.quests.push(...dailyQuests(profile.ownerId, date, profile.skills, true, profile.skillScope));
  } else if (command.kind === 'freeze-auto') profile.streak.autoFreeze = command.value === true;
  else if (command.kind === 'buy') {
    const item = COSMETICS.find(cosmetic => cosmetic.id === command.value);
    if (command.value === 'streak-freeze') {
      if (!earnFreeze(profile.streak, command.id, 'purchase', date)) throw new Error('A purchased freeze is already available');
      award(profile, { id: `buy:${command.id}`, at: command.at, delta: -FREEZE_PRICE, reason: 'Streak freeze', sourceId: command.id });
    } else {
      if (!item || profile.cosmetics.includes(item.id)) throw new Error('Unknown or already owned cosmetic');
      award(profile, { id: `buy:${command.id}`, at: command.at, delta: -item.price, reason: item.label, sourceId: command.id }); profile.cosmetics.push(item.id);
    }
  } else if (command.kind === 'equip') {
    if (command.value !== '' && !profile.cosmetics.includes(String(command.value))) throw new Error('Own a cosmetic before equipping it');
    profile.equipped = command.value === '' ? null : String(command.value);
  } else throw new Error('Unknown progression command');
}
/** Replay immutable receipts in canonical chronological order; out-of-order offline claims converge. */
export function rebuildProfile(ownerId: string, verification: Verification, receipts: ActivityFact[], commands: ProgressionCommand[] = []): Profile {
  const profile = emptyProfile(ownerId, verification), identities = new Map<string, string>();
  for (const fact of receipts) { validateFact(fact, ownerId, verification); const previous = identities.get(fact.id); if (previous && previous !== JSON.stringify(fact)) throw new Error('Conflicting progression receipt'); if (!previous) { identities.set(fact.id, JSON.stringify(fact)); profile.receipts.push(fact); } }
  profile.receipts.sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const commandIds = new Map<string, string>();
  for (const command of commands) {
    if (!command.id || command.id.length > 128) throw new Error('Invalid command identity'); dateInZone(command.at, 'UTC');
    const previous = commandIds.get(command.id); if (previous && previous !== JSON.stringify(command)) throw new Error('Conflicting progression command');
    if (!previous) { commandIds.set(command.id, JSON.stringify(command)); profile.commands.push(command); }
  }
  profile.commands.sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));
  const events = [...profile.receipts.map(fact => ({ at: fact.at, id: fact.id, fact })), ...profile.commands.map(command => ({ at: command.at, id: command.id, command }))].sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const event of events) { if ('fact' in event) applyFact(profile, event.fact); else applyCommand(profile, event.command); }
  profile.level = levelForXp(profile.xp); profile.title = titleForLevel(profile.level);
  return profile;
}
export function claimFact(profile: Profile, fact: ActivityFact): Profile {
  validateFact(fact, profile.ownerId, profile.verification);
  const duplicate = profile.receipts.find(receipt => receipt.id === fact.id);
  if (duplicate) { if (JSON.stringify(duplicate) !== JSON.stringify(fact)) throw new Error('Conflicting progression receipt'); return profile; }
  const latest = Math.max(profile.receipts.at(-1)?.at ?? 0, profile.commands.at(-1)?.at ?? 0);
  if (fact.at <= latest) return rebuildProfile(profile.ownerId, profile.verification, [...profile.receipts, fact], profile.commands);
  const next = JSON.parse(JSON.stringify(profile)) as Profile;
  next.receipts.push(fact); applyFact(next, fact); next.level = levelForXp(next.xp); next.title = titleForLevel(next.level); return next;
}
export function runCommand(profile: Profile, command: ProgressionCommand): Profile { return rebuildProfile(profile.ownerId, profile.verification, profile.receipts, [...profile.commands, command]); }
export function questsForDate(profile: Profile, at: number, zone: string) { const date = dateInZone(at, profile.streak.zone ?? zone); dayNumber(date); return profile.quests.filter(quest => questPeriod(quest, date)); }
