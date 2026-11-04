<?php
declare(strict_types=1);
// Pure class-only replay contract. No configuration, database or HTTP service.
spl_autoload_register(static function (string $class): void {
    $prefix = 'SparowType\\';
    $name = substr($class, strlen($prefix));
    if (str_starts_with($class, $prefix) && preg_match('/^[A-Za-z][A-Za-z0-9]*$/D', $name)) {
        require_once __DIR__.'/../src/'.$name.'.php';
    }
});

use SparowType\SessionValidator;

$base = ['mode' => 'words', 'scoringPolicy' => 'prose', 'initialTarget' => 'ab cd', 'correctionPolicy' => 'current-word'];
$event = static fn(array $changes = []): array => [...['sequence' => 0, 'offsetMs' => 0, 'start' => 0, 'end' => 0, 'type' => 'insert', 'text' => 'a', 'provenance' => 'keyboard'], ...$changes];
$cases = [
    ['name' => 'duplicate sequence', 'events' => [$event(), $event(['start' => 1, 'end' => 1])]],
    ['name' => 'decreasing event time', 'events' => [$event(['offsetMs' => 20]), $event(['sequence' => 1, 'offsetMs' => 10, 'start' => 1, 'end' => 1])]],
    ['name' => 'negative sequence', 'events' => [$event(['sequence' => -1])]],
    ['name' => 'negative time', 'events' => [$event(['offsetMs' => -1])]],
    ['name' => 'edit beyond retained transcript', 'events' => [$event(['start' => 1, 'end' => 1])]],
    ['name' => 'reversed edit range', 'events' => [$event(['start' => 1, 'end' => 0])]],
    ['name' => 'unknown operation', 'events' => [$event(['type' => 'teleport'])]],
    ['name' => 'non-string insertion', 'events' => [$event(['text' => 42])]],
    ['name' => 'deletion cannot insert', 'events' => [$event(['type' => 'delete'])]],
    ['name' => 'submission cannot insert', 'events' => [$event(['type' => 'submit'])]],
    ['name' => 'unsupported correction policy', 'config' => ['correctionPolicy' => 'unlock-all'], 'events' => [$event()]],
    ['name' => 'word locking requires prose', 'config' => ['scoringPolicy' => 'code', 'correctionPolicy' => 'correct-words-locked'], 'events' => [$event()]],
    ['name' => 'submitted correct word remains locked', 'events' => [$event(['text' => 'ab ']), $event(['sequence' => 1, 'offsetMs' => 20, 'type' => 'delete', 'text' => '', 'start' => 0, 'end' => 1])]],
    ['name' => 'empty locked deletion cannot reopen', 'config' => ['correctionPolicy' => 'correct-words-locked'], 'events' => [$event(['type' => 'delete', 'text' => ''])]],
    ['name' => 'invalid composition identity', 'events' => [$event(['compositionId' => 7])]],
    ['name' => 'oversized composition identity', 'events' => [$event(['compositionId' => str_repeat('x', 257)])]],
    ['name' => 'pause anchor references missing input', 'events' => [$event()], 'options' => ['pauseIntervals' => [['startMs' => 0, 'endMs' => 1, 'afterSequence' => 2]]]],
    ['name' => 'pause anchor has a different timestamp', 'events' => [$event()], 'options' => ['pauseIntervals' => [['startMs' => 1, 'endMs' => 2, 'afterSequence' => 0]]]],
    ['name' => 'input inside pause still rejects', 'events' => [$event(['offsetMs' => 20])], 'options' => ['pauseIntervals' => [['startMs' => 10, 'endMs' => 30]]]],
];
$checks = [];
foreach ($cases as $case) {
    $outcomes = [];
    foreach ([true, false] as $includeTimeSeries) {
        try {
            (new SessionValidator())->replay([...$base, ...($case['config'] ?? [])], $case['events'], 1000, [...($case['options'] ?? []), 'includeTimeSeries' => $includeTimeSeries]);
            $outcomes[] = ['accepted' => true];
        } catch (Throwable $error) {
            $outcomes[] = ['accepted' => false, 'class' => get_class($error), 'message' => $error->getMessage()];
        }
    }
    $checks[] = ['name' => $case['name'].' retains the exact replay rejection', 'pass' => $outcomes[0] === $outcomes[1] && $outcomes[0]['accepted'] === false && $outcomes[0]['class'] === InvalidArgumentException::class];
}
$failed = count(array_filter($checks, static fn(array $check): bool => !$check['pass']));
echo json_encode(['status' => $failed ? 'FAILED' : 'PASS-SCOPED', 'scope' => 'Pure malformed-replay rejection parity with and without optional chart projection; no database, configuration, HTTP or capacity claim.', 'passed' => count($checks) - $failed, 'failed' => $failed, 'checks' => $checks, 'privateConfigurationRead' => false, 'databaseConnected' => false], JSON_THROW_ON_ERROR);
exit($failed ? 1 : 0);
