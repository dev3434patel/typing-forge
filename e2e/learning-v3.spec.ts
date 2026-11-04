import { test, expect } from '@playwright/test';
import { exportedResult } from './helpers';

test('learning shows the pressed wrong letter and advances by default, with corrections still counted', async ({ page }) => {
  await page.goto('/learn');
  await expect(page.getByLabel('Correction policy')).toHaveValue('correct');
  const input = page.getByRole('textbox', { name: 'Type the practice text' });
  const target = page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text');
  const text = await target.textContent();
  expect(text).toBeTruthy();
  const wrong = text![0] === 'x' ? 'z' : 'x';
  await input.focus();
  await input.pressSequentially(wrong);
  await expect(target.locator('[data-typed]').first()).toHaveAttribute('data-typed', wrong);
  await expect(target.locator('[data-typed]').first()).toHaveAttribute('data-expected', text![0]);
  await expect(target.locator('[data-typed]').first()).toContainText(wrong);
  await expect(target.locator('[data-typed]').first()).not.toHaveAttribute('data-current', 'true');
  await expect(target.locator('[data-current="true"]')).toHaveAttribute('data-expected', text![1]);
  await expect(page.getByTestId('typing-feedback')).toContainText('Expected');
  await expect(page.getByTestId('typing-feedback')).toContainText(wrong);
  await expect(page.getByTestId('typing-feedback')).toContainText('Added to your text');

  await input.press('Backspace');
  await expect(target).toHaveText(text!);
  await expect(target.locator('[data-current="true"]')).toHaveAttribute('data-expected', text![0]);
  await input.pressSequentially(text!, { delay: 3 });
  await expect(page.getByRole('region', { name: 'Session results' })).toBeVisible();
  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem('typingforge:v3:guest:learning') || '{}'));
  expect(evidence.sessions).toHaveLength(1);
  expect(evidence.sessions[0].attempts).toHaveLength([...text!].length + 1);
  expect(evidence.sessions[0].attempts.filter((attempt: { correct: boolean }) => !attempt.correct)).toHaveLength(1);
  await expect(page.getByRole('region', { name: 'Session results' })).toContainText((text!.length / (text!.length + 1) * 100).toFixed(1));
});

test('learning records rejected attempts and saves exactly one immutable result', async ({ page }) => {
  await page.goto('/learn');
  await page.getByLabel('Correction policy').selectOption('stop');
  const input = page.getByRole('textbox', { name: 'Type the practice text' });
  await expect(input).toBeVisible();
  const text = await page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text').textContent();
  expect(text).toBeTruthy();
  const wrong = text![0] === 'x' ? 'z' : 'x';
  await input.focus();
  await input.pressSequentially(wrong);
  await expect(page.getByTestId('typing-feedback')).toBeVisible();
  await expect(page.getByTestId('typing-feedback')).toContainText('Expected');
  await expect(page.getByTestId('typing-feedback')).toContainText(wrong);
  await expect(page.getByTestId('typing-feedback')).toContainText('Not inserted');
  await expect(page.locator('[aria-label="Adaptive typing lesson"] [data-current="true"]')).toHaveAttribute('data-expected', text![0]);
  await expect(page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text')).toHaveText(text!);
  await expect(input).toHaveValue('');
  await input.pressSequentially(text!, { delay: 3 });
  await expect(page.getByRole('region', { name: 'Session results' })).toBeVisible();
  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem('typingforge:v3:guest:learning') || '{}'));
  expect(evidence.sessions).toHaveLength(1);
  expect(evidence.sessions[0].attempts).toHaveLength([...text!].length + 1);
  expect(evidence.sessions[0].attempts.filter((attempt: { correct: boolean }) => !attempt.correct)).toHaveLength(1);
  const expectedAccuracy = text!.length / (text!.length + 1) * 100;
  await expect(page.getByRole('region', { name: 'Session results' })).toContainText(expectedAccuracy.toFixed(1));
  await page.reload();
  await expect(page.getByText('Make every key feel natural.')).toBeVisible();
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('typingforge:v3:guest:learning') || '{}'));
  expect(persisted.sessions).toHaveLength(1);
});

