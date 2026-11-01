import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { User } from './types';
import { ApiService } from './services/api';
import { ADDRESS, PHONE, EMAIL, PRICING_DATA, FULL_REGULATIONS, PRIVACY_POLICY } from './constants';
import ServiceForm from './components/ServiceForm';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import CookieBanner from './components/CookieBanner';
import { validatePassword, validateRegistration } from './utils/validation';
import { Menu, X } from 'lucide-react';

const HOURS = 'Pn–Pt 10:00–18:00';
const BRANDS = ['FOX', 'RockShox', 'Öhlins', 'Marzocchi', 'SR Suntour'];
const fieldClass = 'w-full border border-skoczek-line bg-skoczek-paper px-3 py-3 text-skoczek-ink outline-none focus:border-skoczek-ink';

const SuspensionLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <g transform="translate(50, 50) rotate(-45) translate(-50, -50)">
      <rect x="42" y="10" width="16" height="22" fill="currentColor" />
      <circle cx="50" cy="12" r="5" fill="#f4ecdc" stroke="currentColor" strokeWidth="3"/>
      <rect x="62" y="15" width="14" height="35" fill="currentColor" />
      <rect x="46" y="30" width="8" height="50" fill="currentColor" opacity="0.35"/>
      <path d="M40 36 L60 41.5 L40 47 L60 52.5 L40 58 L60 63.5 L40 69 L60 74.5"
            stroke="currentColor" strokeWidth="5" strokeLinecap="square" strokeLinejoin="miter" />
      <rect x="44" y="80" width="12" height="12" fill="currentColor" />
      <circle cx="50" cy="90" r="5" fill="#f4ecdc" stroke="currentColor" strokeWidth="3"/>
    </g>
  </svg>
);

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (!isLogin) {
        const registrationError = validateRegistration(formData.name, formData.phone);
        if (registrationError) {
          setError(registrationError);
          return;
        }
      }

      const result = isLogin
        ? await ApiService.auth.login(formData.email, formData.password)
        : await ApiService.auth.register({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
          });
      onLoginSuccess(result.user);
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd serwera.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-skoczek-ink/50 p-4">
      <div className="relative w-full max-w-md border border-skoczek-ink bg-skoczek-card p-6">
        <button onClick={onClose} className="absolute right-4 top-4 text-skoczek-muted hover:text-skoczek-ink" aria-label="Zamknij">
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-display text-3xl text-skoczek-ink">{isLogin ? 'Wejście' : 'Nowe konto'}</h2>
        <p className="mb-6 mt-1 text-sm text-skoczek-muted">Konto służy do śledzenia zlecenia.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <>
              <input required placeholder="Imię i nazwisko" className={fieldClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input required placeholder="Telefon" className={fieldClass} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </>
          )}
          <input required type="email" placeholder="E-mail" className={fieldClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input required type="password" placeholder="Hasło, min. 8 znaków" minLength={8} className={fieldClass} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          {error && <p className="border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</p>}
          <button disabled={loading} type="submit" className="w-full bg-skoczek-primary py-3 font-semibold text-white hover:bg-skoczek-primaryHover disabled:opacity-50">
            {loading ? 'Chwila...' : (isLogin ? 'Zaloguj' : 'Załóż konto')}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-skoczek-muted">
          {isLogin ? 'Nie masz konta? ' : 'Masz już konto? '}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-semibold text-skoczek-ink underline">
            {isLogin ? 'Załóż konto' : 'Zaloguj się'}
          </button>
        </p>
      </div>
    </div>
  );
};

const ContactInquiryForm = () => {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', company: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.company.trim()) {
      setSent(true);
      return;
    }
    setSubmitting(true);
    try {
      await ApiService.inquiries.create({
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
      });
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Nie udało się zapisać zapytania.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="border border-skoczek-line bg-skoczek-paper p-8">
        <h3 className="font-display text-3xl text-skoczek-ink">Zapytanie zapisane</h3>
        <p className="mt-2 text-skoczek-muted">Skontaktujemy się najszybciej jak to możliwe.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-3">
      <h3 className="font-display text-3xl text-skoczek-ink">Krótkie pytanie</h3>
      <div className="absolute -left-[9999px] h-0 overflow-hidden" aria-hidden="true">
        <label>
          Firma
          <input tabIndex={-1} autoComplete="off" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input required placeholder="Imię" className={fieldClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input required type="email" placeholder="E-mail" className={fieldClass} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      </div>
      <input required placeholder="Temat, np. wycena serwisu" className={fieldClass} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
      <textarea required rows={4} placeholder="Wiadomość" className={fieldClass} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={submitting} className="w-full bg-skoczek-ink py-3 font-semibold text-skoczek-paper disabled:opacity-50">
        {submitting ? 'Zapisywanie...' : 'Zapisz pytanie'}
      </button>
    </form>
  );
};

