import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { SessionController } from "@/lib/typing-core";
import {
  COURSE_ASSESSMENT_VERSION, COURSE_LESSONS, COURSE_VERSION,
  assessCourseResult, buildCourseConfiguration, deriveCourseProgress, getCourseLesson,
  type CourseAssessment,
} from "@/lib/typing-course";
import type { SessionRecord } from "@/services/session-repository";
import Lessons, { CourseMetricValue, OutcomeChecks } from "./Lessons";

const fixture = vi.hoisted(() => ({ params: new URLSearchParams(), records: [] as SessionRecord[] }));
vi.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => <a href={to} {...props}>{children}</a>,
  useSearchParams: () => [fixture.params, vi.fn()],
}));
vi.mock("@/components/layout/Header", () => ({ Header: () => null }));
vi.mock("@/components/layout/Footer", () => ({ Footer: () => null }));
vi.mock("@/components/typing/TypingArea", () => ({ TypingArea: () => null }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/contexts/PreferencesContext", () => ({ usePreferences: () => ({ preferences: { language: "en", layout: "qwerty" } }) }));
vi.mock("@/hooks/useTestResults", () => ({
  useSessionHistory: () => ({ records: fixture.records, loading: false, error: null, storageMode: "persistent" }),
  useTestResults: () => ({ saveSession: vi.fn(), syncState: { message: "Saved on this device." }, retrySync: vi.fn() }),
}));

function speedAttempt(paused = false) {
  let now = 0;
  const config = buildCourseConfiguration("speed-15", { ownerId: "guest", clientSessionId: "speed-result" });
  const controller = new SessionController(config, { now: () => now, wallNow: () => 1_700_000_000_000 + now });
  controller.input({ type: "insert", text: "#" }); now += 60;
  controller.input({ type: "delete" }); now += 60;
  for (const [index, text] of [...config.initialTarget.slice(0, 48)].entries()) {
    if (paused && index === 10) { controller.pause(); now += 500; controller.resume(); }
    controller.input({ type: "insert", text }); now += 100;
  }
  now = 30_000 + (paused ? 500 : 0);
  controller.tick();
  const result = controller.result!;
  return { result, assessment: assessCourseResult(result)! };
}

/** The same durable, owner-scoped summaries used after raw replay expiry. */
function completedCourseRecords(): SessionRecord[] {
  return COURSE_LESSONS.flatMap((lesson, index) => (["a", "b"] as const).map((variantId, variantIndex) => {
    const id = `${lesson.id}-${variantId}`;
    const completedAt = 1_700_000_000_000 + index * 100_000 + variantIndex * 40_000;
    const evidence: CourseAssessment = {
      version: COURSE_ASSESSMENT_VERSION, courseId: COURSE_VERSION,
      lessonId: lesson.id, variantId, sessionId: id, ownerId: "guest",
      layout: "qwerty", language: "en", inputMethod: "keyboard", completedAt, qualifies: true,
      checks: { configuration: true, completed: true, accuracy: true, evidence: true, speed: true, unassisted: true },
      metrics: { wpm: Math.max(20, lesson.targetWpm), inputAccuracy: 100, finalTextAccuracy: 100,
        insertionAttempts: 200, correctAttempts: 200, incorrectAttempts: 0,
        elapsedMs: lesson.durationMs ?? 10_000, progress: 100 }, reasonCodes: [],
    };
    const record: SessionRecord = {
      schemaVersion: 3, ownerId: "guest", clientSessionId: id, payloadVersion: "forge-v3", payloadHash: `test:${id}`,
      courseEvidence: evidence,
      summary: { id, mode: lesson.durationMs ? "time" : "learn", wpm: evidence.metrics.wpm!, rawWpm: evidence.metrics.wpm!,
        accuracy: 100, consistency: 100, duration: evidence.metrics.elapsedMs / 1000,
        correctChars: 200, incorrectChars: 0, totalChars: 200, errors: 0,
        date: new Date(completedAt).toISOString(), wpmHistory: [] },
      privateContent: false, cloudConsent: false, provenance: "observed", state: "local-only", attempts: 0,
      nextAttemptAt: 0, createdAt: completedAt, evidenceExpiresAt: completedAt - 1,
    };
    return record;
  }));
}

beforeEach(() => { fixture.params = new URLSearchParams(); fixture.records = []; });

describe("course result target presentation", () => {
  it("shows a corrected 48/49 attempt as 97.96%, below its 98% target", () => {
    const { assessment } = speedAttempt();
    expect(assessment.metrics.correctAttempts).toBe(48);
    expect(assessment.metrics.insertionAttempts).toBe(49);
    expect(assessment.checks.accuracy).toBe(false);
    const html = renderToStaticMarkup(<OutcomeChecks assessment={assessment} lesson={getCourseLesson("speed-15")!} paused={false} />);
    expect(html).toContain("97.96% recorded");
    expect(html).not.toContain("98.0% recorded");
    expect(html).toMatch(/data-passed="false"[^>]*>.*?<p>98% input accuracy<\/p>/);
  });
  it.each([95, 97, 98])("never rounds a failing accuracy up to the %i%% threshold", minimum => {
    const html = renderToStaticMarkup(<CourseMetricValue value={minimum - 0.0001} decimals={2} minimum={minimum} meetsTarget={false} />);
    expect(html).toBe(`&lt;${minimum.toFixed(2)}`);
  });
  it("keeps the canonical passing decision at the numerical tolerance boundary", () => {
    expect(renderToStaticMarkup(<CourseMetricValue value={98 - 5e-10} decimals={2} minimum={98} meetsTarget />)).toBe("98.00");
  });
  it("does not imply a rounded passing speed or invent missing measurements", () => {
    expect(renderToStaticMarkup(<CourseMetricValue value={14.99} decimals={0} minimum={15} meetsTarget={false} />)).toBe("&lt;15");
    expect(renderToStaticMarkup(<CourseMetricValue value={null} decimals={2} minimum={98} meetsTarget={false} />)).toBe("—");
  });
  it("explains the actual pause even after recording all 30 active seconds", () => {
    const { assessment, result } = speedAttempt(true);
    expect(result.pauseIntervals).toHaveLength(1);
    expect(assessment.metrics.elapsedMs).toBe(30_000);
    expect(assessment.checks.completed).toBe(false);
    const html = renderToStaticMarkup(<OutcomeChecks assessment={assessment} lesson={getCourseLesson("speed-15")!} paused />);
    expect(html).toContain("30.0 seconds of active time · this run was paused.");
    expect(html).toContain("Paused speed practice cannot earn a checkpoint.");
    expect(html).toContain("uninterrupted required");
    expect(html).not.toContain("seconds · uninterrupted</span>");
  });
});

describe("course navigation destinations and completion state", () => {
  it.each([
    ["", 'id="course-title" tabindex="-1"', "Find your rhythm."],
    ["home-anchors", 'tabindex="-1">', COURSE_LESSONS[0].title],
    ["unknown", 'tabindex="-1">', "This lesson is not in the current course."],
  ])("provides a programmatically focusable heading for the %s destination", (lesson, marker, title) => {
    if (lesson) fixture.params.set("lesson", lesson);
    const html = renderToStaticMarkup(<Lessons />);
    expect(html).toContain(marker);
    expect(html).toContain(title);
    expect(html).toMatch(/<h1[^>]*tabindex="-1"/);
  });
  it("offers a course review after all 36 lessons instead of calling lesson 1 the next step", () => {
    fixture.records = completedCourseRecords();
    expect(deriveCourseProgress(fixture.records, "guest").completedCount).toBe(36);
    const html = renderToStaticMarkup(<Lessons />);
    expect(html).toContain('aria-label="Course review"');
    expect(html).toContain("All lessons complete.");
    expect(html).toContain("Review your course");
    expect(html).toContain('aria-label="Review completed lessons"');
    expect(html).toContain('id="course-map-title" tabindex="-1"');
    expect(html).not.toContain('aria-label="Your next lesson"');
    expect(html).not.toContain("Your next step");
  });
  it("still offers the first available lesson before any saved progress", () => {
    const html = renderToStaticMarkup(<Lessons />);
    expect(html).toContain("Start learning");
    expect(html).toContain('aria-label="Your next lesson"');
    expect(html).toContain("Your next step");
    expect(html).not.toContain("All lessons complete.");
  });
});
