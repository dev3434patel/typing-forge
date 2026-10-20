import catalog from '../../backend/resources/typing-course-v1.json';
import { activeOffset, replaySnapshot } from './typing-core/metrics';
import type { SessionConfig, SessionResult } from './typing-core/types';
import type { SessionRecord } from '../services/session-repository';

export const COURSE_VERSION = 'typing-course-v1' as const;
export const COURSE_ASSESSMENT_VERSION = 'typing-course-assessment-v1' as const;
export const COURSE_GENERATOR_VERSION = 'typing-course-fixed-v1' as const;
export type CourseVariantId = 'a' | 'b' | 'c';
export type CourseInputMethod = 'keyboard' | 'composition' | 'virtual';
export interface CourseChapter { id: string; title: string; description: string; path: 'foundations' | 'speed' }
export interface CourseVariant { id: CourseVariantId; text: string }
export interface CourseLesson {
  id: string; title: string; chapterId: string; targetWpm: number; minAccuracy: number;
  minAttempts: number; minDurationMs: number; durationMs: number | null;
  variants: readonly CourseVariant[]; focusKeys: readonly string[];
  prerequisiteId: string | null; guidance: string;
}
export interface CourseCatalog {
  version: typeof COURSE_VERSION; assessmentVersion: typeof COURSE_ASSESSMENT_VERSION;
  title: string; language: 'en'; layout: 'qwerty';
  chapters: readonly CourseChapter[]; lessons: readonly CourseLesson[];
}
export interface CourseAssessment {
  version: typeof COURSE_ASSESSMENT_VERSION; courseId: typeof COURSE_VERSION;
  lessonId: string; variantId: CourseVariantId; sessionId: string; ownerId: string;
  layout: 'qwerty'; language: 'en'; inputMethod: CourseInputMethod; completedAt: number;
  qualifies: boolean;
  checks: { configuration: boolean; completed: boolean; accuracy: boolean; evidence: boolean; speed: boolean; unassisted: boolean };
  metrics: {
    wpm: number | null; inputAccuracy: number | null; finalTextAccuracy: number | null;
    insertionAttempts: number; correctAttempts: number; incorrectAttempts: number;
    elapsedMs: number; progress: number;
  };
  reasonCodes: string[];
}
export interface CourseLessonProgress {
  lessonId: string; status: 'locked' | 'available' | 'in-progress' | 'completed';
  unlocked: boolean; completed: boolean; qualificationCount: number;
  qualifyingSessionIds: string[]; qualifiedVariants: CourseVariantId[];
  nextVariantId: CourseVariantId; attempts: number; lastAssessment: CourseAssessment | null;
  bestWpm: number | null; bestAccuracy: number | null;
}
export interface CourseProgress {
  lessons: CourseLessonProgress[]; byLessonId: Record<string, CourseLessonProgress>;
  completedCount: number; totalLessons: number; foundationCompletedCount: number;
  speedCompletedCount: number; continueLessonId: string | null;
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
export const COURSE_CATALOG = deepFreeze(catalog as unknown as CourseCatalog);
export const COURSE_LESSONS = COURSE_CATALOG.lessons;
export const COURSE_CHAPTERS = COURSE_CATALOG.chapters;
const lessonMap = new Map(COURSE_LESSONS.map(lesson => [lesson.id, lesson]));
const variantIds: readonly CourseVariantId[] = ['a', 'b', 'c'];
const checkReasons = {
  configuration: 'configuration', completed: 'completion', accuracy: 'accuracy',
  evidence: 'minimum-evidence', speed: 'speed', unassisted: 'assistance',
} as const;
export function getCourseLesson(id: string): CourseLesson | undefined { return lessonMap.get(id); }

/** All timed runs receive enough immutable text for more than 900 WPM at 30s. */
export function getCourseTarget(lesson: CourseLesson, variantId: CourseVariantId): string {
  const variant = lesson.variants.find(item => item.id === variantId);
  if (!variant) throw new Error('Choose a known lesson variant.');
  let target = variant.text;
  if (lesson.durationMs !== null) while (target.length < 2400) target += ` ${variant.text}`;
  return target;
}

export function buildCourseConfiguration(lessonId: string, options: {
  ownerId: string; clientSessionId: string; variantId?: CourseVariantId; repeatedContent?: boolean;
}): SessionConfig {
  const lesson = getCourseLesson(lessonId);
  if (!lesson) throw new Error('Choose a known course lesson.');
  if (!options.ownerId || !options.clientSessionId) throw new Error('A lesson needs a workspace and a new session ID.');
  const variantId = options.variantId ?? 'a';
  const target = getCourseTarget(lesson, variantId);
  return {
    clientSessionId: options.clientSessionId, ownerScope: options.ownerId,
    mode: lesson.durationMs === null ? 'learn' : 'time', initialTarget: target,
    ...(lesson.durationMs === null ? {} : { durationMs: lesson.durationMs }),
    scoringPolicy: 'prose', correctionPolicy: 'current-word', rejectIncorrect: false,
    language: 'en', script: 'Latin', keyboardLayout: 'qwerty', inputMethod: 'keyboard',
    contentRevision: `${COURSE_VERSION}:${lessonId}:${variantId}`,
    generatorVersion: COURSE_GENERATOR_VERSION, seed: `${lessonId}:${variantId}`,
    repeatedContent: options.repeatedContent === true, privacy: 'public-corpus',
    punctuation: /[^A-Za-z0-9 ]/.test(target), numbers: /[0-9]/.test(target),
    settings: { course: { courseId: COURSE_VERSION, lessonId, variantId, assessmentVersion: COURSE_ASSESSMENT_VERSION } },
  };
}

function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function nonnegative(value: unknown): value is number { return finite(value) && value >= 0; }
const equal = (a: number, b: number) => Math.abs(a - b) <= 0.000001;
function courseIdentity(result: SessionResult) {
  const metadata = result?.configuration?.settings?.course;
  if (!object(metadata) || metadata.courseId !== COURSE_VERSION || metadata.assessmentVersion !== COURSE_ASSESSMENT_VERSION ||
      typeof metadata.lessonId !== 'string' || !variantIds.includes(metadata.variantId as CourseVariantId)) return null;
  const lesson = getCourseLesson(metadata.lessonId);
  if (!lesson) return null;
  return { metadata, lesson, variantId: metadata.variantId as CourseVariantId };
}

/** Recompute course checks from canonical input; caller-supplied metrics never award progress. */
export function assessCourseResult(result: SessionResult): CourseAssessment | null {
  const identity = courseIdentity(result);
  if (!identity) return null;
  const { metadata, lesson, variantId } = identity;
  const config = result.configuration;
  const target = getCourseTarget(lesson, variantId);
  const method: CourseInputMethod = config.inputMethod === 'composition' ? 'composition' : config.inputMethod === 'virtual' ? 'virtual' : 'keyboard';
  let configuration = Object.keys(metadata).sort().join(',') === 'assessmentVersion,courseId,lessonId,variantId' &&
    result.schemaVersion === 3 && result.metricsVersion === 'forge-v3' &&
    result.ownerScope === config.ownerScope && typeof result.ownerScope === 'string' && result.ownerScope.length > 0 &&
    result.clientSessionId === config.clientSessionId && config.initialTarget === target && result.initialTarget === target && result.targetText === target &&
    config.mode === (lesson.durationMs === null ? 'learn' : 'time') &&
    (lesson.durationMs === null ? config.durationMs === undefined : config.durationMs === lesson.durationMs) &&
    config.scoringPolicy === 'prose' && config.correctionPolicy === 'current-word' && config.rejectIncorrect === false &&
    config.language === 'en' && config.script === 'Latin' && config.keyboardLayout === 'qwerty' && config.inputMethod === 'keyboard' &&
    config.contentRevision === `${COURSE_VERSION}:${lesson.id}:${variantId}` && config.generatorVersion === COURSE_GENERATOR_VERSION &&
    config.seed === `${lesson.id}:${variantId}` && config.privacy === 'public-corpus' && !config.challengeId && !config.startImmediately &&
    config.wordCount === undefined && config.punctuation === /[^A-Za-z0-9 ]/.test(target) && config.numbers === /[0-9]/.test(target) &&
    Array.isArray(result.issuedTargetSegments) && result.issuedTargetSegments.length === 0;
  let metrics: CourseAssessment['metrics'] = { wpm: null, inputAccuracy: null, finalTextAccuracy: null, insertionAttempts: 0, correctAttempts: 0, incorrectAttempts: 0, elapsedMs: 0, progress: 0 };
  let completed = false;
  let unassisted = false;
  try {
    if (!Array.isArray(result.events) || !Array.isArray(result.pauseIntervals) || !nonnegative(result.elapsedMs) || result.elapsedMs > 600000 ||
        !nonnegative(result.wallDurationMs) || result.wallDurationMs < result.elapsedMs || !finite(result.finishedAtWall) ||
        result.startedAtWall === null || !finite(result.startedAtWall) || result.finishedAtWall < result.startedAtWall ||
        Math.abs(result.finishedAtWall - result.startedAtWall - result.wallDurationMs) > 1000 ||
        result.events.some((event, index) => !object(event) || event.sequence !== index || typeof event.text !== 'string' ||
          !nonnegative(event.offsetMs) || event.offsetMs > result.wallDurationMs ||
          (lesson.durationMs !== null && activeOffset(event.offsetMs, result.pauseIntervals) >= lesson.durationMs)) ||
        result.pauseIntervals.some(pause => pause.endMs > result.wallDurationMs) ||
        (result.finishReason === 'timeout'
          ? lesson.durationMs === null || result.elapsedMs !== lesson.durationMs || activeOffset(result.wallDurationMs, result.pauseIntervals) < result.elapsedMs
          : !equal(activeOffset(result.wallDurationMs, result.pauseIntervals), result.elapsedMs)) ||
        Boolean(config.paused) !== Boolean(result.pauseIntervals.length)) throw new Error('Invalid course timing or event evidence.');
    const replayed = replaySnapshot(config, result.events, result.elapsedMs, {
      targetText: result.targetText, pauseIntervals: result.pauseIntervals,
      finiteFinal: lesson.durationMs === null, issuedTargetSegments: result.issuedTargetSegments,
    });
    const observed = replayed.metrics;
    metrics = { wpm: observed.wpm, inputAccuracy: observed.inputAccuracy, finalTextAccuracy: observed.finalTextAccuracy,
      insertionAttempts: observed.insertionAttempts, correctAttempts: observed.correctAttempts,
      incorrectAttempts: observed.incorrectAttempts, elapsedMs: observed.elapsedMs, progress: observed.progress };
    const cleanFinal = observed.finalTextAccuracy === 100 && observed.incorrect === 0 && observed.extra === 0 && observed.missed === 0;
    completed = result.status === 'finished' && cleanFinal && replayed.finalText === result.finalText && result.finalTranscript === replayed.finalText &&
      (lesson.durationMs === null
        ? result.finishReason === 'completed' && observed.progress === 100 && observed.untyped === 0
        : result.finishReason === 'timeout' && equal(result.elapsedMs, lesson.durationMs) && result.pauseIntervals.length === 0);
    unassisted = method === 'keyboard' && config.inputMethod === 'keyboard' &&
      result.events.every(event => event.provenance === 'keyboard' && event.type !== 'composition' &&
        (event.compositionId === undefined || event.compositionId === '') && (!event.text || event.text.length === 1)) &&
      Array.isArray(result.assistance) && result.assistance.length === 0;
  } catch {
    configuration = false;
  }
  const checks: CourseAssessment['checks'] = {
    configuration, completed,
    accuracy: metrics.inputAccuracy !== null && metrics.inputAccuracy + 1e-9 >= lesson.minAccuracy,
    evidence: metrics.insertionAttempts >= lesson.minAttempts && metrics.elapsedMs >= lesson.minDurationMs,
    speed: lesson.targetWpm === 0 || metrics.wpm !== null && metrics.wpm + 1e-9 >= lesson.targetWpm,
    unassisted,
  };
  const reasonCodes = (Object.keys(checkReasons) as Array<keyof typeof checkReasons>).filter(key => !checks[key]).map(key => checkReasons[key]);
  return { version: COURSE_ASSESSMENT_VERSION, courseId: COURSE_VERSION, lessonId: lesson.id, variantId,
    sessionId: result.clientSessionId, ownerId: result.ownerScope, layout: 'qwerty', language: 'en', inputMethod: method,
    completedAt: finite(result.finishedAtWall) ? result.finishedAtWall : 0, qualifies: reasonCodes.length === 0, checks, metrics, reasonCodes };
}

/** Validate a retained derived summary; replay expiry does not erase this small personal record. */
function validAssessment(value: unknown, ownerId: string, sessionId: string): value is CourseAssessment {
  if (!object(value) || value.version !== COURSE_ASSESSMENT_VERSION || value.courseId !== COURSE_VERSION || value.ownerId !== ownerId ||
      value.sessionId !== sessionId || value.layout !== 'qwerty' || value.language !== 'en' ||
      !['keyboard', 'composition', 'virtual'].includes(value.inputMethod as string) || !finite(value.completedAt) ||
      typeof value.lessonId !== 'string' || !getCourseLesson(value.lessonId) || !variantIds.includes(value.variantId as CourseVariantId) ||
      !object(value.checks) || !object(value.metrics) || typeof value.qualifies !== 'boolean' || !Array.isArray(value.reasonCodes)) return false;
  const checks = value.checks;
  if (Object.keys(checkReasons).some(key => typeof checks[key] !== 'boolean')) return false;
  const expectedReasons = (Object.keys(checkReasons) as Array<keyof typeof checkReasons>).filter(key => !checks[key]).map(key => checkReasons[key]);
  if (value.qualifies !== (expectedReasons.length === 0) || JSON.stringify(value.reasonCodes) !== JSON.stringify(expectedReasons)) return false;
  const metrics = value.metrics;
  if (!['wpm', 'inputAccuracy', 'finalTextAccuracy'].every(key => metrics[key] === null || nonnegative(metrics[key])) ||
      !['insertionAttempts', 'correctAttempts', 'incorrectAttempts', 'elapsedMs', 'progress'].every(key => nonnegative(metrics[key])) ||
      !['insertionAttempts', 'correctAttempts', 'incorrectAttempts'].every(key => Number.isInteger(metrics[key])) ||
      Number(metrics.inputAccuracy) > 100 || Number(metrics.finalTextAccuracy) > 100 || Number(metrics.progress) > 100 ||
      Number(metrics.correctAttempts) + Number(metrics.incorrectAttempts) !== metrics.insertionAttempts) return false;
  const measured = metrics as unknown as CourseAssessment['metrics'];
  const lesson = getCourseLesson(value.lessonId)!;
  // A stored boolean cannot bypass the actual numerical evidence or method.
  return !value.qualifies || value.inputMethod === 'keyboard' && measured.finalTextAccuracy === 100 &&
    finite(measured.inputAccuracy) && measured.inputAccuracy + 1e-9 >= lesson.minAccuracy &&
    measured.insertionAttempts >= lesson.minAttempts && measured.elapsedMs >= lesson.minDurationMs &&
    (lesson.durationMs === null ? measured.progress === 100 : measured.elapsedMs === lesson.durationMs) &&
    (lesson.targetWpm === 0 || finite(measured.wpm) && measured.wpm + 1e-9 >= lesson.targetWpm);
}

/** Reconcile only saved current-owner evidence; no independent completion flags exist. */
export function deriveCourseProgress(records: readonly SessionRecord[], ownerId: string): CourseProgress {
  const lessons: CourseLessonProgress[] = COURSE_LESSONS.map(lesson => ({ lessonId: lesson.id, status: 'locked', unlocked: false, completed: false,
    qualificationCount: 0, qualifyingSessionIds: [], qualifiedVariants: [], nextVariantId: 'a', attempts: 0,
    lastAssessment: null, bestWpm: null, bestAccuracy: null }));
  const byLessonId = Object.fromEntries(lessons.map(item => [item.lessonId, item]));
  const seen = new Set<string>();
  const observations: CourseAssessment[] = [];
  for (const record of [...records].sort((a, b) => a.createdAt - b.createdAt || a.clientSessionId.localeCompare(b.clientSessionId))) {
    if (record.ownerId !== ownerId || record.payloadVersion !== 'forge-v3' || record.provenance !== 'observed' || record.state === 'rejected' || seen.has(record.clientSessionId)) continue;
    seen.add(record.clientSessionId);
    const accepted = object(record.accepted) ? record.accepted : null;
    let assessment: unknown;
    // An accepted server projection is authoritative, including a failed result.
    if (accepted && 'course' in accepted) assessment = accepted.course;
    else if (record.candidate) assessment = assessCourseResult(record.candidate as SessionResult);
    else assessment = record.courseEvidence;
    if (validAssessment(assessment, ownerId, record.clientSessionId)) observations.push(assessment);
  }
  observations.sort((a, b) => a.completedAt - b.completedAt || a.sessionId.localeCompare(b.sessionId));
  for (const assessment of observations) {
    const lesson = getCourseLesson(assessment.lessonId)!;
    const progress = byLessonId[lesson.id];
    progress.attempts++;
    progress.lastAssessment = assessment;
    if (assessment.metrics.wpm !== null) progress.bestWpm = Math.max(progress.bestWpm ?? 0, assessment.metrics.wpm);
    if (assessment.metrics.inputAccuracy !== null) progress.bestAccuracy = Math.max(progress.bestAccuracy ?? 0, assessment.metrics.inputAccuracy);
    const available = !lesson.prerequisiteId || byLessonId[lesson.prerequisiteId].completed;
    if (available && assessment.qualifies && !progress.qualifiedVariants.includes(assessment.variantId)) {
      progress.qualifiedVariants.push(assessment.variantId);
      progress.qualifyingSessionIds.push(assessment.sessionId);
      progress.qualificationCount = Math.min(2, progress.qualifiedVariants.length);
      progress.completed = progress.qualificationCount === 2;
    }
  }
  for (const lesson of COURSE_LESSONS) {
    const progress = byLessonId[lesson.id];
    progress.unlocked = !lesson.prerequisiteId || byLessonId[lesson.prerequisiteId].completed;
    progress.status = progress.completed ? 'completed' : !progress.unlocked ? 'locked' : progress.attempts ? 'in-progress' : 'available';
    progress.nextVariantId = variantIds.find(id => !progress.qualifiedVariants.includes(id)) ??
      variantIds[(variantIds.indexOf(progress.lastAssessment?.variantId ?? 'c') + 1) % variantIds.length];
  }
  const foundationIds = new Set(COURSE_CHAPTERS.filter(chapter => chapter.path === 'foundations').map(chapter => chapter.id));
  const foundationCompletedCount = COURSE_LESSONS.filter(lesson => foundationIds.has(lesson.chapterId) && byLessonId[lesson.id].completed).length;
  return { lessons, byLessonId, completedCount: lessons.filter(item => item.completed).length, totalLessons: lessons.length,
    foundationCompletedCount, speedCompletedCount: lessons.filter(item => item.completed).length - foundationCompletedCount,
    continueLessonId: lessons.find(item => item.unlocked && !item.completed)?.lessonId ?? null };
}