test('learning preserves wrong-key feedback when one stop-mode input batch ends correctly', async ({ page }) => {
  await page.goto('/learn?language=en');
  await page.getByLabel('Correction policy').selectOption('stop');
  const target = page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text');
  const first = await target.locator('[data-slot-index="0"]').getAttribute('data-expected');
  const second = await target.locator('[data-slot-index="1"]').getAttribute('data-expected');
  expect(first).toBeTruthy();
  expect(second).toBeTruthy();
  const wrong = 'x';
  expect([first, second]).not.toContain(wrong);
  const batch = `${wrong}${first}${wrong}${second}`;
  const input = page.getByRole('textbox', { name: 'Type the practice text' });
  await input.fill(batch);
  const feedback = page.getByTestId('typing-feedback');
  await expect(feedback).toContainText(`You typed ${wrong}`);
  await expect(feedback).toContainText(`Expected ${second}`);
  await expect(feedback).toContainText('Not inserted');
  await expect(feedback).toContainText('2 incorrect units in this input');
  await expect(target.locator('[data-slot-index="0"]')).toHaveAttribute('data-typed', first!);
  await expect(target.locator('[data-slot-index="1"]')).toHaveAttribute('data-typed', second!);
  await expect(target.locator('[data-current="true"]')).toHaveAttribute('data-slot-index', '2');
  await page.getByRole('button', { name: 'Finish practice', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Session results' })).toBeVisible();
  const result = await exportedResult(page);
  expect(result.events).toHaveLength(1);
  expect(result.events[0].text).toBe(batch);
  expect(result.metrics.insertionAttempts).toBe(4);
  expect(result.metrics.incorrectAttempts).toBe(2);
  expect(result.finalText).toBe(`${first}${second}`);
});

test('Tab leaves the learning input without generating another lesson', async ({ page }) => {
  await page.goto('/learn');
  const target = page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text');
  const before = await target.textContent();
  const input = page.getByRole('textbox', { name: 'Type the practice text' });
  await input.focus();
  await input.press('Tab');
  await expect(input).not.toBeFocused();
  await expect(target).toHaveText(before!);
  await expect(page.getByRole('button', { name: 'Finger guide', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Hide keyboard', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Correction policy')).toBeFocused();
});

test('Arabic lesson uses RTL native characters and composition has no invented key timing', async ({ page }) => {
  await page.goto('/learn?language=ar&layout=native');
  await expect(page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text[dir="rtl"]')).toBeVisible();
  await page.getByLabel('Input method', { exact: true }).selectOption('composition');
  const input = page.getByRole('textbox', { name: 'Type the practice text' });
  const text = await page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text').textContent();
  await input.evaluate((element, content) => {
    element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
    element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: content }));
  }, text!);
  await expect(page.getByRole('region', { name: 'Session results' })).toBeVisible();
  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem('typingforge:v3:guest:learning') || '{}'));
  expect(evidence.sessions).toHaveLength(1);
  expect(evidence.sessions[0].dimensions).toMatchObject({ language: 'ar', layout: 'native', inputMethod: 'composition' });
  expect(evidence.sessions[0].attempts.every((attempt: { attributable: boolean; latencyMs: number | null }) => !attempt.attributable && attempt.latencyMs === null)).toBe(true);
});

