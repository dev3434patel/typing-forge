<?php
declare(strict_types=1);

namespace SparowType;

/** Native PHP replay of the portable forge-v3 contract. No client correctness flag is trusted. */
final class SessionValidator
{
    public const MAX_INSERTED_UTF16_UNITS = 20000;
    private array $graphemeCache = [];

    private static function check(bool $condition, string $message): void
    {
        if (!$condition) {
            throw new \InvalidArgumentException($message);
        }
    }

    private static function number(mixed $value): bool
    {
        return (is_int($value) || is_float($value)) && is_finite((float)$value);
    }

    private static function integer(mixed $value): bool
    {
        return self::number($value) && floor((float)$value) === (float)$value;
    }

    private static function json(mixed $value): string
    {
        return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    }

    /** Stable server idempotency representation. Objects are sorted, ordered evidence is not. */
    public static function stablePayload(mixed $value): string
    {
        if (is_object($value)) {
            $value = get_object_vars($value);
            $object = true;
        } else {
            $object = false;
        }
        if (!is_array($value)) {
            return self::json($value);
        }
        if (!$object && array_is_list($value)) {
            return '[' . implode(',', array_map([self::class, 'stablePayload'], $value)) . ']';
        }
        ksort($value, SORT_STRING);
        $parts = [];
        foreach ($value as $key => $item) {
            $parts[] = self::json((string)$key) . ':' . self::stablePayload($item);
        }
        return '{' . implode(',', $parts) . '}';
    }

    private function normalize(string $text, string $policy): string
    {
        self::check(mb_check_encoding($text, 'UTF-8'), 'Input must be valid UTF-8.');
        if ($policy === 'code') {
            return str_replace("\r\n", "\n", $text);
        }
        self::check(class_exists(\Normalizer::class), 'The PHP intl extension is required for Unicode scoring.');
        $normalized = \Normalizer::normalize($text, \Normalizer::FORM_C);
        self::check($normalized !== false, 'Unicode normalization failed.');
        return $normalized;
    }

    private function units(string $text): array
    {
        $cacheKey = "\0" . $text;
        if (isset($this->graphemeCache[$cacheKey])) {
            return $this->graphemeCache[$cacheKey];
        }
        self::check(class_exists(\IntlBreakIterator::class), 'The PHP intl extension is required for grapheme scoring.');
        $iterator = \IntlBreakIterator::createCharacterInstance('und');
        $iterator->setText($text);
        $units = [];
        $start = $iterator->first();
        foreach ($iterator as $end) {
            if ($end > $start) {
                $units[] = substr($text, $start, $end - $start);
            }
            $start = $end;
        }
        // ICU <74 predates Unicode 15.1 GB9c. Merge Indic conjunct boundaries so
        // XAMPP's ICU 71 agrees with current browser Intl.Segmenter for these scripts.
        $merged = [];
        foreach ($units as $unit) {
            $previous = count($merged) - 1;
            if ($previous >= 0 && UnicodeGraphemes::joinsIndicConjunct($merged[$previous], $unit)) {
                $merged[$previous] .= $unit;
            } else {
                $merged[] = $unit;
            }
        }
        if (count($this->graphemeCache) >= 32) {
            unset($this->graphemeCache[array_key_first($this->graphemeCache)]);
        }
        $this->graphemeCache[$cacheKey] = $merged;
        return $merged;
    }

    private static function length(string $text): int
    {
        return intdiv(strlen(mb_convert_encoding($text, 'UTF-16LE', 'UTF-8')), 2);
    }

    private static function policy(array $config): string
    {
        $policy = $config['scoringPolicy'] ?? (($config['mode'] ?? '') === 'code' ? 'code' : 'prose');
        self::check(is_string($policy), 'Scoring policy must be a string.');
        return $policy;
    }

    private static function whitespace(string $text): bool
    {
        // ECMAScript WhiteSpace + LineTerminator; PCRE/ICU \s includes NEL and
        // obsolete U+180E, which must remain editable just as in the browser.
        return (bool)preg_match('/^[\x{0009}-\x{000D}\x{0020}\x{00A0}\x{1680}\x{2000}-\x{200A}\x{2028}\x{2029}\x{202F}\x{205F}\x{3000}\x{FEFF}]*$/u', $text);
    }

    public static function activeOffset(float|int $offset, array $pauses = []): float|int
    {
        self::check(is_finite((float)$offset) && $offset >= 0, 'Event time must be finite and non-negative.');
        $paused = 0;
        foreach ($pauses as $pause) {
            $paused += max(0, min($offset, $pause['endMs']) - $pause['startMs']);
        }
        return max(0, $offset - $paused);
    }

    private static function state(): array
    {
        return ['units' => [], 'editableStart' => 0, 'attempts' => [], 'correctAttemptCount' => 0, 'deletionActions' => 0, 'deletedUnits' => 0, 'lastSequence' => -1, 'lastOffsetMs' => 0, 'compositionGroups' => [], 'submissions' => []];
    }

    private static function words(array $target): array
    {
        $words = [];
        $start = 0;
        for ($i = 0, $n = count($target); $i <= $n; $i++) {
            if ($i === $n || $target[$i] === ' ') {
                $words[] = ['start' => $start, 'end' => $i, 'separator' => $i < $n ? $i : null];
                $start = $i + 1;
            }
        }
        return $words;
    }

