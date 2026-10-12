# SaleCentar kao glava; Menu Snap kao prvi proizvod

## Trenutno stanje

- SaleCentar (`apps/salecentar`) ima AppDeploy owner-only API i **statičke demo proizvode**.
- Menu Snap (`apps/menu-snap`) ima vlastiti Express API i PostgreSQL bazu, autentifikaciju i pilot narudžbe prema prethodnoj isporuci.
- Menu Snap nudi admin JSON export na `GET /api/admin/salecentar-export`.
- SaleCentar još **nema implementiran importer** tog exporta niti dijeljenu korisničku sesiju.
- Zato zajednički GitHub repo **ne znači** integrisan poslovni sistem.

## Predložena prva veza (bez lažne naplate)

1. U SaleCentar katalogu prikazati Menu Snap kao uslugu, bez automatskog statusa 'paid'.
2. Menu Snap vodi stvarnu narudžbu i stanje odobrenja.
3. Administrator provjerava uplatu izvan aplikacije i zatim evidentira potvrdu.
4. Admin izvozi JSON iz Menu Snap-a i validira ga prije uvoza u SaleCentar.
5. SaleCentar evidentira vanjski `order_id`, izvor, `verified_at` i status; duplikate odbija po `(source, order_id)`.
6. Kasnije uvesti server-to-server integraciju s potpisanim događajima, replay zaštitom i idempotency.

## Pravila

- Nikada ne slati admin bearer token, DB password, Gemini ključ ili AppDeploy credential u frontend ili Git.
- Ne poistovjećivati `demo`, `pending`, `paid` i `refunded`.
- Ne dijeliti jednu bazu ili autentifikaciju samo zato što su aplikacije u monorepu.
- Prije automatske naplate potrebni su odabran payment provider, potpis webhooka i reconciliation.
- Pri dodavanju novih proizvoda: novi `apps/<slug>/` i zapis u `catalog/products.json`; integracija se testira zasebno.
