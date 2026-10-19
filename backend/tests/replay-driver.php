<?php
declare(strict_types=1);
require dirname(__DIR__).'/bootstrap.php';
$validator = new \SparowType\SessionValidator();
$cases = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
$results = [];
foreach ($cases as $case) {
    try {
        $results[] = ['ok' => true, 'result' => $validator->validate($case['candidate'], $case['owner'], $case['consent'] ?? false, $case['interim'] ?? false)];
    } catch (\Throwable $error) {
        $results[] = ['ok' => false, 'message' => $error->getMessage(), 'class' => get_class($error)];
    }
}
echo json_encode($results, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
