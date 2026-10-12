// Pilot session is held in memory; refresh requires login. Never place credentials in source or localStorage.
let sessionToken: string | null = null;
export function setSessionToken(token: string | null) { sessionToken=token; }
export function ownerHeaders(): Record<string,string> {
 if (!sessionToken) throw new Error('Please log in first.');
 return {Authorization:`Bearer ${sessionToken}`};
}
export function clearOwnerToken() { sessionToken=null; }
