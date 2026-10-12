import { RevenueStream, ToolRequirement, AIPromptItem, ScriptItem, WorkflowNode, ChecklistItem } from '../types';

export const REVENUE_STREAMS: RevenueStream[] = [
  {
    id: 'local_seo_ai',
    name: {
      en: '1. AI Local SEO & Lead Capture Automation Agency',
      bs: '1. AI Agencija za Lokalni SEO i Automatizaciju Lead-ova'
    },
    difficulty: { en: 'Ultra Low (No code)', bs: 'Izuzetno nisko (Bez koda)' },
    timeTo100: { en: '3 - 5 Days', bs: '3 - 5 Dana' },
    scalability: { en: '$5,000 - $12,000 / month', bs: '$5,000 - $12,000 / mjesečno' },
    techBarrierScore: 2,
    speedScore: 9.5,
    scalabilityScore: 9,
    overallScore: 9.8,
    isWinner: true,
    description: {
      en: 'Scan local SMBs (dentists, plumbers, realtors, HVAC, clinics), generate instant AI audit reports highlighting missing leads/reviews, and set up automated review/lead responses.',
      bs: 'Analizirajte lokalne firme (stomatologe, vodoinstalatere, agente za nekretnine, klime, klinike), kreirajte instant AI izvještaje o propuštenim klijentima i podesite automatske odgovore.'
    },
    pros: {
      en: ['Zero upfront cost ($0 tools)', 'Immediate tangible value to business owner', 'Super fast sales cycle', 'High recurring monthly retainers'],
      bs: ['Nula početnih troškova ($0 alati)', 'Trenutna i jasna vrijednost vlasniku firme', 'Brz prodajni ciklus', 'Visoki mjesečni pretplatnički ugovori']
    },
    cons: {
      en: ['Requires consistent 10 cold emails/DMs per day for first 3 days'],
      bs: ['Zahtijeva slanje 10 direktnih poruka/emailova dnevno u prva 3 dana']
    },
    targetClients: {
      en: 'Local service providers: Dentists, Plumbers, HVAC, Realtors, Car Detailers, Aesthetic Clinics.',
      bs: 'Lokalni pružaoci usluga: Stomatolozi, Vodoinstalateri, Servisi za klime, Agencije za nekretnine, Auto detaileri, Poliklinike.'
    }
  },
  {
    id: 'social_content_factory',
    name: {
      en: '2. AI Social Media Content Engine for Small Businesses',
      bs: '2. AI Mašina za Social Media Sadržaj Malih Preduzeća'
    },
    difficulty: { en: 'Low-Medium', bs: 'Nisko-Srednje' },
    timeTo100: { en: '7 - 10 Days', bs: '7 - 10 Dana' },
    scalability: { en: '$3,000 - $6,000 / month', bs: '$3,000 - $6,000 / mjesečno' },
    techBarrierScore: 4,
    speedScore: 7,
    scalabilityScore: 7.5,
    overallScore: 7.8,
    isWinner: false,
    description: {
      en: 'Generate 30 days of branded social media posts, reels scripts, and carousels for SMBs using AI batch prompts and Canva templates.',
      bs: 'Kreirajte 30 dana brendiranih objava, skripti za Reelsove i karusela za mala preduzeća koristeći AI i besplatne Canva predloške.'
    },
    pros: {
      en: ['Visually attractive deliverable', 'Easily packaged into monthly subscription'],
      bs: ['Atraktivan vizuelni proizvod', 'Lako se pakuje u mjesečnu pretplatu']
    },
    cons: {
      en: ['Higher ongoing manual effort to approve graphics', 'Longer sales cycle'],
      bs: ['Više ručnog rada oko odobravanja grafika', 'Duži prodajni ciklus']
    },
    targetClients: {
      en: 'E-commerce stores, Fitness trainers, Restaurants, Boutiques.',
      bs: 'Online prodavnice, Fitnes treneri, Restorani, Butici.'
    }
  },
  {
    id: 'chatbot_builder',
    name: {
      en: '3. AI Customer Support & Booking Chatbots',
      bs: '3. AI Chatbotovi za Podršku i Zakazivanje Termina'
    },
    difficulty: { en: 'Medium', bs: 'Srednje' },
    timeTo100: { en: '7 - 12 Days', bs: '7 - 12 Dana' },
    scalability: { en: '$4,000 - $9,000 / month', bs: '$4,000 - $9,000 / mjesečno' },
    techBarrierScore: 6,
    speedScore: 6.5,
    scalabilityScore: 8.5,
    overallScore: 7.5,
    isWinner: false,
    description: {
      en: 'Build custom AI website chatbots using no-code platforms (Botpress/Voiceflow) that capture visitor leads and book appointments automatically.',
      bs: 'Izradite AI chatbotove za web stranice bez koda koji prikupljaju podatke posjetilaca i automatski zakazuju termine.'
    },
    pros: {
      en: ['High perceived value ($500+ setup fee)', 'Sticky recurring subscription'],
      bs: ['Visoka viđena vrijednost ($500+ postavka)', 'Stabilna mjesečna zarada']
    },
    cons: {
      en: ['Requires learning chatbot conversation flows', 'Potential bug troubleshooting'],
      bs: ['Zahtijeva učenje toka razgovora u chatbotu', 'Potreba za rješavanjem grešaka']
    },
    targetClients: {
      en: 'Law firms, Private medical practices, Auto dealerships.',
      bs: 'Advokatske kancelarije, Privatne ordinacije, Auto saloni.'
    }
  },
  {
    id: 'cold_outbound_agency',
    name: {
      en: '4. AI B2B Cold Email & Prospecting Agency',
      bs: '4. AI B2B Cold Email i Prospecting Agencija'
    },
    difficulty: { en: 'Medium-High', bs: 'Srednje-Visoko' },
    timeTo100: { en: '10 - 14 Days', bs: '10 - 14 Dana' },
    scalability: { en: '$5,000 - $15,000 / month', bs: '$5,000 - $15,000 / mjesečno' },
    techBarrierScore: 7,
    speedScore: 6,
    scalabilityScore: 9.5,
    overallScore: 7.2,
    isWinner: false,
    description: {
      en: 'Help B2B agencies scrape leads and send AI-personalized cold outreach campaigns to generate qualified sales calls.',
      bs: 'Pomažite B2B agencijama da pronalaze klijente i šalju AI personalizovane hladne email poruke za zakazivanje sastanaka.'
    },
    pros: {
      en: ['Massive income potential per client ($1k-$3k/mo)'],
      bs: ['Veliki potencijal zarade po klijentu ($1k-$3k/mj)']
    },
    cons: {
      en: ['Domain technical setups (SPF, DKIM, DMARC)', 'Deliverability challenges'],
      bs: ['Tehnička podešavanja domena (SPF, DKIM)', 'Rizik od odaska u Spam']
    },
    targetClients: {
      en: 'B2B Software companies, Marketing agencies, Consultants.',
      bs: 'B2B softverske kompanije, Marketing agencije, Konsultanti.'
    }
  },
  {
    id: 'ecommerce_listing_opt',
    name: {
      en: '5. AI E-Commerce Product Description & SEO Enhancer',
      bs: '5. AI Optimizacija Proizvoda i Opisa za E-Commerce'
    },
    difficulty: { en: 'Low', bs: 'Nisko' },
    timeTo100: { en: '7 - 10 Days', bs: '7 - 10 Dana' },
    scalability: { en: '$2,000 - $5,000 / month', bs: '$2,000 - $5,000 / mjesečno' },
    techBarrierScore: 3,
    speedScore: 7,
    scalabilityScore: 6.5,
    overallScore: 6.8,
    isWinner: false,
    description: {
      en: 'Rewrite Shopify/Amazon product listings with high-converting AI bullet points and SEO rich snippet descriptions.',
      bs: 'Prepišite opise proizvoda na Shopify/Amazon prodavnicama uz AI za bolje rangiranje i veću prodaju.'
    },
    pros: {
      en: ['Easy to standardize with prompts', 'Fast execution'],
      bs: ['Lako standardizovati uz promptove', 'Brza izrada']
    },
    cons: {
      en: ['One-off project nature', 'Lower client retention'],
      bs: ['Jednokratni projekti', 'Niže zadržavanje klijenata']
    },
    targetClients: {
      en: 'Shopify brand owners, Amazon FBA sellers, Etsy sellers.',
      bs: 'Vlasnici Shopify prodavnica, Amazon FBA prodavci, Etsy prodavci.'
    }
  }
];