    private function apply(array &$state, array $event, string $targetText, array $config): void
    {
        self::check(self::integer($event['sequence'] ?? null) && $event['sequence'] > $state['lastSequence'], 'Event sequence must increase.');
        self::check(self::number($event['offsetMs'] ?? null) && $event['offsetMs'] >= $state['lastOffsetMs'] && $event['offsetMs'] >= 0, 'Event time must be finite and monotonic.');
        self::check(self::integer($event['start'] ?? null) && self::integer($event['end'] ?? null) && $event['start'] >= 0 && $event['end'] >= $event['start'] && $event['end'] <= count($state['units']), 'Edit range is outside the transcript.');
        self::check(in_array($event['type'] ?? null, ['insert', 'replace', 'delete', 'reject', 'submit', 'composition'], true), 'Unknown edit operation.');
        self::check(is_string($event['text'] ?? null), 'Edit text must be a string.');
        self::check(!in_array($event['type'], ['delete', 'submit'], true) || $event['text'] === '', 'Deletion or submission cannot insert text.');
        $lock = ($config['correctionPolicy'] ?? null) === 'current-word';
        self::check(!$lock || $event['start'] >= $state['editableStart'], 'Submitted words cannot be edited.');
        $state['lastSequence'] = $event['sequence'];
        $state['lastOffsetMs'] = $event['offsetMs'];
        $composition = $event['compositionId'] ?? null;
        if ($composition !== null) {
            self::check(is_string($composition) && strlen($composition) <= 256, 'Invalid composition identity.');
        }
        $hasCompositionId = is_string($composition) && $composition !== '';
        if ($hasCompositionId && isset($state['compositionGroups'][$composition])) {
            return;
        }
        if ($hasCompositionId) {
            $state['compositionGroups'][$composition] = true;
        }
        $policy = self::policy($config);
        $target = $this->units($targetText);
        $words = $policy === 'prose' ? self::words($target) : [];
        if ($event['type'] === 'submit') {
            self::check($policy === 'prose', 'Word submission requires prose scoring.');
            $state['submissions'][] = $event['start'];
            sort($state['submissions'], SORT_NUMERIC);
            if ($lock) {
                $state['editableStart'] = max($state['editableStart'], $event['start']);
            }
            return;
        }
        $inserted = $this->units($this->normalize($event['text'], $policy));
        self::check(count($state['units']) - ($event['end'] - $event['start']) + count($inserted) <= 1000000 && count($state['attempts']) + count($inserted) <= 1000000, 'Transcript resource limit exceeded.');
        if ($event['type'] === 'delete' && $event['end'] === $event['start']) {
            $state['deletionActions']++;
        }
        if ($event['type'] !== 'reject' && $event['end'] > $event['start']) {
            $state['submissions'] = array_values(array_map(fn($position) => $position > $event['end'] ? $position - ($event['end'] - $event['start']) : $position, array_filter($state['submissions'], fn($position) => $position <= $event['start'] || $position > $event['end'])));
            array_splice($state['units'], $event['start'], $event['end'] - $event['start']);
            $state['deletionActions']++;
            $state['deletedUnits'] += $event['end'] - $event['start'];
        }
        $cursor = $event['start'];
        $wordIndex = 0;
        $within = 0;
        if ($policy === 'prose') {
            for ($index = 0; $index < $cursor; $index++) {
                foreach ($state['submissions'] as $position) {
                    if ($position === $index) { $wordIndex++; $within = 0; }
                }
                if ($state['units'][$index] === ' ') { $wordIndex++; $within = 0; } else { $within++; }
            }
            foreach ($state['submissions'] as $position) {
                if ($position === $cursor) { $wordIndex++; $within = 0; }
            }
        }
        foreach ($inserted as $unit) {
            $word = $words[$wordIndex] ?? null;
            $slot = $policy === 'prose' ? ($word ? min($word['end'], $word['start'] + $within) : count($target)) : $cursor;
            $expected = $target[$slot] ?? null;
            $correct = $policy === 'free' || $expected === $unit;
            $state['attempts'][] = ['offsetMs' => $event['offsetMs'], 'correct' => $correct, 'expected' => $expected, 'typed' => $unit, 'position' => $slot, 'compositionId' => $composition, 'provenance' => $event['provenance'], 'eventSequence' => $event['sequence'], 'eventUnits' => count($inserted)];
            if ($correct) { $state['correctAttemptCount']++; }
            if ($event['type'] !== 'reject' && !(($config['rejectIncorrect'] ?? false) && !$correct)) {
                $state['submissions'] = array_map(fn($position) => $position > $cursor ? $position + 1 : $position, $state['submissions']);
                array_splice($state['units'], $cursor++, 0, [$unit]);
                if ($lock && ($policy === 'prose' ? $unit === ' ' : self::whitespace($unit))) {
                    $state['editableStart'] = max($state['editableStart'], $cursor);
                }
                if ($unit === ' ') { $wordIndex++; $within = 0; } else { $within++; }
            }
        }
        $nearby = implode('', array_slice($state['units'], max(0, $event['start'] - 1), min(count($state['units']), $cursor + 1) - max(0, $event['start'] - 1)));
        if (preg_match('/[^\x00-\x7F]|\r/', $nearby)) {
            $old = $state['units'];
            $positionAfterMerge = fn($position) => count($this->units($this->normalize(implode('', array_slice($old, 0, $position)), $policy)));
            $state['submissions'] = array_map($positionAfterMerge, $state['submissions']);
            $state['editableStart'] = $positionAfterMerge($state['editableStart']);
            $state['units'] = $this->units($this->normalize(implode('', $old), $policy));
        }
    }

