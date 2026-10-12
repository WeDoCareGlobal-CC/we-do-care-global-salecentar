import { ToolRequirement, AIPromptItem, ScriptItem, WorkflowNode } from '../types';

export interface AffiliateTier {
  category: { en: string; bs: string };
  payoutType: { en: string; bs: string };
  commissionRate: { en: string; bs: string };
  avgPayoutPerSale: { en: string; bs: string };
  examplePrograms: string[];
  bestFor: { en: string; bs: string };
}

export const AFFILIATE_COMPARISON = {
  modelName: {
    en: 'Niche AI & SaaS Affiliate Recommendation Agent',
    bs: 'AI Agens za Preporuku Nišnih SaaS i AI Alata (Affiliate Marketing)'
  },
  whyItWins: {
    en: 'Unlike agency models, you do NOT have client meetings, fulfillment deadlines, customer disputes, or churn headaches. You create automated high-intent problem-solving assets that recommend proven software solutions and earn 30% to 50% recurring monthly commissions forever.',
    bs: 'Za razliku od agencijskih modela, OVDJE NEMA sastanaka s klijentima na Zoomu, rokova isporuke, žalbi ili tehničke podrške. Kreirate automatizovane sadržaje koji rješavaju konkretan problem, preporučuju provjeren softver i donose 30% do 50% ponavljajuće mjesečne provizije (MRR) zauvijek.'
  },
  speedToFirst100: {
    en: '4 to 7 Days (Only 2 to 3 software signups needed, or 1 high-ticket bounty)',
    bs: '4 do 7 Dana (Potrebne samo 2 do 3 pretplate na softver ili 1 veća provizija)'
  },
  scalabilityTo5k: {
    en: '$5,000+/mo achievable with 125 active recurring users ($40/mo commission each)',
    bs: '$5.000+/mjesečno dostižno sa 125 aktivnih pretplatnika ($40/mj provizija po korisniku)'
  },
  techBarrier: {
    en: 'Zero Coding ($0 free no-code stack)',
    bs: 'Nula Programiranja ($0 besplatni no-code alati)'
  }
};

export const AFFILIATE_TIERS: AffiliateTier[] = [
  {
    category: { en: 'Tier 1: B2B AI & Automation Tools', bs: 'Kategorija 1: B2B AI i Alati za Automatizaciju' },
    payoutType: { en: 'Monthly Recurring (MRR)', bs: 'Mjesečno Ponavljajuća (MRR)' },
    commissionRate: { en: '30% - 40% Lifetime', bs: '30% - 40% Doživotno' },
    avgPayoutPerSale: { en: '$15 - $45 / month per user', bs: '$15 - $45 / mjesečno po korisniku' },
    examplePrograms: ['Make.com (Partner)', 'Notion AI', 'ElevenLabs', 'Descript', 'Jasper AI', 'Claude Team / Cursor Tools'],
    bestFor: { en: 'Fastest compounding passive income to $5,000/mo', bs: 'Najbrži rast do stabilnih $5.000/mj pasivnog prihoda' }
  },
  {
    category: { en: 'Tier 2: All-in-One Business Operating Systems', bs: 'Kategorija 2: Poslovne Platforme Sve-U-Jednom' },
    payoutType: { en: 'High Monthly Recurring', bs: 'Visoka Mjesečna Ponavljajuća' },
    commissionRate: { en: '40% Recurring', bs: '40% Ponavljajuća' },
    avgPayoutPerSale: { en: '$39 - $118 / month per user', bs: '$39 - $118 / mjesečno po korisniku' },
    examplePrograms: ['GoHighLevel ($97-$297/mo plans)', 'Systeme.io (Free to paid)', 'Stan Store ($29/mo)'],
    bestFor: { en: 'Fastest route to first $100 with just 1 or 2 conversions', bs: 'Najbrži put do prvih $100 uz samo 1 do 2 konverzije' }
  },
  {
    category: { en: 'Tier 3: Enterprise & Freelance Platforms', bs: 'Kategorija 3: Korporativne i Freelance Platforme' },
    payoutType: { en: 'One-Time High Bounty', bs: 'Jednokratna Visoka Isplata' },
    commissionRate: { en: 'Flat Bounty / 100% 1st Month', bs: 'Fiksna Isplata / 100% prvog mjeseca' },
    avgPayoutPerSale: { en: '$100 - $300 per activated account', bs: '$100 - $300 po aktiviranom nalogu' },
    examplePrograms: ['Shopify ($150 bounty)', 'Webflow ($100-$300)', 'Semrush ($200 per sale + $10 trial)'],
    bestFor: { en: 'Instant cash injections within 7 days', bs: 'Brza injekcija gotovine u roku od 7 dana' }
  }
];

