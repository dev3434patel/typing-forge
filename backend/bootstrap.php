<?php
declare(strict_types=1);

spl_autoload_register(static function (string $class): void {
    $prefix = 'SparowType\\';
    if (!str_starts_with($class, $prefix)) return;
    $relative = substr($class, strlen($prefix));
    if (!preg_match('/^[A-Za-z][A-Za-z0-9]*$/D', $relative)) return;
    $file = __DIR__.'/src/'.$relative.'.php';
    if (is_file($file)) require_once $file;
});

$configFile = getenv('SPAROWTYPE_CONFIG_FILE') ?: __DIR__.'/config.php';
if (!is_file($configFile)) $configFile = __DIR__.'/config.example.php';
$configuration = require $configFile;
if (!is_array($configuration)) throw new RuntimeException('Backend configuration must return an array.');
date_default_timezone_set('UTC');
return $configuration;