for (const language of ['en', 'es', 'fr', 'de', 'pt', 'it', 'ru', 'hi', 'ar', 'gu-Latn']) {
  test(`${language} content completes through the actual learning input adapter`, async ({ page }) => {
    await page.goto(`/learn?language=${language}`);
    const input = page.getByRole('textbox', { name: 'Type the practice text' });
    await expect(input).toBeVisible();
    const text = await page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text').textContent();
    expect(text?.length).toBeGreaterThan(0);
    if (language === 'hi' || language === 'ar') {
      await input.evaluate((element, content) => {
        element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
        element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: content }));
      }, text!);
    } else {
      await input.focus();
      await input.pressSequentially(text!);
    }
    await expect(page.getByRole('region', { name: 'Session results' })).toBeVisible();
    const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem('typingforge:v3:guest:learning') || '{}'));
    expect(evidence.sessions).toHaveLength(1);
    expect(evidence.sessions[0].dimensions.language).toBe(language);
    expect(evidence.sessions[0].attempts.every((attempt: { correct: boolean }) => attempt.correct)).toBe(true);
    if (language === 'hi' || language === 'ar') expect(evidence.sessions[0].dimensions.inputMethod).toBe('composition');
  });
}

for (const viewport of [
  { name: 'portrait', width: 390, height: 844, scrollBeforeFinish: false },
  { name: 'landscape', width: 844, height: 390, scrollBeforeFinish: false },
  { name: 'previously scrolled portrait', width: 390, height: 844, scrollBeforeFinish: true },
]) {
  test(`learning completion keeps results focused and their summary visible in ${viewport.name}`, async ({ page }, info) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    // This scenario isolates result focus; the normal opening/PWA suites retain
    // their own production animation and service-worker coverage.
    await page.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
    await page.goto('/learn?language=en&layout=qwerty');
    const input = page.getByRole('textbox', { name: 'Type the practice text', exact: true });
    await expect(input).toBeVisible();
    const target = page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text');
    const text = await target.textContent();
    expect(text?.length).toBeGreaterThan(1);
    await input.focus();
    await input.pressSequentially(text!.slice(0, -1), { delay: 3 });
    await expect(page.getByRole('region', { name: 'Session results', exact: true })).toHaveCount(0);
    if (viewport.scrollBeforeFinish) {
      const scrollable = await page.evaluate(() => {
        const available = document.documentElement.scrollHeight - innerHeight;
        window.scrollTo({ top: Math.min(100, available), behavior: 'instant' });
        return available;
      });
      expect(scrollable).toBeGreaterThan(0);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
      await expect(input).toBeFocused();
    }
    const scrollBefore = await page.evaluate(() => scrollY);
    await input.pressSequentially(text!.slice(-1));
    const learningResults = page.locator('[aria-label="Learning results"]');
    await expect(learningResults).toBeFocused();
    const results = learningResults.getByRole('region', { name: 'Session results', exact: true });
    await expect(results).toBeVisible();
    // Check the actual summary line, not the tall result region whose chart and
    // evidence can legitimately extend below a phone viewport.
    await expect(results.getByText('Session complete', { exact: true })).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
    const evidence = await exportedResult(page);
    expect(evidence.finalText).toBe(text);
    expect(evidence.metrics.insertionAttempts).toBe([...text!].length);
    expect(evidence.metrics.incorrectAttempts).toBe(0);
    expect(evidence.metrics.inputAccuracy).toBe(100);
    await info.attach('learning-result-focus-viewport', {
      contentType: 'application/json',
      body: JSON.stringify({ viewport, scrollBefore, scrollAfter: await page.evaluate(() => scrollY),
        canonicalInputExact: true, attempts: evidence.metrics.insertionAttempts, inputAccuracy: evidence.metrics.inputAccuracy,
        focusAndSummaryVisibilityCheckedBeforeExport: true, virtualClock: false }),
    });
  });
}



