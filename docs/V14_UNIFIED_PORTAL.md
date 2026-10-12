# v14 — Jedinstveni korisnički portal (pilot)

## Implementirano
- `/portal` je responzivni HTML/CSS/JS portal poslužen iz centralnog SaleCentar integration servisa.
- Koristi `POST /auth/login` i `POST /auth/logout` s postojećim centralnim korisnicima i sesijama.
- `GET /portal/api/me` i `GET /portal/api/modules` zahtijevaju aktivan Bearer token; validacija se radi preko PostgreSQL `sc_sessions`.
- Moduli se čitaju iz centralnog `catalog/products.json`; prikaz je informativan i ne tvrdi da postoje aktivne pretplate.
- Token se čuva samo u memoriji otvorene stranice (ne u localStorage), pa refresh zahtijeva novu prijavu.
- Sadržaj kataloga se ubacuje pomoću `textContent`, a ne `innerHTML`; portal ima CSP i `no-store` zaglavlja.

## Pokretanje
Pokrenuti postojeći centralni integration server uz PostgreSQL i potrebne tajne, zatim otvoriti `http://127.0.0.1:3101/portal` (ako se koristi podrazumijevani port). Centralni korisnički račun mora već biti kreiran.

## Nije implementirano
- Ne postoji entitlements/pretplatnički model niti jedinstvena korisnička navigacija sa stvarnim URL-ovima svih modula.
- Nema automatskog prosljeđivanja centralne sesije između različitih origin-a (nema OIDC).
- Muse-Flow → Speech Generator TTS poziv nije povezan. Oba servisa zahtijevaju zasebnu konfiguraciju i sigurnosni pregled.
- Pristup pilot portalu trenutno imaju i `admin` i `viewer` korisnici; to nije javni customer portal.
- PostgreSQL E2E i produkcijski buildovi nisu provjereni lokalno.

## Provjera
`node --check server.mjs`, `node --check portal.js`, `npm test` u `apps/salecentar/integration`: 31 passed, 2 skipped (DB), 0 failed.