export const AFFILIATE_TOOL_STACK: ToolRequirement[] = [
  {
    name: 'Make.com',
    role: {
      en: 'AI Automation Engine: Scrapes trending questions, feeds to Gemini, auto-updates content table',
      bs: 'AI Motor Automatizacije: Prati trendove, prosljeđuje u Gemini i ažurira bazu sadržaja'
    },
    cost: { en: '$0 / Free Plan', bs: '$0 / Besplatno' },
    freeTierLimit: { en: '1,000 free operations/month (plenty for 10-15 daily actions)', bs: '1.000 besplatnih operacija mjesečno' },
    url: 'https://www.make.com',
    badge: 'Core Engine'
  },
  {
    name: 'Airtable',
    role: {
      en: 'Affiliate Knowledge Hub & Content Matrix (Stores programs, links, hooks, and drafts)',
      bs: 'Baza Znanja i Matrica Sadržaja (Čuva programe, linkove, naslove i skripte)'
    },
    cost: { en: '$0 / Free Tier', bs: '$0 / Besplatni paket' },
    freeTierLimit: { en: '1,000 records per base with rich fields and webhooks', bs: '1.000 zapisa po bazi sa webhook podrškom' },
    url: 'https://airtable.com',
    badge: 'Data & Tracking'
  },
  {
    name: 'Google Gemini 2.5 Flash / ChatGPT',
    role: {
      en: 'High-Intent Content & Problem-Solving Generator (Creates comparison guides, scripts, bridge copy)',
      bs: 'Generator Sadržaja s Visokom Namjerom Kupovine (Poređenja alata, skripte, landing tekst)'
    },
    cost: { en: '$0 / Free API & Free Web', bs: '$0 Besplatan API i Web' },
    freeTierLimit: { en: 'Generous free daily limits (15 requests/minute)', bs: '15 zahtjeva po minuti besplatno' },
    url: 'https://ai.google.dev',
    badge: 'AI Engine'
  },
  {
    name: 'Carrd.co / Tally.so / Notion',
    role: {
      en: 'Zero-Cost Bridge Page & Free Resource Download Hub (Hosts the affiliate recommendation)',
      bs: 'Besplatna Bridge Stranica i Hub za Preuzimanje (Sadrži preporuku i affiliate link)'
    },
    cost: { en: '$0 / Free Plans', bs: '$0 / Besplatni nalozi' },
    freeTierLimit: { en: 'Unlimited submissions on Tally; free core pages on Carrd/Notion', bs: 'Neograničene prijave na Tally; besplatno na Carrd/Notion' },
    url: 'https://tally.so',
    badge: 'Bridge Page'
  },
  {
    name: 'Reddit / YouTube Shorts / LinkedIn',
    role: {
      en: '100% Free Organic Distribution (Delivers laser-targeted buyers searching for solutions)',
      bs: '100% Besplatna Organska Distribucija (Dovodi kupce koji aktivno traže rješenje)'
    },
    cost: { en: '$0 / Organic', bs: '$0 / Organski domet' },
    freeTierLimit: { en: 'Unlimited free organic reach', bs: 'Neograničen besplatan doseg' },
    url: 'https://reddit.com',
    badge: 'Traffic Source'
  }
];

