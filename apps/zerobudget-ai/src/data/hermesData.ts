import { HermesImprovement, ToolRequirement, AIPromptItem, ScriptItem } from '../types';

export const CONTENT_TOOL_STACK: ToolRequirement[] = [
  {
    name: 'Tally.so / Telegram Bot',
    role: {
      en: 'Client Intake (Upload voice memo, YouTube/podcast link, or bullet notes)',
      bs: 'Prijem materijala (Glasovna poruka, YouTube/podcast link ili bilješke)'
    },
    cost: { en: '$0 / 100% Free', bs: '$0 / 100% Besplatno' },
    freeTierLimit: { en: 'Unlimited submissions & file uploads up to 10MB', bs: 'Neograničeno prijava i fajlova do 10MB' },
    url: 'https://tally.so',
    badge: 'Intake'
  },
  {
    name: 'Make.com',
    role: {
      en: 'Autonomous Workflow Engine (Orchestrates Intake -> AI -> Airtable -> Docs)',
      bs: 'Centralni orkestrator (Povezuje formu -> AI agenta -> Bazu -> Google Docs)'
    },
    cost: { en: '$0 Free Tier', bs: '$0 Besplatni nivo' },
    freeTierLimit: { en: '1,000 operations/month (enough for 30+ client deliverables)', bs: '1.000 operacija mjesečno (dovoljno za 30+ isporuka)' },
    url: 'https://www.make.com',
    badge: 'Automation Core'
  },
  {
    name: 'Google Gemini 2.5 Flash / ChatGPT Free',
    role: {
      en: 'Content Engine (Transcribes, hooks, drafts LinkedIn posts & newsletters)',
      bs: 'AI Motor za Sadržaj (Transkripcija, udice, LinkedIn objave i newsletter)'
    },
    cost: { en: '$0 Free Tier / Web UI', bs: '$0 Besplatno' },
    freeTierLimit: { en: 'Gemini API: 15 Requests/Min & 1,500/day free', bs: '15 zahtjeva/min i 1.500/dan besplatno' },
    url: 'https://ai.google.dev',
    badge: 'AI Engine'
  },
  {
    name: 'Airtable',
    role: {
      en: 'Content CRM & Calendar (Stores raw notes, client voice profiles, approved copy)',
      bs: 'Baza i Kalendar Sadržaja (Čuva bilješke, stil klijenta i gotove objave)'
    },
    cost: { en: '$0 Free Plan', bs: '$0 Besplatno' },
    freeTierLimit: { en: 'Up to 1,000 records & rich attachment fields', bs: 'Do 1.000 redova i neograničene baze' },
    url: 'https://airtable.com',
    badge: 'Content CRM'
  },
  {
    name: 'Google Docs & Drive',
    role: {
      en: 'Client Delivery Portal (Auto-generated branded document for review)',
      bs: 'Isporuka Klijentu (Automatski generisan Google dokument za pregled)'
    },
    cost: { en: '$0 Free Account', bs: '$0 Besplatno' },
    freeTierLimit: { en: '15GB free storage', bs: '15GB besplatnog prostora' },
    url: 'https://docs.google.com',
    badge: 'Delivery'
  }
];

