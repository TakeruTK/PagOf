'use client';
import PasswordForm from './password-form';

export default function ForceChangePassword() {
  return <main className="login-page">
    <div className="brand"><img src="/brand/flor-carolina-alfaro.png" alt="" className="brand-mark" />CAROLINA ALFARO<span>O R F E B R E R Í A</span></div>
    <section className="login-card" aria-labelledby="force-password-title">
      <p className="eyebrow">PRIMER INGRESO</p>
      <h1 id="force-password-title">Elige tu propia contraseña.</h1>
      <p>Por seguridad, antes de continuar debes reemplazar la contraseña temporal por una tuya.</p>
      <PasswordForm submitLabel="Guardar y entrar" onSuccess={() => window.location.reload()} />
    </section>
  </main>;
}
