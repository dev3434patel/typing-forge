import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown,
  Circle, Gauge, Keyboard, LockKeyhole, RotateCcw, Target,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TypingArea } from "@/components/typing/TypingArea";
import { useAuth } from "@/hooks/useAuth";
import { useSessionHistory, useTestResults, type SaveStatus } from "@/hooks/useTestResults";
import { usePreferences } from "@/contexts/PreferencesContext";
import type { SessionConfig, SessionResult } from "@/lib/typing-core";
import {
  COURSE_CHAPTERS, COURSE_LESSONS,
  assessCourseResult, buildCourseConfiguration, deriveCourseProgress,
  getCourseLesson, type CourseLesson, type CourseAssessment,
} from "@/lib/typing-course";
import { cn } from "@/lib/utils";
import "./lessons.css";

const DetailedResults = lazy(() => import("@/components/typing/SessionResults").then(module => ({ default: module.SessionResults })));
type VariantId = "a" | "b" | "c";
type ActiveLesson = { lessonId: string; variantId: VariantId; wasQualified: boolean; configuration: SessionConfig };
const format = (value: number | null | undefined, decimals = 0) => typeof value === "number" && Number.isFinite(value) ? value.toFixed(decimals) : "—";

export function CourseMetricValue({ value, decimals = 1, minimum, meetsTarget }: { value: number | null; decimals?: number; minimum: number; meetsTarget: boolean }) {
  const rounded = format(value, decimals);
  return <>{!meetsTarget && value !== null && Number.isFinite(value) && Number(rounded) >= minimum ? `<${minimum.toFixed(decimals)}` : rounded}</>;
}

function LessonTargets({ lesson }: { lesson: CourseLesson }) {
  return <dl className="course-targets">
    <div><dt><Target size={15} aria-hidden="true" /> Input accuracy</dt><dd>{lesson.minAccuracy}%<span> or higher</span></dd></div>
    <div><dt><Gauge size={15} aria-hidden="true" /> {lesson.durationMs ? "Sustained speed" : "Approach"}</dt><dd>{lesson.targetWpm > 0 ? <>{lesson.targetWpm}<span> WPM or higher</span></> : <>Accuracy first</>}</dd></div>
    <div><dt><CheckCircle2 size={15} aria-hidden="true" /> Completion</dt><dd>2 passages<span> · different variants</span></dd></div>
  </dl>;
}

function CheckpointDots({ count }: { count: number }) {
  return <span className="course-checkpoints" role="img" aria-label={`${Math.min(2, count)} of 2 qualifying passages`}>
    {[0, 1].map(index => <span className={cn(index < count && "is-earned")} key={index} aria-hidden="true">{index < count ? <Check size={12} /> : null}</span>)}
  </span>;
}

export function OutcomeChecks({ assessment, lesson, paused }: { assessment: CourseAssessment; lesson: CourseLesson; paused: boolean }) {
  const checks = [
    { passed: assessment.checks.completed, title: lesson.durationMs ? "Full 30-second assessment" : "Whole passage completed correctly", description: lesson.durationMs ? `${format(assessment.metrics.elapsedMs / 1000, 1)} seconds of active time${paused ? " · this run was paused. Paused speed practice cannot earn a checkpoint." : " · uninterrupted required"}` : assessment.checks.completed ? "No remaining wrong, missed or extra characters" : "Complete the whole passage with no wrong, missed or extra characters" },
    { passed: assessment.checks.accuracy, title: `${lesson.minAccuracy}% input accuracy`, description: <><CourseMetricValue value={assessment.metrics.inputAccuracy} decimals={2} minimum={lesson.minAccuracy} meetsTarget={assessment.checks.accuracy} />% recorded · corrections retain their original accuracy cost</> },
    { passed: assessment.checks.speed, title: lesson.targetWpm ? `${lesson.targetWpm} WPM target` : "Accuracy before speed", description: lesson.targetWpm ? <><CourseMetricValue value={assessment.metrics.wpm} minimum={lesson.targetWpm} meetsTarget={assessment.checks.speed} /> WPM recorded</> : "There is no speed requirement for this lesson" },
    { passed: assessment.checks.evidence && assessment.checks.unassisted && assessment.checks.configuration, title: assessment.checks.unassisted ? "A measured keyboard attempt" : "Individual keyboard input required", description: !assessment.checks.unassisted ? "Use individual keyboard input for a checkpoint. Composed or bulk input remains a practice attempt." : `${assessment.metrics.insertionAttempts} / ${lesson.minAttempts} required attempts · ${format(assessment.metrics.elapsedMs / 1000, 1)} seconds${lesson.durationMs ? " · uninterrupted required" : ""}` },
  ];
  return <ul className="course-outcome-checks" aria-label="Lesson assessment checks">
    {checks.map(check => <li key={check.title} data-passed={check.passed}>
      {check.passed ? <CheckCircle2 size={19} aria-label="Met" /> : <Circle size={19} aria-label="Not yet met" />}
      <div><p>{check.title}</p><span>{check.description}</span></div>
    </li>)}
  </ul>;
}

