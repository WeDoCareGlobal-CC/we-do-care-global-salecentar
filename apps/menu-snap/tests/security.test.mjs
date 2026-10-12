import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(name)=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('AI routes protected after auth and persistent quota',()=>{
 const server=read('server.ts'), routes=read('server/routes.ts');
 assert.match(server,/installRoutes\(app\)/);
 assert.match(server,/aiQuota\)/);
 assert.ok(server.indexOf('installRoutes(app)')<server.indexOf('aiQuota);'));
 assert.match(routes,/ON CONFLICT\(user_id,day\)/);
 assert.match(routes,/WHERE ai_usage.used<\$2/);
});
test('tenant isolation for menus and images',()=>{
 const r=read('server/routes.ts');
 assert.match(r,/FROM menus WHERE id=\$1 AND user_id=\$2/);
 assert.match(r,/UPDATE menus SET payload=\$1,approved=false,updated_at=now\(\) WHERE id=\$2 AND user_id=\$3/);
 assert.match(r,/FROM images WHERE id=\$1 AND user_id=\$2/);
});
test('no fabricated Gemini results and manual payment verification',()=>{
 const s=read('server.ts'),r=read('server/routes.ts');
 assert.doesNotMatch(s,/picsum\.photos/i);
 assert.match(s,/AI service is not configured/);
 assert.match(r,/status='paid'/);
 assert.match(r,/externalReference/);
 assert.match(r,/WHERE id=\$3 AND status='pending'/);
});
test('production configuration and scripts',()=>{
 const s=read('server.ts'),pkg=JSON.parse(read('package.json'));
 assert.match(s,/DATABASE_URL is required/);
 assert.match(s,/ADMIN_BOOTSTRAP_KEY/);
 assert.ok(pkg.dependencies.pg);
 assert.ok(pkg.scripts.build);
});
