import { destroySession, sameOrigin } from '@/lib/admin-auth';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:'Solicitud no permitida.'}, {status:403});
  try {
    return Response.json({ok:true}, {headers:{'Cache-Control':'no-store','Set-Cookie':await destroySession(request)}});
  } catch {
    return Response.json({error:'No pudimos cerrar sesión. Vuelve a intentarlo.'}, {status:503});
  }
}
