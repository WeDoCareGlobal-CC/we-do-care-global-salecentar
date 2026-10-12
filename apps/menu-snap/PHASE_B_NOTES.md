# Phase B — initial safety patch

Changes:
- Missing Gemini configuration returns HTTP 503 instead of fabricated menu data or unrelated photos.
- Generic API errors avoid disclosing provider internals to clients.
- Port configurable via PORT environment variable.
- Health endpoint no longer reveals whether Gemini credentials are present.
- Request JSON limit reduced to 10 MB; basic input length/type checks added.

Important: NOT production-ready. AI endpoints remain unauthenticated and without per-user quotas. Database, image storage, tenant isolation, billing, automated tests and verified build remain outstanding. Do not expose publicly until authentication and usage controls are implemented.

This is a source-only patch; dependency installation and build were not executed.
