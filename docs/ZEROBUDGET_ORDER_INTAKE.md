# We Do Care Global SaleCentar — ZeroBudget AI pilot narudžbe

## Šta je implementirano
ZeroBudget AI ima vlasnički obrazac za evidenciju narudžbe. Browser šalje email i pilot token ZeroBudget backendu (`POST /api/pilot-order`). Backend kreira UUID, uzima cijenu iz `ZERO_BUDGET_PACK_PRICE_CENTS`, postavlja `pending` i HMAC-potpisan zahtjev šalje na `SALECENTAR_SYNC_URL`. Tajna potpisa nikada nije u browseru. SaleCentar koristi postojeću PostgreSQL tabelu `salecentar_orders`.

## Konfiguracija
1. Pokrenuti PostgreSQL i SaleCentar integration server (`apps/salecentar/integration`) sa `SALECENTAR_DATABASE_URL`, `SALECENTAR_ADMIN_TOKEN` i `SALECENTAR_SYNC_SECRET`.
2. U ZeroBudget AI serveru postaviti `ZERO_BUDGET_AI_TOKEN`, `SALECENTAR_SYNC_URL`, **isti** `SALECENTAR_SYNC_SECRET` i `ZERO_BUDGET_PACK_PRICE_CENTS`.
3. Ne commitovati `.env`. Ograničiti mrežni pristup integration serveru.
4. Cijena 2900 centi u `.env.example` je ilustrativna pilot postavka, ne potvrđena javna ponuda.

## Ograničenja
- Samo ovlašteni operater unosi narudžbe; nije checkout za javne kupce.
- Nema automatskog plaćanja niti provjere uplate. Status je uvijek `pending`.
- Nema potvrđenog PostgreSQL end-to-end testa u ovom okruženju.
- Ako mreža prekine nakon upisa, ponovno slanje može kreirati drugu narudžbu. Za produkciju uvesti klijentski idempotency key i status lookup.
- Token pristup i cijene trebaju migraciju na centralnu autentifikaciju i katalog prije javnog lansiranja.
- HMAC ključ je zajednički s Menu Snap modulom; preporuka je odvojeni ključ po modulu.
