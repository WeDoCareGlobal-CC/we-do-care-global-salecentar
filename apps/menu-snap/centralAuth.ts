// Internal SaleCentar session verification. Service credentials stay on backend.
export async function centralIdentity(token: string, moduleName: 'menu-snap'|'zerobudget-ai') {
  const base=process.env.SALECENTAR_AUTH_URL;
  const secret=moduleName==='menu-snap'?process.env.SALECENTAR_MENU_SNAP_SECRET:process.env.SALECENTAR_ZERO_BUDGET_SECRET;
  if(!base||!secret||secret.length<32) return null;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),4000);
  try {
    const response=await fetch(new URL('/internal/auth/introspect',base),{
      method:'POST',signal:controller.signal,
      headers:{'content-type':'application/json','x-salecentar-module':moduleName,'x-salecentar-service-key':secret},
      body:JSON.stringify({token})
    });
    if(!response.ok)return null;
    const result=await response.json();
    const u=result?.user;
    if(!result.active||typeof u?.id!=='string'||typeof u?.email!=='string'||!['admin','viewer'].includes(u.role))return null;
    return {id:u.id as string,email:u.email as string,role:u.role as 'admin'|'viewer'};
  } finally {clearTimeout(timeout);}
}

// Check if a central user has entitlement for a specific module
export async function checkCentralEntitlement(userId: string, moduleId: string): Promise<boolean> {
  const base=process.env.SALECENTAR_AUTH_URL;
  const secret=moduleId==='menu-snap'?process.env.SALECENTAR_MENU_SNAP_SECRET:
             moduleId==='zerobudget-ai'?process.env.SALECENTAR_ZERO_BUDGET_SECRET:
             moduleId==='muse-flow'?process.env.SALECENTAR_MUSE_FLOW_SECRET:
             moduleId==='speech-generator'?process.env.SALECENTAR_SPEECH_GENERATOR_SECRET:
             moduleId==='hermes-x402'?process.env.SALECENTAR_HERMES_SECRET:
             null;
  if(!base||!secret||secret.length<32) return false;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),4000);
  try {
    const response=await fetch(new URL('/internal/auth/entitlement',base),{
      method:'POST',signal:controller.signal,
      headers:{'content-type':'application/json','x-salecentar-module':moduleId,'x-salecentar-service-key':secret},
      body:JSON.stringify({user_id:userId})
    });
    if(!response.ok)return false;
    const result=await response.json();
    return result.enabled===true;
  } finally {clearTimeout(timeout);}
}

export async function centralLogin(email:string,password:string) {
 const base=process.env.SALECENTAR_AUTH_URL;
 if(!base)throw new Error('Central authentication is not configured');
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),4000);
 try {
  const response=await fetch(new URL('/auth/login',base),{
   method:'POST',signal:controller.signal,headers:{'content-type':'application/json'},
   body:JSON.stringify({email,password})
  });
  if(!response.ok)return null;
  return await response.json() as {token:string;role:string};
 }finally{clearTimeout(timeout);}
}
