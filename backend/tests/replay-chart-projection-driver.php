<?php
declare(strict_types=1);

// Pure class loader. Do not load application bootstrap or private configuration.
spl_autoload_register(static function (string $class): void {
    $prefix = 'SparowType\\';
    $name = substr($class, strlen($prefix));
    if (str_starts_with($class, $prefix) && preg_match('/^[A-Za-z][A-Za-z0-9]*$/D', $name)) {
        require_once __DIR__.'/../src/'.$name.'.php';
    }
});

use SparowType\SessionValidator;

$validator = new SessionValidator();
$cases = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
$results = [];

foreach ($cases as $case) {
    $submittedHash = hash('sha256', SessionValidator::stablePayload($case['candidate']));
    try {
        // Default validation must still construct and validate its complete chart.
        $validated = $validator->validate(
            $case['candidate'],
            $case['owner'],
            $case['consent'] ?? false,
            $case['interim'] ?? false,
        );
    } catch (\Throwable $error) {
        $results[] = [
            'ok' => false,
            'message' => $error->getMessage(),
            'class' => get_class($error),
            'submittedCandidateUnchanged' => $submittedHash === hash('sha256', SessionValidator::stablePayload($case['candidate'])),
        ];
        continue;
    }

    try {
        $candidate = $validated['candidate'];
        $canonicalHash = hash('sha256', SessionValidator::stablePayload($candidate));
        $config = $candidate['configuration'];
        $policy = $config['scoringPolicy'] ?? (($config['mode'] ?? '') === 'code' ? 'code' : 'prose');
        $options = [
            'targetText' => $candidate['targetText'],
            'pauseIntervals' => $candidate['pauseIntervals'],
            'finiteFinal' => !in_array($config['mode'], ['time', 'zen'], true) && $policy !== 'free' && !($case['interim'] ?? false),
            'issuedTargetSegments' => $candidate['issuedTargetSegments'],
        ];
        $full = $validator->replay($config, $candidate['events'], $candidate['elapsedMs'], [...$options, 'includeTimeSeries' => true]);
        $withoutChart = $validator->replay($config, $candidate['events'], $candidate['elapsedMs'], [...$options, 'includeTimeSeries' => false]);
        $expectedWithoutChart = $validated['replay'];
        unset($expectedWithoutChart['timeSeries']);

        // Store only comparison witnesses. Keeping another full result for every
        // corpus row would repeat the original parity child's memory pressure.
        $results[] = [
            'ok' => true,
            'submittedCandidateUnchanged' => $submittedHash === hash('sha256', SessionValidator::stablePayload($case['candidate'])),
            'chartProjection' => [
                'defaultChartPresent' => array_key_exists('timeSeries', $validated['replay']),
                'explicitTrueChartPresent' => array_key_exists('timeSeries', $full),
                'explicitFalseChartOmitted' => !array_key_exists('timeSeries', $withoutChart),
                'explicitTrueMatchesDefault' => $full === $validated['replay'],
                'explicitFalseMatchesDefaultWithoutChart' => $withoutChart === $expectedWithoutChart,
                'canonicalCandidateUnchanged' => $canonicalHash === hash('sha256', SessionValidator::stablePayload($candidate))
                    && $canonicalHash === hash('sha256', SessionValidator::stablePayload($validated['candidate'])),
                'canonicalPayloadHashUnchanged' => $validated['payloadHash'] === 'sha256:'.$canonicalHash,
                'defaultReplayHash' => hash('sha256', SessionValidator::stablePayload($validated['replay'])),
                'explicitTrueReplayHash' => hash('sha256', SessionValidator::stablePayload($full)),
                'expectedWithoutChartHash' => hash('sha256', SessionValidator::stablePayload($expectedWithoutChart)),
                'explicitFalseReplayHash' => hash('sha256', SessionValidator::stablePayload($withoutChart)),
                'canonicalCandidateHash' => $canonicalHash,
            ],
        ];
    } catch (\Throwable $error) {
        // A projection failure must not be mistaken for a default-validation
        // rejection that happened to match an expected rejected corpus row.
        $results[] = [
            'ok' => true,
            'submittedCandidateUnchanged' => $submittedHash === hash('sha256', SessionValidator::stablePayload($case['candidate'])),
            'chartProjection' => [
                'exception' => ['class' => get_class($error), 'message' => $error->getMessage()],
            ],
        ];
    }
    unset($validated, $candidate, $full, $withoutChart, $expectedWithoutChart);
}

echo json_encode($results, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