export default function Lessons() {
  const { user } = useAuth();
  const ownerId = user?.id ?? "guest";
  const { preferences } = usePreferences();
  const history = useSessionHistory();
  const { saveSession, syncState, retrySync } = useTestResults();
  const [params, setParams] = useSearchParams();
  const requestedLesson = params.get("lesson");
  const selected = requestedLesson ? getCourseLesson(requestedLesson) : undefined;
  const progress = useMemo(() => deriveCourseProgress(history.records, ownerId), [history.records, ownerId]);
  const [active, setActive] = useState<ActiveLesson | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set([COURSE_CHAPTERS[0].id]));
  const destinationHeading = useRef<HTMLHeadingElement>(null);
  const courseMapHeading = useRef<HTMLHeadingElement>(null);
  const previousLesson = useRef(requestedLesson);
  const outcomeHeading = useRef<HTMLHeadingElement>(null);
  const currentScope = useRef(ownerId);
  const currentLesson = useRef(requestedLesson);
  const saveRequest = useRef({ generation: 0, sessionId: null as string | null });
  currentScope.current = ownerId;
  currentLesson.current = requestedLesson;
  useEffect(() => {
    const request = saveRequest.current;
    request.generation++; request.sessionId = null;
    setActive(null); setResult(null); setDetailsOpen(false); setSaving(false); setSaveError(false);
    return () => { request.generation++; request.sessionId = null; };
  }, [requestedLesson, ownerId]);
  useEffect(() => { if (result) outcomeHeading.current?.focus({ preventScroll: true }); }, [result]);
  useEffect(() => {
    if (previousLesson.current === requestedLesson) return;
    previousLesson.current = requestedLesson;
    destinationHeading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [requestedLesson]);
  const selectedProgress = selected ? progress.byLessonId[selected.id] : undefined;
  const currentActive = active && selected && active.lessonId === selected.id && active.configuration.ownerScope === ownerId ? active : null;
  const assessment = useMemo(() => result ? assessCourseResult(result) : null, [result]);
  const recommended = (progress.continueLessonId ? getCourseLesson(progress.continueLessonId) : undefined) ?? COURSE_LESSONS[0];
  const courseComplete = progress.completedCount === COURSE_LESSONS.length;
  const speedStart = COURSE_LESSONS.find(lesson => lesson.chapterId === COURSE_CHAPTERS.find(chapter => chapter.path === "speed")?.id)!;
  const nextLesson = selected ? COURSE_LESSONS.find(lesson => lesson.prerequisiteId === selected.id) : undefined;
  const knownKeys = useMemo(() => {
    if (!selected) return [];
    const set = new Set<string>([" "]);
    for (const lesson of COURSE_LESSONS) {
      if (lesson.durationMs) continue;
      for (const variant of lesson.variants) for (const character of variant.text) set.add(character.toLowerCase());
      if (lesson.id === selected.id) break;
    }
    if (selected.durationMs) for (const character of "abcdefghijklmnopqrstuvwxyz0123456789.,;:'!?-()\"") set.add(character);
    return [...set];
  }, [selected]);
  const choose = (id?: string) => {
    saveRequest.current.generation++; saveRequest.current.sessionId = null;
    setActive(null); setResult(null); setDetailsOpen(false); setSaving(false); setSaveError(false);
    setParams(id ? { lesson: id } : {});
  };
  const reviewCourse = () => {
    courseMapHeading.current?.focus({ preventScroll: true });
    courseMapHeading.current?.scrollIntoView({ block: "start", behavior: "instant" });
  };
  const begin = (variantId?: VariantId) => {
    if (!selected || !selectedProgress?.unlocked || history.loading || saving) return;
    const variant = variantId ?? selectedProgress.nextVariantId;
    const repeated = history.records.some(record => {
      const local = record.courseEvidence;
      const accepted = record.accepted as { course?: CourseAssessment } | undefined;
      const evidence = accepted?.course ?? local;
      return evidence?.lessonId === selected.id && evidence.variantId === variant;
    });
    saveRequest.current.generation++; saveRequest.current.sessionId = null;
    setResult(null); setDetailsOpen(false); setSaving(false); setSaveError(false);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setActive({ lessonId: selected.id, variantId: variant, wasQualified: selectedProgress.qualifiedVariants.includes(variant), configuration: buildCourseConfiguration(selected.id, { ownerId, clientSessionId: crypto.randomUUID(), variantId: variant, repeatedContent: repeated }) });
  };
  const persist = async (value: SessionResult) => {
    const scope = ownerId;
    const lessonId = requestedLesson;
    const generation = ++saveRequest.current.generation;
    saveRequest.current.sessionId = value.clientSessionId;
    const isCurrent = () => currentScope.current === scope && currentLesson.current === lessonId &&
      saveRequest.current.generation === generation && saveRequest.current.sessionId === value.clientSessionId;
    setSaving(true); setSaveError(false);
    try { await saveSession(value); }
    catch { if (isCurrent()) setSaveError(true); }
    finally { if (isCurrent()) setSaving(false); }
  };
  const complete = (value: SessionResult) => {
    if (value.ownerScope !== ownerId) return;
    setResult(value);
    void persist(value);
  };
  const toggleChapter = (id: string) => setExpanded(previous => {
    const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });
  const checkpointCount = selectedProgress?.qualificationCount ?? 0;
  const resultRecord = result ? history.records.find(record => record.ownerId === ownerId && record.clientSessionId === result.clientSessionId) : undefined;
  const displayedSaveStatus: SaveStatus = result && syncState.sessionId === result.clientSessionId ? syncState : {
    state: resultRecord?.state ?? "local-only",
    message: resultRecord?.message ?? (resultRecord ? resultRecord.state === "synced" ? "Saved to your account." : resultRecord.state === "rejected" ? "The server did not accept this attempt." : "Saved on this device." : "This attempt has not been saved yet."),
    storageMode: history.storageMode,
    sessionId: result?.clientSessionId,
  };
  const contributesCheckpoint = !!result && !!selectedProgress?.qualifyingSessionIds.includes(result.clientSessionId);
  const outcomeTitle = !assessment?.qualifies ? "A useful attempt. Try again." : currentActive?.wasQualified ? "Skill reinforced." : selectedProgress?.completed ? "Lesson complete." : contributesCheckpoint ? "Checkpoint earned." : "Targets met.";
  const outcomeDescription = !assessment?.qualifies ? "Use the checks below to choose what to improve in your next attempt." : currentActive?.wasQualified ? "This passage already has a checkpoint. Choose a different passage to build on it." : selectedProgress?.completed ? "Two different passages met the targets. This lesson is complete." : contributesCheckpoint ? "Meet the targets on a different passage to complete this lesson." : "This attempt met its targets. A checkpoint appears after the attempt is saved on the current learning path.";
  const percent = Math.round(progress.completedCount / COURSE_LESSONS.length * 100);
  const highestSpeed = COURSE_LESSONS.filter(lesson => lesson.durationMs && progress.byLessonId[lesson.id]?.completed).reduce((value, lesson) => Math.max(value, lesson.targetWpm), 0);

  return <div className={cn("forge-shell course-shell", currentActive && !result && "course-is-practising")}>
    <Header />
    <main id="main-content" className="course-main" aria-busy={history.loading}>
      <nav aria-label="Learning paths" className="course-path-nav">
        <Link to="/lessons" aria-current="page" className="forge-chip bg-primary/10 text-primary"><BookOpen size={15} aria-hidden="true" /> Structured lessons</Link>
        <Link to="/learn" className="forge-chip">Adaptive practice <ArrowRight size={14} aria-hidden="true" /></Link>
      </nav>
      {history.error && <p role="status" className="course-notice">Account sync or browser storage is unavailable. Available on-device course progress is shown. <Link to="/profile">Open your data controls</Link>.</p>}
      {history.loading && <p role="status" className="course-loading">Reading your course progress…</p>}

      {!requestedLesson && <>
        <section className="course-hero" aria-labelledby="course-title">
          <div className="course-hero-copy">
            <p className="eyebrow">THE TYPING COURSE · ENGLISH / QWERTY</p>
            <h1 id="course-title" ref={destinationHeading} tabIndex={-1}>Find your rhythm.<br /><span>One lesson at a time.</span></h1>
            <p className="course-intro">Learn where your fingers go, build accurate movement, then turn that control into speed. A clear path from your first keys to 80 WPM practice.</p>
            <div className="course-hero-actions">
              <button className="forge-button" disabled={history.loading} onClick={() => courseComplete ? reviewCourse() : choose(recommended.id)}>{courseComplete ? "Review your course" : progress.completedCount ? "Continue your course" : "Start learning"}<ArrowRight size={17} aria-hidden="true" /></button>
              <button className="forge-button-secondary" onClick={() => choose(speedStart.id)}><Gauge size={17} aria-hidden="true" /> Train your speed</button>
            </div>
            <p className="course-hero-footnote">36 lessons · 108 original passages · no account required</p>
          </div>
          {courseComplete ? <aside className="course-next" aria-label="Course review">
            <div className="course-next-top"><span>Keep your skills sharp</span><CheckCircle2 size={18} aria-hidden="true" /></div>
            <p className="course-next-number">36<span> / 36</span></p>
            <h2>All lessons complete.</h2>
            <p>Every lesson has two different qualifying passages. Choose any lesson in the map to revisit a skill or reinforce your speed.</p>
            <div className="course-next-bottom"><span>Choose your review</span><button onClick={reviewCourse} aria-label="Review completed lessons"><ArrowRight size={20} aria-hidden="true" /></button></div>
          </aside> : <aside className="course-next" aria-label="Your next lesson">
            <div className="course-next-top"><span>Your next step</span><BookOpen size={18} aria-hidden="true" /></div>
            <p className="course-next-number">{String(COURSE_LESSONS.indexOf(recommended) + 1).padStart(2, "0")}<span> / 36</span></p>
            <h2>{recommended.title}</h2>
            <p>{recommended.guidance}</p>
            <div className="course-next-keys" aria-label="Lesson focus keys">{recommended.focusKeys.map(key => <kbd key={key}>{key === " " ? "space" : key}</kbd>)}</div>
            <div className="course-next-bottom"><CheckpointDots count={progress.byLessonId[recommended.id]?.qualificationCount ?? 0} /><button onClick={() => choose(recommended.id)} aria-label={`Open ${recommended.title}`}><ArrowRight size={20} /></button></div>
          </aside>}
        </section>

        <section className="course-progress-strip" aria-label="Your course progress">
          <div><span>Course completed</span><strong>{progress.completedCount}<small> / 36 lessons</small></strong></div>
          <div className="course-progress-meter"><label htmlFor="course-progress">{percent}% of your path</label><progress id="course-progress" max={36} value={progress.completedCount} /></div>
          <div><span>Foundations</span><strong>{progress.foundationCompletedCount}<small> / 30</small></strong></div>
          <div><span>Speed milestone</span><strong>{highestSpeed || "—"}<small>{highestSpeed ? " WPM" : " not yet earned"}</small></strong></div>
        </section>

        <section className="course-map" aria-labelledby="course-map-title">
          <div className="course-section-heading"><div><p className="eyebrow">A SMALL STEP. A REAL SKILL.</p><h2 id="course-map-title" ref={courseMapHeading} tabIndex={-1}>Your learning path</h2></div><span>Two different qualifying passages complete a lesson.</span></div>
          <div className="course-chapters">
            {COURSE_CHAPTERS.map((chapter, chapterIndex) => {
              const lessons = COURSE_LESSONS.filter(lesson => lesson.chapterId === chapter.id);
              const completed = lessons.filter(lesson => progress.byLessonId[lesson.id]?.completed).length;
              const open = expanded.has(chapter.id);
              return <section className="course-chapter" key={chapter.id} data-completed={completed === lessons.length}>
                <h3><button className="course-chapter-heading" aria-expanded={open} aria-controls={`chapter-${chapter.id}`} onClick={() => toggleChapter(chapter.id)}>
                  <span className="course-chapter-number">{String(chapterIndex + 1).padStart(2, "0")}</span>
                  <span className="course-chapter-title">{chapter.title}<small>{chapter.description}</small></span>
                  <span className="course-chapter-count">{completed} / {lessons.length}</span><ChevronDown className={cn(open && "is-open")} size={18} aria-hidden="true" />
                </button></h3>
                <div id={`chapter-${chapter.id}`} hidden={!open}>
                  <ol className="course-lesson-list">
                    {lessons.map(lesson => {
                      const state = progress.byLessonId[lesson.id];
                      return <li key={lesson.id}><button className="course-lesson" data-status={state.status} onClick={() => choose(lesson.id)} aria-labelledby={`lesson-number-${lesson.id} lesson-label-${lesson.id}`} aria-describedby={`lesson-status-${lesson.id}`}>
                        <span className="course-lesson-state" id={`lesson-number-${lesson.id}`}>{state.completed ? <Check size={17} aria-hidden="true" /> : !state.unlocked ? <LockKeyhole size={14} aria-hidden="true" /> : <span>{String(COURSE_LESSONS.indexOf(lesson) + 1).padStart(2, "0")}</span>}</span>{" "}
                        <span className="course-lesson-name" id={`lesson-label-${lesson.id}`}>{lesson.title}{" "}<small>{lesson.targetWpm ? `${lesson.targetWpm} WPM · ` : ""}{lesson.minAccuracy}% accuracy{lesson.durationMs ? " · 30 seconds" : ""}</small></span>
                        <span className="sr-only" id={`lesson-status-${lesson.id}`}>{state.status.replace("-", " ")}, {state.qualificationCount} of 2 qualifying passages</span>
                        <CheckpointDots count={state.qualificationCount} /><ArrowRight size={15} aria-hidden="true" />
                      </button></li>;
                    })}
                  </ol>
                </div>
              </section>;
            })}
          </div>
        </section>
        <section className="course-principles" aria-label="How to make progress">
          <div><Keyboard size={19} aria-hidden="true" /><h3>Feel the keys</h3><p>Use the live guide, settle your hands on F and J, and keep your attention on the passage. Finger hints are a reference, not a sensor.</p></div>
          <div><Target size={19} aria-hidden="true" /><h3>Accuracy leads</h3><p>Correct a mistake while you are in the current word. Moving to the next word commits it; editing never removes the original accuracy cost.</p></div>
          <div><Gauge size={19} aria-hidden="true" /><h3>Earn steady speed</h3><p>Two different passages build a more useful checkpoint than one lucky run. The speed path is available from the start.</p></div>
        </section>
      </>}

      {requestedLesson && !selected && <section className="course-empty"><BookOpen size={32} aria-hidden="true" /><h1 ref={destinationHeading} tabIndex={-1}>This lesson is not in the current course.</h1><p>Open the lesson map to choose an available lesson.</p><button className="forge-button" onClick={() => choose()}>Back to lessons</button></section>}

      {selected && <>
        <button className="course-back" onClick={() => choose()}><ArrowLeft size={16} aria-hidden="true" /> All lessons</button>
        <div className="course-lesson-heading"><div><p className="eyebrow">{COURSE_CHAPTERS.find(chapter => chapter.id === selected.chapterId)?.title} · LESSON {String(COURSE_LESSONS.indexOf(selected) + 1).padStart(2, "0")}</p><h1 ref={destinationHeading} tabIndex={-1}>{selected.title}</h1><p>{selected.guidance}</p></div><div className="course-lesson-checkpoint"><CheckpointDots count={checkpointCount} /><span>{Math.min(2, checkpointCount)} of 2 checkpoints</span></div></div>
        {(!currentActive || !!result) && <LessonTargets lesson={selected} />}
        {(preferences.language !== "en" || preferences.layout !== "qwerty") && <p className="course-notice">This course teaches English and US QWERTY. <Link to="/learn">Use adaptive practice</Link> for another language or layout.</p>}

        {!currentActive && !result && <section className="course-preview" aria-labelledby="lesson-preview-title">
          <div className="course-preview-copy"><p className="eyebrow">BEFORE YOU BEGIN</p><h2 id="lesson-preview-title">Small movements. Clear targets.</h2><p>{selected.durationMs ? "Find a comfortable rhythm for the full 30 seconds. Idle time counts, and pausing or ending early cannot earn a speed checkpoint." : "Finish the assigned passage with every character correct. Keep your hands relaxed and repair errors before leaving the current word."}</p><p>You need at least {selected.minAttempts} insertion attempts and {selected.minDurationMs / 1000} seconds of measured practice. Only individual keyboard input qualifies for this keyboard course.</p><div className="course-focus-keys" aria-label="Keys introduced or practised">{selected.focusKeys.map(key => <kbd key={key}>{key === " " ? "space" : key}</kbd>)}</div>
            {!selectedProgress?.unlocked ? <div className="course-locked" role="status"><LockKeyhole size={18} aria-hidden="true" /><div><strong>Build the previous skill first.</strong><p>Complete {getCourseLesson(selected.prerequisiteId ?? "")?.title ?? "the preceding lesson"} to unlock this lesson.</p><button className="forge-button-secondary" onClick={() => choose(selected.prerequisiteId ?? undefined)}>Open the previous lesson <ArrowRight size={15} aria-hidden="true" /></button></div></div> : <button className="forge-button" disabled={history.loading} onClick={() => begin()}>{selectedProgress.completed ? "Practise this lesson" : "Start lesson"}<ArrowRight size={17} aria-hidden="true" /></button>}
          </div>
          <div className="course-passage-preview"><div><span>YOUR NEXT PASSAGE</span><span>Variant {selectedProgress?.nextVariantId.toUpperCase()}</span></div><p aria-label="Lesson passage preview">{selected.variants.find(variant => variant.id === selectedProgress?.nextVariantId)?.text}</p><span>Guided keyboard below the passage · correct-current-word editing</span></div>
        </section>}

        {currentActive && !result && <section className="course-practice" aria-label="Course lesson practice">
          <div className="course-practice-top"><span><Keyboard size={15} aria-hidden="true" /> English · QWERTY · passage {currentActive.variantId.toUpperCase()}</span><span>{selected.minAccuracy}% accuracy{selected.durationMs ? ` · ${selected.targetWpm} WPM · 30 seconds` : " · finish the passage"}</span><details className="course-technique"><summary>Technique &amp; targets <ChevronDown size={14} aria-hidden="true" /></summary><div className="course-technique-body"><p>{selected.guidance}</p><p>{selected.durationMs ? "Complete the full 30 seconds without pausing. Idle time counts." : "Finish the whole passage. Correct errors before leaving the current word."}</p><LessonTargets lesson={selected} /></div></details></div>
          <TypingArea key={currentActive.configuration.clientSessionId} configuration={currentActive.configuration} onTestComplete={complete} onRestart={() => begin((["a", "b", "c"] as const)[((["a", "b", "c"] as const).indexOf(currentActive.variantId) + 1) % 3])} keyboardLessonKeys={knownKeys} autoFocus />
        </section>}

        {result && assessment && <section className="course-outcome" aria-label="Course lesson result">
          <div className="course-outcome-heading"><div><p className="eyebrow">{assessment.qualifies ? currentActive?.wasQualified ? "REINFORCEMENT" : "A STEP FORWARD" : "KEEP BUILDING CONTROL"}</p><h2 ref={outcomeHeading} tabIndex={-1}>{outcomeTitle}</h2><p>{outcomeDescription}</p></div><div className="course-outcome-stats"><div><strong><CourseMetricValue value={assessment.metrics.wpm} decimals={0} minimum={selected.targetWpm} meetsTarget={assessment.checks.speed} /></strong><span>WPM</span></div><div><strong><CourseMetricValue value={assessment.metrics.inputAccuracy} decimals={2} minimum={selected.minAccuracy} meetsTarget={assessment.checks.accuracy} /><small>%</small></strong><span>input accuracy</span></div></div></div>
          <OutcomeChecks assessment={assessment} lesson={selected} paused={result.pauseIntervals.length > 0} />
          <p role="status" className="course-save-status" data-session-id={displayedSaveStatus.sessionId}>{saving ? "Saving this attempt…" : saveError ? "This attempt could not be saved. Keep the result open and try again." : displayedSaveStatus.message}</p>
          {saveError && <button className="forge-button-secondary" onClick={() => void persist(result)}>Retry saving</button>}
          <div className="course-outcome-actions">
            {selectedProgress?.completed && nextLesson ? <button className="forge-button" onClick={() => choose(nextLesson.id)}>Next lesson<ArrowRight size={17} aria-hidden="true" /></button> : selectedProgress?.completed ? <button className="forge-button" onClick={() => choose()}>Back to your path<ArrowRight size={17} aria-hidden="true" /></button> : <button className="forge-button" disabled={saving} onClick={() => begin()}>{assessment.qualifies ? "Start the next passage" : "Try the next passage"}<ArrowRight size={17} aria-hidden="true" /></button>}
            <button className="forge-button-secondary" disabled={saving} onClick={() => begin(currentActive?.variantId)}><RotateCcw size={16} aria-hidden="true" /> Repeat this passage</button>
          </div>
          <details className="course-full-result" onToggle={event => setDetailsOpen(event.currentTarget.open)}><summary>View full session results</summary>{detailsOpen && <Suspense fallback={<p role="status" className="p-5 text-muted-foreground">Loading session details…</p>}><DetailedResults result={result} onRestart={() => begin()} onRepeat={() => begin(currentActive?.variantId)} saveStatus={displayedSaveStatus} onRetrySave={retrySync} /></Suspense>}</details>
        </section>}
      </>}

      <p className="course-storage-note">{history.storageMode === "memory" && !history.loading ? "Temporary browser storage: export important results before closing this visit. " : ""}{user ? "Course progress follows this account’s saved sessions." : "Guest course progress is kept on this device. Sign in to enable account sync."} Practice milestones are personal and are not ranked certificates. <Link to="/profile">Manage your data</Link>.</p>
    </main>
    <Footer />
  </div>;
}
