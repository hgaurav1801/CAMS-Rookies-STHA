import crypto from 'node:crypto';
import { one, pool } from './db.js';
import { HttpError, asyncRoute } from './errors.js';

const COOKIE = 'cams_sid';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const isProduction = () => process.env.NODE_ENV === 'production';
const cookieOptions = () => ({ httpOnly: true, sameSite: 'strict', secure: isProduction() && process.env.APP_ORIGIN?.startsWith('https://'), path: '/', maxAge: MAX_AGE });
export async function createSession(req, res, user) {
  const prev = req.cookies?.[COOKIE];
  if (prev) await pool.execute('DELETE FROM sessions WHERE token_hash = ?', [digest(prev)]);
  const token = crypto.randomBytes(32).toString('hex');
  const csrf = crypto.randomBytes(24).toString('hex');
  await pool.execute('INSERT INTO sessions (token_hash,user_id,csrf_token,expires_at) VALUES (?,?,?,DATE_ADD(NOW(),INTERVAL 7 DAY))', [digest(token),user.id,csrf]);
  res.cookie(COOKIE,token,cookieOptions());
  return csrf;
}
export async function destroySession(req, res) {
  const token = req.cookies?.[COOKIE];
  if (token) await pool.execute('DELETE FROM sessions WHERE token_hash = ?', [digest(token)]);
  res.clearCookie(COOKIE,{ path:'/', sameSite:'strict', httpOnly:true, secure: cookieOptions().secure });
}
export const loadUser = asyncRoute(async (req,_res,next) => {
  req.user = null;
  req.session = null;
  const sid = req.cookies?.[COOKIE];
  if (sid && /^[0-9a-f]{64}$/.test(sid)) {
    const record = await one('SELECT s.token_hash,s.csrf_token,u.id,u.email,u.role FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at > NOW()', [digest(sid)]);
    if (record) { req.user = { id:record.id,email:record.email,role:record.role };req.session = record; }
  }
  next();
});
export const needRole = (...roles) => (req,_res,next) => {
  if (!req.user) return next(new HttpError(401,'UNAUTHENTICATED','Please sign in.'));
  if (!roles.includes(req.user.role)) return next(new HttpError(403,'FORBIDDEN','You do not have permission.'));
  next();
};
export function requireCsrf(req,_res,next) {
  if (!['POST','PUT','PATCH','DELETE'].includes(req.method)) return next();
  if (['/api/auth/login','/api/auth/register'].includes(req.path)) return next();
  if (!req.session) return next(new HttpError(401,'UNAUTHENTICATED','Please sign in.'));
  const got = req.get('X-CSRF-Token') || '';
  const wanted = req.session.csrf_token;
  const left = Buffer.from(got), right = Buffer.from(wanted);
  if (left.length !== right.length || !crypto.timingSafeEqual(left,right)) return next(new HttpError(403,'CSRF_REJECTED','Invalid request token. Refresh and retry.'));
  next();
}
export function checkOrigin(req,_res,next) {
  if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (!origin || (process.env.APP_ORIGIN || 'http://127.0.0.1:5173').split(',').includes(origin)) return next();
  next(new HttpError(403,'ORIGIN_REJECTED','Cross-origin modification is not permitted.'));
}