export const AFFILIATE_PROMPTS: AIPromptItem[] = [
  {
    id: 'aff_prompt_discovery',
    title: {
      en: 'Prompt #1: Niche & High-Paying Recurring Affiliate Program Discovery',
      bs: 'Prompt #1: Pronalaženje Visokoplaćenih Ponavljajućih Affiliate Programa'
    },
    toolTarget: 'ChatGPT Free / Gemini 2.5 Flash / Make.com',
    purpose: {
      en: 'Identifies software with high customer retention (>85%), generous recurring commissions (30%+), and low competition search volume.',
      bs: 'Identifikuje softvere sa visokim zadržavanjem korisnika (>85%), ponavljajućom provizijom (30%+) i niskom konkurencijom.'
    },
    inputsNeeded: {
      en: ['Target Industry (e.g., Solo Creators, Real Estate, E-commerce)', 'Problem to Solve'],
      bs: ['Ciljna Industrija (npr. Samostalni kreatori, Nekretnine, E-trgovina)', 'Problem koji se rješava']
    },
    promptText: {
      en: `Act as a senior B2B SaaS Growth and Affiliate Marketing Strategist.
I am building a zero-budget automated AI affiliate recommendation engine targeting the niche: "{{Target_Niche}}".

Generate a structured analysis of the top 3 SaaS tools in this niche that meet ALL these strict criteria:
1. Offers an official affiliate program paying at least 30% RECURRING monthly commissions OR a minimum $100 bounty.
2. Solves a painful daily bottleneck (saving at least 5 hours/week for the user).
3. Has a free trial or freemium tier (to make user conversion frictionless).
4. Low churn rate / high software stickiness.

For each tool, provide:
- Tool Name & Primary URL
- Affiliate Platform (e.g. PartnerStack, FirstPromoter, Rewardful, In-house)
- Commission Rate & Estimated MRR per 10 active referrals
- The #1 Urgent Pain Point it solves
- Top 3 "High Buyer Intent" search keywords (e.g., "Alternative to X", "How to automate Y without code")

Output as a clean markdown table followed by a 1-sentence verdict on which tool to prioritize for my first $100 within 7 days.`,
      bs: `Djeluj kao viši B2B SaaS strategist za rast i affiliate marketing.
Gradim automatizovani sistem za preporuku softvera bez početnog budžeta za nišu: "{{Target_Niche}}".

Generiši strukturiranu analizu 3 najbolja SaaS alata u ovoj niši koji ispunjavaju SVE ove stroge kriterije:
1. Imaju zvanični affiliate program sa najmanje 30% PONAVLJAJUĆE mjesečne provizije ILI minimalno $100 fiksne isplate.
2. Rješavaju bolan svakodnevni problem (štedeći korisniku bar 5 sati sedmično).
3. Imaju besplatni probni period (free trial) ili freemium verziju za laku konverziju.
4. Visoko zadržavanje korisnika (niska stopa odustajanja).

Za svaki alat navedi:
- Naziv alata i web stranicu
- Affiliate platformu (npr. PartnerStack, FirstPromoter, Rewardful)
- Stopu provizije i procijenjenu mjesečnu zaradu za 10 korisnika
- Glavni problem koji rješava
- Top 3 ključne riječi s visokom namjerom kupovine (npr. "Alternativa za X", "Kako automatizovati Y bez koda")

Prikaži u obliku pregledne tabele i završi s 1 rečenicom preporuke koji alat donosi prvih $100 u roku od 7 dana.`
    }
  },
  {
    id: 'aff_prompt_review_article',
    title: {
      en: 'Prompt #2: High-Intent "Problem-Solver" & Comparison Article Generator',
      bs: 'Prompt #2: Generator Članka Poređenja i Rješavanja Problema (SEO Namjera)'
    },
    toolTarget: 'Make.com Gemini Node / Medium / Substack / Blog',
    purpose: {
      en: 'Creates a deep, unbiased-sounding problem-solving guide that ranks organically or can be shared in communities, embedding natural affiliate recommendation links.',
      bs: 'Kreira objektivan, temeljit vodič za rješavanje problema koji se organski rangira ili dijeli u zajednicama s prirodno ugrađenim affiliate linkom.'
    },
    inputsNeeded: {
      en: ['Recommended Software', 'Alternative/Competitor', 'Specific Workflow/Pain Point'],
      bs: ['Preporučeni Softver', 'Alternativa/Konkurent', 'Specifičan Workflow/Problem']
    },
    promptText: {
      en: `Write a high-converting, honest, and in-depth problem-solving tutorial titled:
"How to Solve {{Pain_Point}} in Under 15 Minutes (Without Coding or Expensive Tools)"

Include a direct comparison between:
- Tool A (The Recommended Affiliate Tool): {{Recommended_Tool}}
- Tool B (The Traditional / Expensive Alternative): {{Competitor_Tool}}

Structure the article:
1. THE BRUTAL REALITY: Why most {{Target_Audience}} waste 10+ hours a week doing this manually.
2. THE 3-STEP AUTOMATED SYSTEM: Step-by-step walkthrough of how {{Recommended_Tool}} automates this workflow.
3. FEATURE-BY-FEATURE HEAD-TO-HEAD COMPARISON:
   - Price & Free Trial Availability
   - Time to Setup
   - Ease of Use (1-10)
   - Real-world results
4. THE FINAL VERDICT: Who should choose {{Recommended_Tool}} and who should choose {{Competitor_Tool}}.
5. THE EXCLUSIVE BONUS OFFER: Offer a free downloadable template/checklist if they sign up via the provided link.
6. MANDATORY FTC DISCLOSURE: Include a transparent, friendly 1-sentence affiliate disclosure at top and bottom.

Tone: Unbiased, practitioner-level, highly actionable, zero marketing fluff. Word count: 800 - 1,200 words.`,
      bs: `Napiši visoko-konvertujući, objektivan i detaljan tutorijal za rješavanje problema s naslovom:
"Kako riješiti {{Pain_Point}} za manje od 15 minuta (Bez programiranja i skupih alata)"

Uključi direktno poređenje:
- Alat A (Preporučeni Affiliate Alat): {{Recommended_Tool}}
- Alat B (Tradicionalna / Skupa Alternativa): {{Competitor_Tool}}

Struktura članka:
1. SUROVA REALNOST: Zašto većina {{Target_Audience}} gubi 10+ sati sedmično radeći ovo ručno.
2. AUTOMATIZOVANI SISTEM U 3 KORAKA: Korak-po-korak uputstvo kako {{Recommended_Tool}} automatizuje ovaj proces.
3. DIREKTNA TABELA POREĐENJA:
   - Cijena i besplatni probni period
   - Vrijeme podešavanja
   - Lakoća korištenja (1-10)
   - Konkretni rezultati
4. ZAKLJUČAK: Za koga je idealan {{Recommended_Tool}}, a za koga {{Competitor_Tool}}.
5. EKSKLUZIVNI BONUS: Ponuda besplatnog šablona/kontrolne liste ako se registruju preko navedenog linka.
6. ZAKONSKA NAPOMENA: Transparentna i prijateljska napomena o affiliate linku na vrhu i dnu teksta.

Ton: Stručan, praktičan, direktan, bez praznih marketinških fraza. Dužina: 800 - 1.200 riječi.`
    }
  },
  {
    id: 'aff_prompt_short_video',
    title: {
      en: 'Prompt #3: Viral 60-Second Short-Form Video Script & Hook Generator',
      bs: 'Prompt #3: Skripta za 60-Sekundni Viralni Video (TikTok / YouTube Shorts)'
    },
    toolTarget: 'CapCut / Loom / YouTube Shorts / TikTok',
    purpose: {
      en: 'Generates scroll-stopping 60-second video scripts that reveal an "insane AI cheat-code workflow" and drive viewers to the link in bio for the free template.',
      bs: 'Kreira video skripte od 60 sekundi koje demonstriraju nevjerovatan AI trik i usmjeravaju gledaoce na link u opisu profila.'
    },
    inputsNeeded: {
      en: ['Software Feature', 'Specific Time-Saving Metric', 'Free Template Name'],
      bs: ['Funkcija Softvera', 'Ušteda Vremena (npr. 8 sati u 2 minute)', 'Naziv Besplatnog Šablona']
    },
    promptText: {
      en: `Generate 3 viral short-form video scripts (for YouTube Shorts, Instagram Reels, and TikTok) promoting {{Recommended_Tool}}.

Goal: Drive viewers to the link in bio to get the free {{Free_Template_Name}} workflow template (which contains our affiliate link).

Format for each script (under 60 seconds / 130 words):
- [0:00 - 0:03] THE HOOK (Visual + Text-on-Screen + Spoken): A pattern-interrupt statement that stops scrolling (e.g. "Stop wasting 4 hours doing X manually...").
- [0:03 - 0:15] THE AGITATION: Show the painful manual way on screen.
- [0:15 - 0:45] THE "AHA!" MOMENT: Screen recording demonstration of {{Recommended_Tool}} completing the entire job in 2 clicks.
- [0:45 - 0:60] CALL TO ACTION: "I put the exact free automation template and link in my bio. Grab it before the free tier ends."

Provide 3 distinct hook variations:
1. The Negative Warning Hook
2. The "Secret Hack Nobody Talks About" Hook
3. The Before vs After Speed Test Hook`,
      bs: `Generiši 3 viralne kratke video skripte (za YouTube Shorts, Instagram Reels i TikTok) koje promovišu {{Recommended_Tool}}.

Cilj: Usmjeriti gledaoce na link u profilu kako bi preuzeli besplatni {{Free_Template_Name}} šablon (koji sadrži naš affiliate link).

Format svake skripte (do 60 sekundi / 130 riječi):
- [0:00 - 0:03] UDICA (Vizuelno + Tekst na ekranu + Govor): Rečenica koja zaustavlja skrolovanje (npr. "Prestanite gubiti 4 sata radeći X ručno...").
- [0:03 - 0:15] PROBLEM: Pokažite bolan i spor ručni način rada na ekranu.
- [0:15 - 0:45] ODUŠEVLJENJE: Snimak ekrana gdje {{Recommended_Tool}} završava cijeli posao u 2 klika.
- [0:45 - 0:60] POZIV NA AKCIJU: "Kompletan besplatan šablon sam ostavio u linku na profilu. Preuzmite ga dok traje besplatni period."

Daj 3 različite varijacije udice:
1. Upozoravajuća udica ("Nemojte praviti ovu grešku...")
2. Udica tajnog trika ("Tajna koju vam agencije ne govore...")
3. Test brzine "Prije i Poslije"`
    }
  },
  {
    id: 'aff_prompt_lead_magnet',
    title: {
      en: 'Prompt #4: Automated Bridge-Page & Welcome Email Delivery Sequence',
      bs: 'Prompt #4: Tekst za Bridge Stranicu i Automatski Email s Preporukom'
    },
    toolTarget: 'Make.com + Tally.so + Gmail / Brevo Free',
    purpose: {
      en: 'When someone submits the free template form on Tally, this prompt generates the instant value-packed email delivering the template with your affiliate link.',
      bs: 'Kada neko preuzme besplatni šablon, ovaj prompt generiše trenutni email dobrodošlice koji isporučuje resurs uz vaš affiliate link.'
    },
    inputsNeeded: {
      en: ['User First Name', 'Downloaded Resource', 'Special Affiliate Free Trial Link'],
      bs: ['Ime Korisnika', 'Preuzeti Resurs', 'Poseban Link za Besplatan Trial']
    },
    promptText: {
      en: `Write an automated 2-part email sequence for delivering a free automation blueprint.

Email 1 (Sent Immediately):
- Subject: Here is your free {{Resource_Name}} (+ quick 3-minute setup guide)
- Body: Deliver the direct Google Sheet / Make blueprint download link. Explain in 3 bullet points how to import it into {{Recommended_Tool}}. Emphasize that they can get an extended free trial using this special partner link: [{{Affiliate_Link}}].
- Friendly PS reminding them they don't need a paid plan to test it.

Email 2 (Sent 24 Hours Later):
- Subject: Did you get stuck on Step 2? (Quick tip for {{First_Name}})
- Body: Address the #1 common roadblock when setting up {{Recommended_Tool}}. Provide the 1-click workaround. Remind them why this tool saves 20 hours a month. Re-include the partner trial link.

Keep tone genuine, founder-to-founder, and extremely helpful.`,
      bs: `Napiši automatsku email sekvencu u 2 dijela za isporuku besplatnog automatizovanog resursa.

Email 1 (Šalje se odmah):
- Naslov: Vaš besplatni {{Resource_Name}} (+ 3-minutni vodič za postavku)
- Sadržaj: Isporuči direktan link za preuzimanje šablona. Objasni u 3 stavke kako ga uvesti u {{Recommended_Tool}}. Naglasi da mogu iskoristiti besplatan probni period putem partnerskog linka: [{{Affiliate_Link}}].
- Prijateljski PS podsjetnik da im nije potrebna platna kartica za testiranje.

Email 2 (Šalje se nakon 24 sata):
- Naslov: Da li je zapelo na drugom koraku? (Mali savjet za {{First_Name}})
- Sadržaj: Obradi najčešću prepreku pri podešavanju alata {{Recommended_Tool}}. Daj brzo rješenje u 1 klik. Podsjeti zašto ovaj alat štedi 20 sati mjesečno. Ponovo navedi partnerski link.

Ton: Prirodan, nesebično koristan i profesionalan.`
    }
  }
];

