import React,{useState} from 'react';
import App from './App';
import {getSessionToken,setSessionToken} from './services/session';

export default function LoginGate(){
 const [signedIn,setSignedIn]=useState(Boolean(getSessionToken()));
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 async function login(event:React.FormEvent){
  event.preventDefault();setBusy(true);setError('');
  try{
   const response=await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({email,password})});
   const body=await response.json();
   if(!response.ok||typeof body.token!=='string')throw Error(body.error||'Login failed');
   setSessionToken(body.token);setPassword('');setSignedIn(true);
  }catch(e){setError(e instanceof Error?e.message:'Login failed');}
  finally{setBusy(false);}
 }
 async function logout(){
  const token=getSessionToken();setSessionToken('');setSignedIn(false);
  try{await fetch('/api/auth/logout',{method:'POST',headers:{Authorization:`Bearer ${token}`}});}
  catch{setError('Local session cleared; central revocation not confirmed');}
 }
 if(signedIn)return <><div style={{display:'flex',justifyContent:'space-between',padding:'8px 16px',background:'#172033',color:'#fff',fontFamily:'system-ui'}}>
  <span>We Do Care Global SaleCentar · Muse-Flow</span>
  <button onClick={logout} style={{background:'#fff',color:'#172033',padding:'4px 12px',borderRadius:6}}>Sign out</button>
 </div><App/></>;
 return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#0f172a',color:'#f8fafc',fontFamily:'system-ui'}}>
  <form onSubmit={login} style={{width:'min(420px,90vw)',display:'grid',gap:14,padding:32,background:'#1e293b',borderRadius:14}}>
   <h1 style={{fontSize:24,fontWeight:700}}>Muse-Flow</h1>
   <p>Sign in with your We Do Care Global SaleCentar account.</p>
   <label>Email<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} style={{display:'block',width:'100%',color:'#111',padding:10,borderRadius:6}}/></label>
   <label>Password<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} style={{display:'block',width:'100%',color:'#111',padding:10,borderRadius:6}}/></label>
   <button disabled={busy} type="submit" style={{background:'#38bdf8',color:'#082f49',padding:12,borderRadius:6,fontWeight:700}}>{busy?'Signing in...':'Sign in'}</button>
   {error&&<p role="alert" style={{color:'#fda4af'}}>{error}</p>}
  </form>
 </main>;
}
