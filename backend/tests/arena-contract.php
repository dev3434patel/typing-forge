<?php
declare(strict_types=1);
// Pure rules only: no bootstrap, private configuration or database connection.
spl_autoload_register(static function(string $class): void {
    $prefix='SparowType'.chr(92);if(!str_starts_with($class,$prefix))return;$name=substr($class,strlen($prefix));
    if(preg_match('/^[A-Za-z][A-Za-z0-9]*$/D',$name))require_once __DIR__.'/../src/'.$name.'.php';
});
$input=json_decode(stream_get_contents(STDIN),true,512,JSON_THROW_ON_ERROR);
try{
    $value=match($input['action']){
        'duration'=>SparowType\ArenaRules::duration($input['duration']??null),
        'code'=>SparowType\ArenaRules::code($input['code']??null),
        'configuration'=>SparowType\ArenaRules::configuration($input['id'],$input['duration']),
        'bracket'=>SparowType\ArenaRules::bracket($input['wait']),
        'waiting-liveness'=>SparowType\ArenaRules::waitingLiveness($input['room'],$input['members'],$input['now']),
        'placements'=>SparowType\ArenaRules::placements($input['members']),
        'issued'=>(function()use($input){SparowType\ArenaRules::validateIssued($input['room'],$input['candidate']);return true;})(),
        'prefix'=>SparowType\ArenaRules::prefix($input['previous'],$input['candidate']),
        'quarantine'=>SparowType\ArenaRules::quarantine($input['candidate'],$input['metrics']),
        default=>throw new RuntimeException('Unknown pure arena operation')
    };
    echo json_encode(['ok'=>true,'value'=>$value],JSON_THROW_ON_ERROR);
}catch(SparowType\ApiException $error){echo json_encode(['ok'=>false,'status'=>$error->status,'code'=>$error->errorCode],JSON_THROW_ON_ERROR);}
