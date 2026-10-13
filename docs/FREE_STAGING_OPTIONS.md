# Besplatni staging — prijedlog (istraživanje 2026-10-13)

Cilj: pokrenuti **svih 8 servisa** (postgres, salecentar-integration, menu-snap,
zerobudget-ai, muse-flow, speech-generator, hermes-x402, nginx) kao staging
**bez ikakvih troškova**.

## Što stack traži (iz docker-compose.yml)

- Node 22 (Express serveri, stateless, HTTP)
- Python 3.11 (hermes-x402, FastAPI)
- PostgreSQL 16
- nginx reverse proxy
- ~2–4 GB RAM realno, ~5 GB disk za slike + baza

## Lokalni resursi (provjereno na ovom računalu)

| Resurs | Stanje |
|---|---|
| CPU | AMD Ryzen 5 3600, 6 jezgri — dovoljno |
| RAM | ~16 GB — dovoljno |
| C: disk | 32 GB slobodno (94% popunjeno — **uzeno**) |
| D: disk | 664 GB slobodno — **preporučeno za Docker podatke** |
| Virtualizacija | Omogućena u firmwareu (VM Monitor Extensions: Yes) |
| WSL2 | Ne startuje — „Virtual Machine Platform" Windows komponenta vjerovatno nije uključena (potvrda traži admin) |
| Docker Desktop | Instaliran, backend pada (0xffffffff) — uzrok: vjerovatno isti WSL2 problem |
| Native PostgreSQL 16.3 | **Već radi lokalno** (port 5432) — CI i svi testovi koriste ovo |

## Opcije — sortirane po preporuci

### 1. Oracle Cloud Always Free ⭐ PREPORUKA

- **2 Arm OCPU + 12 GB RAM + 200 GB disk**, besplatno **zauvijek** (ne kredit, ne trial)
- Puni VM: instaliraš Docker Engine, `docker compose up`, cijeli stack radi 24/7
- Kreditna kartica tražena **pri registraciji** (verifikacija), ali Always Free nikad ne naplaćuje
- Jedina opcija koja nosi 8 servisa non-stop bez ijednog dinara
- Slabosti: sam upravljaš OS/TLS/backup; capacity ponekad nedostupan u regionu

### 2. GitHub Codespaces (preko personal forka) ⭐ alternativa bez nove registracije

- **120 core-hours/mjesečno** na personal accountu (= 60 h na 2-jezgrenom), 15 GB storage
- **Docker-in-Docker radi** unutar codespacea — compose stack može u cijelosti
- **VAŽNO:** repo je pod org `WeDoCareGlobal-CC`, a org accounti **nemaju** besplatnu
  Codespaces kvotu → forkaj repo na svoj **personal** github account (`emirperla96-lab`
  ili `we-do-care-global` user account) i pokreni codespace ondje
- Idealan za **staging testove na zahtjev** (E2E, release gates), ne za 24/7
- Besplatno, bez kartice

### 3. Baza: Neon free (uz bilo koju gornju opciju)

- Pravi PostgreSQL 16, standard connection string (`postgres://...`) — naš `pg` driver radi direktno
- 0.5 GB storage, 100 CU-hours/mjesečno, scale-to-zero nakon 5 min, bez kartice
- Ako stack već ima VM (opcija 1), baza ostaje u njemu; Neon je fallback/za preview okruženja
- Alternativa: Supabase free (500 MB, pauzira nakon 1 sedmice)

### 4. Render / Koyeb / SnapDeploy — NE PREPORUČUJEM za ovaj stack

- Render: 750 h/mj, ali 512 MB po servisu i spavanje nakon 15 min → 8 servisa ne stane
- Koyeb: samo 1 besplatan servis; kartica obavezna (od 02/2026)
- SnapDeploy: 4 container × 512 MB, 100 h/mj — prezauzeto za 8 servisa
- Heroku / Fly.io: besplatni tierovi **ukinuti**

### 5. Cloudflare (Pages/Workers) — ne odgovara

- Već imaš skill (`cloudflare-deploy-fleet`) i aktivne Pages projekte — ali Workers
  ne izvršavaju Express servere ni PostgreSQL TCP konekcije. Nije fit za backend stack.

### 6. Lokalno: WSL2 — jedna admin komanda

- Virtualizacija JE uključena u BIOS-u. Nedostaje Windows komponenta. Kao admin:
  `dism /online /enable-feature /featurename:VirtualMachinePlatform /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart`
  pa restart → WSL2 + Docker Engine rade, cijeli stack lokalno na D: disku (664 GB slobodno)
- Ovo otkriva i **pravi uzrok Docker Desktop pada** — vrijedi uraditi bez obzira na odabir

## Konkretan prijedlog

**Faza 1 — odmah, bez troška i bez registracije (lokalno):**
Uključiti WSL2 (admin komanda gore) → Docker Engine → `docker compose up` s podacima
na D: disku. Cijeli stack + nginx lokalno. Ovo rješava i Docker problem iz v18.

**Faza 2 — staging „pravi", besplatan (Oracle Always Free):**
Registracija (kartica samo za verifikaciju) → VM 2 OCPU/12 GB → Docker Engine →
isti compose file → Neon za bazu ili postgres u VMu → Let's Encrypt TLS.
Cijeli stack 24/7, 0 €.

**Faza 3 — E2E testovi (Codespaces na personal forku):**
Za puštanje release gates: fork → codespace → compose → cross-module testovi.
Ne troši Oracle resurse.

## Blokeri koji traže tvoj korak

| Bloker | Tvoj korak |
|---|---|
| WSL2/Docker lokalno | Pokreni admin CMD s `dism` komandom gore + restart |
| Oracle staging | Registracija na cloud.oracle.com (kartica za verifikaciju, 0 naplate) |
| Codespaces | Fork repoa na personal account (org nema besplatnu kvotu) |
| GitHub Actions CI | i dalje BLOCKED — org free plan, private repo (vidi docs/CI_BLOCKED.md) |

## Sažetak odluke

| Opcija | Cijena | 24/7 | Cijeli stack | Napora |
|---|---|---|---|---|
| Oracle Always Free | 0 € | Da | Da | Srednji (VM ops) |
| Codespaces (fork) | 0 € | Ne (60 h/mj) | Da (Docker-in-Docker) | Malo |
| Lokalni WSL2 | 0 € | Samo dok računalo radi | Da | Malo (1 admin cmd) |
| Neon free (baza) | 0 € | Scale-to-zero | Samo baza | Minimalno |
