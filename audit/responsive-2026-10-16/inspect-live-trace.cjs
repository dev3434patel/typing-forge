const fs=require('fs');const p='audit/responsive-2026-10-16/artifacts/.playwright-artifacts-0/traces/973d642d79b98c4f8bd6-c213526c530884993c17-recording10.trace';
const data=fs.readFileSync(p,'utf8').trim().split('\n').map(x=>JSON.parse(x));
const before=new Map(data.filter(x=>x.type==='before').map(x=>[x.callId,x]));
for(const x of data.filter(x=>['before','after','log'].includes(x.type)).slice(-70)){
const b=before.get(x.callId);if(x.type==='before')console.log(JSON.stringify({type:x.type,time:x.startTime,id:x.callId,method:x.method,params:x.params}));
else if(x.type==='after')console.log(JSON.stringify({type:x.type,time:x.endTime,id:x.callId,method:b?.method,error:x.error,result:x.result}));
else console.log(JSON.stringify(x));
}
