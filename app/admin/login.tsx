'use client';
import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [error,setError] = useState('');
  const [pending,setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:form.get('username'),password:form.get('password')})});
      const result = await response.json() as {error?:string};
      if (!response.ok) throw new Error(result.error || 'No pudimos iniciar sesión.');
      window.location.replace('/admin');
    } catch (e) { setError(e instanceof Error ? e.message : 'No pudimos iniciar sesión.'); setPending(false); }
  }
  return <main className="login-page"><a className="brand" href="/">CAROLINA ALFARO<span>O R F E B R E R Í A</span></a><section className="login-card" aria-labelledby="login-title"><p className="eyebrow">ACCESO AL TALLER</p><h1 id="login-title">Tu espacio para crear.</h1><p>Ingresa para administrar tus piezas y publicaciones.</p><form onSubmit={submit}><label className="field" htmlFor="username">Usuario<input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={100}/></label><label className="field" htmlFor="password">Contraseña<input id="password" name="password" type="password" autoComplete="current-password" required maxLength={256}/></label>{error&&<p className="error-box" role="alert">{error}</p>}<button className="button dark" disabled={pending} type="submit">{pending?'Ingresando…':'Entrar al taller'}{pending?<Loader2 size={18}/>:<ArrowUpRight size={18}/>}</button></form><a className="login-back" href="/"><ArrowLeft size={16}/> Volver a la página</a></section></main>;
}
