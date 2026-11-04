<?php
declare(strict_types=1);
// Aggregate-only diagnostic on a guarded, newly owned disposable instance.
try {
    if(PHP_SAPI!=='cli'||getenv('SPAROWTYPE_SOURCE24_DB_PROFILE_ACCEPTANCE')!=='1')throw new RuntimeException('profile-opt-in');
    $owner=getenv('SPAROWTYPE_CAPACITY_OWNER_ID')?:'';$phase=$argv[1]??'';
    if(!preg_match('/^[a-f0-9]{16}$/D',$owner)||!in_array($phase,['before','after'],true))throw new RuntimeException('profile-arguments');
    $root=realpath(__DIR__.'/../..');$owned=realpath($root.'/backend/storage/pack-instance-'.$owner);
    if(!$owned||realpath(dirname($owned))!==realpath($root.'/backend/storage'))throw new RuntimeException('profile-directory');
    $marker=json_decode((string)file_get_contents($owned.'/ownership.json'),true,32,JSON_THROW_ON_ERROR);
    if(($marker['id']??null)!==$owner||realpath($marker['root']??'')!==$root||!is_int($marker['runnerPid']??null)||$marker['runnerPid']<1)throw new RuntimeException('profile-owner');
    $adminPath=realpath($owned.'/admin.json');
    if($adminPath!==$owned.DIRECTORY_SEPARATOR.'admin.json')throw new RuntimeException('profile-admin-boundary');
    $admin=json_decode((string)file_get_contents($adminPath),true,32,JSON_THROW_ON_ERROR);$dbConfig=$admin['database']??[];
    $expectedDatabase='sparow_pack_'.$owner.'_audit';$port=(int)($dbConfig['port']??0);
    if(($dbConfig['name']??null)!==$expectedDatabase||($dbConfig['host']??null)!=='127.0.0.1'||in_array($port,[0,3306,3307,3308,4173,8081],true)||$port<1||$port>65535||realpath($admin['identity']['datadir']??'')!==realpath($owned.'/data'))throw new RuntimeException('profile-database-boundary');
    $db=new PDO('mysql:host=127.0.0.1;port='.$port.';dbname='.$expectedDatabase.';charset=utf8mb4',$dbConfig['username'],$dbConfig['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
    $identity=$db->query('SELECT DATABASE() AS db,@@port AS port,@@datadir AS datadir,@@performance_schema AS enabled')->fetch();
    if($identity['db']!==$expectedDatabase||(int)$identity['port']!==$port||realpath($identity['datadir'])!==realpath($owned.'/data')||(int)$identity['enabled']!==1)throw new RuntimeException('profile-identity');
    if($phase==='before'){
        // Summary aggregation only. No SQL history or raw statement trace.
        $db->exec("UPDATE performance_schema.setup_consumers SET ENABLED='NO'");
        $db->exec("UPDATE performance_schema.setup_instruments SET ENABLED='NO',TIMED='NO'");
        $db->exec("UPDATE performance_schema.setup_instruments SET ENABLED='YES',TIMED='YES' WHERE NAME LIKE 'statement/sql/%' OR NAME LIKE 'statement/com/%' OR NAME LIKE 'wait/io/file/innodb/%'");
        $db->exec("UPDATE performance_schema.setup_consumers SET ENABLED='YES' WHERE NAME IN ('global_instrumentation','thread_instrumentation','events_statements_current','statements_digest','events_waits_current')");
    }
    $statusNames=['Com_commit','Com_rollback','Handler_commit','Innodb_row_lock_waits','Innodb_row_lock_time','Innodb_row_lock_time_max','Innodb_log_waits','Innodb_os_log_fsyncs','Innodb_data_fsyncs','Innodb_data_reads','Innodb_data_writes','Innodb_buffer_pool_reads','Innodb_buffer_pool_read_requests','Threads_running','Max_used_connections','Performance_schema_digest_lost'];
    $variableNames=['innodb_flush_log_at_trx_commit','sync_binlog','innodb_buffer_pool_size','performance_schema','log_bin','slow_query_log'];
    $read=static function(string $type,array $names)use($db):array{
        $statement=$db->prepare('SHOW GLOBAL '.$type.' WHERE Variable_name IN ('.implode(',',array_fill(0,count($names),'?')).')');$statement->execute($names);$result=[];
        foreach($statement->fetchAll(PDO::FETCH_NUM) as $row)if(in_array($row[0],$names,true))$result[$row[0]]=$row[1];return $result;
    };
    $status=$read('STATUS',$statusNames);$variables=$read('VARIABLES',$variableNames);
    $category=static function(string $text):string{
        $sql=strtoupper(str_replace('`','',$text));
        if(preg_match('/^(COMMIT|ROLLBACK|BEGIN|START TRANSACTION)\b/',$sql,$match))return strtolower(str_replace(' ','-',$match[1]));
        if(str_contains($sql,'RATE_LIMITS'))return str_starts_with($sql,'INSERT')?'rate-upsert':'rate-other';
        foreach(['ARENA_MEMBERS'=>'arena-members','ARENA_ROOMS'=>'arena-rooms','USERS'=>'users','ARENA_MATCH_LOCKS'=>'arena-match-locks','TYPING_SESSIONS'=>'typing-sessions'] as $table=>$name)if(preg_match('/\b'.$table.'\b/',$sql))return $name.'-'.strtolower(strtok($sql,' '));
        if(str_contains($sql,'UTC_TIMESTAMP'))return 'database-clock';
        return 'other';
    };
    $q=$db->prepare('SELECT DIGEST,DIGEST_TEXT,COUNT_STAR,SUM_TIMER_WAIT,MAX_TIMER_WAIT,SUM_LOCK_TIME,SUM_ERRORS,SUM_ROWS_AFFECTED,SUM_ROWS_SENT,SUM_ROWS_EXAMINED FROM performance_schema.events_statements_summary_by_digest WHERE SCHEMA_NAME=? ORDER BY DIGEST LIMIT 257');$q->execute([$expectedDatabase]);$rows=$q->fetchAll();
    if(count($rows)>256)throw new RuntimeException('profile-digest-bound');
    $digests=[];$overflowCount=0;
    foreach($rows as $row){
        if($row['DIGEST']===null){$overflowCount+=(int)$row['COUNT_STAR'];continue;}
        $text=$row['DIGEST_TEXT']??'';
        if(stripos($text,'performance_schema')!==false||preg_match('/^SHOW\b/i',$text))continue;
        if(!preg_match('/^[a-f0-9]{32,64}$/iD',$row['DIGEST']))throw new RuntimeException('profile-digest-identifier');
        $digests[]=['digest'=>$row['DIGEST'],'category'=>$category($text),'count'=>(int)$row['COUNT_STAR'],'totalMs'=>(float)$row['SUM_TIMER_WAIT']/1e9,'maxMsSinceServerStart'=>(float)$row['MAX_TIMER_WAIT']/1e9,'lockMs'=>(float)$row['SUM_LOCK_TIME']/1e9,'errors'=>(int)$row['SUM_ERRORS'],'rowsAffected'=>(int)$row['SUM_ROWS_AFFECTED'],'rowsSent'=>(int)$row['SUM_ROWS_SENT'],'rowsExamined'=>(int)$row['SUM_ROWS_EXAMINED']];
    }
    $waits=[];
    foreach($db->query("SELECT EVENT_NAME,COUNT_STAR,SUM_TIMER_WAIT,MAX_TIMER_WAIT FROM performance_schema.events_waits_summary_global_by_event_name WHERE EVENT_NAME LIKE 'wait/io/file/innodb/%' ORDER BY EVENT_NAME LIMIT 65") as $row){
        if(!preg_match('~^wait/io/file/innodb/[a-z0-9_]+$~iD',$row['EVENT_NAME']))throw new RuntimeException('profile-wait-name');
        $waits[]=['event'=>$row['EVENT_NAME'],'count'=>(int)$row['COUNT_STAR'],'totalMs'=>(float)$row['SUM_TIMER_WAIT']/1e9,'maxMsSinceServerStart'=>(float)$row['MAX_TIMER_WAIT']/1e9];
    }
    if(count($waits)>64)throw new RuntimeException('profile-wait-bound');
    $consumers=$db->query("SELECT NAME,ENABLED FROM performance_schema.setup_consumers ORDER BY NAME")->fetchAll();
    foreach($consumers as $consumer)if(str_contains($consumer['NAME'],'history')&&$consumer['ENABLED']!=='NO')throw new RuntimeException('profile-history-enabled');
    echo json_encode(['status'=>'PASS-SCOPED-OWNED-SNAPSHOT','phase'=>$phase,'recordedAt'=>gmdate('c'),'ownerId'=>$owner,'serverVersion'=>$db->query('SELECT VERSION()')->fetchColumn(),'identityMatched'=>true,'performanceSchemaEnabled'=>true,'globalStatus'=>$status,'variables'=>$variables,'digests'=>$digests,'digestOverflowCount'=>$overflowCount,'fileWaits'=>$waits,'consumers'=>$consumers,'rawSqlPublished'=>false,'rawHistoryRead'=>false,'ownedAdminCredentialsLoadedOnlyByGuardedPhp'=>true,'originalConfigRead'=>false,'applicationDataMutations'=>false,'instrumentationConfigured'=>$phase==='before'],JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT).PHP_EOL;
}catch(Throwable $error){echo json_encode(['status'=>'FAILED','code'=>'owned-database-profile-unavailable','errorType'=>get_class($error),'originalConfigRead'=>false,'privateValuesPublished'=>false],JSON_THROW_ON_ERROR).PHP_EOL;exit(1);}
