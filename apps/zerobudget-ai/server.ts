import {centralIdentity,centralLogin} from "./centralAuth";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import crypto from "node:crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3001);

  app.use(express.json({ limit: "32kb" }));

  // Initialize Gemini lazily
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }
      aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Private pilot access: a server-side token, never a public embedded secret.
  // For production replace with SaleCentar user sessions and durable per-user quotas.
  const ownerToken = process.env.ZERO_BUDGET_AI_TOKEN;
  if (!process.env.SALECENTAR_AUTH_URL && (!ownerToken || ownerToken.length < 24)) {
    throw new Error("Set ZERO_BUDGET_AI_TOKEN (at least 24 characters) before starting.");
  }
  const aiUsage = new Map<string, { day: string; count: number }>();
  const dailyLimit = Math.max(1, Number(process.env.ZERO_BUDGET_AI_DAILY_LIMIT || 20));
  async function guardAi(req: express.Request, res: express.Response, next: express.NextFunction) {
    const header = req.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if(process.env.SALECENTAR_AUTH_URL){
      try{
        const user=await centralIdentity(token,'zerobudget-ai');
        if(!user)return res.status(401).json({error:'Central login required'});
        const day=new Date().toISOString().slice(0,10);
        const key=user.id+':'+day;
        const count=aiUsage.get(key)?.count||0;
        if(count>=dailyLimit)return res.status(429).json({error:'Daily AI limit reached'});
        aiUsage.set(key,{day,count:count+1});
        return next();
      }catch{return res.status(503).json({error:'Central authentication unavailable'});}
    }
    // Constant-time compare for tokens of matching byte length.
    const a = Buffer.from(token);
    const b = Buffer.from(ownerToken!);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const day = new Date().toISOString().slice(0, 10);
    const usage = aiUsage.get("owner");
    const count = usage?.day === day ? usage.count : 0;
    if (count >= dailyLimit) return res.status(429).json({ error: "Daily AI limit reached" });
    aiUsage.set("owner", { day, count: count + 1 });
    next();
  }

  app.post('/api/auth/login',async(req,res)=>{
    if(!process.env.SALECENTAR_AUTH_URL)return res.status(404).json({error:'Central auth not configured'});
    const {email,password}=req.body||{};
    if(typeof email!=='string'||typeof password!=='string')return res.status(400).json({error:'Invalid credentials'});
    try{
      const session=await centralLogin(email,password);
      if(!session)return res.status(401).json({error:'Invalid credentials'});
      res.setHeader('Cache-Control','no-store');
      return res.json(session);
    }catch{return res.status(503).json({error:'Central auth unavailable'});}
  });

  app.post('/api/auth/logout',async(req,res)=>{
    if(!process.env.SALECENTAR_AUTH_URL)return res.status(404).json({error:'Central auth not configured'});
    try{
      const upstream=await fetch(new URL('/auth/logout',process.env.SALECENTAR_AUTH_URL),{
        method:'POST',headers:{authorization:req.get('authorization')||''}
      });
      if(!upstream.ok)return res.status(503).json({error:'Central logout unavailable'});
      return res.json({ok:true});
    }catch{return res.status(503).json({error:'Central logout unavailable'});}
  });

  // Owner-operated pilot intake. Payment is NEVER confirmed by this endpoint.
  // HMAC secret stays on the server; browser sends only the pilot owner token.
  app.post("/api/pilot-order", async (req, res) => {
    const header = req.get("authorization") || "";
    const candidate = header.startsWith("Bearer ") ? header.slice(7) : "";
    if(process.env.SALECENTAR_AUTH_URL){
      try{
        const user=await centralIdentity(candidate,'zerobudget-ai');
        if(!user||user.role!=='admin')return res.status(403).json({error:'SaleCentar admin required'});
      }catch{return res.status(503).json({error:'Central auth unavailable'});}
    }else{
    const left = Buffer.from(candidate);
    const right = Buffer.from(ownerToken);
    if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    }
    const email = req.body?.customer_email;
    if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Valid customer email required" });
    }
    const syncUrl = process.env.SALECENTAR_SYNC_URL;
    const syncSecret = process.env.SALECENTAR_ZERO_BUDGET_SECRET;
    const price = Number(process.env.ZERO_BUDGET_PACK_PRICE_CENTS);
    if (!syncUrl || !/^https?:\/\//.test(syncUrl) || !syncSecret || syncSecret.length < 32 ||
        !Number.isSafeInteger(price) || price <= 0) {
      return res.status(503).json({ error: "SaleCentar order intake is not configured" });
    }
    // Use a fresh UUID per owner submission; retry of the same submission is not yet supported.
    const orderId = crypto.randomUUID();
    const body = JSON.stringify({
      format: "salecentar-pilot-v1",
      orders: [{ order_id: orderId, customer_email: email, offer_code: "ZERO_BUDGET_AI_DIGITAL_PACK",
        price_cents: price, currency: "EUR", status: "pending", created_at: new Date().toISOString() }]
    });
    const timestamp = String(Date.now());
    const signature = "sha256=" + crypto.createHmac("sha256", syncSecret).update(timestamp + "." + body).digest("hex");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      let upstream;
      try {
        upstream = await fetch(syncUrl, { method: "POST", headers: {
          "content-type": "application/json", "x-wdc-signature": signature, "x-wdc-timestamp": timestamp
        }, body, signal: controller.signal });
      } finally { clearTimeout(timeout); }
      if (!upstream.ok) return res.status(502).json({ error: "SaleCentar did not accept order" });
      return res.status(201).json({ order_id: orderId, status: "pending", payment_verified: false });
    } catch {
      return res.status(502).json({ error: "SaleCentar unavailable; verify before resubmitting" });
    }
  });

  // Custom Niche & Copy Generator API endpoint
  app.post("/api/generate-custom", guardAi, async (req, res) => {
    try {
      const { prompt, language = "bs" } = req.body;
      if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 6000 || !["bs", "en"].includes(language)) {
        return res.status(400).json({ error: "Invalid prompt or language" });
      }

      const client = getGeminiClient();
      const systemInstruction = language === "bs"
        ? "Ti si vrhunski stručnjak za AI automatizacije, digitalni marketing i B2B prodaju. Daj konkretne, profesionalne i odmah primjenjive odgovore bez prazne teorije."
        : "You are a world-class AI automation, B2B sales, and digital marketing strategist. Provide ultra-actionable, professional, step-by-step responses without fluff.";

      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ result: response.text });
    } catch (err: any) {
      console.error("Gemini API error:", err);
      res.status(process.env.GEMINI_API_KEY ? 502 : 503).json({
        error: process.env.GEMINI_API_KEY ? "AI generation temporarily unavailable" : "AI service not configured",
      });
    }
  });

  // Vite dev server middleware or static serve
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
