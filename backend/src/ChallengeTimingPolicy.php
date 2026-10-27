<?php
declare(strict_types=1);
namespace SparowType;

/** Independent attempts only. Live races keep their shared server start. */
final class ChallengeTimingPolicy
{
    public const FIRST_INPUT = 'first-input-v1';
    // Matches the existing live-race transport allowance; it never extends input.
    public const RECEIPT_GRACE_MS = 3000;

    public static function firstInput(array $issued): bool
    {
        $settings = $issued['settings'] ?? [];
        if (!is_array($settings)) throw new ApiException(422, 'challenge-policy', 'Invalid issued timing settings.');
        if (!array_key_exists('timingPolicy', $settings)) {
            if (in_array($issued['contentRevision'] ?? null, ['forge-ranked-en-v2', 'forge-social-duel-en-v2'], true))
                throw new ApiException(422, 'challenge-policy', 'The issued timing revision requires its original policy.');
            return false;
        }
        if ($settings['timingPolicy'] !== self::FIRST_INPUT || !in_array($issued['contentRevision'] ?? null, ['forge-ranked-en-v2', 'forge-social-duel-en-v2'], true))
            throw new ApiException(422, 'challenge-policy', 'Unknown issued challenge timing policy.');
        return true;
    }

    public static function milliseconds(string $value): float
    {
        return (float) (new \DateTimeImmutable($value, new \DateTimeZone('UTC')))->format('U.u') * 1000;
    }

    /** Returning an issued attempt never creates a fresh counted attempt. */
    public static function canResume(array $issued, float $start, float $deadline, float $expires, float $now): bool
    {
        if (!self::firstInput($issued)) return $now < $deadline;
        $duration = $issued['durationMs'] ?? 0;
        return self::number($duration) && $duration > 0 && abs($deadline - $start - $duration) <= 0.01 && $now <= $expires - $duration;
    }

    /** Called under the existing owner/challenge locks, after canonical replay. */
    public static function validate(array $issued, array $candidate, float $start, float $deadline, float $expires, float $now): void
    {
        $candidateStart = $candidate['startedAtWall'] ?? null;
        if (!self::firstInput($issued)) {
            if (!self::number($candidateStart) || abs($candidateStart - $start) > 0.01 || $now < $deadline || $now > $expires)
                throw new ApiException(422, 'challenge-mismatch', 'The original fixed challenge clock does not match.');
            return;
        }
        $duration = $issued['durationMs'] ?? null;
        $wall = $candidate['wallDurationMs'] ?? null;
        $finished = $candidate['finishedAtWall'] ?? null;
        $first = $candidate['events'][0] ?? null;
        if (!self::number($duration) || $duration <= 0 || abs($deadline - $start - $duration) > 0.01 ||
            !self::number($candidateStart) || $candidateStart < $start || $candidateStart > $expires - $duration ||
            ($candidate['elapsedMs'] ?? null) !== $duration || ($candidate['finishReason'] ?? null) !== 'timeout' ||
            ($candidate['status'] ?? null) !== 'finished' || ($candidate['pauseIntervals'] ?? null) !== [] ||
            !self::number($wall) || $wall < $duration || $wall > $duration + self::RECEIPT_GRACE_MS ||
            !self::number($finished) || abs($finished - $candidateStart - $wall) > 1000 ||
            $finished < $candidateStart + $duration || $finished > $candidateStart + $duration + self::RECEIPT_GRACE_MS ||
            $finished > $now + 1000 || $now < $candidateStart + $duration ||
            $now > $candidateStart + $duration + self::RECEIPT_GRACE_MS || $now > $expires + self::RECEIPT_GRACE_MS ||
            !is_array($first) || !is_string($first['text'] ?? null) || $first['text'] === '' ||
            (($first['offsetMs'] ?? null) !== 0 && ($first['offsetMs'] ?? null) !== 0.0) ||
            !in_array($first['type'] ?? null, ['insert', 'replace', 'reject'], true) ||
            ($first['start'] ?? null) !== 0 || ($first['end'] ?? null) !== 0 || ($first['provenance'] ?? null) !== 'keyboard') {
            throw new ApiException(422, 'challenge-mismatch', 'Start with a keyboard character inside the preparation window and finish the complete unpaused attempt before its receipt deadline.');
        }
    }

    private static function number(mixed $value): bool
    {
        return (is_int($value) || is_float($value)) && is_finite((float) $value);
    }
}
