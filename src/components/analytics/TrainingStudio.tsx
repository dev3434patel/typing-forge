import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TypingArea } from '@/components/typing/TypingArea';
import { useSessionHistory, useTestResults } from '@/hooks/useTestResults';
import type { SessionConfig, SessionResult } from '@/lib/typing-core/types';
import { usePreferences } from '@/contexts/PreferencesContext';
import { courseAssessmentForRecord, getCourseLesson } from '@/lib/typing-course';
import { assessPlacementRecords, placementConfiguration, placementPartFromResult, practiceConfiguration } from '@/domain/training/placement';
import { TRAINING_FINGERS, FINGER_NAMES } from '@/domain/training/finger-map';
import { trainingConfidence, type DrillKind, type KeyConfidence } from '@/domain/training/generator';
import { analyticsDashboard } from '@/domain/analytics/dashboard';
import { getAllCharacterStats, getUnlockedLetters } from '@/lib/keybr-engine';
import { assessPracticeGoal } from '@/domain/training/practice-goal';
import { SessionInsightsPanel } from './SessionInsightsPanel';
import type { SkillMap } from '@/domain/progression/types';
import { trainingProblemFocus } from '@/domain/training/skill-focus';

const kinds: Array<[DrillKind, string]> = [['home-row', 'Home-row patterns'], ['keys', 'Phonetic key drills'], ['words', 'Original word drills'], ['sentences', 'Sentence rhythm'], ['code', 'Code symbols'], ['numbers', 'Numbers and symbols'], ['problem-keys', 'Measured problem keys']];
const fingerColors = ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#FFFFFF', '#0072B2', '#D55E00', '#CC79A7', '#999999'];
export function TrainingStudio({ owner, lessonId, focusKeys }: { owner: string; lessonId?: string; focusKeys?: readonly string[] }) {
  const { preferences } = usePreferences();
  const history = useSessionHistory();
  const { saveSession } = useTestResults();
  const [kind, setKind] = useState<DrillKind>('keys');
  const [adaptiveRevision, setAdaptiveRevision] = useState(0), [useIntroduced, setUseIntroduced] = useState(false), [alphabetSize, setAlphabetSize] = useState(8);
  const [configuration, setConfiguration] = useState<SessionConfig | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [placementStage, setPlacementStage] = useState<number | null>(null);
  const [placementRun, setPlacementRun] = useState('');
  const [saving, setSaving] = useState(false), [saveError, setSaveError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [skillEvidence, setSkillEvidence] = useState<{ owner: string; layout: string; map: SkillMap } | null>(null);
  const placement = useMemo(() => assessPlacementRecords(history.records, owner), [history.records, owner]);
  const reviews = useMemo(() => analyticsDashboard(history.records, owner, Date.now(), { language: 'en', layout: preferences.layout, inputMethod: 'keyboard' }).reviews.map(item => item.key), [history.records, owner, preferences.layout]);
  useEffect(() => {
    const refresh = (event: Event) => { if ((event as CustomEvent<{ owner: string }>).detail?.owner === owner) setAdaptiveRevision(value => value + 1); };
    window.addEventListener('typingforge:learning-updated', refresh); return () => window.removeEventListener('typingforge:learning-updated', refresh);
  }, [owner]);
  useEffect(() => {
    let cancelled = false, sequence = 0;
    const refresh = async () => {
      const request = ++sequence;
      try {
        const { readProgression } = await import('@/services/progression-storage');
        const stored = await readProgression(owner), map = stored.profile.skillMaps[`en|${preferences.layout}|keyboard|prose`];
        if (!cancelled && request === sequence) setSkillEvidence(map ? { owner, layout: preferences.layout, map } : null);
      } catch { if (!cancelled && request === sequence) setSkillEvidence(null); }
    };
    const updated = (event: Event) => { if ((event as CustomEvent<string>).detail === owner) void refresh(); };
    void refresh(); window.addEventListener('sparowtype:progression', updated);
    return () => { cancelled = true; window.removeEventListener('sparowtype:progression', updated); };
  }, [owner, preferences.layout]);
  const adaptive = useMemo(() => {
    void adaptiveRevision;
    const options = { owner, dimensions: { language: 'en', layout: preferences.layout, domain: 'prose' as const, inputMethod: 'keyboard' as const }, targetWpm: preferences.targetWpm };
    const details = getAllCharacterStats(options);
    const stats: KeyConfidence[] = details.map(item => { const n = item.recentAttempts ?? item.occurrences; return { key: item.char, n, accuracy: (item.accuracy / 100 * n + 1) / (n + 2), smoothedMs: item.avgTimeMs || null }; });
    return { stats, details, introduced: getUnlockedLetters(options), problems: stats.filter(item => item.n >= 20 && item.accuracy < .92).sort((a, b) => a.accuracy - b.accuracy).slice(0, 5).map(item => item.key) };
  }, [adaptiveRevision, owner, preferences.layout, preferences.targetWpm]);
  const skillMap = skillEvidence?.owner === owner && skillEvidence.layout === preferences.layout ? skillEvidence.map : null;
  const problemFocus = skillMap ? trainingProblemFocus(skillMap) : adaptive.problems;
  const practiceGoal = useMemo(() => result && placementStage === null ? assessPracticeGoal(result, history.records.filter(record => record.ownerId === owner && record.candidate).map(record => record.candidate as SessionResult), Math.max(10, (getCourseLesson(lessonId ?? '')?.targetWpm ?? 20) * .75)) : null, [result, placementStage, history.records, owner, lessonId]);
  const validPlacementPart = useMemo(() => result && placementStage !== null ? placementPartFromResult(result) : null, [result, placementStage]);
  const failedAttempts = useMemo(() => lessonId ? history.records.map(record => courseAssessmentForRecord(record, owner)).filter(assessment => assessment?.lessonId === lessonId && !assessment.qualifies).length : 0, [history.records, owner, lessonId]);
  const begin = (stage: number | null) => {
    setResult(null); setSaveError(''); setPlacementStage(stage); setShowDetails(false);
    const sessionId = crypto.randomUUID();
    const runId = stage === 0 ? crypto.randomUUID() : placementRun;
    if (stage !== null) setPlacementRun(runId);
    const letterKeys = kind === 'problem-keys' && problemFocus.length ? [...new Set(problemFocus.join(''))] : focusKeys?.length ? focusKeys : useIntroduced ? adaptive.introduced.slice(0, alphabetSize) : [...'abcdefghijklmnopqrstuvwxyz'];
    const weak: KeyConfidence[] = skillMap ? Object.entries(skillMap.keys).map(([key, value]) => ({ key, n: value.n, accuracy: value.accuracy, smoothedMs: value.speedMs })) : adaptive.stats;
    setConfiguration(stage !== null ? placementConfiguration(owner, sessionId, stage, runId) : practiceConfiguration({ owner, sessionId, seed: sessionId, kind, keys: kind === 'home-row' ? [...'asdfjkl;'] : kind === 'numbers' ? [...'0123456789.,:;!?'] : kind === 'code' ? [...'abcdefghijklmnopqrstuvwxyz0123456789=;(){}_+'] : letterKeys, lessonId, layout: preferences.layout, practiceAssist: true, reviewKeys: reviews, weak, focusSequences: problemFocus }));
  };
  const complete = async (value: SessionResult) => {
    if (value.ownerScope !== owner) return;
    setResult(value); setSaving(true); setSaveError('');
    try { await saveSession(value); } catch { setSaveError('This attempt could not be saved. Keep it open and retry saving.'); } finally { setSaving(false); }
  };
  return <section className="panel p-5 sm:p-7 my-6" aria-label={lessonId ? 'Practice assist' : 'Placement and practice studio'}>
    <p className="eyebrow">{lessonId ? 'EXPLORE WITHOUT A CHECKPOINT' : 'CHOOSE A USEFUL START'}</p><h2 className="text-xl font-semibold mt-2">{lessonId ? 'Practice assist' : 'Placement & practice studio'}</h2><p className="text-sm text-muted-foreground mt-3">{lessonId ? 'Try this skill freely at a comfortable pace. Assist does not unlock the course, earn course stars or certify a speed.' : 'An optional 2-minute, 15-second placement suggests a starting lesson. Skip it, repeat it, or explore any practice type. Placement never unlocks or certifies the course.'}</p>
    {failedAttempts >= 2 && !configuration && <p role="status" className="text-sm mt-3">Two or more attempts have not met this lesson’s course gate. Try the untimed assist with the larger finger reference below; choose your own pace and return whenever you feel ready.</p>}
    {!configuration && <><div className="flex flex-wrap gap-3 items-end mt-4"><label className="text-sm">Practice type<select className="forge-input mt-2" value={kind} onChange={event => setKind(event.target.value as DrillKind)}>{kinds.map(([value, title]) => <option value={value} key={value}>{title}</option>)}</select></label><button className="forge-button-secondary" onClick={() => begin(null)}>Start free practice</button>{!lessonId && <button className="forge-button" onClick={() => begin(0)}>{placement ? 'Retake placement' : 'Try optional placement'}</button>}</div>
      <div className="flex flex-wrap gap-4 items-center mt-3"><label className="min-h-11 flex items-center gap-2 text-sm"><input type="checkbox" checked={useIntroduced} onChange={event => setUseIntroduced(event.target.checked)} /> Use my introduced adaptive alphabet</label><label className="text-sm">Alphabet limit<select className="forge-input mt-2" value={alphabetSize} onChange={event => setAlphabetSize(Number(event.target.value))}>{[3, 5, 8, 12, 26].map(size => <option value={size} key={size}>Up to {size} introduced letters</option>)}</select></label></div>
      {kind === 'problem-keys' && <p className="text-xs text-muted-foreground mt-3">{problemFocus.length ? `Measured ${skillMap ? 'skill-map keys and bigrams' : 'adaptive keys'}: ${problemFocus.join(' · ')}. At least 20 attempts and Bayesian accuracy below 92% are required.` : 'No persistent weak key is established in this model. This exercise uses the selected practice alphabet instead.'}</p>}
      <details className="mt-3"><summary className="min-h-11 flex items-center cursor-pointer text-sm">Why keys are ready or still developing</summary><p className="text-xs text-muted-foreground my-2">English · {preferences.layout} · keyboard prose. Planning confidence combines pace and smoothed accuracy; it is a practice hint, not an unlock. Adaptive mastery keeps its existing assessment rules: at least 20 attributable attempts across two dedicated lessons, at least 97% accuracy at target pace, and two consecutive qualifying checkpoints. Every introduced key must be mastered before the next key is introduced. Free assist never bypasses these rules or course checkpoints.</p><div className="overflow-x-auto"><table className="w-full text-left text-xs"><caption className="sr-only">Measured planning confidence and actual adaptive assessment state</caption><thead><tr><th scope="col" className="p-2">Key</th><th scope="col">Assessment state</th><th scope="col">Recent samples</th><th scope="col">Planning confidence</th><th scope="col">Qualifying checkpoints</th><th scope="col">What to practise</th></tr></thead><tbody>{adaptive.stats.map(item => { const confidence = trainingConfidence(item, 12000 / preferences.targetWpm), state = adaptive.details.find(detail => detail.char === item.key); return <tr key={item.key}><th scope="row" className="p-2 font-mono">{item.key}</th><td>{state?.assessmentState ?? 'locked'}</td><td>{item.n}</td><td>{(confidence * 100).toFixed(0)}%</td><td>{state?.masteryCheckpoints ?? 0} of 2</td><td>{!adaptive.introduced.includes(item.key) ? 'Develop the introduced keys first' : item.n < 20 ? 'Build 20 measured samples' : confidence < .92 ? 'Aim for 92% planning confidence at target pace' : 'Keep control in dedicated adaptive assessments'}</td></tr>; })}</tbody></table></div></details>
      <details className="mt-4"><summary className="min-h-11 flex items-center cursor-pointer text-sm">Finger reference · hints never affect scoring</summary><svg viewBox="0 0 540 115" className="w-full max-w-xl mt-2" role="img" aria-label="Finger reference: left little, ring, middle and index; either thumb; right index, middle, ring and little. The live keyboard highlights the next reference key while practising.">{TRAINING_FINGERS.map((finger, index) => <g key={finger} transform={`translate(${index * 59 + 8},12)`}><rect x={10} y={index === 4 ? 35 : 5} width={32} height={index === 4 ? 38 : 65} rx={15} fill={fingerColors[index]} opacity={.6} stroke="currentColor" strokeWidth={2} /><text x={26} y={94} textAnchor="middle" fill="currentColor" fontSize={14}>{index + 1}</text></g>)}</svg><ol className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mt-2">{TRAINING_FINGERS.map((finger, index) => <li key={finger}>{index + 1}. {FINGER_NAMES[finger]}</li>)}</ol></details></>}
    {configuration && !result && <div className="mt-5"><p className="text-xs text-muted-foreground mb-3">{placementStage === null ? 'Free assist · private custom practice · no course checkpoint' : `Placement part ${placementStage + 1} of 3 · 45 seconds · English/QWERTY`}</p><TypingArea key={configuration.clientSessionId} configuration={configuration} onTestComplete={value => void complete(value)} onRestart={() => begin(placementStage)} autoFocus /><button className="forge-button-secondary mt-4" onClick={() => { setConfiguration(null); setPlacementStage(null); }}>Leave practice</button></div>}
    {result && <div className="mt-5" aria-live="polite"><p className="font-medium">{placementStage === null ? 'Practice recorded' : `Placement part ${placementStage + 1} ${validPlacementPart ? 'complete' : 'ended'}`}</p><p className="text-sm text-muted-foreground mt-2">{result.metrics.wpm?.toFixed(1) ?? '—'} WPM · {result.metrics.inputAccuracy?.toFixed(1) ?? '—'}% input accuracy. {saving ? 'Saving…' : saveError || 'Personal practice; no course checkpoint awarded.'}</p>{practiceGoal && <p className="text-sm mt-3">Personal practice goal: {practiceGoal.passed ? 'met' : 'keep building'} · {practiceGoal.targetWpm.toFixed(1)} WPM at 90% input accuracy · {practiceGoal.source === 'cold-start' ? 'comfortable starting target' : `105% of your last ${practiceGoal.comparableAttempts} comparable attempts’ median`} · {practiceGoal.practiceStars} of 3 practice stars. These do not become course stars or checkpoints.</p>}{placementStage !== null && !validPlacementPart && <p className="text-sm mt-3">This part needs a complete uninterrupted 45 seconds and at least 25 individual keyboard attempts. Repeat it to produce placement guidance.</p>}{saveError && <button className="forge-button-secondary mt-3" disabled={saving} onClick={() => void complete(result)}>Retry saving</button>}<div className="flex flex-wrap gap-3 mt-4">{placementStage !== null && validPlacementPart && placementStage < 2 && <button className="forge-button" disabled={saving || !!saveError} onClick={() => begin(placementStage + 1)}>Next placement part</button>}{placementStage !== null && !validPlacementPart && <button className="forge-button-secondary" disabled={saving} onClick={() => begin(placementStage)}>Repeat placement part</button>}<button className="forge-button-secondary" disabled={saving} onClick={() => { setConfiguration(null); setResult(null); setPlacementStage(null); }}>Back to practice choices</button></div><details className="mt-4" onToggle={event => setShowDetails(event.currentTarget.open)}><summary className="min-h-11 flex items-center cursor-pointer">Explore key and finger evidence</summary>{showDetails && <SessionInsightsPanel result={result} />}</details></div>}
    {placement && <aside className="p-4 rounded-lg bg-muted/30 mt-5"><h3 className="font-medium">Your placementV1 guidance</h3><p className="text-sm text-muted-foreground mt-2">Median {placement.wpm.toFixed(1)} WPM across 3 parts · {placement.inputAccuracy.toFixed(1)}% attempt-weighted accuracy. Local guidance, not a ranking or certificate.</p><Link className="forge-button-secondary mt-3" to={`/lessons?lesson=${encodeURIComponent(placement.recommendedLessonId)}`}>Explore {getCourseLesson(placement.recommendedLessonId)?.title}</Link></aside>}
  </section>;
}
