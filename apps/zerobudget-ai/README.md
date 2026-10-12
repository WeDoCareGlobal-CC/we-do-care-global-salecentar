# ZeroBudget AI — drugi modul We Do Care Global SaleCentar

Izvorni kod preuzet iz dostavljene arhive `zerobudget-ai-main.zip` i ugrađen u `apps/zerobudget-ai/`.

## Pilot zaštita
`POST /api/generate-custom` zahtijeva `Authorization: Bearer <ZERO_BUDGET_AI_TOKEN>`.
Token se unosi u modal i ostaje u React memoriji, ne u localStorage. Bez server tokena servis odbija start.
Ograničenje zahtjeva je **u memoriji procesa** i nije produkcijska kontrola troška.
Bez Gemini ključa nema generisanog sadržaja niti izmišljenog fallback audita.

## Pokretanje
Instalirati zavisnosti unutar foldera, podesiti varijable iz `.env.example` u privatnom `.env` i pokrenuti `npm run dev`. Ne commitovati `.env`.

## Granice integracije
Modul je fizički u monorepu i registrovan u katalogu. SaleCentar autentifikacija, centralna naplata, centralne narudžbe i shared database još **nisu povezani**. Demo kalkulatori u UI-u nisu potvrđeni stvarni poslovni rezultati.
