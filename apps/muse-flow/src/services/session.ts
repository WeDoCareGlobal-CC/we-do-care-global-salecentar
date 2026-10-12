let sessionToken='';
export function getSessionToken(){return sessionToken;}
export function setSessionToken(token:string){sessionToken=token;}
export async function authenticatedFetch(url:string,options:RequestInit={}){
 const token=getSessionToken();
 if(!token)throw new Error('Sign in to We Do Care Global SaleCentar first');
 return fetch(url,{...options,headers:{...Object.fromEntries(new Headers(options.headers).entries()),Authorization:`Bearer ${token}`}});
}