export const TOOL_STACK: ToolRequirement[] = [
  {
    name: 'Make.com',
    role: { en: 'Workflow Automation Engine (Connects Form -> AI -> Email)', bs: 'Isporučilac automatizacije (Povezuje Formu -> AI -> Email)' },
    cost: { en: '$0 / Forever Free', bs: '$0 / Zauvijek besplatno' },
    freeTierLimit: { en: '1,000 free operations per month', bs: '1.000 besplatnih operacija mjesečno' },
    url: 'https://www.make.com',
    badge: 'Core Engine'
  },
  {
    name: 'Tally.so / Google Forms',
    role: { en: 'Client Data & Free Audit Request Intake Form', bs: 'Forma za prikupljanje upita i besplatnog audita' },
    cost: { en: '$0 / Free', bs: '$0 / Besplatno' },
    freeTierLimit: { en: 'Unlimited forms & submissions', bs: 'Neograničeno formi i prijava' },
    url: 'https://tally.so',
    badge: 'Lead Intake'
  },
  {
    name: 'Airtable',
    role: { en: 'CRM & Lead Database (Stores prospective businesses & audit status)', bs: 'CRM & Baza klijenata (Čuva podatke i status audita)' },
    cost: { en: '$0 / Free Plan', bs: '$0 / Besplatni paket' },
    freeTierLimit: { en: 'Up to 1,000 records per base', bs: 'Do 1.000 zapisa po bazi' },
    url: 'https://airtable.com',
    badge: 'Lead CRM'
  },
  {
    name: 'Google Gemini 2.5 Flash / ChatGPT',
    role: { en: 'AI Analysis & Audit Report Generation Engine', bs: 'AI Mozak za analizu i izradu izvještaja' },
    cost: { en: '$0 Free Tier API / Free Web Interface', bs: '$0 Besplatni API / Web sučelje' },
    freeTierLimit: { en: 'Generous free daily limits (15 RPM free)', bs: '15 zahtjeva po minuti besplatno' },
    url: 'https://ai.google.dev',
    badge: 'AI Engine'
  },
  {
    name: 'Loom',
    role: { en: '3-Minute Video Screen Audits (The 30% closing secret)', bs: '3-minutni video audit ekrana (Tajna za 30% zatvaranja)' },
    cost: { en: '$0 / Free', bs: '$0 / Besplatno' },
    freeTierLimit: { en: '25 videos (up to 5 min each)', bs: '25 videa (do 5 min svaki)' },
    url: 'https://www.loom.com',
    badge: 'Closing Tool'
  },
  {
    name: 'Gmail / Outlook',
    role: { en: 'Outreach & Report Delivery Channel', bs: 'Slanje ponuda i izvještaja' },
    cost: { en: '$0 / Existing account', bs: '$0 / Postojeći račun' },
    freeTierLimit: { en: '500 emails/day per personal account', bs: '500 emailova/dnevno po računu' },
    url: 'https://gmail.com',
    badge: 'Outreach'
  }
];