    private function align(array $target, array $typed, string $policy, bool $finiteFinal, array $submissions): array
    {
        $mapping = [];
        $words = self::words($target);
        $wordIndex = 0; $within = 0; $processed = 0; $hasExtra = []; $hasInput = []; $submitted = []; $submissionIndex = 0;
        $submitAt = function ($position) use (&$submissionIndex, $submissions, $words, &$processed, &$submitted, &$wordIndex, &$within): void {
            while ($submissionIndex < count($submissions) && $submissions[$submissionIndex] === $position) {
                $word = $words[$wordIndex] ?? null;
                if ($word) { $processed = max($processed, $word['separator'] === null ? $word['end'] : $word['separator'] + 1); }
                $submitted[$wordIndex++] = true; $within = 0; $submissionIndex++;
            }
        };
        foreach ($typed as $i => $unit) {
            if ($policy === 'prose') { $submitAt($i); }
            if ($policy !== 'prose') {
                $mapping[] = $policy === 'free' || $i >= count($target) ? null : $i;
                $processed = min(count($target), $i + 1); continue;
            }
            $word = $words[$wordIndex] ?? null;
            if (!$word) { $mapping[] = null; continue; }
            if ($unit === ' ') {
                $mapping[] = $word['separator'];
                $processed = max($processed, $word['separator'] === null ? $word['end'] : $word['separator'] + 1);
                $wordIndex++; $within = 0;
            } else {
                $slot = $word['start'] + $within;
                $mapping[] = $slot < $word['end'] ? $slot : null;
                $hasInput[$wordIndex] = true;
                if ($slot >= $word['end']) { $hasExtra[$wordIndex] = true; }
                $processed = max($processed, min($word['end'], $slot + 1)); $within++;
            }
        }
        if ($policy === 'prose') { $submitAt(count($typed)); }
        $currentWord = $words[$wordIndex] ?? null;
        $cursor = $policy === 'prose' ? ($currentWord ? min($currentWord['end'], $currentWord['start'] + $within) : count($target)) : min(count($target), count($typed));
        $characters = [];
        foreach ($target as $index => $expected) {
            $characters[] = ['index' => $index, 'expected' => $expected, 'typed' => null, 'status' => $index < $processed || $finiteFinal ? 'missed' : 'untyped'];
        }
        foreach ($mapping as $i => $slot) {
            if ($slot === null) { $characters[] = ['index' => count($target) + $i, 'expected' => null, 'typed' => $typed[$i], 'status' => 'extra']; }
            else { $characters[$slot] = ['index' => $slot, 'expected' => $target[$slot], 'typed' => $typed[$i], 'status' => $typed[$i] === $target[$slot] ? 'correct' : 'incorrect']; }
        }
        $credited = 0;
        if ($policy === 'code') { foreach ($characters as $char) { if ($char['status'] === 'correct') { $credited++; } } }
        if ($policy === 'prose') {
            foreach ($words as $index => $word) {
                $separatorEntered = $word['separator'] !== null && $characters[$word['separator']]['typed'] !== null;
                $completedLast = $word['separator'] === null && $processed >= $word['end'];
                $exact = ($hasInput[$index] ?? false) && !($hasExtra[$index] ?? false);
                for ($slot = $word['start']; $slot < $word['end']; $slot++) { $exact = $exact && $characters[$slot]['status'] === 'correct'; }
                if ($exact && ($separatorEntered || $completedLast || isset($submitted[$index]))) {
                    $credited += $word['end'] - $word['start'];
                    if ($separatorEntered && $characters[$word['separator']]['status'] === 'correct') { $credited++; }
                } elseif (!$finiteFinal && $index === $wordIndex && !$separatorEntered) {
                    for ($slot = $word['start']; $slot < $word['end'] && $characters[$slot]['status'] === 'correct'; $slot++) { $credited++; }
                }
            }
        }
        return ['characters' => $characters, 'cursor' => $cursor, 'processed' => $processed, 'creditedUnits' => $credited];
    }

    private static function rate(int|float $units, int|float $elapsed): ?float
    {
        return $elapsed <= 0 ? null : max(0, $units) * 12000 / $elapsed;
    }

    private static function rhythm(array $attempts, int|float $elapsed): array
    {
        if ($elapsed < 5000) { return ['consistency' => null, 'peakFiveSecondWpm' => null]; }
        $counts = array_fill(0, (int)ceil($elapsed / 1000), 0);
        foreach ($attempts as $attempt) { $counts[min(count($counts) - 1, (int)floor($attempt['offsetMs'] / 1000))]++; }
        $buckets = []; $weighted = 0;
        for ($start = 0; $start < $elapsed; $start += 1000) {
            $duration = min($elapsed, $start + 1000) - $start;
            $value = self::rate($counts[$start / 1000], $duration) ?? 0;
            $buckets[] = ['duration' => $duration, 'value' => $value]; $weighted += $value * $duration;
        }
        $mean = $weighted / $elapsed; $variance = 0;
        foreach ($buckets as $bucket) { $variance += ($bucket['value'] - $mean) ** 2 * $bucket['duration']; }
        $variance /= $elapsed;
        $consistency = count($attempts) < 5 || $mean == 0 ? null : max(0, min(100, 100 * (1 - sqrt($variance) / $mean)));
        $endings = [];
        for ($end = 5000; $end <= $elapsed; $end += 1000) { $endings[] = $end; }
        if (end($endings) !== $elapsed) { $endings[] = $elapsed; }
        $peak = 0; $left = 0; $right = 0;
        foreach ($endings as $end) {
            while ($left < count($attempts) && $attempts[$left]['offsetMs'] < $end - 5000) { $left++; }
            while ($right < count($attempts) && ($attempts[$right]['offsetMs'] < $end || ($end === $elapsed && $attempts[$right]['offsetMs'] === $end))) { $right++; }
            $peak = max($peak, self::rate($right - $left, 5000) ?? 0);
        }
        return ['consistency' => $consistency, 'peakFiveSecondWpm' => $peak];
    }

