# v13 — Speech Generator pilot

Fifth module at `apps/speech-generator`. Real HTTP endpoint `POST /api/speech` accepts `{text,voice,format:'mp3'}` and returns audio/mpeg from a configured OpenAI-compatible TTS provider. Requires a SaleCentar bearer session; the central integration server must have the matching `SALECENTAR_SPEECH_GENERATOR_SECRET` (32+ characters). `GET /health` reports whether the provider key is present without disclosing it.

This is a **provider-dependent pilot**, not verified live speech generation. Set `SPEECH_PROVIDER_API_KEY` and a compatible HTTPS endpoint. No provider credentials are shipped. Request validation caps text at 3,000 characters and returned audio at 12 MB. 30-second provider timeout. A 20-attempt daily per-user quota is kept **in memory** and is not reliable across processes/restarts; deploy behind a single process only for pilot testing. There is no billing, persistent audio storage, or Muse-Flow UI integration yet. Do not advertise this as production-ready.

Tests mock the provider; no real synthesis or central PostgreSQL authentication was tested locally.