export const MASTER_PROMPTS: AIPromptItem[] = [
  {
    id: 'audit_generator',
    title: {
      en: 'Prompt #1: Local Business Audit & Pain-Point Extractor',
      bs: 'Prompt #1: Ekstrakcija Slabosti i Audit Lokalnog Biznisa'
    },
    toolTarget: 'Make.com / Gemini API Node or ChatGPT Free Web',
    purpose: {
      en: 'Takes business name, industry, website, and Google rating, and instantly outputs a high-value 3-point critique with exact missing revenue figures.',
      bs: 'Uzima naziv firme, industriju, web stranicu i ocjenu na Google-u, te generiše izvještaj o propuštenoj zaradi.'
    },
    inputsNeeded: {
      en: ['Business Name', 'Niche / City', 'Current Google Rating', 'Estimated Monthly Missed Customers'],
      bs: ['Naziv Firme', 'Niša / Grad', 'Trenutna Google Ocjena', 'Procijenjeni Propušteni Klijenti']
    },
    promptText: {
      en: `You are an elite B2B Local SEO and Lead Generation Automation Consultant.
Analyze the following local business profile:
- Business Name: {{Business_Name}}
- Industry & City: {{Niche_City}}
- Current Google Rating & Reviews: {{Google_Rating}}
- Website Status: {{Website_Status}}

Write a professional, non-pushy, high-value 3-part Mini Audit Report that I can send to the business owner:

1. THE CURRENT GAP: Explain in 2 sentences why prospective customers are picking their competitors based on their current online reviews or website response speed.
2. THE MISSED REVENUE: Estimate how many calls/leads they lose every month (e.g. 15-25 qualified inquiries) by not having immediate AI instant-reply or review automation.
3. THE 3-STEP FIX (100% Free Quick Wins):
   - Step A: Instant SMS/WhatsApp auto-reply when a missed call happens.
   - Step B: Automated 1-click Google review link sent after service completion.
   - Step C: AI Chatbot on Google Maps/Website that answers FAQs 24/7.

Tone: Helpful, executive, direct, professional. No buzzwords. Keep total length under 250 words.`,
      bs: `Ti si vrhunski B2B konsultant za lokalni SEO i automatizaciju privlačenja klijenata.
Analiziraj sljedeći profil lokalne firme:
- Naziv Firme: {{Business_Name}}
- Industrija i Grad: {{Niche_City}}
- Google Ocjena i Broj Recenzija: {{Google_Rating}}
- Stanje Web Stranice: {{Website_Status}}

Napiši profesionalan, nenametljiv i izuzetno koristan Mini Izvještaj Audita u 3 dijela koji mogu poslati vlasniku firme:

1. TRENUTNI PROPUST: Objasni u 2 rečenice zašto potencijalni klijenti odlaze konkurenciji na osnovu recenzija ili sporog odgovora.
2. PROPUŠTENA ZARADA: Procijeni koliko poziva/upita gube mjesečno (npr. 15-25 zrelih upita) jer nemaju automatske odgovore.
3. BRZA RJEŠENJA U 3 KORAKA (Korisni savjeti):
   - Korak A: Automatski SMS/WhatsApp odgovor u sekundi nakon propuštenog poziva.
   - Korak B: Slanje linka za Google recenziju u 1 klik nakon pružene usluge.
   - Korak C: AI asistent na web stranici koji odgovara na pitanja 24/7.

Ton: Profesionalan, direktan, pun poštovanja. Ukupna dužina do 250 riječi.`
    }
  },
  {
    id: 'cold_email_prompt',
    title: {
      en: 'Prompt #2: Personalized Cold Email Outreach Generator',
      bs: 'Prompt #2: Generator Personalizovanih Cold Email Poruka'
    },
    toolTarget: 'Make.com / SendGrid / Gmail Module',
    purpose: {
      en: 'Creates a short, non-spammy 4-sentence cold outreach email custom-tailored to the business owner.',
      bs: 'Kreira kratak, efikasan email u 4 rečenice prilagođen vlasniku firme koji otvara vrata bez prodajnog pritiska.'
    },
    inputsNeeded: {
      en: ['Owner Name', 'Business Name', 'Specific Local Competitor Name'],
      bs: ['Ime Vlasnika', 'Naziv Firme', 'Ime Lokalnog Konkurenta']
    },
    promptText: {
      en: `Write a short, compelling cold outreach email to {{Owner_Name}}, owner of {{Business_Name}}.

Constraints:
- Maximum 110 words.
- Subject Line: Short, intriguing, 3-5 words (e.g., "quick question re: {{Business_Name}} reviews").
- Opening: Mention a specific positive detail about their business or 5-star review.
- The Hook: Point out that when searching for {{Niche}} in {{City}}, competitor {{Competitor_Name}} is capturing ~20 extra calls/month due to faster review automation.
- The Offer: Offer to send a free 3-minute video showing how to set up automated Google review generation in under 15 minutes. No call needed, 100% free.
- CTA: "Mind if I send the 3-minute video over?"

Language: Natural, conversational, highly professional.`,
      bs: `Napiši kratak i uvjerljiv hladni email za {{Owner_Name}}, vlasnika firme {{Business_Name}}.

Pravila:
- Maksimalno 110 riječi.
- Naslov (Subject): Kratak i intrigantan, 3-5 riječi (npr. "kratko pitanje za {{Business_Name}}").
- Uvod: Spomeni pozitivan detalj ili dobru ocjenu o njihovom radu.
- Udica: Istakni da pri pretrazi za {{Niche}} u {{City}}, konkurent {{Competitor_Name}} dobija ~20 dodatnih poziva mjesečno zbog bržih odgovora.
- Ponuda: Ponudi besplatan video od 3 minute koji pokazuje kako postaviti automatsko sakupljanje Google recenzija. Bez prodaje, 100% besplatno.
- Poziv na akciju (CTA): "Mogu li Vam poslati kratki video?"

Jezik: Prirodan, poslovan i prijateljski.`
    }
  },
  {
    id: 'loom_script_prompt',
    title: {
      en: 'Prompt #3: 3-Minute Video Audit Script (Loom Framework)',
      bs: 'Prompt #3: Skripta za 3-Minutni Video Audit (Loom Model)'
    },
    toolTarget: 'Loom Video Recording / Personal Teleprompter',
    purpose: {
      en: 'The exact speaking script for recording a 3-minute screen share video that closes 30%+ of prospective clients.',
      bs: 'Tačna govorna skripta za snimanje ekrana u trajanju od 3 minute koja zatvara preko 30% ponuda.'
    },
    inputsNeeded: {
      en: ['Target Website', 'Google Maps Listing'],
      bs: ['Web Stranica Klijenta', 'Google Maps Profil']
    },
    promptText: {
      en: `Generate a word-for-word 3-minute Loom video script for auditing {{Business_Name}}.

Structure:
- 0:00 - 0:30 (The Compliment & Hook): Open with their Google Maps profile. "Hey {{Owner_Name}}, I was looking at {{Business_Name}} and noticed you have great customer service, but your Google Maps listing is losing about 15 leads a month to {{Competitor_Name}}."
- 0:30 - 1:30 (The Gap): Show their website on phone view. Highlight that there's no instant WhatsApp / SMS contact button, and missed call auto-reply isn't enabled.
- 1:30 - 2:30 (The Solution): Show a quick demo of how an automated AI workflow immediately emails & texts a customer who leaves an inquiry, booking them on autopilot.
- 2:30 - 3:00 (The No-Pressure CTA): "I built this exact system. If you want me to turn this on for your business, it takes 15 minutes. If not, feel free to use these ideas yourself! Let me know if you want me to set it up for you."`,
      bs: `Generiši preciznu skriptu od reči do reči za 3-minutni Loom video audit za {{Business_Name}}.

Struktura:
- 0:00 - 0:30 (Pohvala i Udica): Otvori njihov Google Maps profil. "Pozdrav {{Owner_Name}}, gledao sam {{Business_Name}} i vidio odlične ocjene, ali Vaš profil gubi oko 15 klijenata mjesečno u korist {{Competitor_Name}}."
- 0:30 - 1:30 (Problem): Prikaži njihovu stranicu na mobilnom prikazu. Pokaži da nema brzog WhatsApp/SMS dugmeta niti automatskog odgovora na propušten poziv.
- 1:30 - 2:30 (Rješenje): Prikaži kratku demontraciju kako AI automatizacija u sekundi šalje SMS klijentu koji je poslao upit i zakazuje termin.
- 2:30 - 3:00 (Nenametljiv CTA): "Napravio sam ovaj sistem. Ako želite da ga uključimo za Vašu firmu, treba nam 15 minuta. Ako ne, slobodno iskoristite ove savjete. Javite mi ako želite da podesimo sve zajedno."`
    }
  },
  {
    id: 'review_reply_automation',
    title: {
      en: 'Prompt #4: Automated Google Review AI Response Prompt',
      bs: 'Prompt #4: AI Automatizacija Odgovora na Google Recenzije'
    },
    toolTarget: 'Make.com Google Business Profile Node + Gemini',
    purpose: {
      en: 'Automatically generates warm, SEO-keyword-optimized replies to new 5-star customer reviews on autopilot.',
      bs: 'Automatski generiše tople, SEO optimizovane odgovore na nove 5-zvjezdica recenzije korisnika.'
    },
    inputsNeeded: {
      en: ['Customer Name', 'Review Text', 'Service Provided'],
      bs: ['Ime Klijenta', 'Tekst Recenzije', 'Pružena Usluga']
    },
    promptText: {
      en: `You are the friendly customer service AI for {{Business_Name}} in {{City}}.
A customer named {{Customer_Name}} left a {{Star_Rating}}-star review:
"{{Review_Text}}"

Task: Write an automated response to post on Google Business Profile.
Rules:
- Express genuine gratitude.
- Include natural SEO keywords (e.g., "best dentist in Sarajevo", "emergency plumbing repair").
- Keep it under 60 words.
- Sign off warmly from the team.`,
      bs: `Ti si ljubazni AI asistent za podršku korisnicima za {{Business_Name}} u {{City}}.
Korisnik {{Customer_Name}} je ostavio recenziju od {{Star_Rating}} zvjezdica:
"{{Review_Text}}"

Zadatak: Napiši automatski odgovor za Google Business Profil.
Pravila:
- Izrazi iskrenu zahvalnost.
- Ubaci prirodne ključne riječi (npr. "stomatolog Sarajevo", "hitne vodoinstalaterske usluge").
- Dužina do 60 riječi.
- Srdačan pozdrav u ime tima.`
    }
  }
];

