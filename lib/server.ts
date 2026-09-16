import { env } from 'cloudflare:workers';
import { hasAdminSession } from '@/lib/admin-auth';
export function database(){if(!env.DB) throw new Error('Database unavailable'); return env.DB;}
export async function adminAllowed(request?:Request){return hasAdminSession(request);}
export async function protect(request:Request){if(!await adminAllowed(request))return Response.json({error:'Inicia sesión para administrar el taller.'},{status:401,headers:{'Cache-Control':'no-store'}});if(!['GET','HEAD'].includes(request.method)){const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)return Response.json({error:'Solicitud no permitida.'},{status:403});}return null;}
export function failure(e:unknown){console.error('Gallery storage failed',e);return Response.json({error:'No pudimos completar la operación. Tus cambios siguen en el formulario; vuelve a intentarlo.'},{status:503});}
