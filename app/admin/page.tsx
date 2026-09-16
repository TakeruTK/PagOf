import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { adminAllowed } from '@/lib/server';
import Admin from './studio';
export const dynamic='force-dynamic';
export default async function AdminPage(){await requireChatGPTUser('/admin');if(!await adminAllowed())return <main className="section"><h1>Este taller es privado.</h1><p>Tu cuenta no tiene acceso a la administración.</p><a className="button copper" href="/">Volver a la galería</a></main>;return <Admin/>;}
