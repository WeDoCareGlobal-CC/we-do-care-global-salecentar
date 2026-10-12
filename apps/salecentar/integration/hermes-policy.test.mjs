import test from 'node:test';
import assert from 'node:assert/strict';
import {validateHermesSettlement,sameHermesSettlement,classifyHermesBalances} from './hermes-policy.mjs';
const base={network:'base-sepolia',tx_hash:'0x'+'a'.repeat(64),nonce:'abc',asset:'USDC',amount_atomic:'2000',payer:'0x123',pay_to:'0x456',resource:'/v1/keccak',settlement_mode:'facilitator_reported',source_created_at:null};
test('valid Hermes settlement',()=>assert.equal(validateHermesSettlement(base),true));
test('reject zero, leading zero, exponent and negative amounts',()=>{for(const amount_atomic of ['0','0002','2e4','-1','1.2',2])assert.equal(validateHermesSettlement({...base,amount_atomic}),false)});
test('reject fake mode and malformed hash',()=>{assert.equal(validateHermesSettlement({...base,settlement_mode:'confirmed'}),false);assert.equal(validateHermesSettlement({...base,tx_hash:'0xdead'}),false)});
test('replay checks full economic identity',()=>{assert.equal(sameHermesSettlement(base,{...base}),true);for(const k of ['payer','pay_to','resource','asset','settlement_mode','tx_hash','nonce'])assert.equal(sameHermesSettlement(base,{...base,[k]:'changed'}),false);assert.equal(sameHermesSettlement(base,{...base,amount_atomic:'2001'}),false)});
test('facilitator reports never classified as independently verified',()=>{const c=classifyHermesBalances([{settlement_mode:'facilitator_reported',amount_atomic:'2000'},{settlement_mode:'simulated',amount_atomic:'3000'}]);assert.equal(c.independently_verified.length,0);assert.equal(c.facilitator_reported.length,1);assert.equal(c.simulated.length,1)});
