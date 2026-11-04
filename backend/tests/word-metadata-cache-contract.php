<?php
declare(strict_types=1);
// Pure metadata and replay differential checks. No configuration/SQL/HTTP.
spl_autoload_register(static function (string $class): void {
    $prefix = 'SparowType\\';
    if (str_starts_with($class, $prefix)) require_once __DIR__.'/../src/'.substr($class, strlen($prefix)).'.php';
});
require_once __DIR__.'/../../audit/2026-11-02/LegacyWordMetadataValidatorSource30.php';
use SparowType\SessionValidator;
use SparowType\LegacyWordMetadataValidatorSource30;

$checks = [];
$check = static function (string $name, bool $pass) use (&$checks): void { $checks[] = ['name' => $name, 'pass' => $pass]; };
$actual = new SessionValidator();
$legacy = new LegacyWordMetadataValidatorSource30();
$words = new ReflectionMethod($actual, 'words');
$oldWords = new ReflectionMethod($legacy, 'words');
$targets = [[], ['a'], [' '], [' ', 'a', ' ', ' ', 'b', ' '], ['é', ' ', 'क्‍ष'], ['a', "\n", 'b'], array_fill(0, 40000, 'x')];
foreach ($targets as $index => $target) {
    $expected = $oldWords->invoke($legacy, $target);
    $first = $words->invoke($actual, $target);
    $check('metadata miss matches original boundaries for target '.$index, $first === $expected);
    $check('metadata repeat matches original boundaries for target '.$index, $words->invoke($actual, $target) === $expected);
    $first[0]['start'] = -1;
    $first[] = ['start' => -1, 'end' => -1, 'separator' => null];
    $check('caller word-array edits cannot corrupt cached metadata for target '.$index, $words->invoke($actual, $target) === $expected);
}
$targetProperty = new ReflectionProperty($actual, 'wordTarget');
$cacheProperty = new ReflectionProperty($actual, 'wordCache');
$words->invoke($actual, ['x', ' ', 'y']);
$check('cache retains exactly the most recent target value and its metadata', $targetProperty->getValue($actual) === ['x', ' ', 'y'] && $cacheProperty->getValue($actual) === [['start' => 0, 'end' => 1, 'separator' => 1], ['start' => 2, 'end' => 3, 'separator' => null]]);
$check('one validator instance never populates another instance cache', $targetProperty->getValue(new SessionValidator()) === null && $cacheProperty->getValue(new SessionValidator()) === []);
$config = static fn(string $target, string $policy = 'prose'): array => ['mode' => $policy === 'free' ? 'zen' : ($policy === 'code' ? 'code' : 'time'), 'scoringPolicy' => $policy, 'initialTarget' => $target, 'durationMs' => 120000, 'correctionPolicy' => 'current-word'];
$insertions = static function (array $units): array {
    $events = [];
    foreach ($units as $index => $unit) $events[] = ['sequence' => $index, 'offsetMs' => 100 + $index * 83, 'start' => $index, 'end' => $index, 'type' => 'insert', 'text' => $unit, 'provenance' => 'keyboard'];
    return $events;
};
$longTarget = implode(' ', array_fill(0, 800, 'calm'));
$cases = [
    ['empty', $config(''), [], 0, []],
    ['idle target', $config('calm clear'), [], 21000, []],
    ['long target interim', $config($longTarget), $insertions(str_split('calm clear')), 20000, ['targetText' => $longTarget, 'finiteFinal' => false]],
    ['long target final', $config($longTarget), $insertions(str_split('calm clear')), 20000, ['targetText' => $longTarget, 'finiteFinal' => true]],
    ['Unicode composition', $config('áक्‍ष'), [['sequence' => 0, 'offsetMs' => 100, 'start' => 0, 'end' => 0, 'type' => 'composition', 'text' => "a\u{0301}क्‍ष", 'provenance' => 'composition', 'compositionId' => 'native-ime']], 1700, []],
    ['code CRLF', $config("a\nb", 'code'), $insertions(['a', "\r\n", 'b']), 2100, []],
    ['free input', $config('', 'free'), $insertions(['a', 'b', 'c']), 5000, []],
    ['paused sample', $config('calm clear'), [['sequence' => 0, 'offsetMs' => 100, 'start' => 0, 'end' => 0, 'type' => 'insert', 'text' => 'c', 'provenance' => 'keyboard'], ['sequence' => 1, 'offsetMs' => 900, 'start' => 1, 'end' => 1, 'type' => 'insert', 'text' => 'a', 'provenance' => 'keyboard']], 2000, ['pauseIntervals' => [['startMs' => 200, 'endMs' => 800]]]],
    ['issued target changes', $config('calm '), $insertions(['c', 'a', 'l']), 5000, ['targetText' => 'calm clear', 'issuedTargetSegments' => [['offsetMs' => 150, 'afterSequence' => 0, 'text' => 'clear']]]],
    ['virtual word submission', $config('calm clear'), [['sequence' => 0, 'offsetMs' => 100, 'start' => 0, 'end' => 0, 'type' => 'submit', 'text' => '', 'provenance' => 'keyboard'], ['sequence' => 1, 'offsetMs' => 200, 'start' => 0, 'end' => 0, 'type' => 'insert', 'text' => 'c', 'provenance' => 'keyboard']], 2200, []],
    ['locked word rejection', $config('calm clear'), [...$insertions(['c', 'a', 'l', 'm', ' ']), ['sequence' => 5, 'offsetMs' => 600, 'start' => 4, 'end' => 5, 'type' => 'delete', 'text' => '', 'provenance' => 'keyboard']], 6000, []],
];
$outcome = static function (object $validator, array $case): array {
    try { return ['ok' => true, 'value' => $validator->replay($case[1], $case[2], $case[3], $case[4])]; }
    catch (Throwable $error) { return ['ok' => false, 'class' => get_class($error), 'message' => $error->getMessage()]; }
};
foreach ($cases as $case) {
    $expected = $outcome($legacy, $case);
    $check('complete replay remains identical across target and mode changes: '.$case[0], $outcome($actual, $case) === $expected);
}
$failed = count(array_filter($checks, static fn(array $row): bool => !$row['pass']));
echo json_encode(['status' => $failed ? 'FAILED' : 'PASS-SCOPED', 'scope' => 'Pure single-entry metadata cache and exact original-replay differential contracts. No timing benchmark, database, backend configuration or capacity claim.', 'passed' => count($checks) - $failed, 'failed' => $failed, 'checks' => $checks, 'databaseConnected' => false, 'privateConfigurationRead' => false], JSON_THROW_ON_ERROR);
exit($failed ? 1 : 0);
