import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';

// Audit-only process storage. Does not access browser or production data.
const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
  clear: () => storage.clear(),
};

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const metrics = await server.ssrLoadModule('/src/lib/metrics-engine.ts');
  const professional = await server.ssrLoadModule('/src/lib/professional-accuracy.ts');
  const keybr = await server.ssrLoadModule('/src/lib/keybr-engine.ts');

  const text = 'abcdefghij';
  const keystrokes = Array.from(text, (char, position) => ({
    session_id: 'audit', char_expected: char, char_typed: char,
    event_type: 'keydown', timestamp_ms: position * (1000 / 9),
    cursor_index: position, is_backspace: false, is_correct: true,
  }));
  const canonical = metrics.computeSessionMetrics(keystrokes, text, text, true);
  const report = professional.generateProfessionalAccuracyReport(text, text, [], 30, 0, [0, 0], true);

  const startingLetters = keybr.getUnlockedLetters();
  const practiceText = startingLetters.join('').repeat(12);
  const practiceLog = Array.from(practiceText, (char, index) => ({
    char, expected: char, timestamp: index * 100, isCorrect: true,
  }));
  let progress;
  for (let lesson = 0; lesson < 10; lesson++) {
    progress = keybr.updateCharacterProgress(keybr.calculatePerCharMetrics(practiceLog));
  }
  const nextLesson = keybr.generateKeybrLesson(40);

  const results = {
    timing: {
      description: 'Ten correct characters typed over one second in a thirty second timed test',
      expectedFullTestWpm: 4,
      canonicalWpm: canonical.netWpm,
      canonicalDurationSeconds: canonical.durationSeconds,
      professionalReportWpmUsingFullDuration: report.overview.wpm,
    },
    learning: {
      description: 'Ten perfect high speed lessons practicing all initially available letters',
      startingLetters,
      availableLettersAfterPractice: keybr.getUnlockedLetters(),
      remainingLockedLetters: keybr.getLockedLetters().length,
      reportedNextLetter: progress.nextToUnlock,
      reportedNewUnlocks: progress.newlyUnlocked,
      nextLessonAvailableLetters: nextLesson.availableLetters,
    },
    zeroWpmHistory: {
      lowestWpm: String(report.consistency.lowestWpm),
      lowestWpmIsFinite: Number.isFinite(report.consistency.lowestWpm),
    },
  };

  await writeFile(new URL('./engine-probes.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
} finally {
  await server.close();
}
