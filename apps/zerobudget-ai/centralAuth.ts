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
