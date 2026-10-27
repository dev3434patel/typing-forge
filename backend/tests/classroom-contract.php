<?php
declare(strict_types=1);
// Pure contract harness: no bootstrap/configuration, connection or private file read.
spl_autoload_register(static function (string $class): void {
    $prefix = 'SparowType\\';
    if (!str_starts_with($class, $prefix)) return;
    $name = substr($class, strlen($prefix));
    if (preg_match('/^[A-Za-z][A-Za-z0-9]*$/D', $name)) require_once __DIR__.'/../src/'.$name.'.php';
});
$body = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
try {
    $value = match ($body['action']) {
        'configuration' => SparowType\ClassroomService::configuration($body['sessionId'], $body['memberId'], $body['classId']),
        'alias' => SparowType\ClassroomService::alias($body['alias']),
        'validate' => (function () use ($body): array {
            SparowType\ClassroomService::assertIssuedContract($body['candidate'], $body['memberId'], $body['classId']);
            $validated = (new SparowType\SessionValidator())->validate($body['candidate'], $body['memberId'], true);
            return ['metrics' => $validated['metrics'], 'hashAlgorithm' => substr($validated['payloadHash'], 0, 7)];
        })(),
        default => throw new RuntimeException('Unknown pure test action'),
    };
    echo json_encode(['ok' => true, 'value' => $value], JSON_THROW_ON_ERROR);
} catch (SparowType\ApiException $error) {
    echo json_encode(['ok' => false, 'status' => $error->status, 'code' => $error->errorCode], JSON_THROW_ON_ERROR);
} catch (InvalidArgumentException $error) {
    echo json_encode(['ok' => false, 'status' => 422, 'code' => 'invalid-candidate'], JSON_THROW_ON_ERROR);
}
