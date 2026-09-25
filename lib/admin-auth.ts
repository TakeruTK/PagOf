import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';

const COOKIE = 'taller_session';
const SESSION_SECONDS = 8 * 60 * 60;
const HASH_ITERATIONS = 600_000;
const HASH_FORMAT = /^pbkdf2-sha256:[1-9][0-9]{5,}:[a-f0-9]{32}:[a-f0-9]{64}$/;
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
export const digest = async (value: string) => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
export function authDatabase() {
  if (!env.DB) throw new Error('Database unavailable');
  return env.DB;
}
type Credential = { username: string; hash: string; custom: boolean };
function envCredential(): Credential | null {
  return env.ADMIN_USERNAME && HASH_FORMAT.test(env.ADMIN_PASSWORD_HASH || '')
    ? { username: env.ADMIN_USERNAME, hash: env.ADMIN_PASSWORD_HASH!, custom: false }
    : null;
}
// The env-provided credential (docker-compose/.env) is only the bootstrap value.
// Once the workshop owner sets her own password, the admin_credentials row takes
// over — this lets her rotate it herself from the panel without redeploying.
async function activeCredential(): Promise<Credential | null> {
  const row = await authDatabase().prepare('SELECT username, password_hash FROM admin_credentials WHERE id=?')
    .bind('default').first<{ username: string; password_hash: string }>();
  if (row) return { username: row.username, hash: row.password_hash, custom: true };
  return envCredential();
}
async function verifyAgainst(hash: string, password: string) {
  const [, iterations, salt, expected] = hash.split(':');
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const actual = hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', iterations: Number(iterations), salt: encoder.encode(salt) }, key, 256));
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  return difference === 0;
}
async function hashPassword(password: string) {
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', iterations: HASH_ITERATIONS, salt: encoder.encode(salt) }, key, 256));
  return `pbkdf2-sha256:${HASH_ITERATIONS}:${salt}:${hash}`;
}
export async function authConfigured() {
  if (!env.DB) return !!envCredential();
  return !!(await activeCredential());
}
// True until the workshop owner sets her own password — she must not keep using
// the bootstrap credential that was set up (and typed in chat/config) by whoever deployed the site.
export async function mustChangePassword() {
  if (!env.DB) return false;
  const row = await authDatabase().prepare('SELECT id FROM admin_credentials WHERE id=?').bind('default').first();
  return !row;
}
export async function verifyCredentials(username: string, password: string) {
  const active = await activeCredential();
  if (!active) return false;
  return username === active.username && await verifyAgainst(active.hash, password);
}
export async function changePassword(currentPassword: string, newPassword: string) {
  const active = await activeCredential();
  if (!active) throw new Error('El acceso al taller todavía no está configurado.');
  if (!await verifyAgainst(active.hash, currentPassword)) return false;
  if (newPassword.length < 10) throw new Error('La nueva contraseña debe tener al menos 10 caracteres.');
  if (newPassword === currentPassword) throw new Error('Elige una contraseña distinta a la actual.');
  const hash = await hashPassword(newPassword);
  await authDatabase().prepare(`INSERT INTO admin_credentials (id, username, password_hash, updated_at) VALUES ('default', ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET password_hash=excluded.password_hash, updated_at=excluded.updated_at`)
    .bind(active.username, hash, new Date().toISOString()).run();
  return true;
}
const credentialVersion = async () => {
  const active = await activeCredential();
  return digest(active ? `${active.username}:${active.hash}` : 'unconfigured');
};
function tokenFromHeaders(h: Headers) {
  const token = h.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export async function hasAdminSession(request?: Request) {
  if (!await authConfigured()) return false;
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
function clientIp(request: Request) {
  // Cloudflare's managed edge supplies cf-connecting-ip. Self-hosted behind our own
  // reverse proxy (Caddy/Nginx on the same VPS, app bound to 127.0.0.1 only) there is
  // no Cloudflare, so we trust x-real-ip / the first x-forwarded-for hop instead — safe
  // only because the app is unreachable except through that trusted local proxy, which
  // overwrites any client-supplied copy of these headers before forwarding.
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
}
export async function loginAttempt(request: Request) {
  // Local development shares one attempt budget.
  const key = await digest(import.meta.env.DEV ? 'local' : clientIp(request));
  const now = Date.now();
  const db = authDatabase();
  await db.prepare('DELETE FROM admin_login_attempts WHERE expires_at<=?').bind(now).run();
  const row = await db.prepare(`INSERT INTO admin_login_attempts (key, attempts, expires_at) VALUES (?,1,?)
    ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 RETURNING attempts,expires_at`)
    .bind(key, now + 15 * 60 * 1000).first<{attempts:number;expires_at:number}>();
  if (!row) throw new Error('Login unavailable');
  return {key, allowed:row.attempts <= 8, retryAfter:Math.max(1, Math.ceil((row.expires_at-now)/1000))};
}
