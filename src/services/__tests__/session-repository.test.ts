import { describe,it,expect } from 'vitest';
import { SessionRepository,payloadIdentity,type SessionRecord } from '../session-repository';
const summary={id:'one',wpm:12,rawWpm:14,accuracy:90,consistency:60,mode:'time',duration:30,correctChars:30,incorrectChars:2,totalChars:32,errors:4,date:'2026-10-15T00:00:00Z',wpmHistory:[12]};
export const record=(owner='alice',id='one'):SessionRecord=>({schemaVersion:3,ownerId:owner,clientSessionId:id,payloadVersion:'forge-v3',payloadHash:'immutable',summary:{...summary,id},candidate:{events:[]},privateContent:false,cloudConsent:false,provenance:'observed',state:'queued',attempts:0,nextAttemptAt:0,createdAt:100,evidenceExpiresAt:10000});
describe('owner scoped session repository',()=>{
  it('keeps an immutable completed result in memory when IndexedDB is unavailable',async()=>{
    const repo=new SessionRepository();await repo.save(record());
    expect(repo.storageMode).toBe('memory');expect((await repo.get('alice','one'))?.summary.wpm).toBe(12);
    await expect(repo.save({...record(),payloadHash:'changed'})).rejects.toThrow('different immutable evidence');
  });
  it('isolates account history, deletion and guest import',async()=>{
    const repo=new SessionRepository();await repo.save(record('alice'));await repo.save(record('bob'));await repo.save({...record('guest'),state:'local-only'});
    expect((await repo.list('alice')).length).toBe(1);await repo.clear('alice');expect((await repo.list('bob')).length).toBe(1);
    expect(await repo.importGuest('alice')).toBe(1);expect(await repo.importGuest('alice')).toBe(0);expect((await repo.list('alice'))[0].provenance).toBe('guest-import');
  });
  it('enforces private content storage consent at the repository boundary',async()=>{
    const repo=new SessionRepository();await expect(repo.save({...record(),privateContent:true})).rejects.toThrow('consent');
    await repo.save({...record(),privateContent:true,state:'local-only'});expect((await repo.list('alice'))[0].state).toBe('local-only');
  });
  it('expires unsynced replay and private text while retaining useful summaries',async()=>{
    const repo=new SessionRepository();await repo.save({...record(),privateContent:true,cloudConsent:true});await repo.expireEvidence(10001);
    const row=await repo.get('alice','one');expect(row.candidate).toBeUndefined();expect(row.state).toBe('local-only');expect(row.errorCode).toBe('evidence-expired');expect(row.summary.wpm).toBe(12);
  });
  it('imports legacy history nondestructively and restartably, rejecting corrupt records',async()=>{
    const repo=new SessionRepository();localStorage.setItem('typingmaster_history',JSON.stringify([summary,{...summary,id:'corrupt',wpm:'bad'}]));
    expect(await repo.migrateLegacy(localStorage)).toEqual({imported:1,invalid:1});expect(await repo.migrateLegacy(localStorage)).toEqual({imported:0,invalid:1});
    expect(localStorage.getItem('typingforge:v3:legacy-history-backup')).toBe(localStorage.getItem('typingmaster_history'));expect((await repo.list('guest'))[0].payloadVersion).toBe('legacy-unverified');
  });
  it('hashes stable object key order but detects changed evidence',async()=>{
    expect(await payloadIdentity({b:2,a:1})).toBe(await payloadIdentity({a:1,b:2}));expect(await payloadIdentity({a:2})).not.toBe(await payloadIdentity({a:1}));
  });
});
