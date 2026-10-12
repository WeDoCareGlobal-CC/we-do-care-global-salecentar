const MAX_CHARS=3000;
export function validateSpeech(body){
 if(!body||typeof body!=='object'||Array.isArray(body))throw Error('Invalid request');
 const {text,voice='alloy',format='mp3'}=body;
 if(typeof text!=='string'||!text.trim()||text.length>MAX_CHARS)throw Error('Text must contain 1-3000 characters');
 if(!['alloy','echo','fable','onyx','nova','shimmer'].includes(voice))throw Error('Unsupported voice');
 if(format!=='mp3')throw Error('Only mp3 is supported');
 return {text:text.trim(),voice,format};
}
export async function generateSpeech(input,{key=process.env.SPEECH_PROVIDER_API_KEY,endpoint=process.env.SPEECH_PROVIDER_URL||'https://api.openai.com/v1/audio/speech',model=process.env.SPEECH_PROVIDER_MODEL||'tts-1',fetcher=fetch}={}){
 if(!key)throw Error('Speech provider not configured');
 const url=new URL(endpoint);
 if(url.protocol!=='https:' && !(process.env.NODE_ENV!=='production'&&url.hostname==='127.0.0.1'))throw Error('HTTPS provider URL required');
 const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),30000);
 try{
  const r=await fetcher(url,{method:'POST',signal:ctrl.signal,headers:{'authorization':`Bearer ${key}`,'content-type':'application/json'},body:JSON.stringify({model,input:input.text,voice:input.voice,response_format:'mp3'})});
  if(!r.ok)throw Error('Speech provider request failed');
  const type=r.headers.get('content-type')||'';
  if(!type.includes('audio/')&&!type.includes('application/octet-stream'))throw Error('Provider did not return audio');
  const length=Number(r.headers.get('content-length')||0);
  if(length>12000000)throw Error('Audio exceeds size limit');
  const data=Buffer.from(await r.arrayBuffer());
  if(!data.length||data.length>12000000)throw Error('Invalid audio size');
  return data;
 }finally{clearTimeout(timer);}
}
