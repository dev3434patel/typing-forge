export const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
export function json(body: unknown,status=200) { return new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}}); }
export async function boundedBody(request: Request,limit=2_000_000) {
  const reader=request.body?.getReader(); if(!reader) throw new Error('Request body is required.');
  const chunks:Uint8Array[]=[]; let size=0;
  for(;;) {const {done,value}=await reader.read();if(done) break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new Error('Payload exceeds 2 MB.');}chunks.push(value);}
  const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}
  return JSON.parse(new TextDecoder().decode(all));
}