export const CONTENT_PROMPTS: AIPromptItem[] = [
  {
    id: 'content_prompt_1',
    title: {
      en: 'Prompt #1: Raw Transcript & Voice Note Core Idea Extractor',
      bs: 'Prompt #1: Ekstrakcija Glavnih Teza iz Glasovne Poruke ili Bilješki'
    },
    toolTarget: 'Gemini 2.5 Flash / ChatGPT / Hermes Agent',
    purpose: {
      en: 'Analyzes rambling audio transcripts or scattered thoughts and extracts 5 high-impact business insights, key anecdotes, and contrarian perspectives.',
      bs: 'Pretvara neuredne glasovne bilješke u 5 jasnih poslovnih uvida i anegdota za objave.'
    },
    inputsNeeded: {
      en: ['Founder Name & Niche', 'Raw Voice Memo Transcript / Notes', 'Target Audience'],
      bs: ['Ime Vlasnika i Niša', 'Transkript Glasovne Poruke / Bilješke', 'Ciljna Publika']
    },
    promptText: {
      en: `You are an elite B2B Ghostwriter for founders and C-level executives.
Client: {{Founder_Name}}
Industry/Niche: {{Founder_Niche}}
Target Audience: {{Target_Audience}}

Below is an unedited transcript of the founder speaking off-the-cuff:
"""
{{Raw_Transcript}}
"""

Task:
Extract and organize the core value into structured JSON:
1. "core_thesis": The central takeaway in 1 powerful sentence.
2. "contrarian_insight": What does the founder believe that goes against common industry advice?
3. "key_anecdote": The specific personal story or client example mentioned.
4. "5_post_angles":
   - Angle 1: Framework breakdown (Step-by-step tactical guide)
   - Angle 2: Contrarian opinion (Why mainstream advice is wrong)
   - Angle 3: Personal failure or lesson learned
   - Angle 4: Client win / Mini case study
   - Angle 5: Quick-hit actionable checklist

Do not use AI clichés or fluff. Keep it punchy, authentic, and direct.`,
      bs: `Ti si vrhunski B2B Ghostwriter za osnivače i direktore.
Klijent: {{Founder_Name}}
Industrija: {{Founder_Niche}}
Ciljna publika: {{Target_Audience}}

Evo sirovog transkripta govorne poruke ili bilješki:
"""
{{Raw_Transcript}}
"""

Zadatak:
Izvuci ključnu vrijednost u strukturirani format:
1. "Glavna teza": Suština u jednoj snažnoj rečenici.
2. "Suprotno mišljenje (Contrarian)": Šta klijent tvrdi suprotno uobičajenim savjetima?
3. "Anegdota ili primjer": Konkretna priča ili primjer klijenta.
4. "5 uglova za objave":
   - Ugao 1: Korak-po-korak taktički vodič
   - Ugao 2: Suprotno mišljenje (zašto većina griješi)
   - Ugao 3: Lična lekcija ili greška
   - Ugao 4: Mini studija slučaja / uspjeh klijenta
   - Ugao 5: Brza lista savjeta za primjenu

Bez vještačkih AI fraza. Direktno, autentično i uvjerljivo.`
    }
  },
  {
    id: 'content_prompt_2',
    title: {
      en: 'Prompt #2: Viral Hook & 5-Post LinkedIn Pack Generator',
      bs: 'Prompt #2: Generator 5 LinkedIn Objava sa Magnetnim Udicama'
    },
    toolTarget: 'Make.com AI Module / Hermes System Prompt',
    purpose: {
      en: 'Transforms the extracted angles into 5 high-retention LinkedIn posts formatted with 1-line line breaks, magnetic hooks, and zero fluff.',
      bs: 'Generiše 5 gotovih objava za LinkedIn sa magnetnim uvodnim rečenicama spremnih za objavu.'
    },
    inputsNeeded: {
      en: ['Extracted Angles JSON', 'Tone of Voice (e.g. Direct, Analytical, Storyteller)'],
      bs: ['JSON Ekstraktovanih Uglova', 'Ton Komunikacije (Direktan, Analitičan, Pričljiv)']
    },
    promptText: {
      en: `You are ghostwriting 5 LinkedIn posts for {{Founder_Name}}, founder in {{Founder_Niche}}.
Tone: Direct, humble yet authoritative, practical, zero corporate buzzwords.
Rules:
- Line breaks: Keep paragraphs strictly to 1-2 lines for maximum mobile readability.
- The Hook (Line 1): Must evoke curiosity, challenge a myth, or state a shocking metric. Under 80 characters.
- Line 2: Empty line. Line 3: Re-hook that pays off the curiosity.
- The Body: High-density value, no filler sentences.
- Call to Action (End): Thoughtful discussion question or soft invitation to connect.
- BANNED WORDS: "Delve", "Game-changer", "Tapestry", "Testament", "Unleash", "In today's fast-paced world", "Synergy".

Generate all 5 posts numbered [POST 1] through [POST 5], each formatted ready to copy-paste.`,
      bs: `Pišeš 5 LinkedIn objava za {{Founder_Name}}, osnivača u {{Founder_Niche}}.
Ton: Direktan, pristupačan, stručan, bez korporativnih fraza.
Pravila:
- Prijelom teksta: Paragrafi strogo 1-2 rečenice radi lakog čitanja na telefonu.
- Udica (Prva rečenica): Manje od 80 karaktera, ruši mit ili postavlja intrigantno pitanje.
- Tijelo objave: Visoka gustina konkretnih savjeta, bez praznih riječi.
- Završetak (CTA): Pitanje za komentar ili prirodan poziv na povezivanje.
- ZABRANJENE RIJEČI: "U današnjem ubrzanom svijetu", "Revolucionarno", "Sinergija", "Kao što svi znamo".

Generiši svih 5 objava označenih od [OBJAVA 1] do [OBJAVA 5], spremnih za direktno kopiranje.`
    }
  },
  {
    id: 'content_prompt_3',
    title: {
      en: 'Prompt #3: Weekly Authority Newsletter & Case Study Synthesizer',
      bs: 'Prompt #3: Sedmični Newsletter i Mini Studija Slučaja'
    },
    toolTarget: 'Hermes / Gemini 2.5 Flash',
    purpose: {
      en: 'Consolidates the weekly insights into a 450-word high-retention email newsletter with actionable frameworks and a soft client pitch.',
      bs: 'Spaja sedmične uvide u email newsletter od 450 riječi sa praktičnim vodičem i nenametljivom ponudom.'
    },
    inputsNeeded: {
      en: ['Core Topic', 'Client Win Details', 'Call-to-Action Link'],
      bs: ['Glavna Tema', 'Detalji Uspjeha Klijenta', 'Link za Prijavu']
    },
    promptText: {
      en: `Write a high-converting weekly email newsletter for {{Founder_Name}}'s subscriber list.
Topic: {{Core_Topic}}
Client Case: {{Client_Win}}

Structure:
1. SUBJECT LINE: 3 variations (Curiosity, Benefit-driven, Contrarian). Keep all under 40 characters.
2. PREVIEW TEXT: 1 snappy sentence.
3. THE HOOK (Story): A 2-paragraph real situation illustrating the pain point.
4. THE 3-STEP FRAMEWORK: Clear bullet points explaining how to solve it.
5. THE CLIENT PROOF: How {{Client_Win}} achieved results in 14 days using this method.
6. THE CALL TO ACTION: A natural invitation to reply or book a 15-minute diagnostic call.

Style: Personal, like an email from a trusted friend who happens to be a top 1% industry expert.`,
      bs: `Napiši sedmični email newsletter za pretplatnike klijenta {{Founder_Name}}.
Tema: {{Core_Topic}}
Uspjeh: {{Client_Win}}

Struktura:
1. NASLOV (Subject): 3 varijacije (Radoznalost, Korist, Suprotno mišljenje) ispod 40 karaktera.
2. UVOD (Priča): 2 kratka pasusa iz stvarnog iskustva koji opisuju problem.
3. METODOLOGIJA U 3 KORAKA: Jasne stavke kako riješiti problem.
4. DOKAZ (Studija slučaja): Kako je ostvaren rezultat koristeći ovu metodu.
5. POZIV NA AKCIJU: Nenametljiv poziv na odgovor na email ili zakazivanje kratkog razgovora.

Stil: Ličan, kao email od pouzdanog prijatelja koji je stručnjak u industriji.`
    }
  },
  {
    id: 'content_prompt_4',
    title: {
      en: 'Prompt #4: The Quality Assurance & AI "De-Fluffing" Tone Sanitizer',
      bs: 'Prompt #4: AI Filter za Čišćenje i Humanizaciju Teksta'
    },
    toolTarget: 'Make.com Final Review Node / Hermes Reasoning Step',
    purpose: {
      en: 'Critiques generated drafts, strips any lingering AI robotic cadence, injects natural rhythm, and verifies compliance with client tone rules.',
      bs: 'Pregleda generisani tekst, uklanja robotski prizvuk, ubacuje prirodan ritam i provjerava dužinu.'
    },
    inputsNeeded: {
      en: ['Draft Content', 'Client Tone Preferences'],
      bs: ['Nacrt Sadržaja', 'Preferencije Tona Klijenta']
    },
    promptText: {
      en: `Act as a ruthless Executive Copy Editor. Review the following draft:
"""
{{Draft_Content}}
"""

Your Job:
1. Detect and remove any remaining generic AI transitions (e.g., "Furthermore", "In conclusion", "It is crucial to remember").
2. Vary sentence length: Mix 3-word punchy sentences with longer rhythmic explanations.
3. Ensure the writing sounds like a human talking over coffee, not an automated summary.
4. Return ONLY the finalized, sanitized copy.`,
      bs: `Djeluj kao strogi izvršni urednik teksta. Pregledaj sljedeći nacrt:
"""
{{Draft_Content}}
"""

Tvoj zadatak:
1. Ukloni sve robotske prelaze ("Nadalje", "Zaključno", "Važno je napomenuti").
2. Variraj dužinu rečenica: Kombinuj kratke rečenice od 3 riječi sa fluidnijim objašnjenjima.
3. Osiguraj da tekst zvuči kao čovjek koji priča na kafi, a ne AI sažetak.
4. Vrati SAMO finalni, očišćeni tekst spreman za objavu.`
    }
  }
];