    private function metrics(array $config, string $targetText, array $state, int|float $elapsed, bool $finiteFinal, array $pauses = [], bool $includeRhythm = true): array
    {
        $policy = self::policy($config); $target = $this->units($targetText);
        $aligned = $this->align($target, $state['units'], $policy, $finiteFinal, $state['submissions']);
        $counts = ['correct' => 0, 'incorrect' => 0, 'extra' => 0, 'missed' => 0, 'untyped' => 0];
        foreach ($aligned['characters'] as $char) { $counts[$char['status']]++; }
        if ($policy === 'free') { $counts = ['correct' => 0, 'incorrect' => 0, 'extra' => count($state['units']), 'missed' => 0, 'untyped' => 0]; }
        $attemptCount = count($state['attempts']); $totalFinal = $counts['correct'] + $counts['incorrect'] + $counts['extra'] + $counts['missed'];
        $attempts = [];
        if ($includeRhythm) { foreach ($state['attempts'] as $attempt) { $attempts[] = ['offsetMs' => self::activeOffset($attempt['offsetMs'], $pauses)]; } }
        $rhythm = $includeRhythm ? self::rhythm($attempts, $elapsed) : ['consistency' => null, 'peakFiveSecondWpm' => null];
        $metrics = [
            'wpm' => $policy === 'free' ? null : self::rate($aligned['creditedUnits'], $elapsed),
            'rawWpm' => self::rate(count($state['units']), $elapsed), 'attemptRate' => self::rate($attemptCount, $elapsed),
            'correctCharacterWpm' => $policy === 'free' ? null : self::rate($counts['correct'], $elapsed),
            'inputAccuracy' => $policy === 'free' || !$attemptCount ? null : $state['correctAttemptCount'] / $attemptCount * 100,
            'finalTextAccuracy' => $policy === 'free' || !$totalFinal ? null : $counts['correct'] / $totalFinal * 100,
            ...$rhythm, ...$counts, 'creditedUnits' => $policy === 'free' ? 0 : $aligned['creditedUnits'],
            'retainedUnits' => count($state['units']), 'correctAttempts' => $state['correctAttemptCount'], 'incorrectAttempts' => $attemptCount - $state['correctAttemptCount'],
            'insertionAttempts' => $attemptCount, 'deletionActions' => $state['deletionActions'], 'deletedUnits' => $state['deletedUnits'],
            'progress' => $targetText !== '' && $policy !== 'free' ? min(100, $aligned['processed'] / count($target) * 100) : 0, 'elapsedMs' => $elapsed,
        ];
        return ['metrics' => $metrics, 'characters' => $aligned['characters'], 'cursor' => $aligned['cursor']];
    }

    private static function precedes(array $segment, array $event): bool
    {
        return $segment['offsetMs'] < $event['offsetMs'] || ($segment['offsetMs'] === $event['offsetMs'] && ($segment['afterSequence'] ?? -1) < $event['sequence']);
    }