export const AFFILIATE_LANDING_PAGE_COPY = {
  headline: {
    en: 'Stop Wasting 15+ Hours Every Week On Repetitive Manual Work',
    bs: 'Prestanite Gubiti 15+ Sati Sedmično na Iscrpljujući Ručni Rad'
  },
  subheadline: {
    en: 'We tested 40+ AI automation tools so you do not have to. Download our free plug-and-play workflow template and see why 12,000+ founders switched to this #1 stack.',
    bs: 'Testirali smo preko 40 AI alata kako vi ne biste morali. Preuzmite naš besplatni gotovi šablon i pogledajte zašto je preko 12.000 preduzetnika prešlo na ovaj sistem.'
  },
  ctaPrimary: {
    en: 'Claim Free Automation Template & Extended Trial',
    bs: 'Preuzmite Besplatni Šablon i Produženi Probni Period'
  },
  ftcDisclaimer: {
    en: 'Transparency Disclosure: We believe in 100% honesty. When you create an account through links on this page, we may earn an affiliate commission at zero additional cost to you. We only recommend tools we rigorously test.',
    bs: 'Transparentna Napomena: Vjerujemo u 100% poštenje. Kada otvorite nalog putem linkova na ovoj stranici, možemo ostvariti proviziju bez ikakvog dodatnog troška za vas. Preporučujemo isključivo alate koje smo lično testirali.'
  },
  comparisonPoints: [
    {
      feature: { en: 'Monthly Subscription Cost', bs: 'Mjesečni Trošak' },
      traditional: { en: '$400 - $1,500/mo (Manual VAs or legacy software)', bs: '$400 - $1.500/mj (Ručni asistenti ili skupi softveri)' },
      recommended: { en: '$0 to start / $19/mo (All-in-One AI automation)', bs: '$0 za početak / $19/mj (Sve-u-jednom AI)' }
    },
    {
      feature: { en: 'Setup Time', bs: 'Vrijeme Podešavanja' },
      traditional: { en: '2 - 3 weeks of complex onboarding', bs: '2 do 3 sedmice komplikovanih obuka' },
      recommended: { en: 'Under 10 minutes with 1-click import', bs: 'Manje od 10 minuta uz uvoz u 1 klik' }
    },
    {
      feature: { en: 'Coding Skills Required', bs: 'Potrebno Programiranje' },
      traditional: { en: 'Requires developer or Python scripts', bs: 'Zahtijeva developere ili programiranje' },
      recommended: { en: '100% Visual Drag-and-Drop (No-code)', bs: '100% Vizuelno bez koda' }
    },
    {
      feature: { en: 'Automation Capability', bs: 'Mogućnost Automatizacije' },
      traditional: { en: 'Disjointed spreadsheets & manual data entry', bs: 'Razbacane tabele i ručni unos' },
      recommended: { en: 'Fully autonomous 24/7 background execution', bs: 'Potpuno samostalan rad 24/7' }
    }
  ]
};

