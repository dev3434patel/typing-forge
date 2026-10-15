import { describe,it,expect,vi } from 'vitest';
import { SessionRepository,type SessionRecord } from '../session-repository';
import { SessionSync,retryDelay } from '../session-sync';
const row=(id='one'):SessionRecord=>({schemaVersion:3,ownerId:'alice',clientSessionId:id,payloadVersion:'forge-v3',payloadHash:'immutable',summary:{id,wpm:1,rawWpm:1,accuracy:90,consistency:80,mode:'time',duration:30,correctChars:1,incorrectChars:0,totalChars:1,errors:0,date:'2026-10-15',wpmHistory:[]},candidate:{id},privateContent:false,cloudConsent:false,provenance:'observed',state:'queued',attempts:0,nextAttemptAt:0,createdAt:1,evidenceExpiresAt:10000});
describe('account bound retry queue',()=>{
  it('does not upload an old account queue with new credentials',async()=>{
    const repository=new SessionRepository();await repository.save(row());const upload=vi.fn();await new SessionSync({repository,currentOwner:()=> 'bob',upload,now:()=>100}).flush('alice');
    expect(upload).not.toHaveBeenCalled();expect((await repository.get('alice','one')).state).toBe('auth-required');
  });
  it('stops a drain on account switch between requests',async()=>{
    const repository=new SessionRepository();await repository.save(row());await repository.save({...row('two'),createdAt:2});let owner='alice';
    const upload=vi.fn(async()=>{owner='bob';return {accepted:{id:'accepted'}};});await new SessionSync({repository,currentOwner:()=>owner,upload,now:()=>100}).flush('alice');
    expect(upload).toHaveBeenCalledTimes(1);expect((await repository.get('alice','two')).state).toBe('auth-required');
  });
  it('retries a lost acknowledgement using the same ID and hash',async()=>{
    const repository=new SessionRepository();await repository.save(row());const ids:string[]=[];let calls=0;
    const dispatcher=new SessionSync({repository,currentOwner:()=> 'alice',now:()=>100,random:()=>0,upload:async record=>{ids.push(record.clientSessionId+record.payloadHash);if(!calls++)throw new Error('response lost');return {accepted:{canonical:true}};}});
    await dispatcher.flush('alice');expect((await repository.get('alice','one')).state).toBe('retryable-error');await dispatcher.flush('alice',true);
    expect(ids[0]).toBe(ids[1]);expect((await repository.get('alice','one')).state).toBe('synced');
  });
  it('does not endlessly retry validation errors',async()=>{
    const repository=new SessionRepository();await repository.save(row());const upload=vi.fn(async()=>({error:{code:'invalid',message:'Wrong version',status:422}}));const dispatcher=new SessionSync({repository,currentOwner:()=> 'alice',upload,now:()=>100});
    await dispatcher.flush('alice');await dispatcher.flush('alice',true);expect(upload).toHaveBeenCalledTimes(1);expect((await repository.get('alice','one')).state).toBe('rejected');
  });
  it('serializes repeated drains and bounds retry delay',async()=>{
    const repository=new SessionRepository();await repository.save(row());const upload=vi.fn(async()=>({accepted:{}}));const dispatcher=new SessionSync({repository,currentOwner:()=> 'alice',upload,now:()=>100});await Promise.all([dispatcher.flush('alice'),dispatcher.flush('alice')]);expect(upload).toHaveBeenCalledTimes(1);expect(retryDelay(100,()=>1)).toBeLessThanOrEqual(375000);
  });
});