test('learning reuses saved key evidence during live input and refreshes it when the input model changes', async ({ page }) => {
  await page.goto('/learn?language=en&layout=qwerty');
  const input = page.getByRole('textbox', { name: 'Type the practice text' });
  const target = page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text');
  const firstText = await target.textContent();
  expect(firstText).toBeTruthy();
  const sampledKey = firstText!.match(/[a-z]/u)?.[0];
  expect(sampledKey).toBeTruthy();
  await input.focus();
  await input.pressSequentially(firstText!, { delay: 3 });
  const results = page.getByRole('region', { name: 'Session results' });
  await expect(results).toBeVisible();
  await expect(results).toContainText('Saved on this device. Sign in to enable account sync.');
  const completed = await exportedResult(page);
  expect(completed.finalText).toBe(firstText);
  expect(completed.metrics.insertionAttempts).toBe([...firstText!].length);
  expect(completed.metrics.incorrectAttempts).toBe(0);
  expect(completed.metrics.inputAccuracy).toBe(100);

  await page.getByRole('button', { name: 'Next test', exact: true }).click();
  const nextText = await target.textContent();
  expect(nextText!.length).toBeGreaterThan(40);
  const details = page.locator('details.learn-evidence');
  await expect(details).not.toHaveAttribute('open');
  const clock = page.locator('.learn-time-indicator p');
  const elapsedSeconds = async () => Number.parseFloat((await clock.textContent()) ?? '');
  await input.focus();
  await input.pressSequentially(nextText!.slice(0, 8), { delay: 5 });
  // Observe the real live clock after the completed lesson has been acknowledged
  // and the next lesson has started. No clock or event timing is replaced.
  await expect.poll(elapsedSeconds).toBeGreaterThan(1.2);

  await page.evaluate(() => {
    const host = window as Window & {
      __sparowTypeLearningReadProbe?: { count: () => number; restore: () => void };
    };
    const original = Storage.prototype.getItem;
    let reads = 0;
    Storage.prototype.getItem = function (this: Storage, key: string) {
      if (this === localStorage && key === 'typingforge:v3:guest:learning') reads += 1;
      return Reflect.apply(original, this, [key]);
    };
    host.__sparowTypeLearningReadProbe = {
      count: () => reads,
      restore: () => {
        Storage.prototype.getItem = original;
        delete host.__sparowTypeLearningReadProbe;
      },
    };
  });
  const learningReads = () => page.evaluate(() => {
    const host = window as Window & {
      __sparowTypeLearningReadProbe?: { count: () => number };
    };
    return host.__sparowTypeLearningReadProbe!.count();
  });
  try {
    const beforeHiddenInput = await elapsedSeconds();
    await input.pressSequentially(nextText!.slice(8, 20), { delay: 5 });
    await expect(target.locator('[data-current="true"]')).toHaveAttribute('data-slot-index', '20');
    await expect.poll(elapsedSeconds).toBeGreaterThanOrEqual(beforeHiddenInput + 0.3);
    await expect(details).not.toHaveAttribute('open');
    expect(await learningReads(), 'Closed evidence must not reread the saved model on keystrokes or HUD ticks').toBe(0);

    await details.locator('summary').click();
    await expect(details).toHaveAttribute('open', '');
    const key = details.getByRole('button', { name: new RegExp('^' + sampledKey + ': sampled,') });
    await expect(key).toBeVisible();
    const beforeVisibleInput = await elapsedSeconds();
    await input.focus();
    await input.pressSequentially(nextText!.slice(20, 32), { delay: 5 });
    await expect(target.locator('[data-current="true"]')).toHaveAttribute('data-slot-index', '32');
    await expect.poll(elapsedSeconds).toBeGreaterThanOrEqual(beforeVisibleInput + 0.3);
    await expect(details).toHaveAttribute('open', '');
    await expect(key).toHaveAccessibleName(new RegExp('^' + sampledKey + ': sampled,'));
    expect(await learningReads(), 'Visible saved evidence remains correct without rereads during active input').toBe(0);

    await page.getByLabel('Input method', { exact: true }).selectOption('composition');
    await expect(details.getByRole('button', { name: sampledKey + ': Introduced, awaiting evidence', exact: true })).toBeVisible();
    expect(await learningReads(), 'A real input-model change must refresh evidence').toBeGreaterThan(0);
    await page.getByLabel('Input method', { exact: true }).selectOption('keyboard');
    await expect(details.getByRole('button', { name: new RegExp('^' + sampledKey + ': sampled,') })).toBeVisible();
  } finally {
    await page.evaluate(() => {
      const host = window as Window & {
        __sparowTypeLearningReadProbe?: { restore: () => void };
      };
      host.__sparowTypeLearningReadProbe?.restore();
    });
  }
});

