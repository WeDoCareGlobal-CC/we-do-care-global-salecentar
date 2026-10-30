import test from 'node:test';
import assert from 'node:assert/strict';
import {SHOPIFY_GRANT_DDL} from './shopify-grant-tx.mjs';
import {readFile} from 'node:fs/promises';

test('new Shopify grants are deleted with their SaleCentar user',()=>{
  assert.match(SHOPIFY_GRANT_DDL,/CREATE TABLE IF NOT EXISTS sc_shopify_grants[\s\S]*?user_id UUID NOT NULL REFERENCES sc_users\(id\) ON DELETE CASCADE/);
});
test('legacy grants foreign key is migrated without requiring destructive table recreation',()=>{
  assert.match(SHOPIFY_GRANT_DDL,/pg_constraint/);
  assert.match(SHOPIFY_GRANT_DDL,/confdeltype <> 'c'/);
  assert.match(SHOPIFY_GRANT_DDL,/ALTER TABLE sc_shopify_grants ADD CONSTRAINT sc_shopify_grants_user_id_fkey[\s\S]*?ON DELETE CASCADE/);
});
test('user deletion retains existing admin authorization and removes user',async()=>{
  const source=await readFile(new URL('./server.mjs',import.meta.url),'utf8');
  assert.match(source,/if\(req\.method==='DELETE'&&url\.pathname\.startsWith\('\/admin\/users\/'\)\)/);
  assert.match(source,/DELETE FROM sc_users WHERE id=\$1/);
});
