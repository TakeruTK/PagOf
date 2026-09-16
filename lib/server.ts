import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export function database(){if(!env.DB) throw new Error('Database unavailable'); return env.DB;}
export async function adminAllowed(){const user=await getChatGPTUser();if(!user)return false;const emails=(env.ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase());return emails.includes(user.email.toLowerCase()) || (import.meta.env.DEV && user.email==='seedy@sites.test');}
export async function protect(request:Request){if(!await adminAllowed())return Response.json({error:'Necesitas una cuenta autorizada para administrar el taller.'},{status:403});if(!['GET','HEAD'].includes(request.method)){const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)return Response.json({error:'Solicitud no permitida.'},{status:403});}return null;}
export function failure(e:unknown){console.error('Gallery storage failed',e);return Response.json({error:'No pudimos completar la operación. Tus cambios siguen en el formulario; vuelve a intentarlo.'},{status:503});}
