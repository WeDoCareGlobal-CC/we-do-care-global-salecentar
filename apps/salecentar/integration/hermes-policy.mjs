// Hermes settlement intake policy: facilitator reports are NOT chain-verified revenue.
export const MODES = Object.freeze(['simulated','unverified','facilitator_reported']);
export function validateHermesSettlement(x) {
 if (!x || typeof x !== 'object' || Array.isArray(x)) return false;
 const fields=['network','asset','payer','pay_to','resource','nonce','tx_hash'];
 if (!fields.every(k=>typeof x[k]==='string' && x[k].length>0 && x[k].length<=256)) return false;
 if (!/^0x[a-fA-F0-9]{64}$/.test(x.tx_hash)) return false;
 if (typeof x.amount_atomic!=='string'|| !/^[1-9][0-9]{0,77}$/.test(x.amount_atomic)) return false;
 if (!MODES.includes(x.settlement_mode)) return false;
 if (x.source_created_at!=null && (typeof x.source_created_at!=='string'||!Number.isFinite(Date.parse(x.source_created_at)))) return false;
 return true;
}
export function sameHermesSettlement(a,b) {
 return ['network','nonce','tx_hash','asset','payer','pay_to','resource','settlement_mode'].every(k=>a[k]===b[k]) &&
 BigInt(a.amount_atomic)===BigInt(b.amount_atomic);
}
export function classifyHermesBalances(rows) {
 return {facilitator_reported:rows.filter(x=>x.settlement_mode==='facilitator_reported'),
 simulated:rows.filter(x=>x.settlement_mode==='simulated'),
 unverified:rows.filter(x=>x.settlement_mode==='unverified'),
 independently_verified:[],notice:'No independent on-chain verification is implemented; facilitator reports are not recognized as independently verified revenue.'};
}
