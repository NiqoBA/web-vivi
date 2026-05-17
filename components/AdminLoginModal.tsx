'use client';

import { FormEvent, useState } from 'react';
import { useAlfaAuth } from '@/components/AlfaAuthProvider';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AdminLoginModal({ open, onClose }: Props) {
  const { signIn } = useAlfaAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '');
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      e.currentTarget.reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLoginModalInner onClose={onClose} onSubmit={handleSubmit} error={error} loading={loading} />
  );
}

function AdminLoginModalInner({
  onClose,
  onSubmit,
  error,
  loading,
}: {
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  error: string;
  loading: boolean;
}) {
  return (
    <div
      className="admin-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-modal__dialog" role="dialog" aria-labelledby="admin-login-title">
        <div className="admin-modal__head">
          <h2 className="admin-modal__title" id="admin-login-title">
            Acceso administrador
          </h2>
          <button type="button" className="admin-modal__close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <form className="admin-form" onSubmit={onSubmit}>
          <label>
            <span>Correo</span>
            <input type="email" name="email" required autoComplete="username" />
          </label>
          <label>
            <span>Contraseña</span>
            <input type="password" name="password" required autoComplete="current-password" />
          </label>
          <p className="admin-form__error">{error}</p>
          <div className="admin-form__actions">
            <button type="submit" className="admin-form__submit" disabled={loading}>
              Iniciar sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
