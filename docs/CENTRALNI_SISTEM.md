# We Do Care Global SaleCentar — centralni operativni sistem

## Šta je dodano
Centralni dashboard `/control` servira se iz istog Node procesa kao PostgreSQL API. Prikazuje stvarne narudžbe, ukupne brojeve iz cijele baze, agregate po statusu/valuti/modulu i posljednjih 25 promjena statusa uplate. Prikaz nema izmišljene prihode niti automatsku potvrdu uplate.

## Pokretanje
U `apps/salecentar/integration` postavi konfiguraciju prema `.env.example` u okruženju, instaliraj `npm install`, pokreni PostgreSQL i `npm start`. Otvori `http://127.0.0.1:3101/control` lokalno. Admin token unesi u formular. Token se koristi samo u memoriji browser stranice; ne sprema se u localStorage. Ne stavljaj token u URL.

## Sigurnosne granice
`/control` je servisiran bez prijave ali API podaci zahtijevaju Bearer token. Po defaultu server sluša isključivo na 127.0.0.1. Ako treba udaljeni pristup, koristi privatnu mrežu ili HTTPS reverse proxy uz dodatnu autentifikaciju. Nemoj izlagati HTTP API ili token na javnoj mreži. Token je i dalje privremena autentifikacija, nije zajednički identitet/SSO.

## Ograničenja
Stvarni PostgreSQL integracijski test nije izvršen u ovoj sesiji. Centralni React AppDeploy dashboard i dalje koristi vlastitu prijavu i nije povezan s ovim kontrolnim ekranom. Izvještaj o potvrđenim uplatama zasniva se na ručno verifikovanim statusima, ne na bankovnom/PSP webhook dokazu. Novi kontrolni ekran ne uvodi automatsku naplatu ni deployment.

## Testovi
`npm test` u `apps/salecentar/integration` pokreće unit i statičke provjere; DB test zahtijeva `SALECENTAR_TEST_DATABASE_URL`. `node --check server.mjs` i `node --check control.js` provjeravaju sintaksu.
