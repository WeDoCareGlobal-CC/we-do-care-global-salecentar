# We Do Care Global SaleCentar — stabilizacija 1–4

## Istraživanje i ograničenja
Ova revizija je zasnovana na lokalnoj arhivi `we-do-care-global-salecentar-zero-budget-intake-v2.zip`, ne na autentifikovanom GitHub pregledu. U ovom izvršavanju nije bio dostupan web/GitHub alat, pa se ne tvrdi da je obavljen live web research. Preporuke slijede poznate principe: najmanja ovlaštenja, provjerljivi statusi uplata, idempotentni upisi, HMAC s ograničenjem vremena i testovi nad stvarnom bazom.

## Izmjene
1. Centralni sync prihvata samo `pending` ili `cancelled` za Menu Snap, a samo `pending` za ZeroBudget AI. Izvor nikad ne može označiti narudžbu kao plaćenu. Plaćanje se potvrđuje odvojenim admin endpointom, uz obavezan dokaz/reference i audit događaj.
2. Svaki modul ima poseban HMAC ključ; zahtjev uključuje milisekundni timestamp koji je obuhvaćen potpisom. Vrijedi 5 minuta. TLS je obavezan van lokalnog razvoja. ID narudžbe je stabilan na nivou zapisa, dupli import je bez promjene statusa i finansijskih polja.
3. `/admin/orders` vraća paginirane stvarne redove i agregate iz cijele baze (ne samo zadnjih 500). `npm run dashboard` daje stvarni CLI pregled bez lažnih poslovnih metrika. React dashboard još NIJE spojen na ovaj API; uklonjeni su izmišljeni proizvodi i finansijske vrijednosti iz React prikaza.
4. Dodan CI za oba modula i SaleCentar, kao i PostgreSQL integracijski test koji se pokreće uz `SALECENTAR_TEST_DATABASE_URL`.

## API
- `POST /sync/menu-snap` i `/sync/zerobudget-ai`: `X-WDC-Timestamp` (Date.now() milisekunde), `X-WDC-Signature` = `sha256=` + HMAC-SHA256(secret, timestamp + '.' + rawBody)
- `GET /admin/orders?limit=50&offset=0&source=menu-snap` Bearer admin token
- `POST /admin/payments/verify` Bearer admin token, JSON: `source`, `order_id`, `status` (`paid`/`cancelled`/`refunded`), `reference` (najmanje 8 znakova)

## Nezavršeno — ne objavljivati kao produkciju
- Zajednički identitet/SSO za tri aplikacije. Trenutno su različiti sistemi autentifikacije. Nije bezbjedno obećati da je korak 2 potpuno riješen.
- React dashboard nije povezan na stvarni centralni API. CLI dashboard jeste.
- Potrebni su produkcijski payment webhook, provjera potpisa payment provajdera i usklađivanje sa bankom. Admin potvrda je samo pilot.
- PostgreSQL integracijski test treba izvršiti uz PostgreSQL i instaliran `pg`; samo statički/unit testovi su lokalno izvršeni.
- Buildovi oba modula, migracije, backup, deployment i GitHub push nisu potvrđeni.
- Replay unutar petominutnog prozora se neutralizira idempotentnim insertom; za visoko rizične operacije dodati trajnu nonce evidenciju.
- Svi pristupni ključevi samo u server-side env. Rotirati stare dijeljene ključeve. Ne izlagati admin token browseru.
- `SALECENTAR_HOST` po defaultu sluša samo na localhost; za mrežno izlaganje koristiti TLS reverse proxy i mrežna pravila.

## Pokretanje
`cd apps/salecentar/integration && npm install && npm test`
Konfiguriši varijable iz `.env.example`, pokreni PostgreSQL i `npm start`.
Za pregled baze: `SALECENTAR_ADMIN_TOKEN=... npm run dashboard`.
CI PostgreSQL test radi sa izolovanom test bazom.

## Redoslijed do Muse-Flow
1. Zatvoriti P0 sigurnost i reviziju statusa plaćanja — implementacija u ovom paketu.
2. Implementirati zajednički identity provider i RBAC — otvoreno.
3. Povezati React dashboard s backend proxyjem, bez slanja admin tokena u browser — otvoreno; CLI pregled spreman.
4. Pokrenuti PostgreSQL i CI, riješiti eventualne build greške, deployment staging — konfiguracija i test pripremljeni, nije potvrđeno.
5. Tek nakon toga pregledati izvorni kod Muse-Flow.
