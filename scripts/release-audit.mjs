import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const issues=[];
const required=['apps/salecentar/integration/server.mjs','apps/salecentar/integration/hermes-policy.mjs','apps/menu-snap/package.json','apps/zerobudget-ai/package.json','apps/muse-flow/package.json','apps/hermes-x402/requirements.txt','apps/speech-generator/package.json','.github/workflows/salecentar-quality.yml'];
for(const file of required)if(!existsSync(new URL(file,root)))issues.push('Missing '+file);
const server=read('apps/salecentar/integration/server.mjs');
for(const endpoint of ['/internal/auth/introspect','/sync/hermes','/admin/hermes/summary','/portal/api/me'])if(!server.includes(endpoint))issues.push('Missing API '+endpoint);
if(!server.includes('SALECENTAR_DATABASE_URL'))issues.push('Missing database config');
const workflow=read('.github/workflows/salecentar-quality.yml');
for(const name of ['integration-tests:','module-builds:','hermes-security-tests:','speech-generator-tests:'])if(!workflow.includes(name))issues.push('Missing CI job '+name);
for(const mod of ['menu-snap','zerobudget-ai','muse-flow','speech-generator']) {
 const pkg=JSON.parse(read(`apps/${mod}/package.json`));
 if(!pkg.scripts?.build)issues.push(`Missing build script ${mod}`);
}
const output={ok:issues.length===0,checks:required.length+4+1+4+4,issues};
console.log(JSON.stringify(output,null,2));
if(issues.length)process.exitCode=1;
