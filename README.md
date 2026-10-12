# We Do Care Global SaleCentar

**Status: razvojni pilot, nije produkcijski potvrđen.**

Centralna aplikacija: `apps/salecentar/` · Modul 1: `apps/menu-snap/` · Modul 2: `apps/zerobudget-ai/`.

**Aktuelne sigurnosne izmjene i testovi:** `docs/PHASE_B_REFINEMENT.md`.

# We Do Care Global SaleCentar

**Centralni repo** za WE DO CARE GLOBAL prodajni centar i proizvode. Trenutno je pridružen **samo Menu Snap**.

## Struktura

- `apps/salecentar/` — postojeći SaleCentar (AppDeploy React UI + AppDeploy SDK backend)
- `apps/menu-snap/` — Menu Snap, posljednja dostavljena Faza B implementacija (Express, React, PostgreSQL)
- `catalog/products.json` — katalog proizvoda; status pilot, ne produkcija
- `docs/INTEGRACIJA.md` — ugovor i sljedeći koraci integracije
- `docs/POKRETANJE.md` — lokalni razvoj i provjere
- `.github/workflows/` — odvojena statička provjera i build Menu Snap-a

## Važno

**Ovo je repozitorij spreman za GitHub upload, ne jedan gotov deploy.**
SaleCentar i Menu Snap su dvije odvojene aplikacije u jednom repozitoriju. Nisu automatski povezane.
SaleCentar koristi `@appdeploy/client` i `@appdeploy/sdk`, pa njegov runtime zavisi od AppDeploy okruženja.
U izvornom SaleCentar kodu postoje hardkodirani demo proizvodi i owner-only prijava; demo podaci nisu prihod.
Menu Snap naplata je ručna i SaleCentar eksport je JSON, bez stvarnog payment webhooka.
Nisu izvršeni produkcijski deploy, live naplata ni integracijski testovi.

## GitHub novi repo

1. U organizaciji `WeDoCareGlobal-CC` kreiraj **privatan** repo `we-do-care-global-salecentar`.
2. Raspakuj ZIP, uđi u korijenski direktorij i pokreni:
   ```
   git init
   git add .
   git commit -m "Initialize We Do Care Global SaleCentar with Menu Snap"
   git branch -M main
   git remote add origin https://github.com/WeDoCareGlobal-CC/we-do-care-global-salecentar.git
   git push -u origin main
   ```
3. **Prije push-a** pregledaj sve datoteke i provjeri da nisu uključene tajne ili lični podaci.
4. Ne uključuj javni deployment dok se ne prođu provjere iz `docs/POKRETANJE.md`.

Repo nije automatski kreiran na GitHubu: ovaj paket priprema lokalnu strukturu za upload.


## Drugi modul: ZeroBudget AI

`zerobudget-ai` je dodat u `catalog/products.json` sa statusom `source-pending` i vidljiv je u dashboard registru modula. `apps/zerobudget-ai/README.md` dokumentuje granicu: **izvorni kod privatnog repozitorija nije dostupan u ovoj arhivi**, pa funkcionalna integracija nije izvršena. Nema naplate, narudžbi ili AI ruta za ovaj modul.

## Drugi modul — stvarni kod

`apps/zerobudget-ai/` sada sadrži izvorni kod iz dostavljenog privatnog ZIP-a. AI ruta je zaštićena pilot tokenom i ima procesnu kvotu; nema zajedničke autentifikacije, naplate niti narudžbi. Detalji: `apps/zerobudget-ai/README.md`.


## ZeroBudget AI — centralni unos narudžbi (pilot)
Centralni integration servis sada prihvata `POST /sync/zerobudget-ai` sa istim HMAC `x-wdc-signature` formatom kao Menu Snap. Format: `{"format":"salecentar-pilot-v1","orders":[{"order_id":"UUID","customer_email":"kupac@example.org","offer_code":"ZERO_BUDGET_AI_DIGITAL_PACK","price_cents":2900,"currency":"EUR","status":"pending"}]}`. Iznos 2900 je **samo primjer payload-a**, nije konfigurirana prodajna cijena. Endpoint prihvata isključivo `pending`, ne dokazuje uplatu, ne šalje zahtjev automatski iz ZeroBudget AI interfejsa. Centralni upis je idempotentan po (source, source_order_id). Za test: `cd apps/salecentar/integration && npm test`. Za DB integraciju potreban je PostgreSQL i varijable iz integration/.env.example.


## v6 — Testovi i provjera PostgreSQL baze

Vidi `docs/BUILD_AND_POSTGRES_VERIFICATION_V6.md`. Novi test `apps/salecentar/integration/auth.db.integration.test.mjs` provjerava centralnu prijavu i odjavu na stvarnoj bazi kada je dostupna. Buildovi i baza nisu potvrđeni lokalno.


## v7 — release checks

See `docs/RELEASE_VERIFICATION_V7.md` for verified results, offline dependency limitations, and CI/PostgreSQL release gates. No production readiness is claimed.


## v8 — Muse-Flow kao treći modul

Dodana aplikacija `apps/muse-flow` iz korisničkog izvornog ZIP-a, centralna prijava i zaštita AI API-ja, katalog i CI. Detalji: `docs/MUSE_FLOW_INTEGRATION_V8.md`. Produkcijski build i PostgreSQL nisu lokalno potvrđeni.

## Hermes x402 Profit (v9)

Fourth standalone module: `apps/hermes-x402`. Financial endpoints hardened and settlement modes separated. See `docs/HERMES_INTEGRATION_V9.md`. No central revenue sync or live payment is enabled.


## v11 stabilizacija
Pokreni `node scripts/verify-config.mjs` i `node --test scripts/verify-config.test.mjs`. Detalji: `docs/V11_STABILIZATION.md`.


## v12 central finance
See `docs/V12_CENTRAL_FINANCE.md` for Hermes intake validation, strict replay matching, financial reporting classification and outstanding independent on-chain verification.

## v13 — Speech Generator pilot

Fifth module: `apps/speech-generator`. See `docs/V13_SPEECH_GENERATOR.md` for setup and limitations.


## v14 — Centralni pilot portal

Centralni servis poslužuje `/portal` s prijavom i registrom pet modula. Vidi `docs/V14_UNIFIED_PORTAL.md` za sigurnosne granice i nedovršene integracije.


## v15 release readiness
See `docs/V15_RELEASE_READINESS.md`. Run `node scripts/release-audit.mjs` for repository inventory and safety-gate coverage. A passing audit is not production certification.


## v16 End-to-End Pilot
Muse-Flow can now request Speech Generator MP3 through a protected backend bridge. See `docs/V16_END_TO_END_PILOT.md`. Full cross-service validation requires configured services and database.


## v17 — Module access and durable speech usage

See `docs/V17_ACCESS_AND_USAGE.md`. Speech Generator uses central PostgreSQL reservations and entitlement checks. Other module entitlement flags are informational pending enforcement.
