import { createClient } from 'npm:@supabase/supabase-js@2.90.1';
import { validateCandidate,sha256 } from '../_shared/validation.ts';
import { replaySession } from '../../../src/lib/typing-core/metrics.ts';
import { graphemes } from '../../../src/lib/typing-core/transcript.ts';
import { boundedBody,cors,json } from '../_shared/http.ts';

Deno.serve(async(request:Request)=>{
  if(request.method==='OPTIONS')return new Response(null,{headers:cors});
  if(request.method!=='POST')return json({error:'Use POST.'},405);
  const url=Deno.env.get('SUPABASE_URL');const anon=Deno.env.get('SUPABASE_ANON_KEY');const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!anon||!service)return json({error:'Race validation is not configured.'},503);
  const scoped=createClient(url,anon,{global:{headers:{Authorization:request.headers.get('Authorization')??''}},auth:{persistSession:false}});
  const {data:{user},error:authError}=await scoped.auth.getUser();
  if(authError||!user)return json({error:'Sign in to continue this room.'},401);
  try {
    const body=await boundedBody(request);const admin=createClient(url,service,{auth:{persistSession:false}});
    const {data:room,error}=await admin.from('race_sessions').select('*').eq('id',body.raceId).single();
    if(error||!room||![room.host_id,room.opponent_id].includes(user.id))return json({error:'Room membership is required.'},403);
    const {candidate,comparisonKey,keySummaries}=validateCandidate(body.candidate,user.id,{interim:!body.finish});
    if(candidate.configuration.mode!=='race'||candidate.targetText!==room.expected_text||candidate.issuedTargetSegments.length||candidate.pauseIntervals.length||candidate.events.some(e=>e.provenance!=='keyboard')||candidate.configuration.durationMs!==room.duration_seconds*1000) return json({error:'Race target, duration, or input evidence does not match.'},422);
    const now=Date.now();const start=Date.parse(room.started_at);
    if(candidate.startedAtWall!==start)return json({error:'Race evidence must use the server-owned start.'},422);
    if(!Number.isFinite(start)||now<start)return json({error:'The server countdown has not finished.'},422);
    const elapsed=Math.max(0,Math.min(room.duration_seconds*1000,now-start));
    if(candidate.elapsedMs>elapsed+250||candidate.events.some(e=>e.offsetMs>elapsed+250))return json({error:'Race events exceed the server-owned elapsed time.'},422);
    const replay=replaySession(candidate.configuration,candidate.events,elapsed,{targetText:room.expected_text,finiteFinal:body.finish===true});
    const exact=replay.finalText===room.expected_text;
    const correct=replay.characters.filter(slot=>slot.status==='correct').length;
    const progress=Math.min(100,correct/graphemes(room.expected_text).length*100);
    const hash=body.finish?await sha256(candidate):null;
    if(body.finish){const receipt=await admin.rpc('forge_get_submission_receipt',{p_owner:user.id,p_client_id:candidate.clientSessionId,p_hash:hash});if(receipt.error)return json({error:receipt.error.message},409);if(receipt.data)return json({room:{...room,server_now:new Date().toISOString()}});}
    const accepted=body.finish?{schemaVersion:3,metricsVersion:'forge-v3',clientSessionId:candidate.clientSessionId,payloadHash:hash,mode:'race',comparisonKey,elapsedMs:elapsed,metrics:replay.metrics,timeSeries:replay.timeSeries,finishedAtWall:now,eligibility:{eligible:false,reasons:['race-outcomes-have-a-separate-comparison'],verification:'server-race-replayed'},raceId:room.id,acceptedAt:new Date().toISOString()}:null;
    const {data,error:commitError}=await admin.rpc('forge_commit_race_progress',{p_owner:user.id,p_race_id:room.id,p_progress:progress,p_wpm:replay.metrics.wpm,p_accuracy:replay.metrics.inputAccuracy,p_errors:replay.metrics.incorrectAttempts,p_sequence:candidate.events.length,p_complete:body.finish===true&&exact&&now<=Date.parse(room.deadline_at),p_session:body.finish?{clientId:candidate.clientSessionId,hash,accepted,evidence:candidate,keys:keySummaries}:null});
    if(commitError)return json({error:commitError.message},422);
    return json({room:data});
  }catch(error){return json({error:error instanceof Error?error.message:'Race validation failed.'},422);}
});
