import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const required=[
 ['apps/salecentar/integration/.env.example',['SALECENTAR_DATABASE_URL','SALECENTAR_MENU_SNAP_SECRET','SALECENTAR_ZERO_BUDGET_SECRET','SALECENTAR_MUSE_FLOW_SECRET','SALECENTAR_HERMES_SECRET']],
 ['apps/hermes-x402/.env.example',['HERMES_ADMIN_API_KEY','X402_SETTLE_MODE','X402_NETWORK']],
];
export function inspectTemplate(text,keys){
 const vars=new Map();
 for(const line of text.split(/\r?\n/)){
  const match=line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=(.*)$/);
  if(match) vars.set(match[1],match[2].trim());
 }
 return keys.filter(k=>!vars.has(k));
}
export function validateRuntime(env){
 const errors=[];
 if(env.NODE_ENV==='production' && env.SALECENTAR_ALLOW_LEGACY_ADMIN==='true') errors.push('Legacy admin token cannot be enabled in production');
 if(env.NODE_ENV==='production' && env.X402_SETTLE_MODE==='simulate' && env.X402_HOST!=='127.0.0.1' && env.X402_HOST!=='localhost') errors.push('Public simulation must not run in production');
 const secrets=['SALECENTAR_MENU_SNAP_SECRET','SALECENTAR_ZERO_BUDGET_SECRET','SALECENTAR_MUSE_FLOW_SECRET','SALECENTAR_HERMES_SECRET'];
 const provided=secrets.filter(k=>env[k]).map(k=>[k,env[k]]);
 for(const [k,v] of provided) if(v.length<32) errors.push(`${k} must be at least 32 characters`);
 if(new Set(provided.map(([,v])=>v)).size!==provided.length) errors.push('Service secrets must be distinct');
 return errors;
}
if(process.argv[1] && resolve(process.argv[1])===resolve(import.meta.filename)){
 let failed=false;
 for(const [file,keys] of required){
  if(!existsSync(resolve(root,file))){console.error('MISSING',file);failed=true;continue;}
  const missing=inspectTemplate(readFileSync(resolve(root,file),'utf8'),keys);
  if(missing.length){console.error('MISSING KEYS',file,missing.join(', '));failed=true;}
  else console.log('OK',file);
 }
 const errors=validateRuntime(process.env);
 for(const e of errors){console.error('UNSAFE CONFIG',e);failed=true;}
 process.exitCode=failed?1:0;
}
