import { adminAllowed } from '@/lib/server';
import Admin from './studio';
import Login from './login';
import Link from 'next/link';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:false}};
export default async function AdminPage(){
  let allowed: boolean;
  try { allowed = await adminAllowed(); }
  catch { return <main className="section"><h1>El taller no está disponible.</h1><p>Vuelve a intentarlo en unos momentos.</p><Link className="button copper" href="/admin">Volver a intentar</Link></main>; }
  return allowed ? <Admin/> : <Login/>;
}
