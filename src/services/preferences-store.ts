import { THEMES } from '@/lib/themes';
import { CONTENT_PACKS,LAYOUTS } from '@/lib/content-packs';
import type { Preferences } from '@/contexts/PreferencesContext';
export interface PreferenceEnvelope {schemaVersion:3;values:Preferences;pending:Partial<Preferences>;cloudVersion:number;updatedAt:number}
export const PREFERENCE_DEFAULTS:Preferences={theme:'forge-dark',targetWpm:35,language:'en',layout:'qwerty',fontSize:26,caretStyle:'line',smoothCaret:true,sound:false,volume:.2,dailyGoalMinutes:10,liveStats:true,focusMode:false,paceCaret:false};
const boolKeys=['smoothCaret','sound','liveStats','focusMode','paceCaret'] as const;
export function validatePreferences(input:unknown):Preferences {
  const value=input&&typeof input==='object'?input as Record<string,unknown>:{};
  const valid={...PREFERENCE_DEFAULTS};
  const number=(key:keyof Preferences,min:number,max:number)=>typeof value[key]==='number'&&Number.isFinite(value[key])?Math.min(max,Math.max(min,value[key] as number)):PREFERENCE_DEFAULTS[key] as number;
  valid.theme=THEMES.some(theme=>theme.id===value.theme)?value.theme as string:valid.theme;
  valid.language=CONTENT_PACKS.some(pack=>pack.id===value.language)?value.language as string:valid.language;
  valid.layout=typeof value.layout==='string'&&Object.prototype.hasOwnProperty.call(LAYOUTS,value.layout)?value.layout:valid.layout;
  valid.caretStyle=['line','block','underline'].includes(value.caretStyle as string)?value.caretStyle as Preferences['caretStyle']:valid.caretStyle;
  valid.targetWpm=number('targetWpm',10,200);valid.fontSize=number('fontSize',18,40);valid.volume=number('volume',0,1);valid.dailyGoalMinutes=number('dailyGoalMinutes',1,120);
  for(const key of boolKeys)valid[key]=typeof value[key]==='boolean'?value[key] as boolean:valid[key];
  return valid;
}
export function validatePreferencePatch(input:unknown,current:Preferences):Partial<Preferences>{
  if(!input||typeof input!=='object'||Array.isArray(input))return {};
  const checked=validatePreferences({...current,...input});const patch:Partial<Preferences>={};
  for(const field of Object.keys(PREFERENCE_DEFAULTS) as Array<keyof Preferences>)if(Object.prototype.hasOwnProperty.call(input,field))Object.assign(patch,{[field]:checked[field]});
  return patch;
}
export function mergeCloudPreferences(local:PreferenceEnvelope,cloud:{preferences:unknown;version:number}):PreferenceEnvelope {
  return {...local,cloudVersion:cloud.version,values:validatePreferences({...validatePreferences(cloud.preferences),...local.pending})};
}
export function acknowledgePreferences(local:PreferenceEnvelope,sent:Partial<Preferences>,cloud:{preferences:unknown;version:number}):PreferenceEnvelope {
  const pending={...local.pending};
  for(const key of Object.keys(sent) as Array<keyof Preferences>)if(pending[key]===sent[key])delete pending[key];
  return {...local,cloudVersion:cloud.version,pending,values:validatePreferences({...validatePreferences(cloud.preferences),...pending})};
}
