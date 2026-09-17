import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';

const COOKIE = 'taller_session';
const SESSION_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
export const digest = async (value: string) => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
export function authDatabase() {
  if (!env.DB) throw new Error('Database unavailable');
  return env.DB;
}
export function authConfigured() {
  return !!env.ADMIN_USERNAME && /^pbkdf2-sha256:100000:[a-f0-9]{32}:[a-f0-9]{64}$/.test(env.ADMIN_PASSWORD_HASH || '');
}
export async function verifyCredentials(username: string, password: string) {
  if (!authConfigured()) return false;
  const [, , salt, expected] = env.ADMIN_PASSWORD_HASH!.split(':');
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const actual = hex(await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', iterations:100000, salt:encoder.encode(salt)}, key, 256));
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  return difference === 0 && username === env.ADMIN_USERNAME;
}
const credentialVersion = () => digest(`${env.ADMIN_USERNAME}:${env.ADMIN_PASSWORD_HASH}`);
function tokenFromHeaders(h: Headers) {
  const token = h.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export async function hasAdminSession(request?: Request) {
  if (!authConfigured()) return false;
  const token = tokenFromHeaders(request ? request.headers : await headers());
  if (!token) return false;
  const row = await authDatabase().prepare('SELECT token_hash FROM admin_sessions WHERE token_hash=? AND expires_at>? AND credential_version=?')
    .bind(await digest(token), Date.now(), await credentialVersion()).first();
  return !!row;
}
export function sameOrigin(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}
function sessionCookie(token: string, maxAge: number) {
  const secure = env.SESSION_COOKIE_SECURE === 'false' ? '' : import.meta.env.DEV ? '' : '; Secure';
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}
export async function createSession() {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
  const db = authDatabase();
  await db.batch([
    db.prepare('DELETE FROM admin_sessions WHERE expires_at<=?').bind(Date.now()),
    db.prepare('INSERT INTO admin_sessions (token_hash,expires_at,credential_version) VALUES (?,?,?)')
      .bind(await digest(token), Date.now() + SESSION_SECONDS * 1000, await credentialVersion()),
  ]);
  return sessionCookie(token, SESSION_SECONDS);
}
export async function destroySession(request: Request) {
  const token = tokenFromHeaders(request.headers);
  if (token) await authDatabase().prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await digest(token)).run();
  return sessionCookie('', 0);
}
export async function loginAttempt(request: Request) {
  // Cloudflare supplies this header; local development shares one attempt budget.
  const key = await digest(import.meta.env.DEV ? 'local' : (request.headers.get('cf-connecting-ip') || 'unknown'));
  const now = Date.now();
  const db = authDatabase();
  await db.prepare('DELETE FROM admin_login_attempts WHERE expires_at<=?').bind(now).run();
  const row = await db.prepare(`INSERT INTO admin_login_attempts (key, attempts, expires_at) VALUES (?,1,?)
    ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 RETURNING attempts,expires_at`)
    .bind(key, now + 15 * 60 * 1000).first<{attempts:number;expires_at:number}>();
  if (!row) throw new Error('Login unavailable');
  return {key, allowed:row.attempts <= 8, retryAfter:Math.max(1, Math.ceil((row.expires_at-now)/1000))};
}
