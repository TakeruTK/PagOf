import { changePassword, createSession } from '@/lib/admin-auth';
import { protect } from '@/lib/server';

export async function POST(request: Request) {
  const headers = {'Cache-Control':'no-store'};
  const denied = await protect(request);
  if (denied) return denied;
  try {
    const body = await request.text();
    if (body.length > 2048) return Response.json({error:'Datos inválidos.'}, {status:400,headers});
    let input;
    try { input = JSON.parse(body); } catch { return Response.json({error:'Datos inválidos.'}, {status:400,headers}); }
    if (!input || typeof input.currentPassword !== 'string' || typeof input.newPassword !== 'string' || input.newPassword.length > 256)
      return Response.json({error:'Datos inválidos.'}, {status:400,headers});
    let changed;
    try { changed = await changePassword(input.currentPassword, input.newPassword); }
    catch (error) { return Response.json({error: error instanceof Error ? error.message : 'No pudimos cambiar la contraseña.'}, {status:400,headers}); }
    if (!changed) return Response.json({error:'La contraseña actual no es correcta.'}, {status:401,headers});
    // The credential just changed, which invalidates every existing session
    // (including this request's) — issue a fresh one so she stays logged in.
    const cookie = await createSession();
    return Response.json({ok:true}, {headers:{...headers,'Set-Cookie':cookie}});
  } catch (error) {
    console.error('Admin password change unavailable', error);
    return Response.json({error:'No pudimos cambiar la contraseña. Vuelve a intentarlo.'}, {status:503,headers});
  }
}
