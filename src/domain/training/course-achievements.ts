import { assessCourseResult } from '@/lib/typing-course';
import type { SessionResult } from '@/lib/typing-core/types';

export function trainingAchievementFromResult(result: SessionResult) {
  const assessment = assessCourseResult(result);
  const training = result.configuration.settings?.training as { practiceAssist?: boolean; lessonId?: string } | undefined;
  const practiceAssist = training?.practiceAssist === true;
  const qualified = !practiceAssist && assessment?.qualifies === true;
  const accuracy = assessment?.metrics.inputAccuracy ?? 0;
  const stars: 0 | 1 | 2 | 3 = !qualified ? 0 : accuracy >= 98 && assessment?.checks.speed ? 3 : accuracy >= 95 ? 2 : 1;
  return { version: 'training-stars-v1' as const, sessionId: result.clientSessionId, ownerId: result.ownerScope, lessonId: assessment?.lessonId ?? training?.lessonId ?? null, stars, qualified, practiceAssist };
}
