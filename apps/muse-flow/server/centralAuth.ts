import type {Request,Response,NextFunction} from 'express';
const base=process.env.SALECENTAR_AUTH_URL;
const secret=process.env.SALECENTAR_MUSE_FLOW_SECRET;
export async function centralLogin(email:string,password:string){
 if(!base||!secret||secret.length<32)throw Error('Central auth not configured');
 const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),4000);
 try{
  const r=await fetch(new URL('/auth/login',base),{method:'POST',signal:ctrl.signal,
   headers:{'content-type':'application/json'},body:JSON.stringify({email,password})});
  if(r.status===401)return null;
  if(!r.ok)throw Error('Central login unavailable');
  return await r.json();
 }finally{clearTimeout(timer);}
}
export async function requireCentralSession(req:Request,res:Response,next:NextFunction){
 if(!base||!secret||secret.length<32)return res.status(503).json({error:'Central auth not configured'});
 const token=req.get('authorization')?.match(/^Bearer ([A-Za-z0-9_-]{32,})$/)?.[1];
 if(!token)return res.status(401).json({error:'SaleCentar login required'});
 const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),4000);
 try{
  const r=await fetch(new URL('/internal/auth/introspect',base),{
   method:'POST',signal:ctrl.signal,
   headers:{'content-type':'application/json','x-salecentar-module':'muse-flow',
    'x-salecentar-service-key':secret},body:JSON.stringify({token})
  });
  if(!r.ok)return res.status(r.status===401?401:503).json({error:'Central session rejected'});
  const data=await r.json();
  if(!data.active||!['admin','viewer'].includes(data.user?.role))
   return res.status(401).json({error:'Central session rejected'});
  res.locals.centralUser=data.user;
  next();
 }catch{return res.status(503).json({error:'Central authentication unavailable'});}
 finally{clearTimeout(timer);}
}
export async function centralLogout(req:Request,res:Response){
 if(!base)return res.status(503).json({error:'Central auth not configured'});
 try{
  const r=await fetch(new URL('/auth/logout',base),{method:'POST',
   headers:{authorization:req.get('authorization')||''}});
  return res.status(r.ok?200:503).json({ok:r.ok});
 }catch{return res.status(503).json({error:'Central logout unavailable'});}
}
