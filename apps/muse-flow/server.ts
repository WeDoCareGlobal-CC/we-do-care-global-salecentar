import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { apiRouter } from "./server/api.ts";
import {centralLogin,centralLogout,requireCentralSession} from "./server/centralAuth.ts";
import {speechBridge} from "./server/speechBridge.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3002);

app.disable('x-powered-by');
app.use(express.json({limit:'256kb'}));
app.get('/api/health',(_req,res)=>res.json({ok:true,module:'muse-flow'}));
app.post('/api/auth/login',async(req,res)=>{
 const {email,password}=req.body||{};
 if(typeof email!=='string'||typeof password!=='string'||email.length>254||password.length>1024)
  return res.status(400).json({error:'Invalid credentials'});
 try{
  const session=await centralLogin(email,password);
  res.setHeader('Cache-Control','no-store');
  return session?res.json(session):res.status(401).json({error:'Invalid credentials'});
 }catch{return res.status(503).json({error:'Central authentication unavailable'});}
});
app.post('/api/auth/logout',centralLogout);
app.post('/api/integrations/speech',requireCentralSession,speechBridge);
app.use('/api',requireCentralSession,apiRouter);

// Serve client in production
if(process.env.NODE_ENV!=='production'){
  const {createServer}=await import('vite');
  const vite=await createServer({server:{middlewareMode:true},appType:'spa'});
  app.use(vite.middlewares);
}else{
  app.use(express.static(path.join(__dirname,'dist')));
  app.get('*',(_req,res)=>res.sendFile(path.join(__dirname,'dist','index.html')));
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
