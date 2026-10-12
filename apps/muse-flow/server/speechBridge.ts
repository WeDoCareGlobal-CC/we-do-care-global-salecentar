import type {Request,Response} from 'express';

const MAX_TEXT=3000;
export function validateBridgeInput(value:unknown){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid request');
 const {text,voice} = value as {text?:unknown;voice?:unknown};
 if(typeof text!=='string'||!text.trim()||text.length>MAX_TEXT)throw Error('Invalid text');
 if(voice!==undefined && (typeof voice!=='string'||!['alloy','echo','fable','onyx','nova','shimmer'].includes(voice)))throw Error('Invalid voice');
 return {text:text.trim(),...(voice?{voice}:{})};
}
export async function speechBridge(req:Request,res:Response){
 let payload;
 try{payload=validateBridgeInput(req.body);}catch{return res.status(400).json({error:'Invalid speech request'});}
 const base=process.env.SPEECH_GENERATOR_URL;
 if(!base)return res.status(503).json({error:'Speech Generator is not configured'});
 const token=req.get('authorization');
 if(!token?.startsWith('Bearer '))return res.status(401).json({error:'Central login required'});
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),30000);
 try{
  const url=new URL('/api/speech',base);
  if(!['http:','https:'].includes(url.protocol))throw Error('Invalid speech service URL');
  const response=await fetch(url,{method:'POST',signal:controller.signal,headers:{authorization:token,'content-type':'application/json'},body:JSON.stringify(payload)});
  if(!response.ok){
   if([401,429].includes(response.status))return res.status(response.status).json({error:response.status===429?'Speech quota exceeded':'Session rejected'});
   return res.status(503).json({error:'Speech service unavailable'});
  }
  const contentType=response.headers.get('content-type')||'';
  if(!contentType.toLowerCase().startsWith('audio/mpeg'))throw Error('Unexpected audio response');
  const size=Number(response.headers.get('content-length')||0);
  if(size>10_000_000)throw Error('Audio too large');
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length>10_000_000)throw Error('Audio too large');
  res.setHeader('Content-Type','audio/mpeg');
  res.setHeader('Content-Disposition','attachment; filename="muse-flow-speech.mp3"');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(200).send(bytes);
 }catch{return res.status(503).json({error:'Speech service unavailable'});}
 finally{clearTimeout(timeout);}
}
