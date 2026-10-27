import type { Classroom } from './model';

/** A refresh replaces only teacher aggregates; it never resets a student capability or join code. */
export async function refreshTeacherProgress(options: {
  ownerId: string;
  isCurrent: () => boolean;
  load: () => Promise<{ ownerId: string; classes: Classroom[] }>;
  publish: (classes: Classroom[]) => void;
}): Promise<boolean> {
  const value = await options.load();
  if (!options.isCurrent()) return false;
  if (value.ownerId !== options.ownerId) throw new Error('Classroom owner changed. Reopen the teacher workspace before refreshing.');
  options.publish(value.classes);
  return true;
}