export const WORKFLOW_NODES: WorkflowNode[] = [
  {
    step: 1,
    title: { en: 'Trigger: New Audit Request / Lead Input', bs: 'Okidač: Novi Upit za Audit / Unos Klijenta' },
    tool: 'Tally.so / Airtable',
    action: { en: 'Prospect fills out quick form OR you add a prospective business row in Airtable', bs: 'Klijent popuni formu ILI unesete firmu u Airtable' },
    details: { en: 'Fields captured: Business Name, Owner Email, City, Google Maps Link, Phone.', bs: 'Polja: Naziv Firme, Email Vlasnika, Grad, Google Maps Link, Telefon.' }
  },
  {
    step: 2,
    title: { en: 'Action: AI Audit Processing', bs: 'Akcija: AI Obrada i Izrada Audita' },
    tool: 'Make.com + Gemini API',
    action: { en: 'Make passes the form variables into Gemini 2.5 Flash API module using Prompt #1', bs: 'Make šalje podatke u Gemini API modul koristeći Prompt #1' },
    details: { en: 'Executes in 1.2 seconds, outputting formatted mini audit & missed lead stats.', bs: 'Izvršava se za 1,2 sekunde, kreirajući mini audit i procjenu propuštenog prihoda.' }
  },
  {
    step: 3,
    title: { en: 'Action: Save Output to CRM', bs: 'Akcija: Spasavanje U Bazu (CRM)' },
    tool: 'Airtable Module',
    action: { en: 'Updates record status to "Audit Generated" and stores generated text', bs: 'Ažurira status na "Audit Generisan" i čuva generisani tekst' },
    details: { en: 'Creates neat audit history row ready for review or auto-send.', bs: 'Kreira uredan zapis spreman za pregled ili automatsko slanje.' }
  },
  {
    step: 4,
    title: { en: 'Action: Instant Outreach Delivery', bs: 'Akcija: Slanje Email / SMS Ponude' },
    tool: 'Gmail / SendGrid Module',
    action: { en: 'Sends personalized audit report to business owner with calendar booking link', bs: 'Šalje personalizovani izvještaj vlasniku sa linkom za zakazivanje' },
    details: { en: 'Subject line dynamically personalized with business name & city.', bs: 'Naslov emaila se dinamički personalizuje sa imenom firme i grada.' }
  },
  {
    step: 5,
    title: { en: 'Action: Agency Owner Alert', bs: 'Akcija: Obavještenje Vlasniku Agencije' },
    tool: 'Email / Telegram / WhatsApp',
    action: { en: 'Sends ping to your phone: "Audit sent to {{Business_Name}}! Follow up in 24h."', bs: 'Šalje poruku na vaš telefon: "Audit poslat za {{Business_Name}}! Prati za 24h."' },
    details: { en: 'Ensures zero missed opportunities and instant follow-up tracking.', bs: 'Osigurava da ne propustite nijedan potencijalni ugovor.' }
  }
];

