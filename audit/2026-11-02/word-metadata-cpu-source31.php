<?php
declare(strict_types=1);
// Pure diagnostic: no bootstrap, configuration, SQL, HTTP or application clock.
spl_autoload_register(static function (string $class): void {
    $prefix = 'SparowType\\';
    $name = substr($class, strlen($prefix));
    if (str_starts_with($class, $prefix) && preg_match('/^[A-Za-z][A-Za-z0-9]*$/D', $name)) require_once __DIR__.'/../../backend/src/'.$name.'.php';
});
if (getenv('SPAROWTYPE_SOURCE31_WORD_METADATA_DIAGNOSTIC') !== '1') throw new RuntimeException('Coordinated pure diagnostic opt-in required.');
require_once __DIR__.'/LegacyWordMetadataValidatorSource30.php';
$candidate = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
if (count($candidate['events']) !== 10 || count($candidate['characters']) !== 4599 || $candidate['elapsedMs'] !== 15000) throw new RuntimeException('Exact original 800-word reference fixture required.');
$summary = static function (array $values): array {
    sort($values);
    $count = count($values);
    return ['count' => $count, 'min' => $values[0], 'median' => ($values[intdiv($count - 1, 2)] + $values[intdiv($count, 2)]) / 2, 'p95' => $values[(int)ceil($count * .95) - 1], 'max' => $values[$count - 1]];
};
$rows = [];
$same = true;
for ($iteration = 1; $iteration <= 12; $iteration++) {
    $order = $iteration % 2 ? ['source30', 'source31'] : ['source31', 'source30'];
    $row = ['iteration' => $iteration, 'order' => $order];
    foreach ($order as $version) {
        // Same-request reuse is intentional; every version/iteration receives a
        // fresh instance. Authoritative elapsed replay still executes separately.
        $validator = $version === 'source30' ? new SparowType\LegacyWordMetadataValidatorSource30() : new SparowType\SessionValidator();
        $began = hrtime(true);
        $validated = $validator->validate($candidate, $candidate['ownerScope'], false, true);
        $validateMs = (hrtime(true) - $began) / 1000000;
        $began = hrtime(true);
        $authoritative = $validator->replay($validated['candidate']['configuration'], $validated['candidate']['events'], 20000.0, ['targetText' => $candidate['targetText'], 'finiteFinal' => false]);
        $authoritativeReplayMs = (hrtime(true) - $began) / 1000000;
        $row[$version] = ['validateMs' => $validateMs, 'authoritativeReplayMs' => $authoritativeReplayMs, 'combinedMs' => $validateMs + $authoritativeReplayMs, 'validatedHash' => hash('sha256', serialize($validated)), 'canonicalPayloadHash' => $validated['payloadHash'], 'authoritativeProjectionHash' => hash('sha256', serialize($authoritative))];
        unset($validator, $validated, $authoritative);
    }
    foreach (['validatedHash', 'canonicalPayloadHash', 'authoritativeProjectionHash'] as $field) $same = $same && $row['source30'][$field] === $row['source31'][$field];
    $rows[] = $row;
}
$summaries = [];
foreach (['source30', 'source31'] as $version) {
    foreach (['validateMs', 'authoritativeReplayMs', 'combinedMs'] as $field) $summaries[$version][$field] = $summary(array_map(static fn(array $row): float => $row[$version][$field], $rows));
}
foreach (['validatedHash', 'canonicalPayloadHash', 'authoritativeProjectionHash'] as $field) {
    $same = $same && count(array_unique(array_map(static fn(array $row): string => $row['source31'][$field], $rows))) === 1;
}
echo json_encode(['status' => $same ? 'PASS-SCOPED-PURE-DIAGNOSTIC' : 'FAILED', 'phpVersion' => PHP_VERSION, 'iterations' => 12, 'warmups' => 0, 'retries' => 0, 'outlierFiltering' => false, 'freshValidatorPerVersionAndIteration' => true, 'clientElapsedMs' => 15000, 'authoritativeElapsedMs' => 20000.0, 'rows' => $rows, 'summaries' => $summaries, 'completeValidatedAndAuthoritativeOutputsIdentical' => $same, 'privateConfigurationRead' => false, 'databaseConnected' => false, 'httpCapacityMeasured' => false], JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT)."\n";
exit($same ? 0 : 1);
