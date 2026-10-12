import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('central dashboard contains live orders and audit panels',async()=>{
 const html=await readFile(new URL('./control.html',import.meta.url),'utf8');
 for(const id of ['summary','orders','events','email','password','all','pending','paid'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/We Do Care Global SaleCentar/);
});
test('dashboard escapes remote data via textContent',async()=>{
 const js=await readFile(new URL('./control.js',import.meta.url),'utf8');
 assert.match(js,/td\.textContent/);
 assert.doesNotMatch(js,/innerHTML/);
 assert.doesNotMatch(js,/localStorage|sessionStorage/);
});
test('admin overview is authenticated and aggregates entire database',async()=>{
 const server=await readFile(new URL('./server.mjs',import.meta.url),'utf8');
 assert.ok(server.indexOf("if(!await authorized(req,req.method===\'POST\'?\'admin\':\'viewer\'))")<server.indexOf("url.pathname==='/admin/overview'"));
 assert.match(server,/GROUP BY source,status,currency/);
 assert.match(server,/salecentar_payment_events ORDER BY created_at DESC/);
});