export const SCRIPTS: ScriptItem[] = [
  {
    id: 'script_cold_email',
    channel: { en: 'Cold Email', bs: 'Hladni Email' },
    title: { en: 'The "3 Quick Fixes" High-Converting Cold Email', bs: 'Email "3 Brza Savjeta" koji Donosi Odgovore' },
    subject: { en: 'quick question regarding {{Business_Name}} on Google Maps', bs: 'kratko pitanje u vezi {{Business_Name}} na Google-u' },
    body: {
      en: `Hi {{Owner_Name}},

I came across {{Business_Name}} while searching for top-rated {{Niche}} services in {{City}}. You guys have fantastic reviews, but I noticed something critical:

When people search on mobile after 5 PM, competitor {{Competitor_Name}} is snagging about 15-20 leads per month because they have instant SMS auto-reply enabled and an automated 1-click review link.

I put together a short 3-minute video showing 3 zero-cost fixes you can implement today to capture those missed leads.

Would it be okay if I sent that video over to you? No cost or sales pitch, just helpful info.

Best regards,
{{Your_Name}}`,
      bs: `Poštovani {{Owner_Name}},

Naišao sam na {{Business_Name}} dok sam pretraživao usluge {{Niche}} u gradu {{City}}. Imate odlične ocjene, ali sam primijetio jednu važnu stvar:

Kada klijenti pretražuju na mobilnom telefonu nakon radnog vremena, konkurent {{Competitor_Name}} preuzima oko 15-20 upita mjesečno jer imaju podešen automatski SMS odgovor i brzi link za recenzije.

Snimio sam kratak video od 3 minute u kojem sam pokazao 3 besplatna koraka kako da zadržite te klijente.

Mogu li Vam poslati taj kratki video? Bez ikakvih obaveza, samo korisni savjeti.

Lijep pozdrav,
{{Your_Name}}`
    },
    tips: {
      en: 'Send to at least 10 business owners per day. Target businesses with 10–80 reviews (sweet spot).',
      bs: 'Pošaljite najmanje 10 vlasnika dnevno. Ciljajte firme sa 10–80 recenzija (najbolji raspon).'
    }
  },
  {
    id: 'script_dm',
    channel: { en: 'Instagram / LinkedIn DM', bs: 'Instagram / LinkedIn DM' },
    title: { en: 'Direct Social Message for Local Business Owners', bs: 'Direktna Poruka na Društvenim Mrežama' },
    body: {
      en: `Hey {{Owner_Name}}! Love your work at {{Business_Name}}. 

I actually ran a quick audit on local {{Niche}} businesses in {{City}} and noticed your Google profile is super close to hitting the #1 spot, but missing instant review automation.

I recorded a 90-second video showing how to fix it for free. Want me to drop the link here?`,
      bs: `Pozdrav {{Owner_Name}}! Svaka čast na radu u {{Business_Name}}.

Uradio sam brzi audit za {{Niche}} u {{City}} i vidio da je Vaš Google profil jako blizu #1 pozicije, ali nedostaje mu automatsko sakupljanje recenzija.

Snimio sam kratki video od 90 sekundi kako to besplatno podesiti. Želite li da Vam pošaljem link ovdje?`
    },
    tips: {
      en: 'Super low pressure. Always wait for them to say "Sure" or "Yes" before sending the video link so your link doesn’t get marked as spam.',
      bs: 'Nenametljivo. Uvijek sačekajte da odgovore sa "Može" ili "Pošalji" prije slanja linka kako poruka ne bi bila blokirana.'
    }
  },
  {
    id: 'script_followup_day2',
    channel: { en: 'Follow-Up Email (Day 2)', bs: 'Pratnja (Dan 2)' },
    title: { en: 'The Gentle 24-Hour Bump', bs: 'Kratki Podsjetnik nakon 24h' },
    subject: { en: 'Re: quick question regarding {{Business_Name}}', bs: 'Re: kratko pitanje u vezi {{Business_Name}}' },
    body: {
      en: `Hi {{Owner_Name}}, just bumping this in case it got buried! 

Did you want me to send over that 3-minute video breakdown for {{Business_Name}}? 

Here's the direct preview link if easier: [Your Loom Link]

Best,
{{Your_Name}}`,
      bs: `Poštovani {{Owner_Name}}, samo kratak podsjetnik ako je poruka promakla.

Želite li da Vam pošaljem onaj kratki video za {{Business_Name}}?

Evo i direktnog linka ako Vam je lakše pogledati: [Vaš Loom Link]

Srdačan pozdrav,
{{Your_Name}}`
    },
    tips: {
      en: 'Over 50% of positive replies come from the first follow-up. Always send this on Day 2!',
      bs: 'Preko 50% potvrdnih odgovora stiže upravo iz ove druge poruke. Obavezno pošaljite na Dan 2!'
    }
  }
];

