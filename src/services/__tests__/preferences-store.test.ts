import {describe,it,expect} from 'vitest';
import {PREFERENCE_DEFAULTS,validatePreferences,validatePreferencePatch,mergeCloudPreferences,acknowledgePreferences,type PreferenceEnvelope} from '../preferences-store';
const local=():PreferenceEnvelope=>({schemaVersion:3,values:{...PREFERENCE_DEFAULTS,fontSize:28},pending:{fontSize:28},cloudVersion:2,updatedAt:100});
describe('local first versioned preference reconciliation',()=>{
  it('validates stored controls rather than trusting a stale or corrupt object',()=>{const value=validatePreferences({fontSize:999,theme:'bad',layout:'bad',volume:0,liveStats:'yes',language:'unavailable'});expect(value.fontSize).toBe(40);expect(value.theme).toBe('sparow-dark');expect(value.layout).toBe('qwerty');expect(value.volume).toBe(0);expect(value.liveStats).toBe(true);expect(value.language).toBe('en');});
  it('preserves a user edit made before a slow cloud read',()=>{const merged=mergeCloudPreferences(local(),{preferences:{...PREFERENCE_DEFAULTS,fontSize:20,theme:'forge-light'},version:7});expect(merged.values.fontSize).toBe(28);expect(merged.cloudVersion).toBe(7);expect(merged.pending).toEqual({fontSize:28});});
  it('does not erase an edit made while an earlier update was in flight',()=>{const entry={...local(),values:{...PREFERENCE_DEFAULTS,fontSize:32},pending:{fontSize:32}};const next=acknowledgePreferences(entry,{fontSize:28},{preferences:{...PREFERENCE_DEFAULTS,fontSize:28},version:8});expect(next.values.fontSize).toBe(32);expect(next.pending).toEqual({fontSize:32});});
  it('clears only acknowledged fields and drops unknown patch keys',()=>{const next=acknowledgePreferences(local(),{fontSize:28},{preferences:{...PREFERENCE_DEFAULTS,fontSize:28},version:8});expect(next.pending).toEqual({});expect(validatePreferencePatch({fontSize:29,unknown:'no'},PREFERENCE_DEFAULTS)).toEqual({fontSize:29});});
});

describe('legacy theme preference migration', () => {
  it('defaults both keyboard guides on, validates explicit choices and syncs them without overwriting newer edits', () => {
    expect(validatePreferences({})).toMatchObject({showKeyboard:true,showFingerGuide:true});
    expect(validatePreferences({showKeyboard:false,showFingerGuide:false})).toMatchObject({showKeyboard:false,showFingerGuide:false});
    expect(validatePreferences({showKeyboard:'no',showFingerGuide:null})).toMatchObject({showKeyboard:true,showFingerGuide:true});
    const entry={...local(),values:{...PREFERENCE_DEFAULTS,showKeyboard:false},pending:{showKeyboard:false,showFingerGuide:false}};
    const merged=mergeCloudPreferences(entry,{preferences:{showKeyboard:true,showFingerGuide:true},version:3});
    expect(merged.values).toMatchObject({showKeyboard:false,showFingerGuide:false});
    const acknowledged=acknowledgePreferences(merged,{showFingerGuide:false},{preferences:{showKeyboard:true,showFingerGuide:false},version:4});
    expect(acknowledged.pending).toEqual({showKeyboard:false});
  });
  it('accepts the standard Workman layout in saved preferences', () => {
    expect(validatePreferences({layout:'workman'}).layout).toBe('workman');
  });
  it('accepts all synthesized sound packs, an outline caret and an explicit motion preference', () => {
    for (const soundPack of ['soft','mechanical','typewriter','arcade','minimal']) {
      expect(validatePreferences({soundPack,caretStyle:'outline',reducedMotion:true})).toMatchObject({soundPack,caretStyle:'outline',reducedMotion:true});
    }
    expect(validatePreferences({soundPack:'unsupported',reducedMotion:'false'})).toMatchObject({soundPack:'soft',reducedMotion:false});
  });
  it('keeps new feedback choices through cloud acknowledgement', () => {
    const entry={...local(),pending:{soundPack:'arcade' as const,reducedMotion:true}};
    const next=acknowledgePreferences(entry,{soundPack:'arcade',reducedMotion:true},{preferences:{...PREFERENCE_DEFAULTS,soundPack:'arcade',reducedMotion:true},version:12});
    expect(next.pending).toEqual({});
    expect(next.values).toMatchObject({soundPack:'arcade',reducedMotion:true});
  });
  it('migrates dark and light choices without resetting other preferences', () => {
    for (const [legacy, canonical] of [['forge-dark', 'sparow-dark'], ['forge-light', 'sparow-light']]) {
      const values = validatePreferences({...PREFERENCE_DEFAULTS, theme:legacy, fontSize:32, language:'es', layout:'dvorak'});
      expect(values).toMatchObject({theme:canonical, fontSize:32, language:'es', layout:'dvorak'});
      expect(validatePreferencePatch({theme:legacy}, values)).toEqual({theme:canonical});
    }
  });
  it('canonicalizes an unsynced legacy theme while preserving newer local edits', () => {
    const entry = {...local(), pending:{theme:'forge-light', fontSize:32}};
    const next = mergeCloudPreferences(entry, {preferences:{...PREFERENCE_DEFAULTS, theme:'forge-dark', fontSize:20}, version:9});
    expect(next.pending).toEqual({theme:'sparow-light', fontSize:32});
    expect(next.values).toMatchObject({theme:'sparow-light', fontSize:32});
  });
  it('acknowledges equivalent legacy names and retains a different in-flight choice', () => {
    const entry = {...local(), pending:{theme:'sparow-light', fontSize:32}};
    const accepted = acknowledgePreferences(entry, {theme:'forge-light'}, {preferences:{...PREFERENCE_DEFAULTS, theme:'forge-light'}, version:10});
    expect(accepted.pending).toEqual({fontSize:32});
    expect(accepted.values.theme).toBe('sparow-light');
    const changed = acknowledgePreferences(entry, {theme:'forge-dark'}, {preferences:{...PREFERENCE_DEFAULTS, theme:'forge-dark'}, version:10});
    expect(changed.pending).toEqual({theme:'sparow-light', fontSize:32});
    expect(changed.values.theme).toBe('sparow-light');
  });
});