const PricingSection = () => {
  const [activeTab, setActiveTab] = useState<'FRONT' | 'REAR' | 'OTHER'>('FRONT');
  const activeData = PRICING_DATA.find(d => d.id === activeTab);
  const tabLabel = (id: string) => id === 'FRONT' ? 'Przód' : id === 'REAR' ? 'Tył' : 'Inne';

  return (
    <section id="cennik" className="scroll-mt-24 py-14">
      <div className="perf mx-auto mb-10 max-w-5xl" aria-hidden="true" />
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="font-display text-4xl text-skoczek-ink">Cennik</h2>
        <p className="mt-2 text-skoczek-muted">Stawki w złotych. Serwis i wersja z uszczelkami, jeśli jest w karcie.</p>

        <div className="mt-6 flex gap-6 overflow-x-auto border-b border-skoczek-line">
          {PRICING_DATA.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`shrink-0 border-b-2 pb-2 text-base ${activeTab === cat.id ? 'border-skoczek-ink font-semibold text-skoczek-ink' : 'border-transparent text-skoczek-muted'}`}
            >
              {tabLabel(cat.id)}
            </button>
          ))}
        </div>

        {activeTab === 'OTHER' ? (
          <table className="mt-6 w-full text-left">
            <tbody>
              {activeData?.services?.map((svc) => (
                <tr key={svc.name} className="border-b border-skoczek-line">
                  <td className="py-3 pr-4 text-skoczek-ink">{svc.name}</td>
                  <td className="py-3 text-right font-mono text-skoczek-ink">{svc.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="mt-8 space-y-8">
            {activeData?.brands?.map((brand) => (
              <div key={brand.name}>
                <h3 className="inline-block border border-skoczek-ink px-2 py-1 font-display text-xl text-skoczek-ink">{brand.name}</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left">
                    <thead className="text-xs uppercase tracking-wide text-skoczek-muted">
                      <tr>
                        <th className="py-2 font-semibold">Model</th>
                        <th className="py-2 text-right font-semibold">Serwis</th>
                        <th className="py-2 text-right font-semibold">Z uszczelkami</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brand.rows.map((row) => (
                        <tr key={row.model} className="border-t border-skoczek-line">
                          <td className="py-2 pr-4 text-skoczek-ink">{row.model}</td>
                          <td className="py-2 text-right font-mono">{row.priceService || '—'}</td>
                          <td className="py-2 text-right font-mono">{row.priceFull || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'HOME' | 'DASHBOARD' | 'FORM' | 'REGULATIONS' | 'CONTACT' | 'ADMIN' | 'PRIVACY'>('HOME');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const [cookieConsent, setCookieConsent] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  useEffect(() => {
    const initApp = async () => {
      if (localStorage.getItem('skoczek_cookie_consent') === 'true') {
        setCookieConsent(true);
      }

      try {
        const currentUser = await ApiService.auth.me();
        if (currentUser) setUser(currentUser);
      } catch (e) {
        console.error("Session check failed", e);
      } finally {
        setAppLoading(false);
      }
    };

    initApp();
  }, []);

  const handleAcceptCookies = () => {
    setCookieConsent(true);
  };

  const handleLogout = async () => {
    await ApiService.auth.logout();
    setUser(null);
    setView('HOME');
  };

  const go = (target: typeof view) => {
    setView(target);
    setMobileMenuOpen(false);
  };

  const NavLink = ({ label, target }: { label: string, target: typeof view }) => (
    <button
      onClick={() => go(target)}
      className={`text-left text-base ${view === target ? 'font-semibold text-skoczek-ink underline decoration-skoczek-primary decoration-2 underline-offset-4' : 'text-skoczek-muted hover:text-skoczek-ink'}`}
    >
      {label}
    </button>
  );

  const MapComponent = () => {
    if (!cookieConsent) {
      return (
        <div className="flex h-full w-full flex-col items-start justify-center border border-skoczek-line bg-skoczek-paper p-6">
          <p className="font-semibold text-skoczek-ink">Mapa po zgodzie na cookies</p>
          <p className="mt-1 text-sm text-skoczek-muted">Adres jest obok. Mapa Google ładuje się dopiero po zgodzie.</p>
          <button
            onClick={() => {
              localStorage.setItem('skoczek_cookie_consent', 'true');
              setCookieConsent(true);
            }}
            className="mt-4 bg-skoczek-ink px-4 py-2 text-sm font-semibold text-skoczek-paper"
          >
            Pokaż mapę
          </button>
        </div>
      );
    }

    return (
      <iframe
        title="Mapa dojazdu, Mickiewicza 39, Białystok"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2394.026466759714!2d23.1678!3d53.1325!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471ffc0f00000001%3A0x1234567890abcdef!2sMickiewicza%2039%2C%2015-213%20Bia%C5%82ystok!5e0!3m2!1spl!2spl!4v1620000000000!5m2!1spl!2spl"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
      ></iframe>
    );
  };

  if (appLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-skoczek-paper font-display text-2xl text-skoczek-ink">
        Oddaj Amora
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen flex-col font-sans text-skoczek-ink ${cookieConsent ? '' : 'pb-24'}`}>
      <div className="border-b border-skoczek-line bg-skoczek-paper">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 font-mono text-xs text-skoczek-muted">
          <span>{ADDRESS}</span>
          <span>{HOURS}</span>
          <a href={`tel:${PHONE.replace(/\s+/g, '')}`} className="text-skoczek-ink">{PHONE}</a>
        </div>
      </div>

      <nav className="sticky top-0 z-40 border-b border-skoczek-ink/15 bg-skoczek-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button onClick={() => go('HOME')} className="flex items-center gap-3 text-left">
            <SuspensionLogo className="h-10 w-10 text-skoczek-ink" />
            <span className="font-display text-2xl leading-none">Oddaj Amora</span>
          </button>

          <div className="hidden items-center gap-6 md:flex">
            <NavLink label="Start" target="HOME" />
            <NavLink label="Zgłoś serwis" target="FORM" />
            <NavLink label="Regulamin" target="REGULATIONS" />
            <NavLink label="Kontakt" target="CONTACT" />
            {user && user.role === 'ADMIN' && <NavLink label="Panel" target="ADMIN" />}
            {user && user.role !== 'ADMIN' && <NavLink label="Zlecenia" target="DASHBOARD" />}
            {user ? (
              <button onClick={handleLogout} className="text-sm text-skoczek-muted hover:text-skoczek-ink">Wyloguj</button>
            ) : (
              <button onClick={() => setIsAuthModalOpen(true)} className="border border-skoczek-ink px-3 py-2 text-sm font-semibold">
                Konto
              </button>
            )}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 md:hidden" aria-label="Menu">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="flex flex-col gap-4 border-t border-skoczek-line px-4 py-4 md:hidden">
            <NavLink label="Start" target="HOME" />
            <NavLink label="Zgłoś serwis" target="FORM" />
            <NavLink label="Regulamin" target="REGULATIONS" />
            <NavLink label="Kontakt" target="CONTACT" />
            {user && user.role === 'ADMIN' && <NavLink label="Panel" target="ADMIN" />}
            {user && user.role !== 'ADMIN' && <NavLink label="Zlecenia" target="DASHBOARD" />}
            {user ? (
              <button onClick={handleLogout} className="text-left text-skoczek-muted">Wyloguj</button>
            ) : (
              <button onClick={() => { setIsAuthModalOpen(true); setMobileMenuOpen(false); }} className="bg-skoczek-primary py-3 font-semibold text-white">
                Konto
              </button>
            )}
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {view === 'HOME' && (
          <>
            <section className="mx-auto max-w-5xl px-4 py-12 md:py-16">
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-skoczek-muted">Serwis zawieszenia · Białystok</p>
                <h1 className="mt-3 max-w-xl font-display text-5xl leading-tight text-skoczek-ink md:text-6xl">Oddaj Amora</h1>
                <p className="mt-4 max-w-xl text-lg text-skoczek-muted">
                  Warsztat widelców i damperów w Galerii Rowerowej. Przegląd, naprawa i ustawienie.
                </p>
                <ul className="mt-6 flex flex-wrap gap-2 font-mono text-sm text-skoczek-ink">
                  {BRANDS.map((brand) => (
                    <li key={brand} className="border border-dashed border-skoczek-ink/40 bg-skoczek-card/70 px-2 py-1">{brand}</li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button onClick={() => go('FORM')} className="bg-skoczek-primary px-5 py-3 text-center font-semibold text-white hover:bg-skoczek-primaryHover">
                    Zleć naprawę
                  </button>
                  <a href="#cennik" className="px-2 py-3 text-center font-semibold text-skoczek-ink underline underline-offset-4">
                    Cennik
                  </a>
                </div>
                <p className="mt-6 max-w-xl text-sm text-skoczek-muted">
                  Gwarancja 12 miesięcy na usługę. Sprzęt można przywieźć osobiście albo wysłać.
                </p>
              </div>
            </section>

            <PricingSection />

            <section className="border-t border-skoczek-line">
              <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-[1fr_280px] md:items-start">
                <div>
                  <h2 className="font-display text-4xl">Warsztat</h2>
                  <dl className="mt-6 space-y-4">
                    <div>
                      <dt className="text-sm text-skoczek-muted">Adres</dt>
                      <dd className="text-lg">{ADDRESS}</dd>
                      <dd className="text-sm text-skoczek-muted">w lokalu Galerii Rowerowej</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-skoczek-muted">Telefon</dt>
                      <dd>
                        <a href={`tel:${PHONE.replace(/\s+/g, '')}`} className="font-mono text-2xl text-skoczek-ink">{PHONE}</a>
                      </dd>
                      <dd className="text-sm text-skoczek-muted">{HOURS}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-skoczek-muted">Poczta</dt>
                      <dd>
                        <a href={`mailto:${EMAIL}`} className="font-mono text-skoczek-ink">{EMAIL}</a>
                      </dd>
                    </div>
                  </dl>
                  <button onClick={() => go('CONTACT')} className="mt-6 font-semibold underline underline-offset-4">
                    Napisz pytanie
                  </button>
                </div>
                <div className="h-56 w-full border border-skoczek-line">
                  <MapComponent />
                </div>
              </div>
            </section>
          </>
        )}

        {view === 'REGULATIONS' && (
          <article className="mx-auto max-w-3xl px-4 py-12">
            <h2 className="font-display text-4xl">Regulamin serwisu</h2>
            <p className="mt-3 text-skoczek-muted">Zasady przyjęcia sprzętu w Oddaj Amora.</p>
            <div className="mt-6 whitespace-pre-wrap border border-skoczek-line bg-skoczek-card p-5 text-sm leading-relaxed">
              {FULL_REGULATIONS}
            </div>
          </article>
        )}

        {view === 'PRIVACY' && (
          <article className="mx-auto max-w-3xl px-4 py-12">
            <h2 className="font-display text-4xl">Prywatność</h2>
            <div className="mt-6 whitespace-pre-wrap border border-skoczek-line bg-skoczek-card p-5 text-sm leading-relaxed">
              {PRIVACY_POLICY}
            </div>
          </article>
        )}

        {view === 'CONTACT' && (
          <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-2">
            <div>
              <h2 className="font-display text-4xl">Kontakt</h2>
              <dl className="mt-6 space-y-5">
                <div>
                  <dt className="text-sm text-skoczek-muted">Adres</dt>
                  <dd className="text-lg">{ADDRESS}</dd>
                  <dd className="text-sm text-skoczek-muted">Białystok, woj. podlaskie</dd>
                </div>
                <div>
                  <dt className="text-sm text-skoczek-muted">Telefon</dt>
                  <dd className="font-mono text-2xl">{PHONE}</dd>
                  <a href={`tel:${PHONE.replace(/\s+/g, '')}`} className="mt-2 inline-block bg-skoczek-primary px-4 py-2 text-sm font-semibold text-white">
                    Zadzwoń
                  </a>
                </div>
                <div>
                  <dt className="text-sm text-skoczek-muted">E-mail</dt>
                  <dd className="font-mono">{EMAIL}</dd>
                  <a href={`mailto:${EMAIL}`} className="text-sm underline">Otwórz program pocztowy</a>
                </div>
              </dl>
            </div>
            <div className="border border-skoczek-line bg-skoczek-card p-6">
              <ContactInquiryForm />
            </div>
          </div>
        )}

        {view === 'FORM' && (
          <div className="mx-auto max-w-3xl px-4 py-12">
            <ServiceForm
              user={user}
              onSuccess={() => setView('DASHBOARD')}
              onRequestLogin={() => setIsAuthModalOpen(true)}
            />
          </div>
        )}

        {view === 'DASHBOARD' && user && user.role !== 'ADMIN' && (
          <div className="mx-auto max-w-5xl px-4 py-12">
            <Dashboard user={user} />
          </div>
        )}

        {view === 'ADMIN' && user && user.role === 'ADMIN' && (
          <div className="mx-auto max-w-6xl px-4 py-12">
            <AdminDashboard />
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-skoczek-line bg-skoczek-paper/90">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-2xl">Oddaj Amora</p>
            <p className="text-sm text-skoczek-muted">Serwis zawieszenia w Białymstoku.</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <button onClick={() => go('REGULATIONS')} className="hover:underline">Regulamin</button>
            <button onClick={() => go('PRIVACY')} className="hover:underline">Prywatność</button>
            <button onClick={() => go('CONTACT')} className="hover:underline">Kontakt</button>
            <button onClick={() => go('FORM')} className="hover:underline">Zgłoś serwis</button>
          </div>
        </div>
        <p className="px-4 pb-6 text-center font-mono text-xs text-skoczek-muted">© {new Date().getFullYear()} Oddaj Amora</p>
      </footer>

      <CookieBanner onAccept={handleAcceptCookies} />
      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={(u) => { setUser(u); setIsAuthModalOpen(false); }}
        />
      )}
      <Analytics />
    </div>
  );
};

export default App;
