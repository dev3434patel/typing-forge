import { describe,it,expect } from 'vitest';
import { SessionController } from '@/lib/typing-core/session';
import { validateCandidate } from '../../../supabase/functions/_shared/validation';
function result(){let time=0;const controller=new SessionController({clientSessionId:'session-1',ownerScope:'alice',mode:'quote',initialTarget:'abc',scoringPolicy:'prose'},{now:()=>time,wallNow:()=>100000+time});controller.input({type:'insert',text:'a'});time=1000;controller.input({type:'insert',text:'b'});time=2000;controller.input({type:'insert',text:'c'});return JSON.parse(JSON.stringify(controller.result));}
describe('shared trusted server replay boundary',()=>{
  it('replays current-word corrections and rejects a forged edit to a committed word',()=>{
    let time=0;
    const controller=new SessionController({clientSessionId:'word-locked',ownerScope:'alice',mode:'time',durationMs:30000,initialTarget:'cat dog quiet calm',correctionPolicy:'current-word'},{now:()=>time,wallNow:()=>100000+time});
    controller.input({type:'insert',text:'cxt dox'});
    time=1000;controller.input({type:'delete'});
    time=2000;controller.input({type:'insert',text:'g '});
    time=3000;const candidate=JSON.parse(JSON.stringify(controller.finish('manual')));
    expect(validateCandidate(candidate,'alice').replay.finalText).toBe('cxt dog ');
    expect(validateCandidate(candidate,'alice').replay.metrics.incorrectAttempts).toBe(2);
    candidate.events[1].start=1;candidate.events[1].end=2;
    expect(()=>validateCandidate(candidate,'alice')).toThrow('Submitted words cannot be edited');
  });
  it('rejects an unsupported correction policy before comparing scores',()=>{
    const candidate=result();candidate.configuration.correctionPolicy='unknown';
    expect(()=>validateCandidate(candidate,'alice')).toThrow('Unsupported correction policy');
  });
  it('accepts an unchanged canonical session and derives actual key evidence',()=>{const checked=validateCandidate(result(),'alice');expect(checked.replay.metrics.inputAccuracy).toBe(100);expect(checked.keySummaries.map(key=>key.character)).toEqual(['a','b','c']);});
  it('rejects forged metrics and transcript',()=>{const forged=result();forged.metrics.wpm=999;expect(()=>validateCandidate(forged,'alice')).toThrow('replayed metrics');const text=result();text.finalText='xxx';expect(()=>validateCandidate(text,'alice')).toThrow('event replay');});
  it('rejects another owner, modified comparison keys and disordered event evidence',()=>{expect(()=>validateCandidate(result(),'bob')).toThrow('another account');const compared=result();compared.comparisonKey='fake';expect(()=>validateCandidate(compared,'alice')).toThrow('Comparison');const events=result();events.events[1].sequence=4;expect(()=>validateCandidate(events,'alice')).toThrow('contiguous');});
  it('requires explicit cloud-storage consent for custom content',()=>{const custom=result();custom.configuration.privacy='private-custom';expect(()=>validateCandidate(custom,'alice')).toThrow('consent');expect(validateCandidate(custom,'alice',{cloudConsent:true}).replay.finalText).toBe('abc');});
  it('rejects unissued target edits and oversized/overlapping pause evidence',()=>{const target=result();target.targetText='abcd';expect(()=>validateCandidate(target,'alice')).toThrow('reconstruct');const paused=result();paused.configuration.paused=true;paused.pauseIntervals=[{startMs:0,endMs:100},{startMs:50,endMs:200}];expect(()=>validateCandidate(paused,'alice')).toThrow('non-overlapping');});
});
