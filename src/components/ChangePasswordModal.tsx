import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { ApiService } from '../services/api';
import { validatePassword } from '../utils/validation';
import { X, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';

interface ChangePasswordModalProps {
  user: User;
  onClose: () => void;
}

const inputClass =
  'field';

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ user, onClose }) => {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirm) {
      setError('Nowe hasła nie są identyczne.');
      return;
    }
    if (password === current) {
      setError('Nowe hasło musi różnić się od obecnego.');
      return;
    }

    setSaving(true);
    try {
      await ApiService.auth.changePassword(user.email, current, password);
      setDone(true);
      setCurrent('');
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zmienić hasła.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div className="bg-white w-full max-w-md border border-line relative">
        <button
          onClick={onClose}
          aria-label="Zamknij okno zmiany hasła"
          className="absolute top-4 right-4 text-gray-400 hover:text-black"
        >
          <X />
        </button>

        <div className="p-8">
          <h2
            id="change-password-title"
            className="text-[22px] font-bold text-ink-900 tracking-tight mb-2 flex items-center gap-2"
          >
            <KeyRound className="w-5 h-5 text-skoczek-primary" aria-hidden="true" /> Zmiana hasła
          </h2>
          <p className="text-gray-500 text-sm mb-6 break-all">{user.email}</p>

          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-600" aria-hidden="true" />
              </div>
              <p className="font-bold text-green-800 mb-2">Hasło zostało zmienione</p>
              <p className="text-sm text-gray-600 mb-6">
                Przy następnym logowaniu użyj nowego hasła.
              </p>
              <button
                onClick={onClose}
                className="bg-skoczek-primary text-white font-bold px-6 py-3 rounded hover:bg-skoczek-primaryHover transition uppercase tracking-wide text-sm"
              >
                Zamknij
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="current-password" className="field-label">
                  Obecne hasło
                </label>
                <input
                  id="current-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className={inputClass}
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="change-new-password" className="field-label">
                  Nowe hasło
                </label>
                <input
                  id="change-new-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Min. 8 znaków"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="change-confirm-password" className="field-label">
                  Powtórz nowe hasło
                </label>
                <input
                  id="change-confirm-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>

              {error && (
                <p role="alert" className="text-red-600 text-sm font-medium bg-red-50 border border-red-100 p-3 rounded flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-skoczek-primary text-white font-bold py-3 rounded hover:bg-skoczek-primaryHover transition uppercase tracking-wide disabled:opacity-50"
              >
                {saving ? 'Zapisywanie...' : 'Zmień hasło'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
