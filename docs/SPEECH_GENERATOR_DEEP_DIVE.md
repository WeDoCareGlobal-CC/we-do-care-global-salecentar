# Speech Generator Backend — source review

Source archive: `speech-generator-backend-main.zip`, 9 ZIP entries including directories.

## What exists
- Node CommonJS Express 4 backend, `server.js`, `package.json` and npm lockfile.
- GET `/health` returns status and timestamp; GET `/` returns a descriptive JSON object.
- GET `/demo` returns a static HTML demo with a Vercel Analytics injection wrapper.
- `render.yaml` configures Render Frankfurt, free plan, port 10000, and variables naming Ollama (`gemma4:26b`), Paddle, Resend and Gemini.
- GitHub Actions workflow runs `npx webpack` on Node 18/20/22 despite no webpack dependency or build script.

## What is absent
No text-to-speech endpoint, no speech model call, no audio output, no audio storage, no voice selection, no user auth, no usage limits, no billing implementation, no tests. The `test` script exits with error by design. `OLLAMA_URL=http://localhost:11434` assumes a local Ollama process; Render deployment does not define one. Analytics integration is designed for Vercel but deployment target is Render.

## Recommended role in We Do Care Global SaleCentar
Potential fifth module **Speech Generator** for text-to-speech and audio generation, but this ZIP is a scaffold, not a working speech generator. Keep it in incubation rather than list it as a live paid product.

## Suggested implementation stages
1. Define real speech provider and output format, supported languages, limits and licensing; add `POST /api/speech` with authenticated input validation.
2. Integrate SaleCentar central staff auth, per-user quotas and explicit provider cost limits.
3. Add durable job storage, private audio files with expiry, audit logs and deletion policy.
4. Add central catalog entry with `pilot-not-production`, integration tests and working CI.
5. Optionally use Hermes x402 only for separately exposed agent-to-agent speech API calls after independently verified settlement; do not conflate with regular SaleCentar orders.

## Risks
No proof of working TTS, provider support, payment collection or production readiness. A large local model on a free Render instance may be impractical. Audio content, personal data and payment secrets need appropriate access controls. No provider pricing or capabilities were independently verified.
