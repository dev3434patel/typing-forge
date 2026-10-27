<?php
declare(strict_types=1);
/** Guarded fixture provisioning ONLY; never loads the normal application config. */
$file=getenv('ARENA_AUDIT_CONFIG');
if(!$file||!is_file($file))throw new RuntimeException('Explicit owned ARENA_AUDIT_CONFIG required.');
$config=require $file;
$input=json_decode(stream_get_contents(STDIN),true,512,JSON_THROW_ON_ERROR);
$run=$input['runId']??'';$guard=getenv('ARENA_AUDIT_GUARD');
if(!is_array($config)||!is_string($guard)||strlen($guard)<32||!hash_equals($config['arena_audit_guard']??'',$guard)||!preg_match('/^[a-f0-9]{12}$/D',$run))throw new RuntimeException('Audit ownership guard mismatch.');
$name=$config['database']['name']??'';
if(!preg_match('/^sparow_pack_([a-f0-9]{16})_audit$/D',$name,$namespace))throw new RuntimeException('Refusing any database outside the fresh owned audit namespace.');
$instanceId=$namespace[1];$projectRoot=realpath(__DIR__.'/../..');$instance=realpath(__DIR__.'/../storage/pack-instance-'.$instanceId);$sessionRoot=realpath($config['session_save_path']??'');
$ownership=$instance?json_decode((string)file_get_contents($instance.'/ownership.json'),true):null;
if(!$instance||!$sessionRoot||$sessionRoot!==realpath($instance.'/sessions')||($ownership['id']??null)!==$instanceId||realpath($ownership['root']??'')!==$projectRoot||!is_int($ownership['runnerPid']??null)||($config['session_name']??null)!=='sparow_ephemeral_'.$instanceId||($config['database']['host']??null)!=='127.0.0.1'||in_array((int)($config['database']['port']??0),[0,3306,3307,3308],true))throw new RuntimeException('Private instance, owner manifest, session name or database port guard mismatch.');
spl_autoload_register(static function(string $class):void{$prefix='SparowType'.chr(92);if(!str_starts_with($class,$prefix))return;$name=substr($class,strlen($prefix));if(preg_match('/^[A-Za-z][A-Za-z0-9]*$/D',$name))require_once __DIR__.'/../src/'.$name.'.php';});
$db=SparowType\Database::connect($config);
if($db->query('SELECT DATABASE()')->fetchColumn()!==$name)throw new RuntimeException('Database identity changed.');
if(($input['action']??null)==='provision'){
    $count=$input['count']??0;if(!is_int($count)||$count<2||$count>400)throw new RuntimeException('Fixture capacity is2–400 accounts.');
    $hash='sha256:'.password_hash(hash('sha256',bin2hex(random_bytes(24))),PASSWORD_BCRYPT,['cost'=>12]);$accounts=[];
    $db->beginTransaction();try{for($index=0;$index<$count;$index++){
        $id=SparowType\Database::uuid();$email='arena-'.$run.'-'.$index.'@example.test';$handle='arena_'.substr($run,0,8).'_'.$index;
        $q=$db->prepare('INSERT INTO users(id,email,password_hash,handle) VALUES(?,?,?,?)');$q->execute([$id,$email,$hash,$handle]);
        $_SERVER['REMOTE_ADDR']='127.0.0.1';session_id('');SparowType\Security::beginSession($config);$_SESSION['user_id']=$id;$_SESSION['auth_version']=1;
        $accounts[]=['id'=>$id,'cookie'=>$config['session_name'].'='.session_id(),'csrf'=>SparowType\Security::csrf(),'sessionId'=>session_id()];session_write_close();
    }$db->commit();}catch(Throwable $error){if($db->inTransaction())$db->rollBack();foreach($accounts as $account){$path=$sessionRoot.DIRECTORY_SEPARATOR.'sess_'.$account['sessionId'];if(is_file($path))unlink($path);}throw $error;}
    echo json_encode(['database'=>$name,'accounts'=>$accounts],JSON_THROW_ON_ERROR);
}elseif(($input['action']??null)==='cleanup'){
    $q=$db->prepare('DELETE FROM users WHERE email LIKE ?');$q->execute(['arena-'.$run.'-%@example.test']);$deleted=$q->rowCount();$removed=0;
    foreach($input['sessions']??[] as $id){if(!is_string($id)||!preg_match('/^[A-Za-z0-9,-]{20,128}$/D',$id))throw new RuntimeException('Unexpected fixture session identifier.');$path=$sessionRoot.DIRECTORY_SEPARATOR.'sess_'.$id;if(is_file($path)&&unlink($path))$removed++;}
    echo json_encode(['deletedOwnAccounts'=>$deleted,'removedOwnSessions'=>$removed],JSON_THROW_ON_ERROR);
}else throw new RuntimeException('Unknown guarded fixture operation.');