export const AFFILIATE_OUTREACH_SCRIPTS: ScriptItem[] = [
  {
    id: 'aff_script_reddit',
    channel: { en: 'Reddit / Quora / Community Forums', bs: 'Reddit / Quora / Tematski Forumi' },
    title: { en: 'The "90% Value, 10% Bridge" Community Helper Script', bs: 'Skripta za Forume: 90% Korisnosti, 10% Preporuka' },
    body: {
      en: `[Find someone asking: "How do I automate social media posting / lead scraping without spending $200/mo?"]

Hey! I spent months dealing with this exact headache. You do NOT need to pay for overpriced enterprise tools.

Here is the exact 3-step workflow you can set up today for $0:

1. Create a free Make.com account (gives you 1,000 free operations/mo).
2. Use Google Gemini 2.5 Flash API (100% free with 15 requests/min) to generate the summaries.
3. Push the results directly to an Airtable sheet or Google Sheet.

I actually made a clean plug-and-play visual blueprint and setup guide for this that you can clone in 2 minutes:
[Your Free Bridge Page / Notion / Tally Link]

Hope this saves you the hours of debugging I went through! Let me know if you run into any errors on step 2 and I will help you troubleshoot.`,
      bs: `[Pronađite nekoga ko pita: "Kako da automatizujem objave / pretragu klijenata bez plaćanja $200/mjesečno?"]

Pozdrav! Proveo sam mjesece boreći se s ovim problemom. Nema potrebe da plaćate skupe alate.

Evo tačnog sistema u 3 koraka koji možete podesiti danas za $0:

1. Otvorite besplatan Make.com nalog (daje 1.000 besplatnih operacija mjesečno).
2. Koristite besplatni Google Gemini API (daje 15 zahtjeva u minuti besplatno) za generisanje sadržaja.
3. Šaljite rezultate automatski u Airtable ili Google Sheets.

Napravio sam gotov besplatan šablon i kratko vizuelno uputstvo koje možete kopirati za 2 minute:
[Vaš Link do Besplatnog Šablona / Bridge Stranice]

Nadam se da će vam ovo uštedjeti sate truda! Javite ako zapne na drugom koraku, rado ću pomoći.`
    },
    tips: {
      en: 'NEVER drop raw affiliate links directly on Reddit (you will get banned). Always link to your free educational bridge page or Notion template containing the link and bonus.',
      bs: 'NIKADA ne stavljajte direktan affiliate link na Reddit (bićete blokirani). Uvijek linkujte na vašu besplatnu edukativnu stranicu ili Notion šablon koji sadrži preporuku i bonus.'
    }
  },
  {
    id: 'aff_script_linkedin_dm',
    channel: { en: 'LinkedIn / Twitter / X DM', bs: 'LinkedIn / Twitter Direktna Poruka' },
    title: { en: 'The "Free Template Gift" Outreach Script', bs: 'Skripta: Poklon Gotovog Šablona za Operatere' },
    body: {
      en: `Hey {{First_Name}}, loved your recent post on {{Topic}}. 

I noticed you manage a lot of content/workflows manually. I recently built a completely free visual Make.com + AI blueprint that automates {{Specific_Workflow}} in about 90 seconds.

I wrote up a quick 1-page walkthrough with the copy-paste template. Mind if I send the link over? No catch, 100% free to clone.

Best,
{{Your_Name}}`,
      bs: `Pozdrav {{First_Name}}, odlična ti je nedavna objava o temi {{Topic}}.

Vidio sam da dosta procesa vodiš ručno. Nedavno sam napravio potpuno besplatan gotov Make.com + AI šablon koji automatizuje {{Specific_Workflow}} za oko 90 sekundi.

Pripremio sam kratak vodič od jedne stranice sa gotovim šablonom. Mogu li ti poslati link ovdje? Nema nikakve prodaje, 100% besplatno za preuzimanje.

Pozdrav,
{{Your_Name}}`
    },
    tips: {
      en: 'Send to 15 creators/operators daily. When they reply "Sure!", send your bridge page link. 20-30% will test the software trial.',
      bs: 'Pošaljite 15 kreatora ili operatera dnevno. Kada odgovore sa "Može!", pošaljite link bridge stranice. 20-30% njih će aktivirati probni period softvera.'
    }
  },
  {
    id: 'aff_script_community_post',
    channel: { en: 'Discord / Facebook Group / Slack', bs: 'Discord / Facebook Grupe / Slack' },
    title: { en: 'The "Resource Breakdown" Community Post', bs: 'Objava u Tematskim Grupama: Kompletan Vodič' },
    body: {
      en: `🔥 [FREE TEMPLATE] How to automate {{Process_Name}} for $0 (Full Blueprint Inside)

A lot of people in this group asked how to do {{Pain_Point}} without hiring an agency or buying a $100/mo tool.

I spent this weekend documenting the entire no-code setup:
- Tool: {{Recommended_Tool}} (Free tier used)
- Cost: $0
- Setup time: 8 minutes

I put the step-by-step video and the 1-click importable file here:
👉 [Link to Bridge Page / Carrd Site]

Let me know if you want me to add any specific integrations to the template!`,
      bs: `🔥 [BESPLATAN ŠABLON] Kako automatizovati {{Process_Name}} za $0 (Kompletan Vodič)

Mnogi u ovoj grupi su pitali kako riješiti {{Pain_Point}} bez plaćanja skupih agencija ili alata od $100/mj.

Ovog vikenda sam detaljno dokumentovao cijeli besplatni proces bez koda:
- Alat: {{Recommended_Tool}} (Iskorišten besplatni nalog)
- Trošak: $0
- Vrijeme podešavanja: 8 minuta

Kompletan video i fajl za uvoz u 1 klik ostavio sam ovdje:
👉 [Link do Bridge Stranice / Carrd]

Javite ako želite da dodam još neku specifičnu integraciju u šablon!`
    },
    tips: {
      en: 'Deliver immense goodwill. Provide answers to every comment under the post to keep it algorithmically pushed to the top.',
      bs: 'Odgovorite na svaki komentar ispod objave kako bi je algoritam grupe držao na samom vrhu.'
    }
  }
];

