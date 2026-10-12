import test from 'node:test';import assert from 'node:assert/strict';
import {validateSpeech,generateSpeech} from './speech.mjs';
import {createServer} from './server.mjs';
test('rejects empty or long text and unsupported voices',()=>{for(const input of [{text:''},{text:'a'.repeat(3001)},{text:'hello',voice:'bad'}])assert.throws(()=>validateSpeech(input));});
test('validates text and default voice',()=>assert.deepEqual(validateSpeech({text:' Hi '}),{text:'Hi',voice:'alloy',format:'mp3'}));
test('provider returns audio with mocked HTTPS response',async()=>{const b=await generateSpeech({text:'Hi',voice:'alloy'},{key:'test',fetcher:async()=>new Response(Buffer.from('mp3'),{headers:{'content-type':'audio/mpeg'}})});assert.equal(b.toString(),'mp3');});
test('provider rejects non-audio',async()=>{await assert.rejects(generateSpeech({text:'Hi',voice:'alloy'},{key:'test',fetcher:async()=>new Response('oops',{headers:{'content-type':'application/json'}})}));});
test('API requires central session and returns audio for authorized user',async()=>{const server=createServer({auth:async(req)=>req.headers.authorization?{id:'test-user',role:'viewer'}:null,synthesize:async()=>Buffer.from('audio'),usage:async()=>({ok:true})});await new Promise(r=>server.listen(0,'127.0.0.1',r));try{const base=`http://127.0.0.1:${server.address().port}`;assert.equal((await fetch(base+'/api/speech',{method:'POST'})).status,401);const r=await fetch(base+'/api/speech',{method:'POST',headers:{authorization:'Bearer fake','content-type':'application/json'},body:JSON.stringify({text:'Hello'})});assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'audio/mpeg');assert.equal(await r.text(),'audio');}finally{server.close();}});

test('usage denial blocks TTS before provider invocation',async()=>{
 let calls=0;const server=createServer({auth:async()=>({id:'u',role:'viewer'}),usage:async()=>({ok:false,status:403,error:'Speech access not granted'}),synthesize:async()=>{calls++;return Buffer.from('audio');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const r=await fetch(`http://127.0.0.1:${server.address().port}/api/speech`,{method:'POST',headers:{authorization:'Bearer token','content-type':'application/json'},body:JSON.stringify({text:'Hello'})});assert.equal(r.status,403);assert.equal(calls,0);}
 finally{server.close();}
});
test('successful speech records reserved and succeeded events',async()=>{
 const events=[];const server=createServer({auth:async()=>({id:'u',role:'viewer'}),usage:async(path,data)=>{events.push({path,data});return {ok:true};},synthesize:async()=>Buffer.from('audio')});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const r=await fetch(`http://127.0.0.1:${server.address().port}/api/speech`,{method:'POST',headers:{authorization:'Bearer token','content-type':'application/json'},body:JSON.stringify({text:'Hello'})});assert.equal(r.status,200);assert.equal(events.length,2);assert.equal(events[0].data.request_id,events[1].data.request_id);assert.equal(events[1].data.status,'succeeded');}
 finally{server.close();}
});
