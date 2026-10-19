<?php
declare(strict_types=1);
namespace SparowType;

/**
 * Conservative competitive automation heuristics, not proof of human input.
 * Personal/IME practice remains governed by the portable replay contract.
 */
final class CompetitiveInputPolicy
{
    public const SUSTAINED_AFTER_MS = 5000;
    public const MAX_HEADLINE_WPM = 500;
    public const MAX_ATTEMPT_WPM = 650;
    public const BURST_WINDOW_MS = 1000;
    public const MAX_ATTEMPTS_PER_WINDOW = 80;

    /** Reject bulk/malformed competitive evidence before expensive replay. */
    public static function preflight(array $candidate): void
    {
        $events = $candidate['events'] ?? null;
        if (!is_array($events) || !array_is_list($events) || count($events) > 20000)
            throw new ApiException(422, 'competitive-events', 'Competitive event evidence must be a bounded ordered list.');
        $offsets = [];
        $left = 0;
        $previous = -1;
        foreach ($events as $event) {
            if (!is_array($event) || !is_string($event['text'] ?? null))
                throw new ApiException(422, 'competitive-event-shape', 'Competitive edits must contain valid character evidence.');
            if (($event['provenance'] ?? null) !== 'keyboard')
                throw new ApiException(422, 'competitive-input-method', 'Competitive results require individual keyboard input. Personal practice supports other input methods.');
            $offset = $event['offsetMs'] ?? null;
            if ((!is_int($offset) && !is_float($offset)) || !is_finite((float) $offset) || $offset < 0 || $offset < $previous)
                throw new ApiException(422, 'competitive-event-time', 'Competitive edit offsets must be finite and ordered.');
            $previous = $offset;
            $text = $event['text'];
            if ($text === '') continue;
            if (grapheme_strlen($text) !== 1)
                throw new ApiException(422, 'competitive-bulk-input', 'Competitive keyboard edits must contain one character. Bulk edits remain available in personal practice.');
            $offsets[] = $offset;
            while ($offset - $offsets[$left] >= self::BURST_WINDOW_MS) $left++;
            if (count($offsets) - $left > self::MAX_ATTEMPTS_PER_WINDOW)
                throw new ApiException(422, 'competitive-burst', 'This input exceeds the competitive burst limit of 80 insertion attempts per second.');
        }
    }

    /** Called only with canonical server-replayed metrics. */
    public static function enforceRates(array $metrics): void
    {
        if ($metrics['elapsedMs'] >= self::SUSTAINED_AFTER_MS &&
            (($metrics['wpm'] ?? 0) > self::MAX_HEADLINE_WPM || ($metrics['attemptRate'] ?? 0) > self::MAX_ATTEMPT_WPM))
            throw new ApiException(422, 'competitive-rate', 'This result exceeds the competitive plausibility limits of 500 WPM or 650 attempt WPM after five seconds. Personal scores can still be retained.');
    }
}
