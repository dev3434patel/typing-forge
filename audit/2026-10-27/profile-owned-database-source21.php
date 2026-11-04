<?php
declare(strict_types=1);
// One explicitly authorized read-only observation of a still-running owned DB.
// No mutation, bootstrap, original config, private log or raw SQL dump.
try {
    $owner = getenv('SPAROWTYPE_SOURCE21_OWNED_PROFILE_OWNER') ?: '';
    if (!preg_match('/^[a-f0-9]{16}$/D', $owner) || PHP_SAPI !== 'cli') throw new RuntimeException('owned-profile-opt-in');
    $root = realpath(__DIR__.'/../..'); $owned = realpath($root.'/backend/storage/pack-instance-'.$owner);
    if (!$owned) throw new RuntimeException('owned-profile-directory');
    $marker = json_decode((string) file_get_contents($owned.'/ownership.json'), true, 32, JSON_THROW_ON_ERROR);
    if (($marker['id'] ?? null) !== $owner || realpath($marker['root'] ?? '') !== $root || !is_int($marker['runnerPid'] ?? null)) throw new RuntimeException('owned-profile-marker');
    $file = realpath($owned.'/app-config.php');
    if ($file !== $owned.DIRECTORY_SEPARATOR.'app-config.php') throw new RuntimeException('owned-profile-config-boundary');
    $config = require $file;
    if (!is_array($config) || !preg_match('/^[a-f0-9]{64}$/D', $config['arena_audit_guard'] ?? '') || ($config['database']['name'] ?? '') !== 'sparow_pack_'.$owner.'_audit' || ($config['database']['host'] ?? '') !== '127.0.0.1' || in_array((int) ($config['database']['port'] ?? 0), [0,3306,3307,3308,4173,8081], true)) throw new RuntimeException('owned-profile-database-boundary');
    require_once $root.'/backend/src/Database.php';
    $db = SparowType\Database::connect($config);
    if ($db->query('SELECT DATABASE()')->fetchColumn() !== $config['database']['name']) throw new RuntimeException('owned-profile-database-identity');
    $statusNames = ['Uptime','Connections','Threads_connected','Threads_running','Max_used_connections','Slow_queries','Questions','Com_select','Com_insert','Com_update','Com_commit','Handler_commit','Innodb_row_lock_waits','Innodb_row_lock_time','Innodb_row_lock_time_avg','Innodb_row_lock_time_max','Innodb_log_waits','Innodb_os_log_fsyncs','Innodb_data_fsyncs','Innodb_data_reads','Innodb_data_writes','Innodb_buffer_pool_reads','Innodb_buffer_pool_read_requests','Created_tmp_disk_tables','Aborted_clients'];
    $variableNames = ['innodb_flush_log_at_trx_commit','sync_binlog','innodb_buffer_pool_size','innodb_flush_method','innodb_use_native_aio','performance_schema','log_bin','slow_query_log','long_query_time'];
    $read = static function (string $type, array $names) use ($db): array {
        $statement = $db->prepare('SHOW GLOBAL '.$type.' WHERE Variable_name IN ('.implode(',', array_fill(0,count($names),'?')).')'); $statement->execute($names); $result=[];
        foreach ($statement->fetchAll(PDO::FETCH_NUM) as $row) if (in_array($row[0],$names,true)) $result[$row[0]]=$row[1];
        return $result;
    };
    $status = $read('STATUS',$statusNames); $variables=$read('VARIABLES',$variableNames); $timings=[];
    foreach (['select-one'=>'SELECT 1','database-clock'=>'SELECT UNIX_TIMESTAMP(UTC_TIMESTAMP(3))*1000'] as $name=>$sql) {
        $samples=[];
        for($index=0;$index<20;$index++){$started=hrtime(true);$statement=$db->query($sql);$statement->fetchColumn();$statement->closeCursor();$samples[]=(hrtime(true)-$started)/1000000;}
        sort($samples);$timings[$name]=['count'=>count($samples),'minMs'=>$samples[0],'p50Ms'=>$samples[9],'p95Ms'=>$samples[18],'maxMs'=>$samples[19]];
    }
    $innodb=['status'=>'UNAVAILABLE'];
    try {
        $row=$db->query('SHOW ENGINE INNODB STATUS')->fetch(PDO::FETCH_NUM);$text=$row[2]??'';$aggregates=[];
        foreach(['pendingLogFsyncs'=>'/(\d+) pending log flushes/','pendingBufferFsyncs'=>'/(\d+) pending chkp writes/','fileReads'=>'/(\d+) OS file reads/','fileWrites'=>'/(\d+) OS file writes/','fileFsyncs'=>'/(\d+) OS fsyncs/'] as $name=>$pattern)if(preg_match($pattern,$text,$match))$aggregates[$name]=(int)$match[1];
        $innodb=['status'=>'PASS-SCOPED-AGGREGATES','values'=>$aggregates,'rawTextPublished'=>false];unset($text,$row);
    } catch (PDOException) {}
    $counts=[];
    foreach(['users','arena_rooms','arena_members','rate_limits'] as $table)$counts[$table]=(int)$db->query('SELECT COUNT(*) FROM '.$table)->fetchColumn();
    echo json_encode(['status'=>'PASS-SCOPED-READONLY-DIAGNOSTIC','recordedAt'=>gmdate('c'),'ownerId'=>$owner,'databaseIdentityMatched'=>true,'scope'=>'Post-burst/post-counter idle native connection snapshot. Cumulative values have no before baseline and do not attribute request latency. SELECT timings are not commit/HTTP timings.','globalStatus'=>$status,'globalVariables'=>$variables,'idleReadQueryTimings'=>$timings,'innodb'=>$innodb,'remainingOwnedRows'=>$counts,'originalConfigRead'=>false,'sqlMutations'=>false,'guardedOwnedConfigurationLoaded'=>true,'rawSqlOrKeysPublished'=>false],JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT)."\n";
} catch(Throwable){echo json_encode(['status'=>'FAILED','code'=>'owned-profile-unavailable','originalConfigRead'=>false],JSON_THROW_ON_ERROR)."\n";exit(1);}
