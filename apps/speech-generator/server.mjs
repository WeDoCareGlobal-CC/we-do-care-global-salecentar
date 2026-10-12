import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {validateSpeech,generateSpeech} from './speech.mjs';
const PORT=Number(process.env.PORT||3013);
const AUTH_URL=process.env.SALECENTAR_AUTH_URL;
const SECRET=process.env.SALECENTAR_SPEECH_GENERATOR_SECRET;
async function usageAction(path,data){
 if(!AUTH_URL||!SECRET||SECRET.length<32)throw Error('Usage service not configured');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4000);
 try{
  const r=await fetch(new URL(path,AUTH_URL),{method:'POST',signal:controller.signal,headers:{'content-type':'application/json','x-salecentar-service-key':SECRET},body:JSON.stringify(data)});
  if(!r.ok){const error=await r.json().catch(()=>({}));return {ok:false,status:r.status,error:error.error||'Usage service rejected request'};}
  return {ok:true,data:await r.json()};
 }finally{clearTimeout(timer);}
}

const json=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data));};
async function authenticate(req){
 if(!AUTH_URL||!SECRET||SECRET.length<32)throw Error('Auth not configured');
 const token=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{32,})$/)?.[1];
 if(!token)return null;
 const url=new URL('/internal/auth/introspect',AUTH_URL);
 const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),4000);
 try{
  const r=await fetch(url,{method:'POST',signal:ctrl.signal,headers:{'content-type':'application/json','x-salecentar-module':'speech-generator','x-salecentar-service-key':SECRET},body:JSON.stringify({token})});
  if(r.status===401)return null;
  if(!r.ok)throw Error('Auth service unavailable');
  const data=await r.json();
  return data.active&&['admin','viewer'].includes(data.user?.role)?data.user:null;
 }finally{clearTimeout(timer);}
}
export function createServer({auth=authenticate,synthesize=generateSpeech,usage=usageAction}={}){
 return http.createServer(async(req,res)=>{
  if(req.url==='/health'&&req.method==='GET')return json(res,200,{ok:true,module:'speech-generator',providerConfigured:!!process.env.SPEECH_PROVIDER_API_KEY});
  if(req.url!=='/api/speech'||req.method!=='POST')return json(res,404,{error:'Not found'});
  let user;
  try{user=await auth(req);}catch{return json(res,503,{error:'Authentication unavailable'});}
  if(!user)return json(res,401,{error:'SaleCentar session required'});
  let raw='';
  try{
   for await(const chunk of req){raw+=chunk;if(raw.length>16000)return json(res,413,{error:'Request too large'});}
   const input=validateSpeech(JSON.parse(raw));
   const requestId=randomUUID();
   const token=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{32,})$/)?.[1];
   const reserved=await usage('/internal/speech/usage/reserve',{token,request_id:requestId,characters:input.text.length});
   if(!reserved.ok)return json(res,[401,403,409,429].includes(reserved.status)?reserved.status:503,{error:reserved.error});
   let audio;
   try{
    audio=await synthesize(input);
   }catch(e){
    await usage('/internal/speech/usage/finish',{request_id:requestId,status:'failed'}).catch(()=>{});
    throw e;
   }
   const finished=await usage('/internal/speech/usage/finish',{request_id:requestId,status:'succeeded'});
   if(!finished.ok)return json(res,503,{error:'Usage confirmation unavailable'});
   res.writeHead(200,{'content-type':'audio/mpeg','content-disposition':'attachment; filename="speech.mp3"','cache-control':'no-store','x-content-type-options':'nosniff'});
   return res.end(audio);
  }catch(e){
   if(e instanceof SyntaxError||e.message.startsWith('Invalid request')||e.message.startsWith('Text must')||e.message.startsWith('Unsupported')||e.message.startsWith('Only mp3'))return json(res,400,{error:'Invalid speech request'});
   return json(res,503,{error:'Speech provider unavailable'});
  }
 });
}
if(import.meta.url===new URL(`file://${process.argv[1]}`).href)createServer().listen(PORT,'0.0.0.0',()=>console.log(`Speech Generator listening on ${PORT}`));
