<?php
declare(strict_types=1);
foreach(['UnicodeGraphemes','SessionValidator','CourseAssessment','ProgressionCalendar','ProgressionQuests','ProgressionEngine','ProgressionFacts'] as $class)require_once dirname(__DIR__).'/src/'.$class.'.php';
$input=json_decode(stream_get_contents(STDIN),true,512,JSON_THROW_ON_ERROR);$output=[];$validator=new SparowType\SessionValidator();
foreach($input as $case){try{if(isset($case['candidate'])){$validated=$validator->validate($case['candidate'],$case['owner'],true);$value=SparowType\ProgressionFacts::fromAccepted($validated,$validator,$case['zone'],$case['at']);}else $value=SparowType\ProgressionEngine::rebuild($case['owner'],$case['verification'],$case['facts'],$case['commands']??[]);$output[]=['value'=>$value];}catch(Throwable $error){$output[]=['error'=>$error->getMessage()];}}
echo json_encode($output,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