export const CONTENT_PRICING_TIERS = [
  {
    name: { en: '1-Week Pilot (Speed to $100)', bs: '1-Sedmični Pilot (Brzina do $100)' },
    price: 99,
    billing: { en: 'one-time', bs: 'jednokratno' },
    deliverables: {
      en: ['5 Custom LinkedIn Posts', '1 Authority Newsletter Edition', '1 Free Tone Calibration Call/Form', '48-Hour Turnaround'],
      bs: ['5 Objava za LinkedIn', '1 Sedmični Newsletter', 'Prilagođavanje stila klijenta', 'Isporuka u roku od 48h']
    },
    speedToClose: { en: '24 - 48 Hours', bs: '24 - 48 Sati' },
    targetVolume: '1 client = instant $99 (Goal reached!)'
  },
  {
    name: { en: 'Monthly Authority Retainer', bs: 'Mjesečni Retainer za Rast' },
    price: 397,
    billing: { en: 'per month', bs: 'mjesečno' },
    deliverables: {
      en: ['20 LinkedIn Posts (5/week)', '4 Email Newsletters', 'Weekly 10-minute Voice Note Intake', 'Performance Analytics & Lead Hook Tracking'],
      bs: ['20 Objava za LinkedIn (5 sedmično)', '4 Email Newslettera', 'Sedmični unos putem glasovne poruke', 'Praćenje angažmana i leadova']
    },
    speedToClose: { en: '3 - 7 Days', bs: '3 - 7 Dana' },
    targetVolume: '8 clients = $3,176/mo net profit'
  },
  {
    name: { en: 'Full Executive Scaling Suite', bs: 'Kompletan Izvršni Paket' },
    price: 797,
    billing: { en: 'per month', bs: 'mjesečno' },
    deliverables: {
      en: ['All Monthly Retainer items', '4 PDF Slide Carousels for LinkedIn', '1 In-Depth Case Study Article', 'Daily Comment Engagement Strategy'],
      bs: ['Sve iz Mjesečnog Retainera', '4 PDF Karusela za LinkedIn', '1 Detaljna Studija Slučaja', 'Strategija za komentare i leadove']
    },
    speedToClose: { en: '7 - 14 Days', bs: '7 - 14 Dana' },
    targetVolume: '4 clients = $3,188/mo net profit'
  }
];