    /** Also exposed for the cross-runtime differential corpus, never as a public HTTP endpoint. */
    public function replay(array $config, array $events, int|float $elapsed, array $options = []): array
    {
        $initial = $this->normalize($config['initialTarget'], self::policy($config));
        $hasSegments = array_key_exists('issuedTargetSegments', $options);
        $segments = $options['issuedTargetSegments'] ?? [];
        $target = $options['targetText'] ?? $initial . implode('', array_column($segments, 'text'));
        $pauses = $options['pauseIntervals'] ?? []; $finite = $options['finiteFinal'] ?? false;
        $state = self::state(); $accepted = []; $segmentIndex = 0; $issued = $hasSegments ? $initial : $target;
        foreach ($events as $event) {
            $active = self::activeOffset($event['offsetMs'], $pauses);
            if ($active > $elapsed || (isset($config['durationMs']) && $active >= $config['durationMs'])) { continue; }
            foreach ($pauses as $pause) { self::check(!($event['offsetMs'] >= $pause['startMs'] && $event['offsetMs'] < $pause['endMs']), 'Scored event occurred during a pause.'); }
            while ($segmentIndex < count($segments) && self::precedes($segments[$segmentIndex], $event)) { $issued .= $segments[$segmentIndex++]['text']; }
            $this->apply($state, $event, $issued, $config); $accepted[] = ['event' => $event, 'target' => $issued];
        }
        $result = $this->metrics($config, $target, $state, $elapsed, $finite, $pauses);
        $samples = []; $sampled = self::state(); $eventIndex = 0; $previousAttempts = 0; $previousIncorrect = 0;
        $sampleTarget = $hasSegments ? $initial : $target; $sampleSegment = 0;
        for ($start = 0; $start < $elapsed; $start += 1000) {
            $end = min($elapsed, $start + 1000);
            while ($eventIndex < count($accepted)) {
                $active = self::activeOffset($accepted[$eventIndex]['event']['offsetMs'], $pauses);
                if (!($active < $end || ($end === $elapsed && $active === $end))) { break; }
                $item = $accepted[$eventIndex++]; $this->apply($sampled, $item['event'], $item['target'], $config);
            }
            while ($sampleSegment < count($segments) && self::activeOffset($segments[$sampleSegment]['offsetMs'], $pauses) <= $end) { $sampleTarget .= $segments[$sampleSegment++]['text']; }
            $sample = $this->metrics($config, $sampleTarget, $sampled, $end, $end === $elapsed && $finite, [], false);
            $attempts = count($sampled['attempts']); $incorrect = $attempts - $sampled['correctAttemptCount'];
            $samples[] = ['offsetMs' => $end, 'seconds' => $end / 1000, 'wpm' => ($config['scoringPolicy'] ?? null) === 'free' ? null : self::rate($sample['metrics']['creditedUnits'], $end), 'rawWpm' => self::rate($sample['metrics']['retainedUnits'], $end), 'localWpm' => self::rate($attempts - $previousAttempts, $end - $start) ?? 0, 'errors' => $incorrect - $previousIncorrect, 'bucketDurationMs' => $end - $start];
            $previousAttempts = $attempts; $previousIncorrect = $incorrect;
        }
        return [...$result, 'finalText' => implode('', $state['units']), 'timeSeries' => $samples, 'attempts' => $state['attempts']];
    }

    private static function comparisonContent(array $config): array
    {
        if ($config['mode'] === 'custom' || ($config['privacy'] ?? null) === 'private-custom' || ($config['scoringPolicy'] ?? null) === 'free') { return ['contentId' => null, 'sessionId' => $config['clientSessionId'], 'eligible' => false]; }
        if (in_array($config['mode'], ['quote', 'code'], true)) {
            $id = $config['settings']['contentId'] ?? null;
            if (is_string($id) && preg_match('/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/D', $id)) { return ['contentId' => $id, 'sessionId' => null, 'eligible' => true]; }
            return ['contentId' => null, 'sessionId' => $config['clientSessionId'], 'eligible' => false];
        }
        return ['contentId' => null, 'sessionId' => null, 'eligible' => true];
    }

    public static function comparisonKey(array $config): string
    {
        $content = self::comparisonContent($config);
        return self::json(['version' => 'forge-v3', 'comparisonPolicy' => 'forge-cohorts-v2', 'contentId' => $content['contentId'], 'sessionId' => $content['sessionId'], 'policy' => self::policy($config), 'mode' => $config['mode'], 'durationMs' => $config['durationMs'] ?? null, 'words' => $config['wordCount'] ?? null, 'language' => $config['language'] ?? 'en', 'script' => $config['script'] ?? 'Latin', 'layout' => $config['keyboardLayout'] ?? 'qwerty', 'method' => $config['inputMethod'] ?? 'keyboard', 'punctuation' => (bool)($config['punctuation'] ?? false), 'numbers' => (bool)($config['numbers'] ?? false), 'codeLanguage' => $config['codeLanguage'] ?? null, 'corpus' => $config['contentRevision'] ?? 'unspecified', 'generator' => $config['generatorVersion'] ?? 'unspecified', 'segmentation' => 'unicode-grapheme-intl-v1', 'repeated' => (bool)($config['repeatedContent'] ?? false), 'paused' => (bool)($config['paused'] ?? false), 'rejectionPolicy' => (bool)($config['rejectIncorrect'] ?? false), ...(isset($config['correctionPolicy']) ? ['correctionPolicy' => $config['correctionPolicy']] : [])]);
    }

    private static function sameMetrics(array $actual, mixed $provided): bool
    {
        if (!is_array($provided) || count($provided) !== count($actual)) { return false; }
        foreach ($actual as $key => $value) {
            if (!array_key_exists($key, $provided)) { return false; }
            $submitted = $provided[$key];
            if ($value === null) { if ($submitted !== null) { return false; } continue; }
            if (!self::number($submitted)) { return false; }
            // Numeric serialization across JS/PHP may differ by one IEEE-754 ULP.
            // Integer counts and durations remain exact; rates allow only rounding noise.
            $tolerance = is_int($value) ? 0 : max(1e-10, abs($value) * 1e-12);
            if (abs($value - $submitted) > $tolerance) { return false; }
        }
        return true;
    }

