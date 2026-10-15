import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { payloadIdentity, sessionRepository, type SessionRecord } from './session-repository';
import type { TestResult } from '@/lib/typing-engine';
import { reconcileLearningSessions } from '@/lib/keybr-engine';
import type { LearningSessionEvidence } from '@/lib/learning-evidence';
import type { SessionMetricValues } from '@/lib/typing-core/types';

export async function downloadAccountHistory(ownerId: string,attempt=0) {
  if (!isSupabaseConfigured || ownerId === 'guest') return;
  const {data:{session},error:authError}=await supabase.auth.getSession();
  if(authError || session?.user.id!==ownerId) throw new Error('Sign in again to download this account history.');
  const readVersion=async()=>{const {data,error}=await supabase.from('user_data_versions' as never).select('version').eq('user_id',ownerId).maybeSingle();if(error)throw new Error(error.message);return (data as unknown as {version?:number})?.version??0;};
  const initialVersion=await readVersion();const cloudIds=new Set<string>();
  const pageSize=500;
  for(let offset=0;;offset+=pageSize) {
    const {data,error}=await supabase.from('test_sessions').select('*').eq('user_id',ownerId).order('created_at',{ascending:false}).order('id').range(offset,offset+pageSize-1);
    if(error) throw new Error(`Account history could not be downloaded: ${error.message}`);
    for(const raw of data??[]) {
      const row=raw as typeof raw & {client_session_id?:string;metrics_version?:string;accepted_result?:Record<string,unknown>};
      const id=row.client_session_id??`cloud-legacy:${row.id}`;
      cloudIds.add(id);
      const existing=await sessionRepository.get(ownerId,id);
      if(existing||await sessionRepository.isDeleted(ownerId,id)) continue;
      const accepted=row.accepted_result;
      const points=Array.isArray(row.wpm_history)?row.wpm_history:[];
      const summary:TestResult={id,wpm:row.net_wpm??0,rawWpm:row.gross_wpm??0,accuracy:row.accuracy_percent??0,consistency:row.consistency_percent??0,mode:row.test_mode,duration:row.duration_seconds,correctChars:row.correct_characters??0,incorrectChars:Math.max(0,(row.total_characters??0)-(row.correct_characters??0)),totalChars:row.total_characters??0,errors:row.error_count??0,date:row.created_at,wpmHistory:points.map(value=>typeof value==='number'?value:typeof value==='object'&&value?Number((value as Record<string,unknown>).wpm)||0:0)};
      const record:SessionRecord={schemaVersion:3,ownerId,clientSessionId:id,payloadVersion:row.metrics_version??'legacy-unverified',payloadHash:typeof accepted?.payloadHash==='string'?accepted.payloadHash:await payloadIdentity(summary),summary,personalBestEligible:accepted?.personalBestEligible===true,metricSummary:accepted?.metrics as SessionMetricValues|undefined,comparisonKey:typeof accepted?.comparisonKey==='string'?accepted.comparisonKey:undefined,accepted,privateContent:false,cloudConsent:false,provenance:row.metrics_version==='forge-v3'?'observed':'legacy',state:'synced',attempts:0,nextAttemptAt:0,createdAt:Date.parse(row.created_at),evidenceExpiresAt:0,message:'Account summary downloaded. Raw replay remains on its originating device.'};
      await sessionRepository.save(record);
    }
    if((data?.length??0)<pageSize) break;
  }
  const learning:LearningSessionEvidence[]=[];
  for(let offset=0;;offset+=pageSize){
    const {data,error}=await supabase.from('session_learning_evidence' as never).select('evidence,server_sequence').eq('user_id',ownerId).order('server_sequence').range(offset,offset+pageSize-1);
    if(error)throw new Error(`Learning history could not be reconciled: ${error.message}`);
    const rows=data as unknown as Array<{evidence:LearningSessionEvidence;server_sequence:number}>;
    for(const row of rows??[])learning.push(row.evidence);
    if((rows?.length??0)<pageSize)break;
  }
  const finalVersion=await readVersion();
  const currentAuth=await supabase.auth.getSession();
  if(currentAuth.error||currentAuth.data.session?.user.id!==ownerId)throw new Error('Account changed during history download. This account was not reconciled with another account’s credentials.');
  if(finalVersion!==initialVersion){if(attempt<2)return downloadAccountHistory(ownerId,attempt+1);throw new Error('Account history changed during download. Reopen this page to reconcile the latest version.');}
  for(const row of await sessionRepository.list(ownerId))if(row.state==='synced'&&!cloudIds.has(row.clientSessionId))await sessionRepository.remove(ownerId,row.clientSessionId);
  reconcileLearningSessions(learning,ownerId,finalVersion);
}

async function authenticatedOwner(ownerId: string) {
  if (!isSupabaseConfigured) throw new Error('Account operations are unavailable in this installation.');
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token || session.user.id !== ownerId) throw new Error('The signed-in account changed. Reopen this workspace before deleting data.');
  return session;
}

export async function deleteSession(ownerId:string,sessionId:string) {
  // Capture the intended account's bearer before reading storage or issuing a request.
  const auth = ownerId === 'guest' ? null : await authenticatedOwner(ownerId);
  const row=await sessionRepository.get(ownerId,sessionId);
  if(!row) return;
  if(ownerId!=='guest'&&row.state!=='local-only') {
    const clientId=sessionId.startsWith('cloud-legacy:')?sessionId.slice('cloud-legacy:'.length):sessionId;
    const {error}=await supabase.rpc('forge_delete_session_for_owner' as never,{p_owner:ownerId,p_client_id:clientId} as never).setHeader('Authorization',`Bearer ${auth!.access_token}`);
    if(error) throw new Error(`Account deletion failed; local history is retained: ${error.message}`);
  }
  if (auth) await authenticatedOwner(ownerId);
  await sessionRepository.remove(ownerId,sessionId);
}

export async function deleteAccount(ownerId:string) {
  if(ownerId==='guest') {await sessionRepository.clear('guest');return;}
  const auth = await authenticatedOwner(ownerId);
  const {data,error}=await supabase.functions.invoke('delete-account',{body:{confirmation:'DELETE MY ACCOUNT',expectedOwner:ownerId},headers:{Authorization:`Bearer ${auth.access_token}`}});
  if(error||!data?.deleted) throw new Error(data?.error??error?.message??'Account deletion was not acknowledged.');
  const current = await supabase.auth.getSession();
  if (current.error || current.data.session?.user.id !== ownerId) throw new Error('Account changed after deletion was acknowledged. The new workspace was not cleared or signed out.');
  await sessionRepository.clear(ownerId);
  const afterClear = await supabase.auth.getSession();
  if (afterClear.error || afterClear.data.session?.user.id !== ownerId) return;
  const {error:signOutError}=await supabase.auth.signOut({scope:'local'});
  if(signOutError) throw new Error('Account deleted. Reload this page to clear the expired login.');
}

export function exportHistory(records:SessionRecord[]) {
  const blob=new Blob([JSON.stringify({format:'typing-forge-export',schemaVersion:3,exportedAt:new Date().toISOString(),sessions:records},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`typing-forge-history-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
}