export const CONTENT_OUTREACH_SCRIPTS: ScriptItem[] = [
  {
    id: 'outreach_content_linkedin',
    channel: { en: 'LinkedIn DM (Founders & Consultants)', bs: 'LinkedIn DM (Vlasnici i Konsultanti)' },
    title: { en: 'The "Free Sample Post" Zero-Friction Hook', bs: 'Ponuda Besplatnog Uzorka Objave (Bez Rizika)' },
    body: {
      en: `Hi {{Founder_Name}}, loved your recent podcast/talk on {{Topic}}. 

I noticed you don't have much time to post on LinkedIn consistently, which means you're probably leaving 2-3 inbound consulting clients on the table every month.

I took 3 minutes from your talk and turned it into 2 formatted LinkedIn posts in your voice. 

No pitch or cost at all—mind if I send them over for you to post?`,
      bs: `Pozdrav {{Founder_Name}}, odličan govor/gostovanje na temu {{Topic}}.

Vidio sam da nemate puno vremena za redovno objavljivanje na LinkedInu, iako bi vam to donosilo nove B2B klijente svakog mjeseca.

Uzeo sam 3 minuta iz vašeg govora i pretvorio ih u 2 gotove LinkedIn objave u vašem stilu.

Potpuno besplatno i bez ikakvih obaveza—mogu li vam ih poslati u poruci pa ih slobodno objavite?`
    },
    tips: {
      en: 'Over 40% response rate! Once they see high-quality posts in their own voice, offering the $99 pilot is a natural yes.',
      bs: 'Preko 40% odgovora! Kada vide kvalitetne objave u svom stilu, ponuda pilot paketa od $99 se zatvara odmah.'
    }
  },
  {
    id: 'outreach_content_email',
    channel: { en: 'Cold Email', bs: 'Hladni Email' },
    title: { en: 'The "Voice-Note to 5 Posts" Pitch', bs: 'Ponuda "Glasovna Poruka u 5 Objava"' },
    subject: { en: 'quick idea for {{Founder_Name}}\'s LinkedIn', bs: 'kratka ideja za profil {{Founder_Name}}' },
    body: {
      en: `Hi {{Founder_Name}},

Quick question: If you could send a 3-minute voice note on WhatsApp every Monday morning and get 5 high-performing LinkedIn posts + 1 weekly newsletter written for you by Wednesday, would that be worth a quick look?

We run an automated AI ghostwriting engine for busy B2B founders.

We're offering a 1-week pilot for $99 (or free if you don't love the copy).

Can I send over a 60-second preview of how it works?

Best,
{{Your_Name}}`,
      bs: `Poštovani {{Founder_Name}},

Kratko pitanje: Kada biste mogli poslati glasovnu poruku od 3 minuta na WhatsApp svakog ponedjeljka i do srijede dobiti 5 gotovih LinkedIn objava i newsletter u vašem stilu, da li bi vas zanimalo pogledati?

Vodimo automatizovani AI sistem za pisanje sadržaja za zauzete preduzetnike.

Nudimo 1-sedmični pilot za $99 (ili besplatno ako niste oduševljeni tekstom).

Mogu li vam poslati kratak prikaz od 60 sekundi kako sistem funkcioniše?

Srdačan pozdrav,
{{Your_Name}}`
    },
    tips: {
      en: 'Send to 10 founders daily. The low $99 price point removes all buyer skepticism.',
      bs: 'Pošaljite 10 osnivača dnevno. Cijena od $99 uklanja svaki strah klijenta od rizika.'
    }
  }
];

