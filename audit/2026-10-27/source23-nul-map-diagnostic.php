<?php
declare(strict_types=1);
require_once __DIR__.'/../../backend/src/SessionValidator.php';
require_once __DIR__.'/../../backend/tests/LegacyStablePayload.php';
$rows=[];
foreach(['leading-nul'=>["\0x"=>1],'interior-nul'=>["a\0x"=>1]] as $name=>$value){
    $old=LegacyStablePayload::stablePayload($value);$new=null;$error=null;
    try{$new=SparowType\SessionValidator::stablePayload($value);}catch(Throwable $caught){$error=get_class($caught);}
    $cast=json_encode((object)$value,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
    $rows[]=['name'=>$name,'legacyHash'=>hash('sha256',$old),'newMatches'=>$new===$old,'newError'=>$error,'castMatches'=>$cast===$old];
}
echo json_encode(['scope'=>'Pure synthetic map compatibility. No configuration, DB or network.','checks'=>$rows],JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR).PHP_EOL;