    public function validate(array $candidate, string $owner, bool $cloudConsent = false, bool $interim = false): array
    {
        self::check(($candidate['schemaVersion'] ?? null) === 3 && ($candidate['metricsVersion'] ?? null) === 'forge-v3', 'Unsupported session version.');
        self::check(is_string($candidate['clientSessionId'] ?? null) && (bool)preg_match('/^[A-Za-z0-9:_-]{1,128}$/D', $candidate['clientSessionId']), 'Invalid client session ID.');
        self::check(($candidate['ownerScope'] ?? null) === $owner, 'This session belongs to another account.');
        $config = $candidate['configuration'] ?? null;
        self::check(is_array($config) && ($config['clientSessionId'] ?? null) === $candidate['clientSessionId'], 'Configuration identity mismatch.');
        self::check(!isset($config['ownerScope']) || $config['ownerScope'] === $owner, 'Configuration owner mismatch.');
        self::check(($candidate['initialTarget'] ?? null) === ($config['initialTarget'] ?? null), 'Initial target identity mismatch.');
        self::check(in_array($config['mode'] ?? null, ['time', 'words', 'quote', 'code', 'zen', 'custom', 'learn', 'learning', 'race'], true), 'Unsupported mode.');
        self::check(in_array(self::policy($config), ['prose', 'code', 'free'], true), 'Unsupported scoring policy.');
        self::check(!array_key_exists('correctionPolicy', $config) || $config['correctionPolicy'] === 'current-word', 'Unsupported correction policy.');
        foreach (['initialTarget' => $config['initialTarget'] ?? null, 'targetText' => $candidate['targetText'] ?? null, 'finalText' => $candidate['finalText'] ?? null] as $value) { self::check(is_string($value) && self::length($value) <= 40000, 'Text exceeds the server validation limit.'); }
        $elapsed = $candidate['elapsedMs'] ?? null; $wall = $candidate['wallDurationMs'] ?? null;
        self::check(self::number($elapsed) && $elapsed >= 0 && $elapsed <= 600000, 'Server sessions must be at most ten minutes.');
        self::check(self::number($wall) && $wall >= $elapsed, 'Invalid wall duration.');
        $validWall = fn($value) => self::number($value) && abs($value) <= 8640000000000000;
        self::check($validWall($candidate['finishedAtWall'] ?? null), 'Invalid wall finish timestamp.');
        self::check(array_key_exists('startedAtWall', $candidate) && ($candidate['startedAtWall'] === null || $validWall($candidate['startedAtWall'])), 'Invalid wall start timestamp.');
        self::check(in_array($candidate['finishReason'] ?? null, ['completed', 'timeout', 'manual', 'abandoned'], true), 'Unknown finish reason.');
        self::check(in_array($candidate['status'] ?? null, ['ready', 'running', 'paused', 'finished'], true), 'Unknown session status.');
        if ($candidate['startedAtWall'] !== null) { self::check($candidate['finishedAtWall'] >= $candidate['startedAtWall'] && abs($candidate['finishedAtWall'] - $candidate['startedAtWall'] - $wall) <= 1000, 'Wall timestamps do not match duration.'); }
        foreach (['events' => 20000, 'pauseIntervals' => 1000, 'issuedTargetSegments' => 1000] as $key => $limit) { self::check(is_array($candidate[$key] ?? null) && array_is_list($candidate[$key]) && count($candidate[$key]) <= $limit, 'Invalid or excessive ' . $key . '.'); }
        $events = $candidate['events']; $pauses = $candidate['pauseIntervals']; $segments = $candidate['issuedTargetSegments'];
        self::check((bool)($config['paused'] ?? false) === (bool)count($pauses), 'Pause dimensions must match actual evidence.');
        if (array_key_exists('durationMs', $config)) { self::check(self::number($config['durationMs']) && $config['durationMs'] > 0 && $config['durationMs'] <= 600000, 'Invalid configured duration.'); }
        if ($config['mode'] === 'time') { self::check(isset($config['durationMs']) && $elapsed <= $config['durationMs'], 'Timed session requires a valid deadline.'); }
        if ($candidate['startedAtWall'] === null) { self::check($elapsed === 0 && $wall === 0 && !$events && !$pauses && !in_array($candidate['finishReason'], ['completed', 'timeout'], true), 'Unstarted session cannot contain timed input.'); }
        self::check($interim || $candidate['status'] === 'finished', 'Only finished snapshots can be saved.');
        self::check(!($config['mode'] === 'custom' || self::policy($config) === 'free' || ($config['privacy'] ?? null) === 'private-custom') || $cloudConsent, 'Private content requires explicit server-storage consent.');
        $pauseEnd = -1;
        foreach ($pauses as $pause) {
            self::check(is_array($pause) && self::number($pause['startMs'] ?? null) && self::number($pause['endMs'] ?? null) && $pause['startMs'] >= 0 && $pause['startMs'] >= $pauseEnd && $pause['endMs'] >= $pause['startMs'] && $pause['endMs'] <= $wall, 'Pause ranges must be ordered, bounded, and non-overlapping.');
            $pauseEnd = $pause['endMs'];
        }
        $activeWall = self::activeOffset($wall, $pauses);
        if ($candidate['finishReason'] === 'timeout') { self::check(isset($config['durationMs']) && $elapsed == $config['durationMs'] && $activeWall >= $config['durationMs'], 'Timeout must reach the configured deadline.'); }
        else { self::check(abs($activeWall - $elapsed) <= 0.001, 'Active duration does not match wall duration and pauses.'); }
        $previous = -1; $sequence = -1; $hasComposition = false; $assisted = false; $insertedBudget = 0;
        foreach ($events as $event) {
            self::check(is_array($event) && is_string($event['text'] ?? null) && self::length($event['text']) <= 4096, 'Invalid edit payload.');
            $insertedBudget += self::length($event['text']);
            self::check($insertedBudget <= self::MAX_INSERTED_UTF16_UNITS, 'Input evidence exceeds the server limit of 20,000 inserted UTF-16 units. The local result remains available.');
            self::check(self::number($event['offsetMs'] ?? null) && $event['offsetMs'] >= $previous && $event['offsetMs'] <= $wall, 'Event timestamps must be ordered within wall duration.');
            self::check(self::integer($event['sequence'] ?? null) && $event['sequence'] === $sequence + 1, 'Event sequence must be complete and contiguous.');
            self::check(in_array($event['provenance'] ?? null, ['keyboard', 'composition', 'paste', 'drop', 'autocorrect', 'generated'], true), 'Unknown input provenance.');
            $active = self::activeOffset($event['offsetMs'], $pauses);
            self::check($active <= $elapsed && (!isset($config['durationMs']) || $active < $config['durationMs']), 'Event exceeds the accepted deadline.');
            $previous = $event['offsetMs']; $sequence = $event['sequence'];
            $hasComposition = $hasComposition || $event['provenance'] === 'composition';
            $assisted = $assisted || in_array($event['provenance'], ['paste', 'drop', 'autocorrect', 'generated'], true);
        }
        self::check(!$hasComposition || ($config['inputMethod'] ?? null) === 'composition', 'Input-method dimensions do not match composition evidence.');
        $target = $this->normalize($config['initialTarget'], self::policy($config)); $lastOffset = -1; $lastIssueSequence = -1;
        foreach ($segments as $segment) {
            self::check(in_array($config['mode'], ['time', 'zen'], true), 'This mode does not permit target extensions.');
            self::check(is_array($segment) && is_string($segment['text'] ?? null) && self::number($segment['offsetMs'] ?? null) && $segment['offsetMs'] >= 0 && $segment['offsetMs'] >= $lastOffset && $segment['offsetMs'] <= $wall, 'Invalid target extension order.');
            $after = $segment['afterSequence'] ?? -1;
            self::check(self::integer($after) && $after >= -1 && $after < count($events) && ($segment['offsetMs'] !== $lastOffset || $after >= $lastIssueSequence), 'Invalid target issuance sequence.');
            $lastOffset = $segment['offsetMs']; $lastIssueSequence = $after; $target .= $segment['text'];
        }
        self::check($target === $candidate['targetText'], 'Issued target does not reconstruct the displayed target.');
        $finite = !in_array($config['mode'], ['time', 'zen'], true) && self::policy($config) !== 'free' && !$interim;
        $replay = $this->replay($config, $events, $elapsed, ['targetText' => $target, 'pauseIntervals' => $pauses, 'finiteFinal' => $finite, 'issuedTargetSegments' => $segments]);
        self::check($replay['finalText'] === $candidate['finalText'] && ($candidate['finalTranscript'] ?? null) === $candidate['finalText'], 'Event replay does not match the final transcript.');
        self::check(self::sameMetrics($replay['metrics'], $candidate['metrics'] ?? null), 'Replayed metrics differ from the submitted candidate.');
        self::check($candidate['finishReason'] !== 'completed' || ($replay['metrics']['progress'] == 100 && self::policy($config) !== 'free'), 'Completed target must be fully processed.');
        $comparison = self::comparisonKey($config);
        self::check(($candidate['comparisonKey'] ?? null) === $comparison, 'Comparison dimensions do not match configuration.');
        $issuedText = $this->normalize($config['initialTarget'], self::policy($config)); $late = false;
        foreach ($segments as $segment) {
            $limit = count($this->units($issuedText));
            foreach ($replay['attempts'] as $attempt) { if ($attempt['expected'] === null && $attempt['position'] >= $limit && ($attempt['offsetMs'] < $segment['offsetMs'] || ($attempt['offsetMs'] === $segment['offsetMs'] && $attempt['eventSequence'] <= ($segment['afterSequence'] ?? -1)))) { $late = true; } }
            $issuedText .= $segment['text'];
        }
        $eligible = self::comparisonContent($config)['eligible'] && !$late && $replay['metrics']['wpm'] !== null && !($config['repeatedContent'] ?? false) && !$pauses && !$assisted && (!isset($config['durationMs']) || $elapsed == $config['durationMs']) && !($candidate['finishReason'] === 'manual' && !in_array($config['mode'], ['time', 'zen'], true) && $replay['metrics']['progress'] < 100);
        $keys = $this->deriveKeys($candidate, $replay['attempts']);
        // Persist canonical server projections, including the chart, rather than client chart values.
        $candidate['metrics'] = $replay['metrics']; $candidate['timeSeries'] = $replay['timeSeries']; $candidate['characters'] = $replay['characters']; $candidate['cursor'] = $replay['cursor'];
        return ['candidate' => $candidate, 'replay' => $replay, 'metrics' => $replay['metrics'], 'timeSeries' => $replay['timeSeries'], 'comparisonKey' => $comparison, 'keySummaries' => $keys, 'learningEvidence' => $this->learningEvidence($candidate, $replay['attempts']), 'lateTargetExtension' => $late, 'personalBestEligible' => $eligible, 'payloadHash' => 'sha256:' . hash('sha256', self::stablePayload($candidate))];
    }

