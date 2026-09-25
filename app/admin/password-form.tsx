'use client';
import { useState } from 'react';
import { Loader2, ArrowUpRight } from 'lucide-react';

export default function PasswordForm({ onSuccess, submitLabel = 'Guardar contraseña' }: { onSuccess: () => void; submitLabel?: string }) {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get('currentPassword') || '');
    const newPassword = String(form.get('newPassword') || '');
    const confirmPassword = String(form.get('confirmPassword') || '');
    if (newPassword !== confirmPassword) { setError('Las contraseñas nuevas no coinciden.'); return; }
    setPending(true);
    try {
      const response = await fetch('/api/admin/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'No pudimos cambiar la contraseña.');
      onSuccess();
    } catch (e) { setError(e instanceof Error ? e.message : 'No pudimos cambiar la contraseña.'); setPending(false); }
  }
  return <form onSubmit={submit}>
    <label className="field" htmlFor="currentPassword">Contraseña actual<input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required maxLength={256} /></label>
    <label className="field" htmlFor="newPassword">Nueva contraseña<input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required minLength={10} maxLength={256} /></label>
    <label className="field" htmlFor="confirmPassword">Confirma la nueva contraseña<input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={10} maxLength={256} /></label>
    {error && <p className="error-box" role="alert">{error}</p>}
    <button className="button dark" disabled={pending} type="submit">{pending ? 'Guardando…' : submitLabel}{pending ? <Loader2 size={18} /> : <ArrowUpRight size={18} />}</button>
  </form>;
}
