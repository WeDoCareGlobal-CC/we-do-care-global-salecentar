import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
export function checkRelease(rootDir){
 const failures=[];
 const read=p=>readFileSync(resolve(rootDir,p),'utf8');
 const workflow=read('.github/workflows/salecentar-quality.yml');
 const central=read('apps/salecentar/integration/package.json');
 const tests=JSON.parse(central).scripts?.test||'';
 for(const test of ['db.integration.test.mjs','auth.db.integration.test.mjs','hermes-policy.test.mjs'])
  if(!tests.includes(test))failures.push(`Missing integration test: ${test}`);
 for(const marker of ['postgres:16','SALECENTAR_REQUIRE_DB_TESTS','hermes-security-tests','speech-generator-tests','module-builds'])
  if(!workflow.includes(marker))failures.push(`Missing CI gate: ${marker}`);
 for(const mod of ['menu-snap','zerobudget-ai','muse-flow','hermes-x402','speech-generator'])
  if(!existsSync(resolve(rootDir,'apps',mod)))failures.push(`Missing module: ${mod}`);
 for(const file of ['docs/V15_RELEASE_RUNBOOK.md','scripts/backup-postgres.sh','scripts/restore-postgres.sh'])
  if(!existsSync(resolve(rootDir,file)))failures.push(`Missing release artifact: ${file}`);
 return failures;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename)){
 const failures=checkRelease(root);
 for(const f of failures)console.error('FAIL:',f);
 if(failures.length)process.exitCode=1;
 else console.log('Release structure gate passed (not a deployment verification).');
}