    private function deriveKeys(array $candidate, array $attempts): array
    {
        $config = $candidate['configuration'];
        $composition = ($config['inputMethod'] ?? null) === 'composition';
        foreach ($candidate['events'] as $event) { $composition = $composition || $event['provenance'] === 'composition'; }
        $dimensions = self::json([$config['language'] ?? 'en', $config['keyboardLayout'] ?? 'qwerty', $composition ? 'composition' : (($config['inputMethod'] ?? null) === 'virtual' ? 'virtual' : 'keyboard'), ($config['scoringPolicy'] ?? null) === 'code' ? 'code' : 'prose']);
        $keys = [];
        foreach ($attempts as $index => $attempt) {
            $character = $attempt['expected'];
            if ($character === null || self::whitespace($character)) { continue; }
            $previous = $attempts[$index - 1] ?? null;
            $interval = $previous ? $attempt['offsetMs'] - $previous['offsetMs'] : 0;
            $crossesPause = false;
            if ($previous) { foreach ($candidate['pauseIntervals'] as $pause) { $crossesPause = $crossesPause || ($pause['startMs'] < $attempt['offsetMs'] && $pause['endMs'] >= $previous['offsetMs']); } }
            $individual = $attempt['provenance'] === 'keyboard' && $attempt['eventUnits'] === 1 && ($attempt['compositionId'] === null || $attempt['compositionId'] === '');
            $previousIndividual = $previous && $previous['provenance'] === 'keyboard' && $previous['eventUnits'] === 1 && ($previous['compositionId'] === null || $previous['compositionId'] === '');
            $attributable = $index > 0 && $individual && $previousIndividual && $interval > 0 && $interval <= 2000 && !$crossesPause;
            if (!isset($keys[$character])) { $keys[$character] = ['character' => $character, 'dimensions' => $dimensions, 'attempts' => 0, 'correctAttempts' => 0, 'intervalCount' => 0, 'intervalSumMs' => 0]; }
            $keys[$character]['attempts']++;
            if ($attempt['correct']) { $keys[$character]['correctAttempts']++; }
            if ($attributable && $attempt['correct']) { $keys[$character]['intervalCount']++; $keys[$character]['intervalSumMs'] += $interval; }
        }
        return array_values($keys);
    }