test.describe('empty native lesson draft', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('sparowtype.opening-animation.enabled', 'false');
      const probe = {
        before: [] as { trusted: boolean; cancelable: boolean; prevented: boolean; type: string }[],
        compositions: [] as { type: string; trusted: boolean }[],
        inputs: 0,
      };
      Object.assign(window, { lessonNativeProbe: probe });
      const isLessonInput = (target: EventTarget | null) => target instanceof HTMLTextAreaElement &&
        target.getAttribute('aria-label') === 'Type the practice text';
      // Bubble after the actual target listeners so cancellation is observed.
      document.addEventListener('beforeinput', event => {
        if (!isLessonInput(event.target)) return;
        const input = event as InputEvent;
        probe.before.push({ trusted: input.isTrusted, cancelable: input.cancelable,
          prevented: input.defaultPrevented, type: input.inputType });
      });
      document.addEventListener('input', event => {
        if (isLessonInput(event.target)) probe.inputs += 1;
      }, true);
      for (const type of ['compositionstart', 'compositionend']) {
        document.addEventListener(type, event => {
          if (isLessonInput(event.target)) probe.compositions.push({ type: event.type, trusted: event.isTrusted });
        }, true);
      }
    });
  });

  test('trusted letters and an accepted space commit once without a native draft or an idle clock', async ({ page }) => {
    await page.goto('/learn?language=en&layout=qwerty');
    const input = page.getByRole('textbox', { name: 'Type the practice text', exact: true });
    const target = page.locator('.learn-stream-text');
    const text = (await target.textContent())!;
    const firstSpace = text.indexOf(' ');
    expect(firstSpace).toBeGreaterThan(0);
    const prefix = text.slice(0, firstSpace + 3);
    await input.focus();
    await input.press('Space');
    await page.waitForTimeout(180);
    await expect(target.locator('[data-current="true"]')).toHaveAttribute('data-slot-index', '0');
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toHaveCount(0);
    await expect(page.locator('.learn-time-indicator p')).toHaveText('0.0s');
    const beforeFirstKey = await page.evaluate(() => Date.now());
    await input.pressSequentially(prefix, { delay: 3 });
    const afterFirstKeys = await page.evaluate(() => Date.now());
    await expect(input).toHaveValue('');
    await expect(target.locator('[data-current="true"]')).toHaveAttribute('data-slot-index', String(prefix.length));
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
    const observed = await page.evaluate(() => (window as Window & {
      lessonNativeProbe: { before: { trusted: boolean; cancelable: boolean; prevented: boolean; type: string }[]; inputs: number };
    }).lessonNativeProbe);
    expect(observed.before).toHaveLength(prefix.length);
    expect(observed.before.every(event => event.trusted && event.cancelable && event.prevented && event.type === 'insertText')).toBe(true);
    expect(observed.inputs).toBe(0);
    await expect(page.getByText('Type the word before pressing Space.', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Finish practice', exact: true }).click();
    const result = await exportedResult(page);
    expect(result.finalText).toBe(prefix);
    expect(result.events).toHaveLength(prefix.length);
    expect(result.events.every(event => event.provenance === 'keyboard')).toBe(true);
    expect(result.metrics).toMatchObject({ insertionAttempts: prefix.length, correctAttempts: prefix.length, inputAccuracy: 100 });
    expect(result.events[0].offsetMs).toBe(0);
    expect(result.startedAtWall).toBeGreaterThanOrEqual(beforeFirstKey);
    expect(result.startedAtWall).toBeLessThanOrEqual(afterFirstKeys);
  });

  test('untrusted and noncancelable input fallbacks preserve composition ownership and a genuine repeated letter', async ({ page }) => {
    await page.goto('/learn?language=en&layout=qwerty');
    const input = page.getByRole('textbox', { name: 'Type the practice text', exact: true });
    const text = (await page.locator('.learn-stream-text').textContent())!;
    const prefix = text.slice(0, 2);
    await input.focus();
    for (const [index, char] of [...prefix].entries()) {
      const delivered = await input.evaluate((element, change) => {
        return element.dispatchEvent(new InputEvent('beforeinput', {
          bubbles: true, cancelable: change.cancelable, inputType: 'insertText', data: change.text,
        }));
      }, { cancelable: index === 0, text: char });
      expect(delivered).toBe(true);
      await expect(page.locator('.learn-stream-text [data-current="true"]')).toHaveAttribute('data-slot-index', String(index));
      await input.evaluate((element, char) => {
        const field = element as HTMLTextAreaElement;
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(field, char);
        field.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: char }));
      }, char);
      await expect(input).toHaveValue('');
    }
    await input.evaluate(element => {
      const field = element as HTMLTextAreaElement;
      const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
      field.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
      setValue.call(field, 'e\u0301');
      field.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertCompositionText', data: 'e\u0301', isComposing: true }));
      field.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'e\u0301' }));
      setValue.call(field, 'é');
      const echo = new InputEvent('input', { bubbles: true, inputType: 'insertCompositionText', data: 'é' });
      if (echo.inputType !== 'insertCompositionText') throw new Error('The browser did not preserve the explicit composition echo type.');
      field.dispatchEvent(echo);
    });
    await expect(input).toHaveValue('');
    const beforeRepeat = await page.evaluate(() => (window as Window & {
      lessonNativeProbe: { compositions: { type: string; trusted: boolean }[] };
    }).lessonNativeProbe.compositions.length);
    // Some native automation paths use a composition to insert Unicode. Observe
    // that real sequence rather than assuming the insertion's provenance.
    await page.keyboard.insertText('é');
    await expect(input).toHaveValue('');
    const repeatComposition = await page.evaluate(start => (window as Window & {
      lessonNativeProbe: { compositions: { type: string; trusted: boolean }[] };
    }).lessonNativeProbe.compositions.slice(start), beforeRepeat);
    if (repeatComposition.length) {
      expect(repeatComposition.map(event => event.type)).toEqual(['compositionstart', 'compositionend']);
      expect(repeatComposition.every(event => event.trusted)).toBe(true);
    }
    const repeatProvenance = repeatComposition.length ? 'composition' : 'keyboard';
    await page.getByRole('button', { name: 'Finish practice', exact: true }).click();
    const result = await exportedResult(page);
    expect(result.finalText).toBe(`${prefix}éé`);
    expect(result.metrics.insertionAttempts).toBe(4);
    expect(result.events).toHaveLength(4);
    expect(result.events.map(event => event.provenance)).toEqual(['keyboard', 'keyboard', 'composition', repeatProvenance]);
    expect(result.events[2].text).toBe('e\u0301');
  });

  test('pause, resume and a new lesson keep trusted insertions in their own session', async ({ page }) => {
    await page.goto('/learn?language=en&layout=qwerty');
    const input = page.getByRole('textbox', { name: 'Type the practice text', exact: true });
    const target = page.locator('.learn-stream-text');
    const text = (await target.textContent())!;
    await input.focus();
    await input.pressSequentially(text.slice(0, 3));
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Resume practice', exact: true })).toBeFocused();
    await page.waitForTimeout(180);
    await page.getByRole('button', { name: 'Resume practice', exact: true }).click();
    await expect(input).toBeFocused();
    await input.pressSequentially(text.slice(3, 5));
    await page.getByRole('button', { name: 'Finish practice', exact: true }).click();
    const previous = await exportedResult(page);
    expect(previous.finalText).toBe(text.slice(0, 5));
    expect(previous.metrics.insertionAttempts).toBe(5);
    expect(previous.pauseIntervals).toHaveLength(1);
    expect(previous.pauseIntervals[0].endMs - previous.pauseIntervals[0].startMs).toBeGreaterThanOrEqual(150);
    await page.getByRole('button', { name: 'Next test', exact: true }).click();
    const next = (await target.textContent())!;
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toHaveCount(0);
    await expect(page.locator('.learn-time-indicator p')).toHaveText('0.0s');
    await input.focus();
    await input.pressSequentially(next.slice(0, 2));
    await page.getByRole('button', { name: 'Finish practice', exact: true }).click();
    const result = await exportedResult(page);
    expect(result.clientSessionId).not.toBe(previous.clientSessionId);
    expect(result.finalText).toBe(next.slice(0, 2));
    expect(result.events).toHaveLength(2);
    expect(result.metrics).toMatchObject({ insertionAttempts: 2, correctAttempts: 2, inputAccuracy: 100 });
    expect(result.pauseIntervals).toEqual([]);
    expect(result.events[0].offsetMs).toBe(0);
  });

  test('line breaks retain native textarea normalization instead of the direct insertion path', async ({ page }) => {
    const reference = await page.context().newPage();
    let native: { value: string; attempts: number; compositions: { type: string; trusted: boolean }[] };
    try {
      await reference.setContent('<!doctype html><html lang="en"><head><title>Native line break reference</title></head><body><label for="native">Native reference</label><textarea id="native"></textarea></body></html>');
      await reference.locator('textarea').evaluate(element => {
        const compositions: { type: string; trusted: boolean }[] = [];
        Object.assign(window, { nativeLineBreakCompositions: compositions });
        for (const type of ['compositionstart', 'compositionend']) {
          element.addEventListener(type, event => compositions.push({ type: event.type, trusted: event.isTrusted }));
        }
      });
      await reference.locator('textarea').focus();
      await reference.keyboard.insertText('a\r\nb');
      native = await reference.locator('textarea').evaluate(element => {
        const value = (element as HTMLTextAreaElement).value;
        return {
          value,
          // Prose keeps native line endings and applies NFC. CRLF is one
          // Unicode grapheme even when a native command retains both units.
          attempts: Array.from(new Intl.Segmenter('und', { granularity: 'grapheme' }).segment(value.normalize('NFC'))).length,
          compositions: (window as Window & {
            nativeLineBreakCompositions: { type: string; trusted: boolean }[];
          }).nativeLineBreakCompositions,
        };
      });
    } finally {
      await reference.close();
    }
    expect(native!.attempts).toBe(3);
    if (native!.compositions.length) {
      expect(native!.compositions.map(event => event.type)).toEqual(['compositionstart', 'compositionend']);
      expect(native!.compositions.every(event => event.trusted)).toBe(true);
    }
    await page.goto('/learn?language=en&layout=qwerty');
    const input = page.getByRole('textbox', { name: 'Type the practice text', exact: true });
    await input.focus();
    await page.keyboard.insertText('a\r\nb');
    await expect(input).toHaveValue('');
    await page.getByRole('button', { name: 'Finish practice', exact: true }).click();
    const result = await exportedResult(page);
    expect(result.finalText).toBe(native!.value.normalize('NFC'));
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({ text: native!.value,
      provenance: native!.compositions.length ? 'composition' : 'keyboard' });
    expect(result.metrics.insertionAttempts).toBe(native!.attempts);
    const observed = await page.evaluate(() => (window as Window & {
      lessonNativeProbe: { before: { trusted: boolean; cancelable: boolean; prevented: boolean; type: string }[]; inputs: number };
    }).lessonNativeProbe);
    expect(observed.inputs).toBeGreaterThan(0);
    expect(observed.before.some(event => event.trusted && !event.prevented)).toBe(true);
    const appComposition = await page.evaluate(() => (window as Window & {
      lessonNativeProbe: { compositions: { type: string; trusted: boolean }[] };
    }).lessonNativeProbe.compositions);
    expect(appComposition).toEqual(native!.compositions);
  });
});
