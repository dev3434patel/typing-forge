<?php
declare(strict_types=1);

$root = dirname(__DIR__, 2);
spl_autoload_register(static function(string $class) use ($root): void {
    $prefix = 'SparowType\\';
    $name = substr($class, strlen($prefix));
    if (str_starts_with($class, $prefix) && preg_match('/^[A-Za-z][A-Za-z0-9]*$/D', $name)) require_once $root.'/backend/src/'.$name.'.php';
});
$variant = $argv[1] ?? '';
if (!in_array($variant, ['A', 'B'], true)) throw new InvalidArgumentException('Choose A or B.');
$raw = stream_get_contents(STDIN, 2097153);
if (!is_string($raw) || strlen($raw) > 2097152) throw new InvalidArgumentException('Fixture exceeds the unchanged body limit.');
$inputHash = hash('sha256', $raw);
$bytes = strlen($raw);
$memory = [];
$snapshot = static function(string $name) use (&$memory): void { $memory[$name] = ['usedBytes'=>memory_get_usage(false), 'allocatedBytes'=>memory_get_usage(true), 'peakAllocatedBytes'=>memory_get_peak_usage(true)]; };
$ms = static fn(int $start): float => (hrtime(true) - $start) / 1e6;
$snapshot('raw');
$times = [];
try {
    $at = hrtime(true); class_exists(SparowType\RequestBody::class); $times['requestBodyAutoloadMs'] = $ms($at);
    $at = hrtime(true); $body = SparowType\RequestBody::decode($raw); $times['decodeMs'] = $ms($at); $snapshot('decoded');
    $at = hrtime(true);
    if ($variant === 'B') {
        unset($raw);
        if (is_array($body['candidate'] ?? null)) foreach (['characters', 'timeSeries', 'cursor'] as $key) if (array_key_exists($key, $body['candidate'])) $body['candidate'][$key] = null;
    }
    $times['releaseMs'] = $ms($at); $snapshot('releasedOrRetained');
    $at = hrtime(true);
    foreach ([SparowType\ArenaRules::class, SparowType\CompetitiveInputPolicy::class, SparowType\CourseAssessment::class, SparowType\SessionValidator::class] as $class) class_exists($class);
    $validator = new SparowType\SessionValidator();
    $times['validationAutoloadMs'] = $ms($at); $snapshot('autoloaded');
    $at = hrtime(true); SparowType\ArenaRules::preflight($body['candidate']); $times['preflightMs'] = $ms($at);
    $at = hrtime(true); $validated = $validator->validateCheckpoint($body['candidate'], $body['expectedOwner']); $times['validateCheckpointMs'] = $ms($at); $snapshot('validated');
    $candidate = $validated['candidate'];
    if ($candidate['elapsedMs'] !== 2000 && $candidate['elapsedMs'] !== 2000.0) throw new RuntimeException('Checkpoint elapsed changed.');
    $at = hrtime(true);
    $replay = $validator->replay($candidate['configuration'], $candidate['events'], 2300, ['targetText'=>$candidate['targetText'], 'finiteFinal'=>false, 'includeTimeSeries'=>false]);
    $times['authoritativeReplay2300Ms'] = $ms($at); $snapshot('authoritativeReplay');
    if ($replay['metrics']['elapsedMs'] != 2300 || $replay['metrics']['wpm'] === $candidate['metrics']['wpm']) throw new RuntimeException('The authoritative replay must use a genuinely different elapsed time.');
    $flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR;
    $at = hrtime(true);
    $canonicalJson = json_encode($candidate, $flags);
    $replayJson = json_encode($replay, $flags);
    $hashes = ['canonicalRawJsonSha256'=>hash('sha256', $canonicalJson), 'canonicalStableSha256'=>hash('sha256', SparowType\SessionValidator::stablePayload($candidate)), 'authoritativeReplayRawJsonSha256'=>hash('sha256', $replayJson)];
    $times['hashAndSerializationMs'] = $ms($at); $snapshot('hashes');
    echo json_encode(['status'=>'PASS-SCOPED-CPU-ONLY', 'variant'=>$variant, 'inputSha256'=>$inputHash, 'inputBytes'=>$bytes, 'times'=>$times, 'memory'=>$memory, 'managedMemoryLimit'=>ini_get('memory_limit'), 'rawRetained'=>isset($raw), 'bodyRetained'=>isset($body), 'metricClaimRetained'=>is_array($body['candidate']['metrics'] ?? null), 'canonicalPropertyOrder'=>array_keys($candidate), 'hashes'=>$hashes, 'canonicalBytes'=>strlen($canonicalJson), 'replayBytes'=>strlen($replayJson), 'includedFiles'=>get_included_files(), 'peakAllocatedBytes'=>memory_get_peak_usage(true), 'checkpointElapsedMs'=>$candidate['elapsedMs'], 'authoritativeElapsedMs'=>$replay['metrics']['elapsedMs'], 'databaseConnectionCreated'=>false, 'bootstrapOrPrivateConfigLoaded'=>false], $flags);
} catch (Throwable $error) {
    echo json_encode(['status'=>'FAILED', 'variant'=>$variant, 'inputSha256'=>$inputHash, 'times'=>$times, 'memory'=>$memory, 'error'=>['class'=>get_class($error), 'message'=>$error->getMessage()], 'peakAllocatedBytes'=>memory_get_peak_usage(true)], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit(1);
}
