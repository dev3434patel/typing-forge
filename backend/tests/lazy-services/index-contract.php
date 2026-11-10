<?php
declare(strict_types=1);
// Frozen-reference/current-production index flow, real parser, fake services. No server/config.
function lazyIndexOwned(string $owned,string $root,int $runnerPid):array
{
    $storage=realpath($root.'/backend/storage');$name=basename($owned);
    if($storage===false||!preg_match('/^lazy-index-[a-f0-9]{16}$/D',$name)||realpath(dirname($owned))!==$storage||realpath($owned)!==$storage.DIRECTORY_SEPARATOR.$name||is_link($owned))throw new RuntimeException('Temporary index workspace is outside its exact owned boundary.');
    $marker=$owned.'/ownership.json';
    if(!is_file($marker)||is_link($marker)||filesize($marker)>8192)throw new RuntimeException('Missing bounded index workspace ownership marker.');
    $identity=json_decode(file_get_contents($marker),true,512,JSON_THROW_ON_ERROR);
    if(($identity['kind']??null)!=='sparowtype-lazy-index-contract-v1'||($identity['root']??null)!==$root||($identity['runnerPid']??null)!==$runnerPid||($identity['name']??null)!==$name)throw new RuntimeException('Temporary index workspace ownership mismatch.');
    return $identity;
}
function lazyIndexCleanup(string $owned,string $root,int $runnerPid):void
{
    lazyIndexOwned($owned,$root,$runnerPid);
    // Check every fixed directory before deleting anything. Unexpected entries are retained.
    $layout=[''=>['baseline','candidate','ownership.json'],'baseline'=>['backend'],'candidate'=>['backend'],'baseline/backend'=>['bootstrap.php','public'],'candidate/backend'=>['bootstrap.php','public'],'baseline/backend/public'=>['index-contract-io.php'],'candidate/backend/public'=>['index-contract-io.php']];
    foreach($layout as$relative=>$expected){$directory=$relative===''?$owned:$owned.'/'.$relative;if(is_link($directory))throw new RuntimeException('Unexpected linked index workspace directory.');if(!file_exists($directory))continue;if(!is_dir($directory))throw new RuntimeException('Unexpected index workspace directory.');$actual=array_values(array_diff(scandir($directory),['.','..']));if(array_diff($actual,$expected))throw new RuntimeException('Unexpected temporary index workspace entries; retained for inspection.');}
    foreach(['baseline','candidate']as$variant)foreach(['/backend/public/index-contract-io.php','/backend/bootstrap.php']as$suffix){$file=$owned.'/'.$variant.$suffix;if(is_link($file)||(file_exists($file)&&!is_file($file)))throw new RuntimeException('Unexpected generated index file.');}
    foreach(['baseline','candidate']as$variant){foreach(['/backend/public/index-contract-io.php','/backend/bootstrap.php']as$suffix)if(file_exists($owned.'/'.$variant.$suffix))unlink($owned.'/'.$variant.$suffix);foreach(['/backend/public','/backend','']as$suffix)if(is_dir($owned.'/'.$variant.$suffix))rmdir($owned.'/'.$variant.$suffix);}
    unlink($owned.'/ownership.json');rmdir($owned);
    if(file_exists($owned))throw new RuntimeException('Temporary index workspace was not removed.');
}
function indexCases():array
{
    $rows=[];$add=static function(string $name,string $method,string $route,int $status=200,string $raw='{}',array $extra=[])use(&$rows):void{$rows[]=['name'=>$name,'method'=>$method,'route'=>$route,'status'=>$status,'raw'=>$raw,...$extra];};
    foreach(['create','join','get','ready','submit','leave','rematch','match','spectate','appeal']as$action)$add('arena '.$action,'POST','/arena/'.$action,200,$action==='submit'?' {"candidate":[],"finish":false} ':'{}');
    foreach(['missing'=>'{"candidate":[]}','null'=>'{"candidate":[],"finish":null}','true'=>'{"candidate":[],"finish":true}','integer'=>'{"candidate":[],"finish":1}','string'=>'{"candidate":[],"finish":"true"}','array'=>'{"candidate":[],"finish":[]}','bad candidate'=>'{"candidate":null,"finish":true}']as$name=>$raw)$add('submit '.$name,'POST','/arena/submit',in_array($name,['integer','string','array','bad candidate'],true)?422:200,$raw);
    foreach([['GET','/health'],['GET','/auth/session'],['GET','/leaderboards/cohorts'],['GET','/leaderboards'],['GET','/profile'],['GET','/preferences'],['GET','/sessions'],['GET','/data/version'],['GET','/progression'],['GET','/social'],['GET','/classroom'],['GET','/race/transport'],['POST','/sessions'],['POST','/social/duel-submit'],['POST','/race/get'],['POST','/challenges/issue'],['POST','/classroom/student/join'],['POST','/progression/command'],['POST','/account/delete'],['POST','/auth/signup'],['POST','/auth/signin'],['POST','/auth/signout'],['DELETE','/sessions/audit-id']]as[$method,$route])$add('nonarena '.$method.' '.$route,$method,$route,$route==='/auth/signup'?201:200);
    $add('bad JSON arena','POST','/arena/submit',400,'{');$add('bad JSON nonarena','POST','/sessions',400,'{');
    $add('not object','POST','/arena/submit',400,'[]');$add('NUL overwritten child','POST','/arena/submit',400,'{"candidate":{"characters":{"\u0000x":1}},"candidate":[]}');
    $add('depth','POST','/arena/submit',400,'{"x":'.str_repeat('[',513).'0'.str_repeat(']',513).'}',['largeLimit'=>true]);
    $add('UTF8','POST','/arena/submit',400,"{\"x\":\"\xff\"}");$add('body limit','POST','/arena/submit',413,str_repeat('x',129));
    $add('CSRF before JSON','POST','/arena/submit',403,'{',['fault'=>'csrf']);$add('rate before CSRF/JSON','POST','/arena/submit',429,'{',['fault'=>'api-rate']);
    $add('content type before JSON','POST','/arena/submit',415,'{',['contentType'=>'text/plain']);$add('parse before auth','POST','/sessions',400,'{',['fault'=>'auth']);
    $add('auth route refusal','POST','/sessions',401,'{}',['fault'=>'auth']);$add('owner refusal','POST','/arena/get',409,'{"expectedOwner":"other"}');
    $add('domain mapping','GET','/profile',422,'{}',['fault'=>'domain']);$add('conflict mapping','GET','/profile',409,'{}',['fault'=>'conflict']);
    $add('unknown route','GET','/not-found',404);$add('method','PATCH','/arena/submit',405);$add('preflight','OPTIONS','/arena/submit',204);
    return $rows;
}
$directory=__DIR__;$root=realpath(dirname(__DIR__,3));if($root===false)throw new RuntimeException('Repository root is unavailable.');$cases=indexCases();
if(($argv[1]??'')==='--child'){
    $variant=$argv[2]??'';$index=(int)($argv[3]??-1);$owned=$argv[4]??'';$runnerPid=(int)($argv[5]??0);
    if(!in_array($variant,['baseline','candidate'],true)||!isset($cases[$index]))throw new RuntimeException('Unknown child fixture.');
    $identity=lazyIndexOwned($owned,$root,$runnerPid);
    foreach([$variant,$variant.'/backend',$variant.'/backend/public']as$relative){$folder=$owned.'/'.$relative;if(is_link($folder)||realpath($folder)!==str_replace('/',DIRECTORY_SEPARATOR,$folder))throw new RuntimeException('Generated child directory identity mismatch.');}
    foreach(['/backend/public/index-contract-io.php','/backend/bootstrap.php']as$suffix){$relative=$variant.$suffix;$file=$owned.'/'.$relative;if(is_link($file)||realpath($file)!==realpath(dirname($file)).DIRECTORY_SEPARATOR.basename($file)||!is_file($file)||hash_file('sha256',$file)!==($identity['files'][$relative]??null))throw new RuntimeException('Generated child fixture identity mismatch.');}
    foreach(['pdo_mysql','intl','mbstring']as$extension)if(!extension_loaded($extension))throw new RuntimeException('Forward the explicit PHP runtime arguments to child processes.');
    require_once $root.'/backend/src/ApiException.php';require_once $root.'/backend/src/RequestBody.php';
    $case=$cases[$index];$GLOBALS['lazyIndexCase']=$case;
    $_SERVER=['REQUEST_METHOD'=>$case['method'],'REQUEST_URI'=>'/api'.$case['route'],'CONTENT_TYPE'=>$case['contentType']??'application/json'];$_GET=[];$_SESSION=[];
    http_response_code(200);ob_start();
    register_shutdown_function(static function()use($case,$variant):void{$text=ob_get_clean();$json=$text===''?null:json_decode($text,true,512,JSON_THROW_ON_ERROR);$probe='SparowTypeAuditIndex\\IndexProbe';echo json_encode(['variant'=>$variant,'case'=>$case['name'],'status'=>http_response_code(),'json'=>$json,'responseSha256'=>hash('sha256',$text),'trace'=>$probe::$trace,'arenaArgs'=>$probe::$arenaArgs,'spyErrors'=>$probe::$errors,'realParser'=>class_exists('SparowType\\RequestBody',false),'fatal'=>error_get_last()['type']??null],JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);});
    require $owned.'/'.$variant.'/backend/public/index-contract-io.php';exit;
}

