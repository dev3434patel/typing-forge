<?php
declare(strict_types=1);
namespace SparowType;

/** Versioned public course checks; metrics always come from canonical replay. */
final class CourseAssessment
{
    public const COURSE_ID = 'typing-course-v1';
    public const ASSESSMENT_VERSION = 'typing-course-assessment-v1';
    private static ?array $catalog = null;

    private static function check(bool $condition, string $message): void
    {
        if (!$condition) throw new \InvalidArgumentException($message);
    }

    private static function number(mixed $value): bool
    {
        return (is_int($value) || is_float($value)) && is_finite((float) $value);
    }

    public static function catalog(): array
    {
        if (self::$catalog !== null) return self::$catalog;
        $file = dirname(__DIR__).'/resources/typing-course-v1.json';
        $raw = is_file($file) ? file_get_contents($file) : false;
        if ($raw === false) throw new \RuntimeException('The versioned typing curriculum resource is unavailable.');
        $catalog = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($catalog) || ($catalog['version'] ?? null) !== self::COURSE_ID || ($catalog['assessmentVersion'] ?? null) !== self::ASSESSMENT_VERSION || ($catalog['language'] ?? null) !== 'en' || ($catalog['layout'] ?? null) !== 'qwerty' || !is_array($catalog['lessons'] ?? null) || !array_is_list($catalog['lessons']) || count($catalog['lessons']) !== 36) {
            throw new \RuntimeException('The installed typing curriculum has an unsupported structure.');
        }
        $seen = [];
        foreach ($catalog['lessons'] as $lesson) {
            if (!is_array($lesson) || !is_string($lesson['id'] ?? null) || !preg_match('/^[a-z0-9][a-z0-9-]{0,79}$/D', $lesson['id']) || isset($seen[$lesson['id']])) throw new \RuntimeException('The installed typing curriculum contains an invalid lesson identity.');
            $seen[$lesson['id']] = true;
            foreach (['targetWpm', 'minAccuracy', 'minAttempts', 'minDurationMs'] as $key) {
                if (!self::number($lesson[$key] ?? null) || $lesson[$key] < 0) throw new \RuntimeException('The installed typing curriculum contains invalid assessment thresholds.');
            }
            if ($lesson['minAccuracy'] > 100 || $lesson['minAttempts'] < 1 || $lesson['minDurationMs'] > 600000 || !array_key_exists('durationMs', $lesson) || !in_array($lesson['durationMs'], [null, 30000], true)) throw new \RuntimeException('The installed typing curriculum contains unsupported assessment bounds.');
            $variants = $lesson['variants'] ?? null;
            if (!is_array($variants) || !array_is_list($variants) || count($variants) !== 3) throw new \RuntimeException('Every installed course lesson requires three original variants.');
            $variantIds = [];
            foreach ($variants as $variant) {
                if (!is_array($variant) || !in_array($variant['id'] ?? null, ['a', 'b', 'c'], true) || isset($variantIds[$variant['id']]) || !is_string($variant['text'] ?? null) || !preg_match('/^[\x20-\x7E]{1,2000}$/D', $variant['text'])) throw new \RuntimeException('The installed typing curriculum contains an invalid public passage.');
                $variantIds[$variant['id']] = true;
            }
        }
        return self::$catalog = $catalog;
    }

    /** Null leaves every pre-course session and its comparison policy unchanged. */
    public static function configuration(array $candidate): ?array
    {
        $config = $candidate['configuration'] ?? [];
        $settings = is_array($config['settings'] ?? null) ? $config['settings'] : [];
        if (!array_key_exists('course', $settings)) return null;
        $metadata = $settings['course'];
        self::check(is_array($metadata) && !array_is_list($metadata), 'Course metadata must be a versioned object.');
        $keys = array_keys($metadata); sort($keys);
        self::check($keys === ['assessmentVersion','courseId','lessonId','variantId'], 'Course metadata contains unsupported or missing fields.');
        self::check($metadata['courseId'] === self::COURSE_ID && $metadata['assessmentVersion'] === self::ASSESSMENT_VERSION, 'Unknown typing course or assessment revision.');
        self::check(is_string($metadata['lessonId']) && preg_match('/^[a-z0-9][a-z0-9-]{0,79}$/D', $metadata['lessonId']) === 1 && in_array($metadata['variantId'], ['a','b','c'], true), 'Invalid course lesson or variant identity.');
        $catalog = self::catalog();
        $lesson = null; $variant = null;
        foreach ($catalog['lessons'] as $entry) if ($entry['id'] === $metadata['lessonId']) { $lesson = $entry; break; }
        self::check($lesson !== null, 'Unknown course lesson.');
        foreach ($lesson['variants'] as $entry) if ($entry['id'] === $metadata['variantId']) { $variant = $entry; break; }
        self::check($variant !== null, 'Unknown course passage variant.');
        $target = $variant['text'];
        $timed = $lesson['durationMs'] !== null;
        if ($timed) while (strlen($target) < 2400) $target .= ' '.$variant['text'];
        self::check(($config['initialTarget'] ?? null) === $target && ($candidate['initialTarget'] ?? null) === $target && ($candidate['targetText'] ?? null) === $target, 'Use the exact versioned course passage.');
        $allowed = ['clientSessionId','mode','initialTarget','scoringPolicy','durationMs','ownerScope','language','script','keyboardLayout','inputMethod','contentRevision','generatorVersion','seed','repeatedContent','paused','rejectIncorrect','correctionPolicy','punctuation','numbers','settings','privacy'];
        foreach ($config as $key => $_) self::check(in_array($key, $allowed, true), 'Course configuration contains an unsupported dimension.');
        self::check(array_keys($settings) === ['course'], 'Course settings contain unsupported client-controlled assessment values.');
        self::check(($config['mode'] ?? null) === ($timed ? 'time' : 'learn') && ($config['scoringPolicy'] ?? null) === 'prose', 'Course mode or scoring policy differs from its curriculum.');
        self::check(($config['language'] ?? null) === 'en' && ($config['script'] ?? null) === 'Latin' && ($config['keyboardLayout'] ?? null) === 'qwerty', 'This curriculum requires the English QWERTY layout.');
        self::check(in_array($config['inputMethod'] ?? null, ['keyboard','composition','virtual'], true), 'Unsupported actual course input method.');
        self::check(($config['privacy'] ?? null) === 'public-corpus' && in_array($config['correctionPolicy'] ?? null, ['current-word', 'correct-words-locked'], true), 'Course privacy or correction policy differs from its curriculum.');
        self::check(($config['contentRevision'] ?? null) === self::COURSE_ID.':'.$lesson['id'].':'.$variant['id'] && ($config['generatorVersion'] ?? null) === 'typing-course-fixed-v1' && ($config['seed'] ?? null) === $lesson['id'].':'.$variant['id'], 'Course content/generator identity differs from its curriculum.');
        self::check(array_key_exists('rejectIncorrect', $config) && $config['rejectIncorrect'] === false && (!array_key_exists('repeatedContent', $config) || is_bool($config['repeatedContent'])), 'Course correction/retry dimensions are invalid.');
        self::check(array_key_exists('punctuation', $config) && array_key_exists('numbers', $config) && $config['punctuation'] === (preg_match('/[^A-Za-z0-9 ]/', $target) === 1) && $config['numbers'] === (preg_match('/[0-9]/', $target) === 1), 'Course punctuation/number dimensions differ from its passage.');
        self::check($timed ? ($config['durationMs'] ?? null) === 30000 : !array_key_exists('durationMs', $config), 'Course duration differs from its curriculum.');
        self::check(is_array($candidate['issuedTargetSegments'] ?? null) && !$candidate['issuedTargetSegments'], 'Course targets cannot be extended after issuance.');
        return ['metadata' => $metadata, 'lesson' => $lesson, 'target' => $target, 'timed' => $timed];
    }

    public static function assess(array $candidate, array $metrics, array $context): array
    {
        $config = $candidate['configuration'];
        $lesson = $context['lesson'];
        $metadata = $context['metadata'];
        $method = $config['inputMethod'];
        $unassisted = $method === 'keyboard';
        foreach ($candidate['events'] as $event) {
            if (($event['provenance'] ?? null) !== 'keyboard' || ($event['type'] ?? null) === 'composition' || (array_key_exists('compositionId', $event) && $event['compositionId'] !== '') || ($event['text'] !== '' && strlen(mb_convert_encoding($event['text'], 'UTF-16LE', 'UTF-8')) > 2)) $unassisted = false;
        }
        $processedCorrect = $metrics['incorrect'] === 0 && $metrics['extra'] === 0 && $metrics['missed'] === 0;
        $completed = $context['timed']
            ? $candidate['status'] === 'finished' && $candidate['finishReason'] === 'timeout' && $candidate['elapsedMs'] == 30000 && !$candidate['pauseIntervals'] && $metrics['finalTextAccuracy'] == 100 && $processedCorrect
            : $candidate['status'] === 'finished' && $candidate['finishReason'] === 'completed' && $metrics['progress'] == 100 && $metrics['finalTextAccuracy'] == 100 && $metrics['untyped'] === 0 && $processedCorrect && $candidate['finalText'] === $context['target'];
        $checks = [
            'configuration' => $method === 'keyboard',
            'completed' => $completed,
            'accuracy' => self::number($metrics['inputAccuracy']) && $metrics['inputAccuracy'] + 1e-9 >= $lesson['minAccuracy'],
            'evidence' => $metrics['insertionAttempts'] >= $lesson['minAttempts'] && $candidate['elapsedMs'] >= $lesson['minDurationMs'],
            'speed' => $lesson['targetWpm'] <= 0 || (self::number($metrics['wpm']) && $metrics['wpm'] + 1e-9 >= $lesson['targetWpm']),
            'unassisted' => $unassisted,
        ];
        $reasonNames = ['configuration' => 'configuration', 'completed' => 'completion', 'accuracy' => 'accuracy', 'evidence' => 'minimum-evidence', 'speed' => 'speed', 'unassisted' => 'assistance'];
        $reasons = [];
        foreach ($checks as $key => $value) if (!$value) $reasons[] = $reasonNames[$key];
        $courseMetrics = [];
        foreach (['wpm','inputAccuracy','finalTextAccuracy','insertionAttempts','correctAttempts','incorrectAttempts','elapsedMs','progress'] as $key) $courseMetrics[$key] = $metrics[$key];
        return [
            'version' => self::ASSESSMENT_VERSION, 'courseId' => self::COURSE_ID,
            'lessonId' => $metadata['lessonId'], 'variantId' => $metadata['variantId'],
            'sessionId' => $candidate['clientSessionId'], 'ownerId' => $candidate['ownerScope'],
            'layout' => 'qwerty', 'language' => 'en', 'inputMethod' => $method,
            'completedAt' => $candidate['finishedAtWall'], 'qualifies' => !$reasons,
            'checks' => $checks, 'metrics' => $courseMetrics, 'reasonCodes' => $reasons,
        ];
    }
}