export const LANDING_PAGE_BLUEPRINT = {
  headline: {
    en: 'Turn Missed Calls & Google Searchers Into Paying Clients On Autopilot',
    bs: 'Pretvorite Propuštene Pozive i Google Pretrage u Klijente na Autopilotu'
  },
  subheadline: {
    en: 'We build zero-friction AI lead capture & review automation systems for local service businesses in under 48 hours. No monthly tech headaches.',
    bs: 'Podešavamo AI sistem za prikupljanje klijenata i recenzija za lokalne firme u roku od 48 sati. Bez komplikovanih tehničkih procedura.'
  },
  ctaText: {
    en: 'Get Your Free 3-Minute Business Audit',
    bs: 'Preuzmite Besplatan 3-Minutni Audit Firme'
  },
  painPoints: [
    {
      title: { en: 'Losing Calls After Hours', bs: 'Gubljenje Poziva Nakon Radnog Vremena' },
      desc: { en: '62% of local calls after 5 PM go to voice mail. Customers simply call the next business on Google.', bs: '62% poziva nakon 17h ode na sekretaricu. Klijenti prosto pozovu sljedeću firmu na Google-u.' }
    },
    {
      title: { en: 'Slow Review Growth', bs: 'Spore Google Recenzije' },
      desc: { en: 'Happy clients forget to leave reviews unless prompted immediately via automated text message.', bs: 'Zadovoljni klijenti zaborave ostaviti recenziju osim ako ne dobiju brz i jednostavan SMS link.' }
    },
    {
      title: { en: 'Manual Follow-up Waste', bs: 'Gubljenje Vremena na Ručne Odgovore' },
      desc: { en: 'Your staff spends hours answering the same 5 basic pricing & scheduling questions every day.', bs: 'Osoblje troši sate odgovarajući na istih 5 osnovnih pitanja o cijenama i terminima svaki dan.' }
    }
  ],
  howItWorks: [
    {
      step: '01',
      title: { en: 'Run Free Audit', bs: 'Besplatan Audit' },
      desc: { en: 'We analyze your Google Maps ranking, review velocity, and speed-to-lead.', bs: 'Analiziramo Vaš Google profil, brzinuprikupljanja recenzija i brzinu odgovora na upite.' }
    },
    {
      step: '02',
      title: { en: 'Plug & Play Setup', bs: 'Jednostavno Podešavanje' },
      desc: { en: 'We connect our free Make.com & AI workflow engine directly to your phone/website.', bs: 'Povezujemo naš AI sistem za automatizaciju direktno sa Vašim telefonom i stranicom.' }
    },
    {
      step: '03',
      title: { en: 'Watch Leads & Reviews Grow', bs: 'Rast Klijenata i Recenzija' },
      desc: { en: 'Receive instant notifications as customers get auto-booked and reviews start rolling in.', bs: 'Pratite kako pristižu novi zakazani termini i pozitivne ocjene automatski.' }
    }
  ]
};

