import React, { useCallback, useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { ApiService } from '../services/api';
import { validatePassword } from '../utils/validation';
import { CheckCircle, AlertCircle, Send } from 'lucide-react';

interface SetPasswordFormProps {
  /** Called after the password was changed, with the refreshed user. */
  onDone: (user: User | null) => void;
  onNavigate: (to: string) => void;
}

type Status = 'checking' | 'ready' | 'expired' | 'saved';

const inputClass =
  'field';

/** Reads an error handed back by Supabase in the URL hash or query string. */
function errorFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const fromQuery = new URLSearchParams(window.location.search);
  const code = fromHash.get('error') || fromQuery.get('error');
  if (!code) return null;
  return (
    fromHash.get('error_description') ||
    fromQuery.get('error_description') ||
    'Link do zmiany hasła jest nieprawidłowy lub wygasł.'
  );
}

const SetPasswordForm: React.FC<SetPasswordFormProps> = ({ onDone, onNavigate }) => {
  const [status, setStatus] = useState<Status>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-send form (shown when the link is no longer valid)
  const [resendEmail, setResendEmail] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [panelPath, setPanelPath] = useState('/panel-klienta');

  useEffect(() => {
    let active = true;

    const urlError = errorFromUrl();
    if (urlError) {
      setError(urlError);
      setStatus('expired');
      return;
    }

    ApiService.auth.waitForSession().then((hasSession) => {
      if (!active) return;
      setStatus(hasSession ? 'ready' : 'expired');
    });

    return () => {
      active = false;
    };
  }, []);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
      if (password !== confirm) {
        setError('Hasła nie są identyczne.');
        return;
      }

      setSaving(true);
      try {
        await ApiService.auth.setPassword(password);
        const user = await ApiService.auth.me();
        setPanelPath(user?.role === UserRole.ADMIN ? '/panel-mechanika' : '/panel-klienta');
        setStatus('saved');
        setPassword('');
        setConfirm('');
        onDone(user);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nie udało się zapisać nowego hasła.');
      } finally {
        setSaving(false);
      }
    },
    [password, confirm, onDone],
  );

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendState('sending');
    await ApiService.auth.requestPasswordReset(resendEmail);
    setResendState('sent');
  };

  return (
    <div className="panel p-8 md:p-10">
      <div className="border-b border-line pb-7 mb-8">
        <p className="eyebrow mb-3">Konto</p>
        <h1 className="text-[28px] font-bold text-ink-900 tracking-tighter">Ustaw nowe hasło</h1>
      </div>

      {status === 'checking' && (
        <p className="text-gray-500 animate-pulse py-8 text-center" role="status">
          Sprawdzanie linku...
        </p>
      )}

      {status === 'ready' && (
        <form onSubmit={handleSave} className="space-y-5">
          <p className="text-gray-600 text-sm">
            Wpisz nowe hasło do swojego konta. Po zapisaniu zostaniesz od razu zalogowany.
          </p>

          <div>
            <label htmlFor="new-password" className="field-label">
              Nowe hasło
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              autoFocus
              className={inputClass}
              placeholder="Min. 8 znaków"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="field-label">
              Powtórz nowe hasło
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
              placeholder="Powtórz hasło"
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
            className="w-full bg-skoczek-primary text-white font-semibold py-3 rounded hover:bg-skoczek-primaryHover transition uppercase tracking-wider text-sm disabled:opacity-50"
          >
            {saving ? 'Zapisywanie...' : 'Zapisz nowe hasło'}
          </button>
        </form>
      )}

      {status === 'saved' && (
        <div className="text-center py-6 animate-fade-in">
          <div className="w-16 h-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-green-800 mb-2">Hasło zostało zmienione</h2>
          <p className="text-gray-600 text-sm mb-6">
            Możesz już korzystać z konta. Nowe hasło obowiązuje od teraz.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNavigate(panelPath)}
              className="bg-skoczek-primary text-white font-semibold px-6 py-3 rounded hover:bg-skoczek-primaryHover transition uppercase tracking-wider text-sm"
            >
              Przejdź do panelu
            </button>
            <button
              onClick={() => onNavigate('/')}
              className="bg-white text-gray-900 border border-gray-300 font-semibold px-6 py-3 rounded hover:border-skoczek-primary transition uppercase tracking-wider text-sm"
            >
              Strona główna
            </button>
          </div>
        </div>
      )}

      {status === 'expired' && (
        <div className="space-y-6">
          <div className="bg-orange-50 border border-skoczek-primary/20 p-4 rounded flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-skoczek-primary" aria-hidden="true" />
            <div>
              <p className="font-semibold text-ink-900">Link wygasł lub został już użyty</p>
              <p className="text-sm text-gray-600 mt-1">
                {error || 'Linki do zmiany hasła są jednorazowe i ważne przez ograniczony czas.'}
              </p>
            </div>
          </div>

          {resendState === 'sent' ? (
            <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 p-4 rounded">
              Jeśli konto o tym adresie istnieje, wysłaliśmy na nie nowy link do zmiany hasła.
              Sprawdź skrzynkę, również folder ze spamem.
            </p>
          ) : (
            <form onSubmit={handleResend} className="space-y-4">
              <div>
                <label htmlFor="resend-email" className="field-label">
                  Wyślij nowy link na adres e-mail
                </label>
                <input
                  id="resend-email"
                  type="email"
                  required
                  autoComplete="email"
                  className={inputClass}
                  placeholder="twoj@email.pl"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={resendState === 'sending'}
                className="w-full bg-black text-white font-bold py-3 rounded hover:bg-gray-800 transition uppercase text-sm tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resendState === 'sending' ? 'Wysyłanie...' : 'Wyślij link'}
                <Send className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default SetPasswordForm;
