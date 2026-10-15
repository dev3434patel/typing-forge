import { createClient } from 'npm:@supabase/supabase-js@2.90.1';
import { boundedBody,cors,json } from '../_shared/http.ts';
Deno.serve(async(request:Request)=>{
  if(request.method==='OPTIONS')return new Response(null,{headers:cors});
  if(request.method!=='POST')return json({error:'Use POST.'},405);
  const url=Deno.env.get('SUPABASE_URL');const anon=Deno.env.get('SUPABASE_ANON_KEY');const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!anon||!secret)return json({error:'Account deletion is not configured.'},503);
  const scoped=createClient(url,anon,{global:{headers:{Authorization:request.headers.get('Authorization')??''}},auth:{persistSession:false}});
  const {data:{user},error}=await scoped.auth.getUser();if(error||!user)return json({error:'Sign in before deleting this account.'},401);
  try {
    const body=await boundedBody(request,1024);if(body.confirmation!=='DELETE MY ACCOUNT')return json({error:'Explicit deletion confirmation is required.'},400);
    if(body.expectedOwner!==user.id)return json({error:'The account changed. Reopen its workspace and confirm deletion again.'},403);
    const admin=createClient(url,secret,{auth:{persistSession:false}});
    const {error:prepareError}=await admin.rpc('forge_prepare_account_deletion',{p_owner:user.id});
    if(prepareError)return json({error:prepareError.message},422);
    const {error:deleteError}=await admin.auth.admin.deleteUser(user.id);
    if(deleteError)return json({error:deleteError.message},422);
    return json({deleted:true});
  }catch(cause){return json({error:cause instanceof Error?cause.message:'Deletion failed.'},400);}
});