export const HERMES_IMPROVEMENTS: HermesImprovement[] = [
  {
    id: 'hermes_tool_calling',
    number: 1,
    title: {
      en: 'Hermes Native Tool-Calling JSON Schemas',
      bs: 'Hermes Natvne JSON Sheme za Pozivanje Alata'
    },
    category: 'tool-calling',
    summary: {
      en: 'Give Hermes strict tool definitions (`create_airtable_post`, `fetch_voice_transcript`, `generate_docs_delivery`) so it calls real APIs via structured JSON.',
      bs: 'Definišite tačne sheme alata tako da Hermes samostalno poziva API baze, transkripcije i Google Docs-a.'
    },
    technicalDetail: {
      en: 'Hermes-2-Pro and Hermes-3 excel at function calling using the `<tool_call>` protocol. Exposing dedicated endpoints allows autonomous execution without human glue code.',
      bs: 'Hermes modeli koriste <tool_call> protokol za direktno izvršavanje funkcija bez posrednika.'
    },
    codeOrSchema: `{
  "type": "function",
  "function": {
    "name": "dispatch_content_deliverables",
    "description": "Saves generated LinkedIn posts and newsletter to Airtable and notifies client",
    "parameters": {
      "type": "object",
      "properties": {
        "client_id": { "type": "string", "description": "Unique ID from Airtable" },
        "linkedin_posts": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "day_number": { "type": "integer", "enum": [1, 2, 3, 4, 5] },
              "hook": { "type": "string" },
              "body_markdown": { "type": "string" },
              "cta": { "type": "string" }
            },
            "required": ["day_number", "hook", "body_markdown", "cta"]
          }
        },
        "newsletter": {
          "type": "object",
          "properties": {
            "subject_line": { "type": "string" },
            "preview_text": { "type": "string" },
            "content_markdown": { "type": "string" }
          },
          "required": ["subject_line", "content_markdown"]
        },
        "quality_score": { "type": "number", "minimum": 1, "maximum": 10 }
      },
      "required": ["client_id", "linkedin_posts", "newsletter", "quality_score"]
    }
  }
}`,
    impact: {
      en: '100% deterministic output formatting, eliminating broken Markdown strings or missing post sections.',
      bs: '100% pouzdan i strukturiran format, bez grešaka u tekstu ili nepotpunih objava.'
    }
  },
  {
    id: 'hermes_output_contract',
    number: 2,
    title: {
      en: 'Strict Pydantic/Zod Content Contract & Output Validation',
      bs: 'Striktna Validacija Sadržaja i Sheme (Zod / Pydantic)'
    },
    category: 'data-validation',
    summary: {
      en: 'Enforce an immutable schema contract so Hermes cannot return conversational chatter when calling Make.com or Airtable.',
      bs: 'Onemogućite nepotrebne AI uvodne rečenice kako bi podaci odmah bili spremni za bazu.'
    },
    technicalDetail: {
      en: 'Configure response_format: { type: "json_object" } with schema constraint. If schema fails validation, trigger an automatic self-healing repair prompt.',
      bs: 'Koristite prisilni JSON format. Ako validacija ne prođe, pokreće se automatska samokorekcija.'
    },
    codeOrSchema: `// Zod Schema Contract for Hermes Output
import { z } from 'zod';

export const ContentPackageSchema = z.object({
  client_id: z.string(),
  posts: z.array(z.object({
    day: z.number().min(1).max(5),
    hook_length_chars: z.number().max(85),
    full_text: z.string().min(120),
    post_angle: z.enum(['framework', 'contrarian', 'story', 'case_study', 'checklist'])
  })).length(5),
  newsletter: z.object({
    subject: z.string().max(45),
    word_count: z.number().min(300).max(650),
    body: z.string()
  }),
  banned_words_detected: z.literal(false)
});`,
    impact: {
      en: 'Guarantees that exactly 5 posts and 1 newsletter are produced on every single agent run.',
      bs: 'Garantuje da agent u svakom pokretanju kreira tačno 5 objava i 1 newsletter.'
    }
  },
  {
    id: 'hermes_few_shot_voice',
    number: 3,
    title: {
      en: 'Dynamic Few-Shot Founder Voice Memory Injection',
      bs: 'Dinamičko Ubacivanje Primjera Stila Klijenta (Few-Shot)'
    },
    category: 'memory',
    summary: {
      en: 'Query Airtable for the client’s 3 highest-performing past posts and inject them into Hermes’s context window before generation.',
      bs: 'Automatski učitajte 3 najbolje prethodne objave klijenta u kontekst kako bi Hermes savršeno replicirao ton.'
    },
    technicalDetail: {
      en: 'Before prompting Hermes, Make.com fetches the `Client_Voice_Samples` field. Hermes analyzes sentence length, vocabulary, and paragraph spacing to match the founder 1:1.',
      bs: 'Make.com prije poziva AI agenta preuzima uzorke pisanja i nalaže Hermes-u da oponaša stil.'
    },
    codeOrSchema: `<system>
You are an autonomous executive ghostwriter for {{client_name}}.
Always mirror the stylistic DNA in these approved few-shot samples:

<sample_1>
{{approved_post_sample_1}}
</sample_1>

<sample_2>
{{approved_post_sample_2}}
</sample_2>

Notice: Short 1-sentence punches, zero exclamation marks, uses numbers and bullet breaks.
</system>`,
    impact: {
      en: 'Rejection rate drops from 35% down to under 4% because the draft sounds authentic from day 1.',
      bs: 'Odbijanje tekstova od strane klijenata pada sa 35% na manje od 4%.'
    }
  },
  {
    id: 'hermes_anti_ai_filter',
    number: 4,
    title: {
      en: 'Strict Anti-AI Vocabulary Guardrail Layer',
      bs: 'Zid Zabrane AI Šablonskih Riječi (Anti-Slop Filter)'
    },
    category: 'guardrails',
    summary: {
      en: 'Hardcode negative constraints directly in Hermes’s prompt to instantly penalize robotic clichés and academic jargon.',
      bs: 'Ubacite negativna pravila koja automatski eliminišu prepoznatljive vještačke AI fraze.'
    },
    technicalDetail: {
      en: 'Hermes responds exceptionally well to explicit negative constraint lists with strict penalty flags in the system prompt.',
      bs: 'Hermes precizno poštuje zabranjene riječi kada su eksplicitno navedene u sistemskom uputstvu.'
    },
    codeOrSchema: `[CRITICAL STYLE NEGATIVE CONSTRAINTS]
If you output ANY of the following words or phrases, the output will be rejected:
- "delve", "testament", "tapestry", "game-changer", "pivotal"
- "in today's digital landscape", "unleash your potential"
- "furthermore", "in conclusion", "it's worth noting"
- "synergy", "seamless", "paramount", "beacon"

Replacement rule: Use plain, conversational language that a founder would say at lunch.`,
    impact: {
      en: 'Posts pass 100% of human perception checks; readers never suspect AI generation.',
      bs: 'Objave zvuče 100% prirodno, a čitaoci ne prepoznaju da je tekst pisao AI.'
    }
  },
  {
    id: 'hermes_sliding_window',
    number: 5,
    title: {
      en: 'Sliding-Window Chunking for Long Transcripts',
      bs: 'Rascjepkano Procesiranje Dugačkih Audio Transkripata'
    },
    category: 'architecture',
    summary: {
      en: 'When a founder uploads a 30-minute podcast or rambling voice memo, chunk and summarize recursively before generating posts.',
      bs: 'Kada klijent pošalje duži video ili govor, podijelite ga na cjeline prije finalne obrade.'
    },
    technicalDetail: {
      en: 'Split raw text into 2,500-token chunks with 200-token overlap, extract key insights per chunk, and synthesize into a single master blueprint for Hermes.',
      bs: 'Tekst se dijeli na manje dijelove koji se sažimaju i objedinjuju u jedinstvenu bazu tema.'
    },
    codeOrSchema: `// Chunking Pipeline in Make.com / Node
function chunkTranscript(text, maxChars = 6000, overlap = 500) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + maxChars));
    start += (maxChars - overlap);
  }
  return chunks;
}`,
    impact: {
      en: 'Prevents context dilution and hallucination, capturing 100% of the valuable nuggets from long conversations.',
      bs: 'Sprječava gubljenje ključnih ideja i osigurava maksimalnu preciznost.'
    }
  },
  {
    id: 'hermes_temperature_tiering',
    number: 6,
    title: {
      en: 'Two-Tier Temperature & Top-P Tuning',
      bs: 'Dvonivojsko Podešavanje Temperature (Kreativnost vs Preciznost)'
    },
    category: 'tool-calling',
    summary: {
      en: 'Use Temperature 0.75 for hook generation, but switch to 0.15 for final JSON serialization and data formatting.',
      bs: 'Koristite veću temperaturu za osmišljavanje udica, a nisku za čisto strukturiranje podataka.'
    },
    technicalDetail: {
      en: 'Split the generation into two sequential Hermes calls: Call 1 (Ideation & Hooks @ temp 0.75) -> Call 2 (Drafting & Schema Packaging @ temp 0.2).',
      bs: 'Podijelite proces u dva koraka: Prvo kreativna ideacija, zatim precizno formatiranje.'
    },
    codeOrSchema: `// Step 1: Creative Hooks
const hooksResponse = await hermes.chat({
  temperature: 0.75,
  top_p: 0.9,
  messages: [{ role: "user", content: "Brainstorm 10 contrarian hooks..." }]
});

// Step 2: Strict JSON Output
const formattedPackage = await hermes.chat({
  temperature: 0.15,
  response_format: { type: "json_object" },
  messages: [{ role: "user", content: "Format the approved hook into ContentPackageSchema..." }]
});`,
    impact: {
      en: 'Maximum hook novelty and virality without sacrificing JSON schema reliability.',
      bs: 'Maksimalna kreativnost udica uz nultu vjerovatnoću greške u formatu.'
    }
  },
  {
    id: 'hermes_agentic_reasoning',
    number: 7,
    title: {
      en: 'Inner Scratchpad Reasoning Loop (<thinking> protocol)',
      bs: 'Unutrašnji Korak za Razmišljanje i Samokritiku (<thinking> Protokol)'
    },
    category: 'guardrails',
    summary: {
      en: 'Instruct Hermes to critique its own drafts against hook virality criteria inside `<thinking>` tags before delivering final text.',
      bs: 'Naložite Hermes-u da unutar posebnih tagova procijeni privlačnost teksta prije konačnog ispisa.'
    },
    technicalDetail: {
      en: 'Hermes-3 natively supports reasoning tags. It grades hook strength from 1-10, discarding any hook below 8 before the user ever sees it.',
      bs: 'Model prvo samostalno ocjenjuje privlačnost uvodnih rečenica i odbacuje sve slabije od 8/10.'
    },
    codeOrSchema: `<system>
Before outputting any post, evaluate inside <thinking> tags:
1. Is Hook 1 compelling enough to stop someone scrolling on mobile?
2. Does the post provide an actionable takeaway, or is it generic advice?
3. Are there any banned AI words?
If any answer is "No", rewrite the draft internally before providing the final answer.
</system>`,
    impact: {
      en: 'Self-corrects weak copywriting before saving to Airtable, drastically increasing engagement.',
      bs: 'Automatski popravlja slabiji tekst prije nego što stigne u bazu klijenta.'
    }
  },
  {
    id: 'hermes_webhook_trigger',
    number: 8,
    title: {
      en: 'Zero-Click Telegram/WhatsApp Audio Ingestion Webhook',
      bs: 'Automatski Prijem Glasovnih Poruka (Telegram/WhatsApp Webhook)'
    },
    category: 'architecture',
    summary: {
      en: 'Set up a free Telegram Bot that forwards founder voice memos directly to Make.com and triggers Hermes in seconds.',
      bs: 'Povežite besplatnog Telegram bota koji prosljeđuje glasovne poruke klijenta direktno u Make.com.'
    },
    technicalDetail: {
      en: 'Founders record a 3-minute voice memo in Telegram while driving or walking. The bot webhook triggers Make.com, passes audio to Whisper/Gemini audio API, then invokes Hermes.',
      bs: 'Klijent samo snimi poruku u hodu, a sistem sve samostalno transkribuje i pretvara u objave.'
    },
    codeOrSchema: `// Telegram Webhook payload handling in Make.com
{
  "update_id": 100234,
  "message": {
    "chat": { "id": 987654321, "title": "Founder Voice Inbox" },
    "voice": {
      "file_id": "AwACAgIAAxkBAA...",
      "duration": 182,
      "mime_type": "audio/ogg"
    }
  }
}`,
    impact: {
      en: 'Reduces client time commitment to 3 minutes/week, creating an effortless high-retention service.',
      bs: 'Vrijeme koje klijent troši smanjuje se na samo 3 minute sedmično, što osigurava dugotrajnu pretplatu.'
    }
  },
  {
    id: 'hermes_hitl_approval',
    number: 9,
    title: {
      en: 'Human-in-the-Loop (HITL) 1-Click Approval Flag in Airtable',
      bs: 'Brzo Jednoklik Odobravanje u Bazi (Human-in-the-Loop)'
    },
    category: 'architecture',
    summary: {
      en: 'Store drafts with `Status: Needs Human Review`. You glance over the text for 60 seconds, tap "Approve", and Make.com auto-delivers.',
      bs: 'Tekstovi se čuvaju sa statusom "Na pregledu". Bacite pogled 60 sekundi, kliknete "Odobri" i sistem šalje klijentu.'
    },
    technicalDetail: {
      en: 'Maintains 100% agency quality guarantee for the agency owner while delegating 98% of the heavy writing to Hermes.',
      bs: 'Daje vam potpunu kontrolu nad kvalitetom uz uštedu 98% vremena za pisanje.'
    },
    codeOrSchema: `Airtable Field Structure:
- [Record_ID] (Auto)
- [Client_Name] (Single line text)
- [Voice_Note_URL] (Attachment)
- [Hermes_Raw_Output] (Long text)
- [Review_Status] (Single Select: "Draft Generated", "Approved", "Re-run AI")
- [1_Click_Approval_Button] (Triggers Make Webhook when set to "Approved")`,
    impact: {
      en: 'Zero risk of sending flawed copy to high-paying clients, keeping your reputation spotless.',
      bs: 'Eliminiše rizik slanja neprovjerenog sadržaja klijentima.'
    }
  },
  {
    id: 'hermes_multi_tenant_rate_limit',
    number: 10,
    title: {
      en: 'Multi-Tenant Queue & Free-Tier API Rate-Limiter',
      bs: 'Red Čekanja i Zaštita Besplatnih API Limita (Multi-Tenant)'
    },
    category: 'error-handling',
    summary: {
      en: 'Implement a 5-second delay queue between batch operations in Make.com so you never exceed the 15 RPM free Gemini limit.',
      bs: 'Ubacite pauzu od 5 sekundi u Make.com kako nikada ne biste prešli besplatne API limite.'
    },
    technicalDetail: {
      en: 'Add a "Sleep / Delay" module in Make.com when processing multi-client batches. If a 429 Rate Limit error occurs, configure Make.com’s automatic error handler with exponential backoff.',
      bs: 'Dodajte modul za odgodu i automatsko ponavljanje zahtjeva u slučaju prekoračenja limita.'
    },
    codeOrSchema: `// Make.com Error Handler Directive
Directive: "Resume" / "Retry"
Attempts: 3
Interval: 15 seconds
Fallback Route: Send alert to owner Telegram with error trace.`,
    impact: {
      en: 'Flawless 24/7 autonomous reliability with $0 paid software subscriptions.',
      bs: 'Besprijekoran rad sistema 24/7 bez ijednog dolara plaćenih pretplata.'
    }
  }
];
