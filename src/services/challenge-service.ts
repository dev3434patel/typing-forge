import { supabase,isSupabaseConfigured } from '@/integrations/supabase/client';
import type { SessionConfig } from '@/lib/typing-core/types';
export interface RankedChallenge {id:string;user_id:string;nonce:string;target_text:string;configuration:Pick<SessionConfig,'mode'|'durationMs'|'language'|'keyboardLayout'|'inputMethod'|'scoringPolicy'|'contentRevision'>;issued_at:string;starts_at:string;deadline_at:string;expires_at:string;server_now:string}
export async function issueRankedChallenge(duration:number):Promise<RankedChallenge>{
  if(!isSupabaseConfigured)throw new Error('Ranked challenges require a configured cloud backend.');
  const {data,error}=await supabase.rpc('forge_issue_challenge' as never,{p_duration:duration} as never);
  if(error)throw new Error(error.message);if(!data)throw new Error('The server did not issue a challenge.');return data as unknown as RankedChallenge;
}
