import { adminAllowed } from '@/lib/server';
import Admin from './studio';
import Login from './login';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:false}};
export default async function AdminPage(){
  try { return await adminAllowed() ? <Admin/> : <Login/>; }
  catch { return <main className="section"><h1>El taller no está disponible.</h1><p>Vuelve a intentarlo en unos momentos.</p><a className="button copper" href="/admin">Volver a intentar</a></main>; }
}