export const AFFILIATE_WORKFLOW_NODES: WorkflowNode[] = [
  {
    step: 1,
    title: { en: 'Trigger: High-Intent Keyword or Niche Problem Identified', bs: 'Okidač: Identifikovan Problem s Visokom Namjerom Kupovine' },
    tool: 'Google Trends / Reddit / AnswerThePublic',
    action: { en: 'Find what software people are actively complaining about or searching alternatives for', bs: 'Pronalaženje softvera na koji se ljudi žale ili traže povoljnije alternative' },
    details: { en: 'Target search queries like "How to do X without Zapier", "Best affordable alternative to Y".', bs: 'Ciljajte upite poput "Kako uraditi X bez Zapiera", "Najbolja povoljna alternativa za Y".' }
  },
  {
    step: 2,
    title: { en: 'Processing: Autonomous Content & Comparison Generation', bs: 'Obrada: Samostalno Generisanje Sadržaja i Vodiča' },
    tool: 'Make.com + Gemini 2.5 Flash',
    action: { en: 'Make webhook triggers Gemini with Prompt #2 to create full comparison tutorial and bonus workflow', bs: 'Make webhook pokreće Gemini sa Promptom #2 za izradu detaljnog tutorijala i bonusa' },
    details: { en: 'Outputs structured markdown with problem diagnosis, step-by-step screenshots guide, and FTC disclaimer.', bs: 'Kreira strukturiran vodič sa koracima, preporukom i zakonskom napomenom.' }
  },
  {
    step: 3,
    title: { en: 'Database: Store In Airtable Content Hub', bs: 'Baza: Skladištenje u Airtable Centar Sadržaja' },
    tool: 'Airtable Base',
    action: { en: 'Saves drafted guide, generated hooks, affiliate link tags, and distribution status', bs: 'Čuva pripremljen vodič, udice, affiliate parametre i status distribucije' },
    details: { en: 'Acts as your single command center for all software recommendations.', bs: 'Služi kao vaš centralni komandni centar za sve softverske preporuke.' }
  },
  {
    step: 4,
    title: { en: 'Publishing: Deploy To Free Bridge Page & Resource Vault', bs: 'Objavljivanje: Postavljanje na Besplatnu Bridge Stranicu' },
    tool: 'Carrd.co / Tally.so / Notion',
    action: { en: 'Prospective buyer lands on clean page, reads solution, clicks partner button to start trial', bs: 'Zainteresovani korisnik posjećuje stranicu, čita rješenje i klikne na partnerski link' },
    details: { en: 'Captures user email before redirecting, giving you an owned email list for future tools.', bs: 'Prikuplja email prije preusmjeravanja, gradeći vašu trajnu bazu kontakata.' }
  },
  {
    step: 5,
    title: { en: 'Conversion: Recurring Payout to Bank / Stripe', bs: 'Konverzija: Ponavljajuća Isplata na Bankovni Račun / Stripe' },
    tool: 'PartnerStack / FirstPromoter / Wise',
    action: { en: 'SaaS tracks the cookie, pays you 30%-40% monthly recurring commission for every active month', bs: 'Softver bilježi korisnika i isplaćuje vam 30%-40% provizije svakog mjeseca' },
    details: { en: '100% automated payouts directly into your bank or PayPal on the 1st of every month.', bs: '100% automatizovana direktna isplata bez potrebe za fakturisanjem ili administracijom.' }
  }
];

