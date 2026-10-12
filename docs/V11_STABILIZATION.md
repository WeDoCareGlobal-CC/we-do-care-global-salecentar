# v11 — Stabilizacija We Do Care Global SaleCentra

## Urađeno
- Provjera prisustva ključnih env varijabli za SaleCentar i Hermes, bez čitanja ili objavljivanja stvarnih tajni.
- Provjere za prekratke/ponovljene service secrets, produkcijski legacy admin i javno izloženu simulaciju.
- Dopunjeni primjer centralnog env fajla za Muse-Flow i Hermes.
- CI sada pokreće modul-specifične testove gdje postoje i eksplicitno zahtijeva PostgreSQL testnu konfiguraciju.
- Testovi provjera konfiguracije dodani u CI.

## Provjereno lokalno
- `node scripts/verify-config.mjs` — OK
- `node --test scripts/verify-config.test.mjs` — 5 prošlo
- `cd apps/salecentar/integration && npm test` — 26 prošlo, 2 preskočena (PostgreSQL)
- Nisu izvršeni kompletni npm buildovi, stvarna PostgreSQL integracija ni blockchain settlement.

## GitHub Actions
`.github/workflows/salecentar-quality.yml` postavlja PostgreSQL 16 i `SALECENTAR_REQUIRE_DB_TESTS=true`.
Testni proces sada prekida rad ako je baza obavezna, a URL nije postavljen.
Ovo nije zamjena za pregled rezultata stvarnog CI izvršavanja.

## Preostali rad prije v12
- Izvršiti GitHub Actions i popraviti eventualne TypeScript/build/test greške.
- Potvrditi Hermes sync protiv PostgreSQL i provjeriti integritet settlement dokaza.
- Dodati stvarni deployment smoke test za svaki servis.
- Izvršiti sigurnosni pregled autentifikacije i finansijskih ruta.
