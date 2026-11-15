import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import router from './routes/index.js';
import { pool } from './lib/db.js';
import { errorHandler } from './lib/errors.js';
import { loadUser, checkOrigin, requireCsrf } from './lib/auth.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '180kb' }));
app.use(cookieParser());
app.use('/api/auth',rateLimit({windowMs:15*60*1000,limit:50,standardHeaders:'draft-7',legacyHeaders:false}));
app.use(checkOrigin);
app.use(loadUser);
app.use(requireCsrf);
app.use('/api',router);
app.get('/api/health',(_req,res)=>res.json({data:{status:'ok'},message:'OK'}));
const webDist = path.resolve(__dirname,'../../web/dist');
if (fs.existsSync(path.join(webDist,'index.html'))) {
  app.use(express.static(webDist));
  app.get('*',(_req,res)=>res.sendFile(path.join(webDist,'index.html')));
}
app.use((_req,res)=>res.status(404).json({error:{code:'NOT_FOUND',message:'Resource not found.'}}));
app.use(errorHandler);
const port = Number(process.env.PORT || 4000);
try {
  await pool.query('SELECT 1');
  app.listen(port,'127.0.0.1',()=>console.log(`CAMS API ready at http://127.0.0.1:${port}`));
} catch (error) {
  console.error('CAMS cannot connect to MySQL. Check api/.env and run schema.sql.',error.message);
  process.exit(1);
}