    private function learningEvidence(array $candidate, array $attempts): array
    {
        $config = $candidate['configuration']; $settings = $config['settings'] ?? [];
        $composition = ($config['inputMethod'] ?? null) === 'composition'; $assisted = false;
        foreach ($candidate['events'] as $event) {
            $composition = $composition || $event['provenance'] === 'composition';
            $assisted = $assisted || in_array($event['provenance'], ['paste', 'drop', 'autocorrect', 'generated'], true);
        }
        $evidence = [];
        foreach ($attempts as $index => $attempt) {
            $previous = $attempts[$index - 1] ?? null;
            $interval = $previous ? $attempt['offsetMs'] - $previous['offsetMs'] : 0;
            $simultaneous = $attempt['provenance'] === 'composition' || ($attempt['compositionId'] !== null && $attempt['compositionId'] !== '');
            $crossesPause = false;
            if ($previous) { foreach ($candidate['pauseIntervals'] as $pause) { $crossesPause = $crossesPause || ($pause['startMs'] < $attempt['offsetMs'] && $pause['endMs'] >= $previous['offsetMs']); } }
            $individual = $attempt['provenance'] === 'keyboard' && $attempt['eventUnits'] === 1 && !$simultaneous;
            $previousIndividual = $previous && $previous['provenance'] === 'keyboard' && $previous['eventUnits'] === 1 && ($previous['compositionId'] === null || $previous['compositionId'] === '');
            $attributable = $index > 0 && $individual && $previousIndividual && $interval > 0 && $interval <= 2000 && !$crossesPause;
            $classification = !$previous ? 'trigger' : ($simultaneous ? 'composition' : ($interval > 2000 || $crossesPause ? 'inactivity' : (!$attributable ? 'unattributable' : (!$attempt['correct'] ? 'incorrect' : 'individual'))));
            $evidence[] = ['expected' => $attempt['expected'] ?? '', 'typed' => $attempt['typed'], 'correct' => $attempt['correct'], 'offsetMs' => $attempt['offsetMs'], 'latencyMs' => $attributable && $attempt['correct'] ? $interval : null, 'attributable' => $attributable, 'classification' => $classification];
        }
        $stamp = (int)$candidate['finishedAtWall']; $seconds = (int)floor($stamp / 1000); $millis = $stamp - $seconds * 1000;
        $targetWpm = $settings['targetWpm'] ?? null;
        return ['learningVersion' => 'forge-learn-v3', 'sessionId' => $candidate['clientSessionId'], 'completedAt' => gmdate('Y-m-d\TH:i:s', $seconds) . sprintf('.%03dZ', $millis), 'elapsedMs' => $candidate['elapsedMs'], 'dimensions' => ['language' => $config['language'] ?? 'en', 'layout' => $config['keyboardLayout'] ?? 'qwerty', 'domain' => ($config['scoringPolicy'] ?? null) === 'code' ? 'code' : 'prose', 'inputMethod' => $composition ? 'composition' : (($config['inputMethod'] ?? null) === 'virtual' ? 'virtual' : 'keyboard')], 'attempts' => $evidence, 'assessment' => in_array($config['mode'], ['learn', 'learning'], true) && $candidate['finishReason'] === 'completed' && ($settings['review'] ?? false) !== true && !$assisted, 'targetWpm' => self::number($targetWpm) ? min(500, max(1, $targetWpm)) : 35, ...(is_string($settings['sourceResultId'] ?? null) ? ['sourceResultId' => $settings['sourceResultId']] : [])];
    }
}
