// Operator-only live ledger view. Keep SALECENTAR_ADMIN_TOKEN server-side.
const token=process.env.SALECENTAR_ADMIN_TOKEN;
const base=process.env.SALECENTAR_ADMIN_URL||'http://127.0.0.1:3101';
if(!token)throw Error('Set SALECENTAR_ADMIN_TOKEN');
const response=await fetch(new URL('/admin/orders?limit=50',base),{headers:{authorization:`Bearer ${token}`}});
if(!response.ok)throw Error(`Ledger API returned ${response.status}`);
const data=await response.json();
console.log('We Do Care Global SaleCentar — live database snapshot');
console.table(data.summary.map(x=>({module:x.source,status:x.status,currency:x.currency,orders:x.count,total:(Number(x.total_cents)/100).toFixed(2)})));
console.log('Latest orders (page 1):');
console.table(data.orders.map(x=>({module:x.source,id:x.source_order_id,status:x.status,amount:(x.price_cents/100).toFixed(2),currency:x.currency})));
console.log('Amounts are recorded order values, not independently reconciled bank balances.');
