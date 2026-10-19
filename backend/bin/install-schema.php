<?php
declare(strict_types=1);

// Optional CLI alternative to phpMyAdmin Import. This command never creates or
// drops databases/users and refuses every nonempty database, including a partial
// installation. Use a separate administrator config for schema DDL; normal API
// credentials intentionally have only SELECT/INSERT/UPDATE/DELETE permissions.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$options = getopt('', ['config:', 'database:', 'install', 'check']);
if (!isset($options['config'], $options['database']) || (!isset($options['install']) && !isset($options['check']))) {
    fwrite(STDERR, "Usage: php backend/bin/install-schema.php --config=/absolute/private/admin-config.php --database=sparowtype --check|--install\n");
    exit(2);
}
$database = $options['database'];
if (!is_string($database) || !preg_match('/^[A-Za-z][A-Za-z0-9_]{0,63}$/D', $database)) {
    fwrite(STDERR, "Use an explicit database name containing only letters, digits and underscores.\n");
    exit(2);
}
$file = realpath($options['config']);
if ($file === false || !is_file($file)) {
    fwrite(STDERR, "The explicit private configuration file does not exist.\n");
    exit(2);
}
putenv('SPAROWTYPE_CONFIG_FILE='.$file);
try {
    $config = require dirname(__DIR__).'/bootstrap.php';
    if (($config['database']['name'] ?? null) !== $database) throw new RuntimeException('The explicit database name must match the private configuration.');
    $db = \SparowType\Database::connect($config);
    $statement = $db->prepare('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=?');
    $statement->execute([$database]);
    if ((int) $statement->fetchColumn() !== 0) throw new RuntimeException('The target database is not empty. No SQL was imported. Use reviewed migrations for an existing installation.');
    if (isset($options['check']) && !isset($options['install'])) {
        echo \SparowType\Database::json(['database' => $database, 'empty' => true, 'imported' => false]).PHP_EOL;
        exit;
    }
    $schema = file_get_contents(dirname(__DIR__).'/schema.sql');
    if ($schema === false) throw new RuntimeException('The schema file could not be read.');
    // MySQL DDL commits implicitly. A failure is reported visibly; the next run
    // refuses the partial database rather than pretending it was a clean import.
    $db->exec($schema);
    $version = $db->query('SELECT MAX(version) FROM schema_metadata')->fetchColumn();
    echo \SparowType\Database::json(['database' => $database, 'imported' => true, 'schemaVersion' => (int) $version, 'usersCreated' => 0]).PHP_EOL;
} catch (Throwable $error) {
    fwrite(STDERR, 'Schema initialization failed: '.$error->getMessage().PHP_EOL);
    exit(1);
}
