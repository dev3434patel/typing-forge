<?php
declare(strict_types=1);
// Pure class loader: bootstrap can load original private configuration.
spl_autoload_register(static function (string $class): void {
    $prefix='SparowType\\';$name=substr($class,strlen($prefix));
    if(str_starts_with($class,$prefix)&&preg_match('/^[A-Za-z][A-Za-z0-9]*$/D',$name))require_once __DIR__.'/../src/'.$name.'.php';
});
require_once __DIR__.'/LegacyStablePayload.php';
$validator = new \SparowType\SessionValidator();
$cases = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
$results = [];
foreach ($cases as $case) {
    $submittedBytesIdentical = LegacyStablePayload::stablePayload($case['candidate']) === \SparowType\SessionValidator::stablePayload($case['candidate']);
    try {
        $validated = $validator->validate($case['candidate'], $case['owner'], $case['consent'] ?? false, $case['interim'] ?? false);
        $oldPayload = LegacyStablePayload::stablePayload($validated['candidate']);
        $results[] = ['ok' => true, 'result' => $validated, 'serialization' => ['submittedBytesIdentical' => $submittedBytesIdentical, 'canonicalBytesIdentical' => $oldPayload === \SparowType\SessionValidator::stablePayload($validated['candidate']), 'payloadHashUnchanged' => $validated['payloadHash'] === 'sha256:'.hash('sha256', $oldPayload)], ...(($case['includeCanonicalPayload'] ?? false) ? ['canonicalPayloadBase64' => base64_encode($oldPayload)] : [])];
    } catch (\Throwable $error) {
        $results[] = ['ok' => false, 'message' => $error->getMessage(), 'class' => get_class($error), 'serialization' => ['submittedBytesIdentical' => $submittedBytesIdentical]];
    }
}
echo json_encode($results, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