export const LAUNCH_CHECKLIST: ChecklistItem[] = [
  {
    id: 'chk_1',
    day: 1,
    title: { en: 'Setup Free Tool Stack', bs: 'Podešavanje Besplatnih Alata' },
    description: { en: 'Create free accounts on Make.com, Airtable, and Tally.so (0$ spent).', bs: 'Otvorite besplatne račune na Make.com, Airtable i Tally.so ($0 troška).' },
    completed: false
  },
  {
    id: 'chk_2',
    day: 1,
    title: { en: 'Build Lead Intake Airtable Base', bs: 'Izrada Airtable Baze Klijenata' },
    description: { en: 'Create fields: Business Name, City, Niche, Rating, Owner Email, Audit Output.', bs: 'Kreirajte polja: Naziv Firme, Grad, Niša, Ocjena, Email Vlasnika, Audit Tekst.' },
    completed: false
  },
  {
    id: 'chk_3',
    day: 2,
    title: { en: 'Copy Master Prompts into Make.com', bs: 'Kopiranje AI Promptova u Make.com' },
    description: { en: 'Connect Gemini 2.5 Flash API or OpenAI Node in Make with Prompt #1 and Prompt #2.', bs: 'Povežite Gemini API u Make.com sa Promptom #1 i Promptom #2.' },
    completed: false
  },
  {
    id: 'chk_4',
    day: 2,
    title: { en: 'Find First 10 Target Local Businesses', bs: 'Pronađite Prvih 10 Lokalnih Firmi' },
    description: { en: 'Search Google Maps for "Dentists in [City]" or "Plumbers in [City]" with 15-50 reviews.', bs: 'Pretražite Google Maps za "Stomatolog [Grad]" ili "Vodoinstalater [Grad]" sa 15-50 recenzija.' },
    completed: false
  },
  {
    id: 'chk_5',
    day: 3,
    title: { en: 'Send First 10 Cold Outreach Emails / DMs', bs: 'Pošaljite Prvih 10 Emailova / Poruka' },
    description: { en: 'Use Outreach Script #1. Track sent emails in Airtable base.', bs: 'Upotrijebite Skriptu #1. Zabilježite poslani status u Airtable.' },
    completed: false
  },
  {
    id: 'chk_6',
    day: 4,
    title: { en: 'Record 3-Minute Loom Video for Positive Replies', bs: 'Snimite 3-Minutni Loom Video za Odgovore' },
    description: { en: 'When prospect says "Yes send video", record using Prompt #3 script framework.', bs: 'Kada vlasnik kaže "Može", snimite kratki ekran prateći Prompt #3.' },
    completed: false
  },
  {
    id: 'chk_7',
    day: 5,
    title: { en: 'Close First $149 - $299 Client', bs: 'Zatvorite Prvi Ugovor ($149 - $299)' },
    description: { en: 'Offer express 48h setup fee. Receive funds via Stripe / Bank transfer / PayPal.', bs: 'Ponudite brzu postavku u roku od 48h. Primite prvu uplatu.' },
    completed: false
  },
  {
    id: 'chk_8',
    day: 7,
    title: { en: 'Upsell to $399/month Retainer & Scale', bs: 'Ponudite Mjesečnu Pretplatu $399/mj' },
    description: { en: 'Once express setup is running, offer ongoing lead maintenance & weekly AI review management.', bs: 'Nakon postavke ponudite mjesečno održavanje i vođenje recenzija.' },
    completed: false
  }
];
