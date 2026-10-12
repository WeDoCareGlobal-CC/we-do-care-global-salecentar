// Credentials remain only in JS memory.
let token='',offset=0;const limit=50;
const $=id=>document.getElementById(id);
const cell=(tr,value)=>{const td=document.createElement('td');td.textContent=String(value??'—');tr.append(td)};
const money=(cents,currency)=>{const n=Number(cents);return Number.isSafeInteger(n)?new Intl.NumberFormat('bs-BA',{style:'currency',currency:currency||'EUR'}).format(n/100):'—'};
async function api(path){const r=await fetch(path,{headers:{Authorization:'Bearer '+token},cache:'no-store'});if(!r.ok)throw Error(r.status===401?'Sesija je istekla; prijavi se ponovo':'API greška '+r.status);return r.json()}
function renderRows(id,rows,mapper){const body=$(id);body.replaceChildren();for(const item of rows){const tr=document.createElement('tr');mapper(item).forEach(value=>cell(tr,value));body.append(tr)}if(!rows.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=8;td.textContent='Nema zapisa';tr.append(td);body.append(tr)}}
async function load(){
 try{
  $('error').textContent='';
  const [overview,orders]=await Promise.all([api('/admin/overview'),api('/admin/orders?limit='+limit+'&offset='+offset+($('source').value?'&source='+encodeURIComponent($('source').value):''))]);
  $('all').textContent=overview.totals.total_orders;$('pending').textContent=overview.totals.pending_orders;$('paid').textContent=overview.totals.paid_orders;
  renderRows('summary',overview.summary,x=>[x.source,x.status,x.currency,x.count,money(x.total_cents,x.currency)]);
  renderRows('orders',orders.orders,x=>[x.source,x.source_order_id,x.customer_email,x.offer_code,money(x.price_cents,x.currency),x.status,new Date(x.updated_at).toLocaleString('bs-BA')]);
  renderRows('events',overview.recentPaymentEvents,x=>[x.source,x.source_order_id,x.old_status+' → '+x.new_status,x.reference,new Date(x.created_at).toLocaleString('bs-BA')]);
  $('page').textContent='Prikaz '+(offset+1)+'–'+(offset+orders.orders.length);$('next').disabled=orders.orders.length<limit;$('previous').disabled=offset===0;
 }catch(e){$('error').textContent=e.message}
}
$('load').addEventListener('click',async()=>{
 try{
  $('error').textContent='';
  const email=$('email').value.trim(),password=$('password').value;
  const r=await fetch('/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password}),cache:'no-store'});
  $('password').value='';
  if(!r.ok)throw Error('Neuspješna prijava');
  token=(await r.json()).token;offset=0;await load();
 }catch(e){$('error').textContent=e.message}
});
$('logout').addEventListener('click',()=>{
 const old=token;token='';$('password').value='';
 if(old)fetch('/auth/logout',{method:'POST',headers:{Authorization:'Bearer '+old}}).catch(()=>{});
 for(const id of ['summary','orders','events'])$(id).replaceChildren();
 for(const id of ['all','pending','paid'])$(id).textContent='—';
 $('error').textContent='Odjavljeni ste';
});
$('source').addEventListener('change',()=>{offset=0;if(token)load()});
$('previous').addEventListener('click',()=>{offset=Math.max(0,offset-limit);if(token)load()});
$('next').addEventListener('click',()=>{offset+=limit;if(token)load()});