export const AFFILIATE_ASCII_DIAGRAM = `
+-------------------------------------------------------------------------------------------------------+
|                 ZERO-BUDGET AI NICHE AFFILIATE AGENT - END-TO-END AUTOMATION FLOW                     |
+-------------------------------------------------------------------------------------------------------+
|                                                                                                       |
|  [ FREE TRAFFIC CHANNELS ]                                                                             |
|  +--------------------+   +-----------------------+   +----------------------+                        |
|  | Reddit / Quora     |   | YouTube Shorts / Reels|   | LinkedIn / X DMs     |                        |
|  | (Helpful Answers)  |   | (60s AI Hack Video)   |   | (Free Template Offer)|                        |
|  +---------+----------+   +-----------+-----------+   +----------+-----------+                        |
|            |                          |                          |                                    |
|            +--------------------------+--------------------------+                                    |
|                                       |                                                               |
|                                       v                                                               |
|            +-----------------------------------------------------+                                    |
|            | FREE BRIDGE PAGE (Carrd.co / Tally.so / Notion)     |                                    |
|            | - Problem-Solving Breakdown                         |                                    |
|            | - 1-Click "Claim Free Workflow Template"            |                                    |
|            | - Transparent FTC Affiliate Disclosure              |                                    |
|            +--------------------------+--------------------------+                                    |
|                                       |                                                               |
|                     +-----------------+-----------------+                                             |
|                     |                                   |                                             |
|                     v (Email Captured)                  v (Clicks Partner Button)                     |
|      +------------------------------+     +-------------------------------+                           |
|      | MAKE.COM AUTOMATION ENGINE   |     | OFFICIAL SAAS AFFILIATE LINK  |                           |
|      | - Webhook receives lead      |     | (30-day cookie placed)        |                           |
|      | - Logs in Airtable CRM       |     |                               |                           |
|      | - Sends Welcome Email #1     |     | User starts FREE TRIAL        |                           |
|      | - Follows up on Day 2        |     | User upgrades to $49-$99/mo   |                           |
|      +------------------------------+     +---------------+---------------+                           |
|                                                           |                                           |
|                                                           v                                           |
|                                           +-------------------------------+                           |
|                                           | MONTHLY RECURRING REVENUE     |                           |
|                                           | - 30% to 50% commission       |                           |
|                                           | - $15 to $45 / mo per user    |                           |
|                                           | - 100 users = $3,500/mo MRR   |                           |
|                                           | - Auto-paid via Wise / Stripe |                           |
|                                           +-------------------------------+                           |
+-------------------------------------------------------------------------------------------------------+
`;
