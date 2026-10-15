import type { SessionRecord } from './session-repository';
import type { SessionResult,SessionMetricValues } from '@/lib/typing-core/types';
export function sessionView(record:SessionRecord) {
  const candidate=record.candidate as SessionResult|undefined;
  const accepted=record.accepted as {metrics?:SessionMetricValues;comparisonKey?:string;eligibility?:{eligible:boolean;reasons?:string[]}}|undefined;
  const metrics=record.metricSummary??candidate?.metrics??accepted?.metrics;
  return {record,metrics,comparisonKey:record.comparisonKey??candidate?.comparisonKey??accepted?.comparisonKey??'legacy-unverified',isV3:record.payloadVersion==='forge-v3',wpm:metrics?metrics.wpm:record.summary.wpm,accuracy:metrics?metrics.inputAccuracy:record.summary.accuracy,personalBestEligible:record.personalBestEligible??candidate?.eligibility?.eligible??false,ranked:accepted?.eligibility?.eligible===true};
}
export function localDateKey(date:string|number) {const d=new Date(date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function cohortLabel(key:string) {
  if(key==='legacy-unverified')return 'Legacy metrics · personal history';
  try {const c=JSON.parse(key);return [c.mode,c.durationMs?`${c.durationMs/1000}s`:c.words?`${c.words} words`:null,c.language,c.layout,c.method,c.policy,c.punctuation?'punctuation':null,c.numbers?'numbers':null,c.repeated?'repeated':null].filter(Boolean).join(' · ');} catch{return key;}
}
export const metricLabel=(value:number|null|undefined,digits=1)=>value===null||value===undefined||!Number.isFinite(value)?'—':value.toFixed(digits);