$request=trim(stream_get_contents(STDIN));$input=$request===''?[]:json_decode($request,true,512,JSON_THROW_ON_ERROR);$phpArgs=$input['phpArgs']??[];
if(!is_array($phpArgs)||!array_is_list($phpArgs)||count($phpArgs)>40)throw new RuntimeException('Expected explicit phpArgs list.');foreach($phpArgs as$arg)if(!is_string($arg)||strlen($arg)>2048||str_contains($arg,"\0"))throw new RuntimeException('Invalid runtime argument.');
$backend=$root.DIRECTORY_SEPARATOR.'backend';
if(is_link($backend)||!is_dir($backend)||realpath($backend)!==$backend)throw new RuntimeException('Repository backend directory identity mismatch.');
$storagePath=$backend.DIRECTORY_SEPARATOR.'storage';
if(is_link($storagePath))throw new RuntimeException('Storage must not be a symlink.');
if(!file_exists($storagePath)&&!mkdir($storagePath,0700))throw new RuntimeException('Cannot create repository test storage.');
if(is_link($storagePath)||!is_dir($storagePath))throw new RuntimeException('Storage must be a directory.');
$storage=realpath($storagePath);if($storage!==$storagePath)throw new RuntimeException('Storage directory identity mismatch.');
$owned=$storage.DIRECTORY_SEPARATOR.'lazy-index-'.bin2hex(random_bytes(8));$runnerPid=getmypid();
if(!mkdir($owned,0700))throw new RuntimeException('Cannot create fresh temporary index workspace.');
$identity=['kind'=>'sparowtype-lazy-index-contract-v1','root'=>$root,'runnerPid'=>$runnerPid,'name'=>basename($owned),'files'=>[]];
file_put_contents($owned.'/ownership.json',json_encode($identity,JSON_THROW_ON_ERROR));
$sources=[];$sourceFiles=['baseline'=>$directory.'/reference/backend/public/index.php','candidate'=>$root.'/backend/public/index.php'];
try{
lazyIndexOwned($owned,$root,$runnerPid);
foreach($sourceFiles as$variant=>$sourceFile){foreach([$owned.'/'.$variant,$owned.'/'.$variant.'/backend',$owned.'/'.$variant.'/backend/public']as$folder)if(!mkdir($folder,0700))throw new RuntimeException('Cannot create controlled index fixture directory.');$backend=$owned.'/'.$variant.'/backend';$original=file_get_contents($sourceFile);if(substr_count($original,"fopen('php://input', 'rb')")!==1)throw new RuntimeException('Unique IO boundary required.');$io=str_replace("fopen('php://input', 'rb')","fopen('php://stdin', 'rb')",$original);if(str_replace("fopen('php://stdin', 'rb')","fopen('php://input', 'rb')",$io)!==$original)throw new RuntimeException('Exact IO reversal failed.');file_put_contents($backend.'/public/index-contract-io.php',$io);copy($directory.'/stub-bootstrap.php',$backend.'/bootstrap.php');$identity['files'][$variant.'/backend/public/index-contract-io.php']=hash('sha256',$io);$identity['files'][$variant.'/backend/bootstrap.php']=hash_file('sha256',$backend.'/bootstrap.php');$sources[$variant]=['source'=>$variant==='baseline'?'frozen-reference':'actual-current-production','indexSha256'=>hash('sha256',$original),'ioSha256'=>hash('sha256',$io),'ioOnlyExactReverse'=>true];}
file_put_contents($owned.'/ownership.json',json_encode($identity,JSON_THROW_ON_ERROR));
$checks=[];$samples=[];$check=static function(string $name,bool $pass)use(&$checks):void{$checks[]=['name'=>$name,'pass'=>$pass];};
$filterTrace=static fn(array $trace):array=>array_values(array_filter($trace,static fn(string $event):bool=>!in_array($event,['load.SessionValidator','load.DataService','ctor.validator','ctor.data'],true)));
foreach($cases as$index=>$case){$pair=[];foreach(['baseline','candidate']as$variant){$pipes=[];$process=proc_open([PHP_BINARY,...$phpArgs,__FILE__,'--child',$variant,(string)$index,$owned,(string)$runnerPid],[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes,$root,null,['bypass_shell'=>true,'windows_hide'=>true]);if(!is_resource($process))throw new RuntimeException('Fresh child could not start.');try{fwrite($pipes[0],$case['raw']);fclose($pipes[0]);$stdout=stream_get_contents($pipes[1]);$stderr=stream_get_contents($pipes[2]);fclose($pipes[1]);fclose($pipes[2]);$exit=proc_close($process);$process=null;}finally{foreach($pipes as$pipe)if(is_resource($pipe))fclose($pipe);if(is_resource($process)){proc_terminate($process);proc_close($process);}}if($exit!==0)throw new RuntimeException('Child failed before producing valid controlled-index evidence: '.$variant.' '.$case['name']);$row=json_decode($stdout,true,512,JSON_THROW_ON_ERROR);$pair[$variant]=$row;$samples[]=['case'=>$case['name'],'variant'=>$variant,'status'=>$row['status'],'responseSha256'=>$row['responseSha256'],'trace'=>$row['trace'],'arenaArgs'=>$row['arenaArgs'],'spyErrors'=>$row['spyErrors'],'stderrBytes'=>strlen($stderr)];}
    $a=$pair['baseline'];$b=$pair['candidate'];$check($case['name'].' exact actual status/JSON/response bytes',$a['status']===$b['status']&&$a['json']===$b['json']&&$a['responseSha256']===$b['responseSha256']&&$b['status']===$case['status']);$check($case['name'].' unchanged other class-load/control-flow trace',$filterTrace($a['trace'])===$filterTrace($b['trace'])&&$a['spyErrors']===$b['spyErrors']);$check($case['name'].' real parser and no fatal',$a['realParser']&&$b['realParser']&&$a['fatal']===null&&$b['fatal']===null);
    $isArena=$case['method']==='POST'&&preg_match('~^/arena/(create|join|get|ready|submit|leave|rematch|match|spectate|appeal)$~D',$case['route']);
    if($b['arenaArgs']){$submit=$case['route']==='/arena/submit';$decoded=json_decode($case['raw'],true);$finish=($decoded['finish']??false)===true;$check($case['name'].' exact lazy dependency construction',$b['arenaArgs']['validator']===$submit&&$b['arenaArgs']['data']===($submit&&$finish)&&$b['arenaArgs']['validatorIdentity']&&$b['arenaArgs']['dataIdentity']);}
    elseif(!$isArena&&in_array($case['status'],[200,201,401,404,409,422],true)&&!in_array($case['name'],['method','preflight'],true))$check($case['name'].' non-Arena retains both constructors',in_array('ctor.validator',$b['trace'],true)&&in_array('ctor.data',$b['trace'],true));
    if(in_array($case['status'],[400,403,413,415,429],true))$check($case['name'].' malformed body/security refusal precedes lazy dependency construction',!in_array('ctor.validator',$b['trace'],true)&&!in_array('ctor.data',$b['trace'],true));
    if(in_array($case['route'],['/sessions','/social/duel-submit'],true)&&$case['method']==='POST'&&$case['status']===200){$position=array_search('data.capture-receipt',$b['trace'],true);$routePositions=array_keys(array_filter($b['trace'],static fn(string $event):bool=>str_starts_with($event,'route.')));$check($case['name'].' receipt capture stays before dependent route',$position!==false&&$routePositions&&$position<min($routePositions)&&array_search('auth.require-user',$b['trace'],true)<$position);}
}
$failed=count(array_filter($checks,static fn(array $row):bool=>!$row['pass']));
foreach($sourceFiles as$variant=>$file)if(hash_file('sha256',$file)!==$sources[$variant]['indexSha256'])throw new RuntimeException('Index source changed during the differential contract.');
}finally{lazyIndexCleanup($owned,$root,$runnerPid);}
echo json_encode(['status'=>$failed?'FAILED':'PASS-SCOPED','scope'=>'Fresh CLI children execute frozen-reference and actual-current production index control flow with only reversible input-stream substitution, real RequestBody and ApiException, and deterministic unconnected service/PDO spies. Not native HTTP/real service validation.','cases'=>count($cases),'children'=>count($samples),'passed'=>count($checks)-$failed,'failed'=>$failed,'checks'=>$checks,'samples'=>$samples,'sources'=>$sources,'stubSha256'=>hash_file('sha256',$directory.'/stub-bootstrap.php'),'realParserSha256'=>hash_file('sha256',$root.'/backend/src/RequestBody.php'),'temporaryWorkspaceRemoved'=>!file_exists($owned),'servicesStarted'=>0,'privateConfigurationRead'=>false],JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);exit($failed?1:0);
