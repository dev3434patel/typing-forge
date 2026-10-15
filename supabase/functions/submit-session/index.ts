import { createClient } from 'npm:@supabase/supabase-js@2.90.1';
import { validateCandidate, sha256, ValidationError } from '../_shared/validation.ts';
import { boundedBody, cors, json } from '../_shared/http.ts';
import { learningEvidenceFromResult } from '../../../src/lib/learning-evidence.ts';

Deno.serve(async(request:Request)=>{
  if(request.method==='OPTIONS') return new Response(null,{headers:cors});
  if(request.method!=='POST') return json({error:'Use POST.'},405);
  const url=Deno.env.get('SUPABASE_URL');const anon=Deno.env.get('SUPABASE_ANON_KEY');const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!anon||!service) return json({error:'Cloud validation is not configured.'},503);
  const authorization=request.headers.get('Authorization')??'';
  const scoped=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
  const {data:{user},error:authError}=await scoped.auth.getUser();
  if(authError||!user) return json({error:'Sign in again to sync this account.'},401);
  try {
    const body=await boundedBody(request);
    const {candidate,replay,comparisonKey,keySummaries,personalBestEligible}=validateCandidate(body.candidate,user.id,{cloudConsent:body.cloudConsent});
    if(body.clientSessionId!==candidate.clientSessionId||body.payloadVersion!=='forge-v3') return json({error:'Submission envelope identity/version mismatch.'},422);
    const admin=createClient(url,service,{auth:{persistSession:false}});
    const payloadHash=await sha256(candidate);
    const receipt=await admin.rpc('forge_get_submission_receipt',{p_owner:user.id,p_client_id:candidate.clientSessionId,p_hash:payloadHash});
    if(receipt.error)return json({error:receipt.error.message},409);
    if(receipt.data)return json({accepted:receipt.data});
    let eligible=false;const reasons=['personal-first-input-timing'];
    const localBot=candidate.configuration.settings?.localBot===true&&candidate.configuration.challengeId?.startsWith('local-bot:');
    if(localBot)reasons.push('labelled-local-bot');
    if(candidate.configuration.challengeId&&!localBot) {
      const {data:challenge,error}=await admin.from('typing_challenges').select('*').eq('id',candidate.configuration.challengeId).eq('user_id',user.id).single();
      if(error||!challenge) return json({error:'Challenge not found for this account.'},403);
      const config=candidate.configuration;const now=Date.now();
      if(challenge.target_text!==candidate.targetText||candidate.issuedTargetSegments.length||candidate.pauseIntervals.length||candidate.events.some(e=>e.provenance!=='keyboard')||config.mode!=='time'||config.scoringPolicy!=='prose'||config.durationMs!==challenge.configuration.durationMs||candidate.elapsedMs!==challenge.configuration.durationMs||config.contentRevision!==challenge.configuration.contentRevision||config.keyboardLayout!=='qwerty'||config.inputMethod!=='keyboard'||config.language!=='en'||config.punctuation||config.numbers||config.repeatedContent||config.rejectIncorrect||candidate.startedAtWall!==Date.parse(challenge.starts_at)||now<Date.parse(challenge.deadline_at)||now>Date.parse(challenge.expires_at)) return json({error:'Challenge timing, content, or input configuration does not match.'},422);
      eligible=true;reasons.length=0;
    }
    if(!eligible) {
      if(candidate.pauseIntervals.length) reasons.push('paused');
      if(candidate.events.some(e=>e.provenance!=='keyboard')) reasons.push('assisted-or-composition-input');
    }
    // Accepted JSON contains summaries only; text and replay live in expiring evidence.
    const learningEvidence=['learn','learning'].includes(candidate.configuration.mode)&&candidate.configuration.privacy!=='private-custom'?learningEvidenceFromResult(candidate):null;
    const accepted={schemaVersion:3,metricsVersion:'forge-v3',clientSessionId:candidate.clientSessionId,payloadHash,mode:candidate.configuration.mode,comparisonKey,elapsedMs:candidate.elapsedMs,metrics:replay.metrics,timeSeries:replay.timeSeries,personalBestEligible,finishedAtWall:candidate.finishedAtWall,eligibility:{eligible,reasons,verification:'edge-replayed',automationRisk:'Browser transcripts cannot prove human input.'},challengeId:candidate.configuration.challengeId??null,learningEvidence,acceptedAt:new Date().toISOString()};
    const {data,error}=await admin.rpc('forge_commit_session',{p_owner:user.id,p_client_id:candidate.clientSessionId,p_hash:payloadHash,p_accepted:accepted,p_evidence:candidate,p_keys:keySummaries});
    if(error) return json({error:error.message},error.code==='23505'?409:422);
    return json({accepted:data});
  } catch(error) {return json({error:error instanceof Error?error.message:'Session validation failed.'},error instanceof ValidationError?422:400);}
});
