# Lokalni razvoj i verifikacija

## Menu Snap

Potrebni Node 22+, PostgreSQL 15+ i privatni Gemini ključ. U `apps/menu-snap`:

```sh
cp .env.example .env
# upiši svoje vrijednosti SAMO lokalno
npm install
npm run lint
npm test
npm run build
npm start
```

Detalji bootstrap admin naloga i konfiguracije su u `apps/menu-snap/PHASE_B_IMPLEMENTATION.md`.
Ne objavljivati dok se ne provjere negativni auth testovi, baze, kvote, backup i export.

## SaleCentar

`apps/salecentar` koristi AppDeploy SDK i klijentski runtime. Pokretati u podržanom AppDeploy okruženju; običan Vite build bez platformskih paketa može pasti. Demo proizvodi i komisije su primjeri, ne potvrđeni prihodi.

## Kriteriji prije spajanja u produkciju

- `npm run lint`, `npm test`, `npm run build` uspješni uz instalirane zavisnosti
- PostgreSQL integracijski testovi, autorizacija između korisnika i migracije
- AI limiti provjereni pri paralelnim zahtjevima
- JSON import/export ugovor i idempotency testovi
- stvarni payment receipt i jasna evidencija refundacije
- odvojeni deployment i tajne za svaku aplikaciju
