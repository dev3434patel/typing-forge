<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$options = getopt('', ['config:', 'database:', 'check', 'apply']);
if (!isset($options['config'], $options['database']) || (!isset($options['check']) && !isset($options['apply']))) {
    fwrite(STDERR, "Usage: php backend/bin/migrate-schema.php --config=/absolute/private/admin-config.php --database=sparowtype --check|--apply\n"); exit(2);
}
$database = $options['database'];
$file = is_string($options['config']) ? realpath($options['config']) : false;
if (!is_string($database) || !preg_match('/^[A-Za-z][A-Za-z0-9_]{0,63}$/D', $database) || !$file || !is_file($file)) {
    fwrite(STDERR, "Choose an explicit valid database name and existing private administrator config.\n"); exit(2);
}
putenv('SPAROWTYPE_CONFIG_FILE='.$file);
$locked = false;
try {
    $config = require dirname(__DIR__).'/bootstrap.php';
    if (($config['database']['name'] ?? null) !== $database) throw new RuntimeException('The explicit database must match the configuration.');
    $db = \SparowType\Database::connect($config);
    $versions = array_map('intval', $db->query('SELECT version FROM schema_metadata')->fetchAll(PDO::FETCH_COLUMN));
    if (!in_array(1, $versions, true) || max($versions) > 5) throw new RuntimeException('This tool requires a supported initialized schema. It never imports the initial schema.');
    $sources = [2=>'002-progression.sql', 3=>'003_classroom.sql', 4=>'004_social.sql', 5=>'005_arena.sql'];
    $pending = array_diff_key($sources, array_fill_keys($versions, true));
    $sql = [];
    foreach ($pending as $version => $source) {
        $contents = file_get_contents(dirname(__DIR__).'/migrations/'.$source);
        if (!is_string($contents) || trim($contents) === '') throw new RuntimeException('Missing migration: '.$source);
        $sql[$version] = $contents;
    }
    if (!isset($options['apply'])) {
        echo \SparowType\Database::json(['database'=>$database,'applied'=>false,'pending'=>array_values($pending),'schemaVersion'=>max($versions)]).PHP_EOL; exit;
    }
    $lock = $db->prepare('SELECT GET_LOCK(?,10)'); $lock->execute(['sparowtype-migrations:'.$database]);
    if ((int)$lock->fetchColumn() !== 1) throw new RuntimeException('Another migration is running. No SQL was applied.');
    $locked = true; $applied = [];
    // MySQL DDL commits implicitly. These additive sources use IF NOT EXISTS;
    // a partial failure is reported, never labelled a successful transaction.
    foreach ($sql as $version => $source) { $db->exec($source); $applied[] = $pending[$version]; }
    echo \SparowType\Database::json(['database'=>$database,'applied'=>$applied,'schemaVersion'=>(int)$db->query('SELECT MAX(version) FROM schema_metadata')->fetchColumn(),'usersCreated'=>0]).PHP_EOL;
} catch (Throwable $error) { fwrite(STDERR, 'Migration failed: '.$error->getMessage().PHP_EOL); exit(1); }
finally { if ($locked) { $release = $db->prepare('SELECT RELEASE_LOCK(?)'); $release->execute(['sparowtype-migrations:'.$database]); } }
