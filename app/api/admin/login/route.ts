import { authConfigured, authDatabase, createSession, loginAttempt, sameOrigin, verifyCredentials } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const headers = {'Cache-Control':'no-store'};
  if (!sameOrigin(request)) return Response.json({error:'Solicitud no permitida.'}, {status:403,headers});
  try {
    if (!await authConfigured()) return Response.json({error:'El acceso al taller todavía no está configurado.'}, {status:503,headers});
    const body = await request.text();
    if (body.length > 2048) return Response.json({error:'Datos de acceso inválidos.'}, {status:400,headers});
    let input;
    try { input = JSON.parse(body); } catch { return Response.json({error:'Datos de acceso inválidos.'}, {status:400,headers}); }
    if (!input || typeof input.username !== 'string' || typeof input.password !== 'string' || input.username.length > 100 || input.password.length > 256)
      return Response.json({error:'Datos de acceso inválidos.'}, {status:400,headers});
    const attempt = await loginAttempt(request);
    if (!attempt.allowed) return Response.json({error:'Demasiados intentos. Espera 15 minutos antes de volver a intentar.'}, {status:429,headers:{...headers,'Retry-After':String(attempt.retryAfter)}});
    if (!await verifyCredentials(input.username, input.password)) return Response.json({error:'Usuario o contraseña incorrectos.'}, {status:401,headers});
    const cookie = await createSession();
    await authDatabase().prepare('DELETE FROM admin_login_attempts WHERE key=?').bind(attempt.key).run();
    return Response.json({ok:true}, {headers:{...headers,'Set-Cookie':cookie}});
  } catch (error) {
    console.error('Admin sign-in unavailable', error);
    return Response.json({error:'No pudimos iniciar sesión. Vuelve a intentarlo.'}, {status:503,headers});
  }
}
