<?php
declare(strict_types=1);
require dirname(__DIR__).'/bootstrap.php';
$class = new ReflectionClass(\SparowType\AuthService::class);
$service = $class->newInstanceWithoutConstructor();
$hashMethod = $class->getMethod('passwordHash');
$password = str_repeat('a', 80).'first-tail';
$hash = substr($hashMethod->invoke($service, $password), 7);
$real = password_get_info($hash);
$dummy = password_get_info($class->getConstant('DUMMY_HASH'));
$sameCost = $real['options']['cost'] === $dummy['options']['cost'];
$tailMatters = password_verify(hash('sha256', $password), $hash) && !password_verify(hash('sha256', str_repeat('a', 80).'second-tail'), $hash);
echo json_encode(['realCost' => $real['options']['cost'], 'dummyCost' => $dummy['options']['cost'], 'sameCost' => $sameCost, 'longPasswordTailMatters' => $tailMatters], JSON_THROW_ON_ERROR).PHP_EOL;
exit($sameCost && $tailMatters ? 0 : 1);
