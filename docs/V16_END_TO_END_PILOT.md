# v16 — End-to-End Pilot (partial, testable integration)

## Delivered
- Muse-Flow has a new Listen / Download MP3 action using selected text or up to 3000 characters of the current draft.
- The action calls the Muse-Flow backend, not Speech Generator directly. It uses the existing central in-memory session token.
- Muse-Flow exposes `POST /api/integrations/speech` behind `requireCentralSession`; the bridge forwards the same bearer token to Speech Generator, which independently introspects it against SaleCentar.
- Audio is returned as MP3 and downloaded in the browser. The backend validates inputs, enforces a 30-second timeout, rejects non-audio responses, limits response to 10 MB and does not log tokens or user text.
- Configure `SPEECH_GENERATOR_URL` on the Muse-Flow server and `SALECENTAR_AUTH_URL`, `SALECENTAR_SPEECH_GENERATOR_SECRET`, and `SPEECH_PROVIDER_API_KEY` on Speech Generator.

## Limitations / next pilot gate
- A working speech provider key and central PostgreSQL database are required for a true cross-service end-to-end test.
- No billing, entitlements, permanent quota storage, shared usage history or independent blockchain verification has been added.
- The UI truncates long drafts to 3000 characters; the server rejects requests over 3000 characters.
- The Muse-Flow token remains in browser memory; users must log in again after reload according to existing session handling.
- Full frontend compilation was not performed where npm dependencies are unavailable.
- Hermes settlement remains separate from Speech Generator pilot usage.

## Manual E2E acceptance
1. Start SaleCentar integration with PostgreSQL, create a user and log in to Muse-Flow.
2. Start Speech Generator with a valid provider key and the matching central module secret.
3. Set `SPEECH_GENERATOR_URL` in Muse-Flow, restart the server.
4. Select text in editor, click Listen / Download MP3; verify playable audio is downloaded.
5. Verify missing/expired token gives 401, invalid text gives 400, unavailable provider gives 503, quota exhaustion gives 429.
6. Check that private keys and raw tokens are not exposed in browser responses or logs.
