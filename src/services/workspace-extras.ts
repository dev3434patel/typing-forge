import type { SessionRecord } from './session-repository';
import { workspaceExportData } from './game-data';

/** New features load only for an explicit export/reset, outside the keystroke path. */
export async function completeWorkspaceExport(ownerId: string, records: readonly SessionRecord[]) {
  if (!ownerId?.trim()) throw new Error('Choose a workspace before exporting its data.');
  const [arcade, progression, studio, classroom, reminders, season] = await Promise.all([
    import('@/games/engine/records'), import('./progression-storage'), import('./practice-style'),
    import('@/domain/classroom/local-adapter'), import('./reminders'),
    import('./season-customization'),
  ]);
  return { ...workspaceExportData(ownerId, records), arcade: arcade.arcadeData.export(ownerId), progression: await progression.exportProgression(ownerId), studio: studio.readPracticeStyle(ownerId), classrooms: classroom.exportLocalClassrooms(ownerId), reminders: reminders.readReminderPreferences(ownerId), seasonBanners: season.exportSeasonBanners(ownerId) };
}
export async function clearWorkspaceExtras(ownerId: string): Promise<void> {
  if (!ownerId?.trim()) throw new Error('Choose a workspace before clearing its data.');
  const [arcade, progression, studio, classroom, reminders, season, learning] = await Promise.all([
    import('@/games/engine/records'), import('./progression-storage'), import('./practice-style'),
    import('@/domain/classroom/local-adapter'), import('./reminders'),
    import('./season-customization'), import('@/lib/keybr-engine'),
  ]);
  const actions = [
    () => learning.resetKeybrProgress(ownerId),
    () => arcade.arcadeData.clear(ownerId), () => studio.clearPracticeStyle(ownerId),
    () => classroom.clearLocalClassrooms(ownerId), () => progression.clearProgression(ownerId),
    () => { if (typeof localStorage !== 'undefined') reminders.clearReminders(ownerId); },
    () => { if (typeof localStorage !== 'undefined') season.clearSeasonBanners(ownerId); },
  ];
  const results = await Promise.allSettled(actions.map(action => Promise.resolve().then(action)));
  const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
  if (failures.length) throw new Error(`${failures.length} device data stores could not be fully cleared. ${failures.map(result => result.reason instanceof Error ? result.reason.message : 'Storage is unavailable.').join(' ')}`);
}
