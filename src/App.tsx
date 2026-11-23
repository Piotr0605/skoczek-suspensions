import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Analytics } from '@vercel/analytics/react';
import emailjs from '@emailjs/browser';
import { User, UserRole, PricingCategory } from './types';
import { ApiService } from './services/api';
import { PricingService } from './services/pricing';
import { config } from './config';
import { ADDRESS, PHONE, EMAIL, PRICING_DATA, FULL_REGULATIONS, PRIVACY_POLICY } from './constants';
import ServiceForm from './components/ServiceForm';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import CookieBanner from './components/CookieBanner';
import PricingTables from './components/PricingTables';
import SetPasswordForm from './components/SetPasswordForm';
import ChangePasswordModal from './components/ChangePasswordModal';
import { useSeo, routeForPath, normalizePath, SITE_URL } from './seo/seo';
import { validatePassword, validateRegistration } from './utils/validation';
import {
  Menu, X, MapPin, Phone, Mail, ChevronRight,
  ShieldCheck, User as UserIcon, LogOut,
  CheckCircle, Send, Cookie, Wrench, Package, Truck, Clock, AlertCircle, KeyRound,
} from 'lucide-react';

const SuspensionLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <g transform="translate(50, 50) rotate(-45) translate(-50, -50)">
       <rect x="42" y="10" width="16" height="22" rx="1" fill="currentColor" />
       <circle cx="50" cy="12" r="5" fill="white" stroke="currentColor" strokeWidth="3"/>
       <rect x="62" y="15" width="14" height="35" rx="2" fill="currentColor" />
       <rect x="58" y="20" width="6" height="10" fill="currentColor" />
       <circle cx="69" cy="22" r="3" fill="white" fillOpacity="0.5" />
       <circle cx="69" cy="40" r="3" fill="white" fillOpacity="0.5" />
       <rect x="46" y="30" width="8" height="50" fill="currentColor" opacity="0.4"/>
       <rect x="38" y="32" width="24" height="4" rx="1" fill="currentColor" />
       <rect x="38" y="78" width="24" height="4" rx="1" fill="currentColor" />
       <path d="M40 36 L60 41.5 L40 47 L60 52.5 L40 58 L60 63.5 L40 69 L60 74.5"
             stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
       <rect x="44" y="80" width="12" height="12" fill="currentColor" />
       <circle cx="50" cy="90" r="5" fill="white" stroke="currentColor" strokeWidth="3"/>
       <rect x="45" y="75" width="10" height="2" fill="currentColor" />
    </g>
  </svg>
);

/** Renders a JSON-LD block. Search engines read structured data anywhere in the document. */
const JsonLd: React.FC<{ data: object }> = ({ data }) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
);

interface RouterValue {
  path: string;
  navigate: (to: string, replace?: boolean) => void;
}

const RouterContext = React.createContext<RouterValue>({ path: '/', navigate: () => {} });

/**
 * Real <a href> links (crawlable, middle-click and "open in new tab" friendly)
 * that fall back to client-side navigation on a plain left click.
 */
const Link: React.FC<{
  to: string;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}> = ({ to, className, children, ariaLabel }) => {
  const { navigate } = React.useContext(RouterContext);
  return (
    <a
      href={to}
      aria-label={ariaLabel}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
};

const NavLink: React.FC<{ label: string; to: string }> = ({ label, to }) => {
  const { path } = React.useContext(RouterContext);
  return (
    <Link
      to={to}
      className={`relative py-1 text-[13px] font-medium tracking-tight transition-colors ${
        normalizePath(to) === path
          ? 'text-ink-900 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full after:bg-skoczek-primary'
          : 'text-ink-500 hover:text-ink-900'
      }`}
    >
      {label}
    </Link>
  );
};

const MapComponent: React.FC<{ consent: boolean; onAccept: () => void }> = ({ consent, onAccept }) => {
  if (!consent) {
    return (
      <div className="h-full w-full bg-gray-800 flex flex-col items-center justify-center p-8 text-center border border-gray-700">
        <Cookie className="w-12 h-12 text-gray-600 mb-4" aria-hidden="true" />
        <h3 className="text-white font-bold text-lg mb-2">Mapa niedostępna</h3>
        <p className="text-gray-400 text-sm mb-6 max-w-xs">
          Mapy Google wymagają plików cookies. Zaakceptuj naszą politykę prywatności, aby zobaczyć lokalizację.
        </p>
        <button
          onClick={onAccept}
          className="bg-skoczek-primary text-white font-bold py-2 px-6 rounded hover:bg-skoczek-primaryHover transition uppercase text-xs tracking-wider"
        >
          Zaakceptuj Cookies
        </button>
      </div>
    );
  }

  return (
    <iframe
      title="Lokalizacja serwisu Oddaj Amora - ul. Główna 123, 18-100 Łapy"
      src="https://www.google.com/maps?q=52.9918,22.8655&z=16&hl=pl&output=embed"
      width="100%"
      height="100%"
      style={{ border: 0 }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    ></iframe>
  );
};

const ContactDetails: React.FC = () => (
  <div className="panel divide-y divide-line">
    <div className="flex items-start gap-5 p-6">
      <MapPin className="w-5 h-5 shrink-0 text-skoczek-primary mt-1" aria-hidden="true" />
      <div>
        <h2 className="eyebrow-muted mb-2">Adres</h2>
        <p className="text-[17px] font-medium text-ink-900">{ADDRESS}</p>
        <p className="text-[14px] text-ink-500 mt-1">Łapy, powiat białostocki, woj. podlaskie</p>
      </div>
    </div>

    <div className="flex items-start gap-5 p-6">
      <Phone className="w-5 h-5 shrink-0 text-skoczek-primary mt-1" aria-hidden="true" />
      <div className="flex-1">
        <h2 className="eyebrow-muted mb-2">Telefon</h2>
        <p className="text-2xl font-semibold text-ink-900 tracking-tight">{PHONE}</p>
        <p className="text-[14px] text-ink-500 mt-1 mb-4">Poniedziałek - piątek, 10:00-18:00</p>
        <a href={`tel:${PHONE.replace(/\s+/g, '')}`} className="btn-primary btn-sm">
          <Phone className="w-3.5 h-3.5" aria-hidden="true" /> Zadzwoń teraz
        </a>
      </div>
    </div>

    <div className="flex items-start gap-5 p-6">
      <Mail className="w-5 h-5 shrink-0 text-skoczek-primary mt-1" aria-hidden="true" />
      <div>
        <h2 className="eyebrow-muted mb-2">E-mail</h2>
        <p className="text-[17px] font-medium text-ink-900 mb-2 break-all">{EMAIL}</p>
        <a href={`mailto:${EMAIL}`} className="link-accent text-[14px]">Napisz wiadomość</a>
      </div>
    </div>
  </div>
);

const FAQ_ITEMS = [
  {
    q: 'Ile kosztuje serwis amortyzatora rowerowego?',
    a: 'Ceny zależą od modelu i zakresu prac - serwis zerowy zaczyna się od 120 zł, standardowy serwis olejowy widelca to zwykle 250-350 zł, a serwis z wymianą uszczelek od ok. 560 zł. Pełne stawki dla wszystkich marek znajdziesz w cenniku. Ostateczna kwota jest zawsze potwierdzana wyceną po diagnozie.',
  },
  {
    q: 'Ile trwa serwis amortyzatora?',
    a: 'Wycenę przygotowujemy standardowo do 3 dni roboczych od dostarczenia sprzętu. Przewidywany termin realizacji podajemy w wycenie; może się wydłużyć, jeśli konieczne jest sprowadzenie części. Sprzęt wysyłamy w ciągu 1 dnia roboczego od zaksięgowania płatności.',
  },
  {
    q: 'Czy mogę wysłać amortyzator kurierem z innego miasta?',
    a: 'Tak, przyjmujemy sprzęt z całej Polski. Amortyzator należy wysłać odpowiednio zabezpieczony, na własny koszt i ryzyko, razem z potwierdzeniem zgłoszenia serwisowego. Po naprawie odsyłamy go kurierem pod wskazany adres.',
  },
  {
    q: 'Czy wycena serwisu jest darmowa?',
    a: 'Wstępna wycena po diagnozie jest bezpłatna i nie zobowiązuje do zlecenia naprawy. Jeśli po otrzymaniu wyceny zrezygnujesz z usługi, naliczamy opłatę za diagnozę w wysokości 80 zł brutto oraz koszt przesyłki zwrotnej. Przy realizacji zlecenia opłata za diagnozę jest wliczana w koszt serwisu.',
  },
  {
    q: 'Jaką gwarancję otrzymuję na serwis?',
    a: 'Na wykonaną robociznę oraz zamontowane części zamienne udzielamy 12 miesięcy gwarancji, liczonych od dnia wydania lub wysłania amortyzatora. Gwarancja nie obejmuje uszkodzeń mechanicznych, nieprawidłowej eksploatacji ani samodzielnych ingerencji w mechanizm.',
  },
  {
    q: 'Jakie marki amortyzatorów serwisujecie?',
    a: 'Serwisujemy amortyzatory i dampery marek RockShox, FOX, Manitou, DT Swiss, SR Suntour, Öhlins, Marzocchi, DVO, Cane Creek oraz Cannondale (w tym Lefty, Ocho i Fatty). Zajmujemy się też sztycami regulowanymi, m.in. RockShox Reverb.',
  },
  {
    q: 'Co się stanie, jeśli po rozebraniu amortyzatora koszt będzie wyższy?',
    a: 'Jeśli w trakcie serwisu okaże się, że potrzebne są dodatkowe części, kontaktujemy się z Tobą i przedstawiamy aktualizację wyceny. Dalsze prace wykonujemy dopiero po Twojej akceptacji, a przekroczenie wstępnej wyceny o ponad 20% zawsze zgłaszamy telefonicznie.',
  },
];

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

type AuthMode = 'login' | 'register' | 'reset';

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isReset = mode === 'reset';

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError('');
    setResetSent(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Password recovery: always report the same thing, whether or not the
      // address exists, so the form cannot be used to probe for accounts.
      if (isReset) {
        await ApiService.auth.requestPasswordReset(formData.email);
        setResetSent(true);
        return;
      }

      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (isRegister) {
        const registrationError = validateRegistration(formData.name, formData.phone);
        if (registrationError) {
          setError(registrationError);
          return;
        }
      }

      let result;
      if (isLogin) {
        result = await ApiService.auth.login(formData.email, formData.password);
      } else {
        result = await ApiService.auth.register({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password
        });
      }
      onLoginSuccess(result.user);
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd serwera.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white w-full max-w-md border border-line relative">
        <button onClick={onClose} aria-label="Zamknij okno logowania" className="absolute top-4 right-4 text-gray-400 hover:text-black"><X /></button>
        <div className="p-8">
          <h2 id="auth-modal-title" className="text-[22px] font-bold text-ink-900 tracking-tight mb-2">
            {isReset ? 'Nie pamiętasz hasła?' : isLogin ? 'Zaloguj się' : 'Utwórz konto'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {isReset
              ? 'Podaj adres e-mail konta. Wyślemy na niego link do ustawienia nowego hasła.'
              : 'Zarządzaj swoimi naprawami w bazie danych Oddaj Amora.'}
          </p>

          {resetSent ? (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-100 p-4 rounded flex items-start gap-3">
                <CheckCircle className="w-5 h-5 mt-0.5 shrink-0 text-green-600" aria-hidden="true" />
                <div>
                  <p className="font-bold text-green-800">Sprawdź skrzynkę</p>
                  <p className="text-sm text-green-700 mt-1">
                    Jeśli konto o tym adresie istnieje, wysłaliśmy na nie link do ustawienia nowego
                    hasła. Zajrzyj też do folderu ze spamem - link jest jednorazowy.
                  </p>
                </div>
              </div>
              <button
                onClick={() => switchMode('login')}
                className="w-full bg-skoczek-primary text-white font-bold py-3 rounded hover:bg-skoczek-primaryHover transition uppercase tracking-wide"
              >
                Wróć do logowania
              </button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <label className="sr-only" htmlFor="auth-name">Imię i nazwisko</label>
                <input id="auth-name" required autoComplete="name" placeholder="Imię i Nazwisko" className="field"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <label className="sr-only" htmlFor="auth-phone">Telefon</label>
                <input id="auth-phone" required autoComplete="tel" type="tel" placeholder="Telefon" className="field"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </>
            )}
            <label className="sr-only" htmlFor="auth-email">Adres e-mail</label>
            <input id="auth-email" required type="email" autoComplete="email" placeholder="Email" className="field"
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            {!isReset && (
              <>
                <label className="sr-only" htmlFor="auth-password">Hasło</label>
                <input id="auth-password" required type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="Hasło (min. 8 znaków)" minLength={8} className="field"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </>
            )}

            {isLogin && (
              <div className="text-right">
                <button type="button" onClick={() => switchMode('reset')} className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400 hover:text-skoczek-primary transition-colors">
                  Nie pamiętasz hasła?
                </button>
              </div>
            )}

            {error && <p role="alert" className="text-red-600 text-sm font-medium bg-red-50 p-2 rounded">{error}</p>}

            <button disabled={loading} type="submit" className="w-full bg-skoczek-primary text-white font-bold py-3 rounded hover:bg-skoczek-primaryHover transition uppercase tracking-wide disabled:opacity-50 flex justify-center">
              {loading ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-[50%]"></span> : isReset ? 'Wyślij link' : isLogin ? 'Zaloguj' : 'Zarejestruj'}
            </button>
          </form>
          )}

          {!resetSent && (
            <div className="mt-6 text-center text-sm text-gray-500">
              {isReset ? (
                <button onClick={() => switchMode('login')} className="text-skoczek-primary font-medium hover:text-skoczek-primaryHover transition-colors">
                  Wróć do logowania
                </button>
              ) : (
                <>
                  {isLogin ? 'Nie masz konta? ' : 'Masz już konto? '}
                  <button onClick={() => switchMode(isLogin ? 'register' : 'login')} className="text-skoczek-primary font-medium hover:text-skoczek-primaryHover transition-colors">
                    {isLogin ? 'Zarejestruj się' : 'Zaloguj się'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ContactInquiryForm: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await emailjs.send(
        config.emailjs.serviceId,
        config.emailjs.templateId,
        {
          to_name: 'Oddaj Amora',
          from_name: formData.name.trim().slice(0, 100),
          from_email: formData.email.trim().slice(0, 150),
          from_phone: '-',
          component_model: `Zapytanie ze strony: ${formData.subject.trim().slice(0, 150)}`,
          problem_description: formData.message.trim().slice(0, 2000),
          delivery_method: '-',
          preferred_date: '-',
        },
        config.emailjs.publicKey,
      );
      setStatus('sent');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-green-50 rounded border border-green-100 animate-fade-in">
        <div className="w-16 h-16 bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-800">Wiadomość wysłana!</h3>
        <p className="text-green-700 mt-2">Skontaktujemy się z Tobą najszybciej jak to możliwe.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 text-[14px] font-medium text-green-800 underline underline-offset-4"
        >
          Wyślij kolejną wiadomość
        </button>
      </div>
    );
  }

  const inputClass =
    'field';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-6">
        <p className="eyebrow mb-3">Wiadomość</p>
        <h2 className="text-[22px] font-bold text-ink-900 tracking-tight">Szybkie zapytanie</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="field-label">Imię</label>
          <input id="contact-name" required autoComplete="name" className={inputClass} value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div>
          <label htmlFor="contact-email" className="field-label">Email</label>
          <input id="contact-email" required type="email" autoComplete="email" className={inputClass} value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
      </div>
      <div>
        <label htmlFor="contact-subject" className="field-label">Temat</label>
        <input id="contact-subject" required placeholder="np. Wycena serwisu RockShox Pike" className={inputClass} value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
      </div>
      <div>
        <label htmlFor="contact-message" className="field-label">Wiadomość</label>
        <textarea id="contact-message" required rows={4} placeholder="Twoja wiadomość..." className={inputClass} value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}></textarea>
      </div>

      {status === 'error' && (
        <div role="alert" className="flex items-start gap-2 text-sm bg-red-50 border border-red-100 text-red-700 p-3 rounded">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Nie udało się wysłać wiadomości. Napisz bezpośrednio na{' '}
            <a className="font-bold underline" href={`mailto:${EMAIL}`}>{EMAIL}</a> lub zadzwoń:{' '}
            <a className="font-bold underline" href={`tel:${PHONE.replace(/\s+/g, '')}`}>{PHONE}</a>.
          </span>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Wysyłając wiadomość akceptujesz zasady przetwarzania danych opisane w Polityce Prywatności.
      </p>

      <button type="submit" disabled={status === 'sending'}
        className="btn-dark w-full">
        {status === 'sending' ? 'Wysyłanie...' : 'Wyślij Wiadomość'} <Send className="w-4 h-4" />
      </button>
    </form>
  );
};

/** Lowest number that appears in a price string such as "250-300" or "270 / 350". */
function lowestPrice(categories: PricingCategory[], id: string): number | null {
  const category = categories.find((c) => c.id === id);
  if (!category) return null;
  const values: number[] = [];
  const collect = (value: string | null | undefined) => {
    if (!value) return;
    for (const match of value.matchAll(/\d+/g)) values.push(Number(match[0]));
  };
  category.brands?.forEach((brand) => brand.rows.forEach((row) => {
    collect(row.priceService);
    collect(row.priceFull);
  }));
  category.services?.forEach((service) => collect(service.price));
  return values.length ? Math.min(...values) : null;
}

const App: React.FC = () => {
  const [path, setPath] = useState<string>(() =>
    typeof window === 'undefined' ? '/' : normalizePath(window.location.pathname),
  );
  const route = routeForPath(path);
  const view = route.view;

  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const [cookieConsent, setCookieConsent] = useState(false);
  // Starts with the built-in list so prices are visible immediately (also for
  // crawlers); the stored list replaces it as soon as the database answers.
  const [pricing, setPricing] = useState<PricingCategory[]>(PRICING_DATA);

  useSeo(route);

  const navigate = useCallback((to: string, replace = false) => {
    const next = normalizePath(to);
    const [, hash] = to.split('#');
    if (typeof window !== 'undefined') {
      if (replace) window.history.replaceState({}, '', to);
      else window.history.pushState({}, '', to);
    }
    setPath(next);
    setMobileMenuOpen(false);
    if (hash) {
      window.setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    const onPopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        if (localStorage.getItem('skoczek_cookie_consent') === 'true') {
          setCookieConsent(true);
        }
      } catch {
        // localStorage can be unavailable (private mode / blocked cookies)
      }
      try {
        const currentUser = await ApiService.auth.me();
        if (currentUser) setUser(currentUser);
      } catch (e) {
        console.error('Session check failed', e);
      } finally {
        setAppLoading(false);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    let active = true;
    PricingService.get().then((payload) => {
      if (!active) return;
      setPricing(payload.categories);
    });
    return () => {
      active = false;
    };
  }, []);

  // Keep private views out of reach of logged-out visitors (RLS enforces this server side too).
  useEffect(() => {
    if (appLoading) return;
    if (view === 'ADMIN' && (!user || user.role !== UserRole.ADMIN)) {
      navigate('/', true);
      if (!user) setIsAuthModalOpen(true);
    }
    if (view === 'DASHBOARD' && !user) {
      navigate('/', true);
      setIsAuthModalOpen(true);
    }
  }, [view, user, appLoading, navigate]);

  const handleAcceptCookies = () => setCookieConsent(true);

  const handleLogout = async () => {
    await ApiService.auth.logout();
    setUser(null);
    navigate('/');
  };

  const acceptCookiesFromMap = useCallback(() => {
    try {
      localStorage.setItem('skoczek_cookie_consent', 'true');
    } catch {
      // ignore - consent then lasts for this session only
    }
    setCookieConsent(true);
  }, []);

  const routerValue = useMemo(() => ({ path, navigate }), [path, navigate]);

  if (appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-skoczek-primary">
        <div className="animate-spin h-8 w-8 border-2 border-ink-200 border-t-skoczek-primary rounded-[50%]" role="status" aria-label="Wczytywanie"></div>
      </div>
    );
  }

  const frontFrom = lowestPrice(pricing, 'FRONT');
  const rearFrom = lowestPrice(pricing, 'REAR');
  const otherFrom = lowestPrice(pricing, 'OTHER');

  return (
    <RouterContext.Provider value={routerValue}>
    <div className="min-h-screen flex flex-col font-sans bg-white text-gray-900">
      <a href="#main" className="sr-only sr-only-focusable bg-skoczek-primary text-white font-bold rounded">
        Przejdź do treści
      </a>

      <div className="bg-ink-900 text-white border-b border-ink-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center md:justify-between gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-300">
            Darmowa wycena <span className="text-ink-600 mx-2">/</span> Wysyłka z całej Polski
          </p>
          <p className="hidden md:block font-mono text-[11px] uppercase tracking-[0.18em] text-ink-300">
            Pn-Pt 10:00-18:00 <span className="text-ink-600 mx-2">/</span> {PHONE}
          </p>
        </div>
      </div>

      <header className="sticky top-0 w-full z-40 bg-white/95 backdrop-blur border-b border-line">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Menu główne">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center gap-3 group" ariaLabel="Oddaj Amora - strona główna">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <SuspensionLogo className="w-full h-full text-skoczek-primary" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[19px] font-bold tracking-tight text-ink-900">
                  Oddaj<span className="text-skoczek-primary">Amora</span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mt-1">
                  Serwis zawieszeń
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              <NavLink label="Start" to="/" />
              <NavLink label="Cennik" to="/cennik" />
              <NavLink label="Zgłoś serwis" to="/zglos-serwis" />
              <NavLink label="Regulamin" to="/regulamin" />
              <NavLink label="Kontakt" to="/kontakt" />

              {user && user.role === UserRole.ADMIN && <NavLink label="Panel mechanika" to="/panel-mechanika" />}
              {user && user.role !== UserRole.ADMIN && <NavLink label="Moje konto" to="/panel-klienta" />}

              <div className="h-6 w-px bg-gray-300 mx-2"></div>

              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="block text-xs text-gray-400 font-bold uppercase">
                      {user.role === UserRole.ADMIN ? 'Administrator' : 'Zalogowany jako'}
                    </span>
                    <span className="block text-sm font-bold text-black">{user.name}</span>
                  </div>
                  <button onClick={() => setIsChangePasswordOpen(true)} aria-label="Zmień hasło" title="Zmień hasło" className="text-gray-400 hover:text-skoczek-primary"><KeyRound className="w-5 h-5" /></button>
                  <button onClick={handleLogout} aria-label="Wyloguj się" title="Wyloguj się" className="text-gray-400 hover:text-skoczek-primary"><LogOut className="w-5 h-5" /></button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="btn-ghost btn-sm"
                >
                  <UserIcon className="w-4 h-4" aria-hidden="true" /> Strefa klienta
                </button>
              )}
            </div>

            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-black p-2"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Zamknij menu' : 'Otwórz menu'}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden bg-white border-b border-gray-100 p-4 space-y-4 absolute left-0 w-full shadow-xl z-50">
              <div className="flex flex-col gap-4 text-center">
                <NavLink label="Start" to="/" />
                <NavLink label="Cennik" to="/cennik" />
                <NavLink label="Zgłoś serwis" to="/zglos-serwis" />
                <NavLink label="Regulamin" to="/regulamin" />
                <NavLink label="Kontakt" to="/kontakt" />

                {user && user.role === UserRole.ADMIN && <NavLink label="Panel mechanika" to="/panel-mechanika" />}
                {user && user.role !== UserRole.ADMIN && <NavLink label="Moje konto" to="/panel-klienta" />}

                <hr className="border-gray-100" />
                {user ? (
                  <>
                    <button onClick={() => { setIsChangePasswordOpen(true); setMobileMenuOpen(false); }} className="text-gray-700 font-bold uppercase py-2 text-sm tracking-wider">Zmień hasło</button>
                    <button onClick={handleLogout} className="text-red-500 font-bold uppercase py-2">Wyloguj się</button>
                  </>
                ) : (
                  <button onClick={() => { setIsAuthModalOpen(true); setMobileMenuOpen(false); }} className="bg-skoczek-primary text-white py-3 font-bold uppercase rounded">Zaloguj się</button>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      <main id="main" className="flex-grow">
        {view === 'HOME' && (
          <>
            <section className="relative border-b border-line bg-white overflow-hidden">
              <div className="absolute inset-0 z-0 bg-blueprint pointer-events-none" aria-hidden="true"></div>
              <div className="absolute right-0 top-0 bottom-0 hidden lg:block w-px bg-line" aria-hidden="true"></div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-12 gap-12 lg:gap-16 py-16 lg:py-24">
                <div className="lg:col-span-7">
                  <p className="eyebrow mb-6">01 &mdash; Serwis zawieszenia rowerowego</p>

                  <h1 className="text-[2.6rem] leading-[1.05] md:text-6xl md:leading-[1.03] font-bold text-ink-900 tracking-tightest mb-7">
                    Serwis amortyzatorów<br className="hidden sm:block" /> i damperów rowerowych
                  </h1>

                  <span className="rule-accent mb-7" aria-hidden="true"></span>

                  <p className="text-ink-600 text-[17px] leading-relaxed max-w-2xl mb-10">
                    Serwis olejowy, wymiana uszczelek, naprawa i ustawienie zawieszenia marek FOX,
                    RockShox, Marzocchi, Öhlins, Manitou i SR Suntour. Sprzęt przyjmujemy osobiście
                    w Łapach koło Białegostoku oraz kurierem z całej Polski.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/zglos-serwis" className="btn-primary group">
                      Zleć naprawę
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                    </Link>
                    <Link to="/cennik" className="btn-ghost">Zobacz cennik</Link>
                  </div>
                </div>

                <div className="lg:col-span-5 lg:border-l lg:border-line lg:pl-12">
                  <dl className="divide-y divide-line border-y border-line">
                    {[
                      ['Punkt serwisowy', 'ul. Główna 123, Łapy'],
                      ['Wycena', 'do 3 dni roboczych'],
                      ['Gwarancja', '12 miesięcy na usługę'],
                      ['Wysyłka', 'kurierem, cała Polska'],
                    ].map(([term, value]) => (
                      <div key={term} className="flex items-baseline justify-between gap-6 py-4">
                        <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">{term}</dt>
                        <dd className="text-[15px] font-medium text-ink-900 text-right">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <a href={`tel:${PHONE.replace(/\s+/g, '')}`} className="mt-8 flex items-center justify-between border border-line-strong px-5 py-4 hover:border-ink-900 transition-colors group">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">Zadzwoń</span>
                    <span className="text-lg font-semibold text-ink-900 group-hover:text-skoczek-primary transition-colors">{PHONE}</span>
                  </a>
                </div>
              </div>
            </section>

            <section className="border-b border-line bg-white" aria-label="Dlaczego my">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-line border-line">
                  {[
                    { n: '01', t: 'Gwarancja', d: '12 miesięcy na robociznę i części' },
                    { n: '02', t: 'Oryginalne części', d: 'Komponenty i oleje producentów' },
                    { n: '03', t: 'Lokalizacja', d: 'Łapy, powiat białostocki' },
                    { n: '04', t: 'Doradztwo', d: 'Dobór ustawień pod wagę i styl jazdy' },
                  ].map((item, i) => (
                    <div
                      key={item.n}
                      className={`py-8 lg:px-8 ${i % 2 === 0 ? 'pr-6 lg:pr-8 border-r border-line lg:border-r-0' : 'pl-6 lg:pl-8'} ${i < 2 ? 'border-b border-line lg:border-b-0' : ''} ${i === 0 ? 'lg:pl-0' : ''} ${i === 3 ? 'lg:pr-0' : ''}`}
                    >
                      <span className="font-mono text-[11px] tracking-[0.18em] text-skoczek-primary">{item.n}</span>
                      <h2 className="text-[15px] font-semibold text-ink-900 mt-3">{item.t}</h2>
                      <p className="text-[13px] text-ink-500 mt-1.5 leading-relaxed">{item.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-labelledby="uslugi-heading">
              <div className="mb-12 max-w-3xl">
                <p className="eyebrow mb-4">02 &mdash; Zakres prac</p>
                <h2 id="uslugi-heading" className="text-3xl md:text-[2.5rem] md:leading-[1.1] font-bold text-ink-900 tracking-tighter">
                  Co serwisujemy
                </h2>
                <p className="text-ink-600 mt-5 text-[17px] leading-relaxed">
                  Zawieszenie rowerów MTB, gravel i e-bike &mdash; od serwisu olejowego po pełną
                  regenerację z wymianą uszczelek i tulei ślizgowych.
                </p>
              </div>

              <div className="grid md:grid-cols-3 border-t border-line">
                <article className="border-b md:border-b-0 md:border-r border-line py-8 md:pr-8">
                  <Wrench className="w-6 h-6 text-skoczek-primary mb-5" aria-hidden="true" />
                  <h3 className="text-lg font-semibold text-ink-900 mb-3">Amortyzatory przednie</h3>
                  <p className="text-[15px] text-ink-600 leading-relaxed mb-5">
                    Serwis widelców RockShox (Pike, Lyrik, SID, Judy, Reba), FOX (32, 34, 36, 38, 40),
                    Manitou, DT Swiss, SR Suntour, Marzocchi, DVO, Öhlins oraz Cannondale Lefty.
                    Wymiana oleju, uszczelek, tulei i serwis kartridża.
                  </p>
                  {frontFrom && (
                    <p className="font-mono text-[12px] tracking-[0.1em] text-ink-900">od <span className="text-skoczek-primary font-medium">{frontFrom} zł</span></p>
                  )}
                </article>

                <article className="border-b md:border-b-0 md:border-r border-line py-8 md:px-8">
                  <Package className="w-6 h-6 text-skoczek-primary mb-5" aria-hidden="true" />
                  <h3 className="text-lg font-semibold text-ink-900 mb-3">Amortyzatory tylne (dampery)</h3>
                  <p className="text-[15px] text-ink-600 leading-relaxed mb-5">
                    Serwis damperów powietrznych i sprężynowych: RockShox Monarch, Deluxe, Super Deluxe,
                    Vivid, FOX Float DPS, DPX2, X2, DHX, Manitou, Cane Creek, Öhlins TTX i DT Swiss.
                  </p>
                  {rearFrom && (
                    <p className="font-mono text-[12px] tracking-[0.1em] text-ink-900">od <span className="text-skoczek-primary font-medium">{rearFrom} zł</span></p>
                  )}
                </article>

                <article className="py-8 md:pl-8">
                  <Truck className="w-6 h-6 text-skoczek-primary mb-5" aria-hidden="true" />
                  <h3 className="text-lg font-semibold text-ink-900 mb-3">Sztyce i montaż</h3>
                  <p className="text-[15px] text-ink-600 leading-relaxed mb-5">
                    Serwis sztyc regulowanych (dropperów) hydraulicznych i mechanicznych, montaż
                    i demontaż amortyzatora lub dampera w ramie, doradztwo przy doborze ustawień.
                  </p>
                  {otherFrom && (
                    <p className="font-mono text-[12px] tracking-[0.1em] text-ink-900">od <span className="text-skoczek-primary font-medium">{otherFrom} zł</span></p>
                  )}
                </article>
              </div>

              <div className="mt-10 pt-10 border-t border-line flex flex-col sm:flex-row gap-3">
                <Link to="/cennik" className="btn-primary">
                  Pełny cennik usług <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link to="/zglos-serwis" className="btn-ghost">Zgłoś serwis online</Link>
              </div>
            </section>

            <section className="bg-ink-50 border-y border-line py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="proces-heading">
              <div className="max-w-7xl mx-auto">
                <p className="eyebrow mb-4">03 &mdash; Przebieg zlecenia</p>
                <h2 id="proces-heading" className="text-3xl md:text-[2.5rem] md:leading-[1.1] font-bold text-ink-900 tracking-tighter mb-12">
                  Jak przebiega serwis
                </h2>
                <ol className="grid md:grid-cols-4 border-t border-line bg-white">
                  {[
                    { n: '01', icon: <Send className="w-5 h-5" aria-hidden="true" />, title: 'Zgłoszenie', text: 'Wypełniasz formularz serwisowy online - opisujesz model i usterkę.' },
                    { n: '02', icon: <Truck className="w-5 h-5" aria-hidden="true" />, title: 'Dostarczenie', text: 'Przywozisz sprzęt na ul. Główną 123 w Łapach lub wysyłasz kurierem.' },
                    { n: '03', icon: <Clock className="w-5 h-5" aria-hidden="true" />, title: 'Diagnoza i wycena', text: 'W ciągu maksymalnie 3 dni roboczych otrzymujesz szczegółową wycenę do akceptacji.' },
                    { n: '04', icon: <CheckCircle className="w-5 h-5" aria-hidden="true" />, title: 'Naprawa i zwrot', text: 'Po akceptacji wykonujemy serwis i odsyłamy sprzęt - z 12-miesięczną gwarancją.' },
                  ].map((step, i) => (
                    <li
                      key={step.n}
                      className={`p-8 border-line border-b md:border-b-0 ${i < 3 ? 'md:border-r' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <span className="font-mono text-[11px] tracking-[0.18em] text-skoczek-primary">{step.n}</span>
                        <span className="text-ink-300">{step.icon}</span>
                      </div>
                      <h3 className="text-[15px] font-semibold text-ink-900 mb-2">{step.title}</h3>
                      <p className="text-[14px] text-ink-500 leading-relaxed">{step.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto" aria-labelledby="faq-heading">
              <p className="eyebrow mb-4">04 &mdash; Pytania i odpowiedzi</p>
              <h2 id="faq-heading" className="text-3xl md:text-[2.5rem] md:leading-[1.1] font-bold text-ink-900 tracking-tighter mb-3">
                Najczęstsze pytania
              </h2>
              <p className="text-ink-500 mb-10 text-[15px]">Koszty, terminy, wysyłka i gwarancja.</p>

              <div className="border-t border-line">
                {FAQ_ITEMS.map((item) => (
                  <details key={item.q} className="group border-b border-line py-5">
                    <summary className="cursor-pointer list-none flex items-start justify-between gap-6">
                      <h3 className="text-[16px] font-medium text-ink-900 group-open:text-skoczek-primary transition-colors">{item.q}</h3>
                      <span className="shrink-0 mt-1 text-ink-400 group-open:text-skoczek-primary transition-colors">
                        <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" aria-hidden="true" />
                      </span>
                    </summary>
                    <p className="text-ink-600 text-[15px] leading-relaxed mt-4 max-w-3xl">{item.a}</p>
                  </details>
                ))}
              </div>

              <JsonLd
                data={{
                  '@context': 'https://schema.org',
                  '@type': 'FAQPage',
                  mainEntity: FAQ_ITEMS.map((item) => ({
                    '@type': 'Question',
                    name: item.q,
                    acceptedAnswer: { '@type': 'Answer', text: item.a },
                  })),
                }}
              />
            </section>

            <section className="bg-ink-900 text-white border-t border-ink-800" aria-labelledby="kontakt-heading">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-skoczek-primary mb-4">05 &mdash; Kontakt</p>
                  <h2 id="kontakt-heading" className="text-3xl md:text-[2.5rem] md:leading-[1.1] font-bold tracking-tighter mb-10">
                    Przyjmujemy sprzęt osobiście i kurierem
                  </h2>

                  <dl className="border-t border-ink-700">
                    <div className="py-5 border-b border-ink-700 flex items-start justify-between gap-8">
                      <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400 pt-1">Adres</dt>
                      <dd className="text-[15px] leading-relaxed text-right">
                        ul. Główna 123<br />18-100 Łapy<br />
                        <span className="text-ink-400">powiat białostocki</span>
                      </dd>
                    </div>

                    <div className="py-5 border-b border-ink-700 flex items-center justify-between gap-8">
                      <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">Telefon</dt>
                      <dd className="text-right">
                        <a href={`tel:${PHONE.replace(/\s+/g, '')}`} className="text-lg font-semibold hover:text-skoczek-primary transition-colors">{PHONE}</a>
                        <span className="block text-[13px] text-ink-400 mt-0.5">Pn-Pt 10:00-18:00</span>
                      </dd>
                    </div>

                    <div className="py-5 border-b border-ink-700 flex items-center justify-between gap-8">
                      <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">E-mail</dt>
                      <dd className="text-right">
                        <a href={`mailto:${EMAIL}`} className="text-[15px] hover:text-skoczek-primary transition-colors break-all">{EMAIL}</a>
                      </dd>
                    </div>
                  </dl>

                  <div className="flex flex-col sm:flex-row gap-3 mt-10">
                    <Link to="/zglos-serwis" className="btn-primary">Zleć naprawę</Link>
                    <Link to="/kontakt" className="btn inline-flex border-ink-600 text-white hover:border-white">
                      Formularz kontaktowy
                    </Link>
                  </div>
                </div>

                <div className="h-[420px] w-full border border-ink-700 overflow-hidden">
                  <MapComponent consent={cookieConsent} onAccept={acceptCookiesFromMap} />
                </div>
              </div>
            </section>
          </>
        )}

        {view === 'PRICING' && (
          <div className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4">
              <header className="mb-12 border-b border-line pb-10">
                <p className="eyebrow mb-4">Cennik</p>
                <h1 className="text-3xl md:text-[2.75rem] md:leading-[1.08] font-bold text-ink-900 tracking-tightest">
                  Cennik serwisu amortyzatorów
                </h1>
                <span className="rule-accent mt-6 mb-6" aria-hidden="true"></span>
                <p className="text-ink-600 max-w-3xl leading-relaxed text-[17px]">
                  Poniżej znajdziesz orientacyjne ceny serwisu amortyzatorów przednich, damperów
                  i sztyc regulowanych (ceny brutto w PLN). Kolumna &bdquo;cena serwisu&rdquo; obejmuje
                  robociznę i olej, a &bdquo;z uszczelkami&rdquo; - pełny serwis wraz z kompletem uszczelek.
                  Ostateczny koszt potwierdzamy wyceną po diagnozie sprzętu, a każda zmiana zakresu prac
                  wymaga Twojej akceptacji.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                  <Link to="/zglos-serwis" className="btn-primary">
                    Zgłoś serwis <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                  <a href={`tel:${PHONE.replace(/\s+/g, '')}`} className="btn-ghost">
                    <Phone className="w-4 h-4" aria-hidden="true" /> {PHONE}
                  </a>
                </div>
              </header>

              <PricingTables categories={pricing} />

              <p className="text-[14px] text-ink-500 mt-12 border-l-2 border-skoczek-primary bg-ink-50 px-6 py-5 leading-relaxed">
                Ceny mają charakter informacyjny i nie stanowią oferty w rozumieniu Kodeksu cywilnego.
                Koszt części zamiennych oraz przesyłki zwrotnej doliczany jest do wyceny. Szczegółowe
                zasady realizacji zleceń opisuje{' '}
                <Link to="/regulamin" className="link-accent">regulamin serwisu</Link>.
              </p>
            </div>
          </div>
        )}

        {view === 'REGULATIONS' && (
          <div className="bg-gray-50 py-16 min-h-[calc(100vh-theme(spacing.24))]">
            <div className="max-w-4xl mx-auto px-4">
              <div className="panel p-8 md:p-12">
                <p className="eyebrow mb-4">Dokument</p>
                <h1 className="text-3xl md:text-4xl font-bold text-ink-900 tracking-tighter mb-6">Regulamin serwisu</h1>
                <span className="rule-accent mb-7" aria-hidden="true"></span>
                <p className="text-ink-600 mb-8 text-[16px] leading-relaxed">
                  Zasady świadczenia usług serwisowych przez Oddaj Amora.
                </p>
                <div className="border-t border-line pt-8 text-ink-700 text-[14px] whitespace-pre-wrap leading-[1.75] font-[450]">
                  {FULL_REGULATIONS}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'PRIVACY' && (
          <div className="bg-gray-50 py-16 min-h-[calc(100vh-theme(spacing.24))]">
            <div className="max-w-4xl mx-auto px-4">
              <div className="panel p-8 md:p-12">
                <p className="eyebrow mb-4">Dokument</p>
                <h1 className="text-3xl md:text-4xl font-bold text-ink-900 tracking-tighter mb-6">Polityka prywatności i RODO</h1>
                <span className="rule-accent mb-7" aria-hidden="true"></span>
                <div className="border-t border-line pt-8 text-ink-700 text-[14px] whitespace-pre-wrap leading-[1.75] font-[450]">
                  {PRIVACY_POLICY}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'CONTACT' && (
          <div className="bg-gray-50 py-16 min-h-[calc(100vh-theme(spacing.24))]">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex flex-col md:flex-row gap-12">
                <div className="md:w-1/2 space-y-8">
                  <div>
                    <p className="eyebrow mb-4">Kontakt</p>
                    <h1 className="text-3xl md:text-[2.5rem] md:leading-[1.1] font-bold text-ink-900 tracking-tighter mb-4">Napisz lub zadzwoń</h1>
                    <p className="text-ink-600 text-[16px] leading-relaxed">
                      Serwis amortyzatorów rowerowych Oddaj Amora - Łapy koło Białegostoku,
                      ul. Główna 123. Wybierz preferowaną formę kontaktu.
                    </p>
                  </div>

                  <ContactDetails />

                  <div className="h-[280px] w-full border border-line overflow-hidden">
                    <MapComponent consent={cookieConsent} onAccept={acceptCookiesFromMap} />
                  </div>
                </div>

                <div className="md:w-1/2">
                  <div className="panel p-8">
                    <ContactInquiryForm />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'FORM' && (
          <div className="bg-gray-50 py-16 min-h-[calc(100vh-theme(spacing.24))]">
            <div className="max-w-3xl mx-auto px-4">
              <ServiceForm
                user={user}
                onSuccess={() => navigate('/panel-klienta')}
                onRequestLogin={() => setIsAuthModalOpen(true)}
              />
            </div>
          </div>
        )}

        {view === 'DASHBOARD' && user && (
          <div className="bg-gray-50 py-16 min-h-[calc(100vh-theme(spacing.24))]">
            <div className="max-w-6xl mx-auto px-4">
              <Dashboard user={user} />
            </div>
          </div>
        )}

        {view === 'ADMIN' && user && user.role === UserRole.ADMIN && (
          <div className="bg-gray-50 py-16 min-h-[calc(100vh-theme(spacing.24))]">
            <div className="max-w-7xl mx-auto px-4">
              <AdminDashboard />
            </div>
          </div>
        )}

        {view === 'SET_PASSWORD' && (
          <div className="bg-gray-50 py-16 min-h-[calc(100vh-theme(spacing.24))]">
            <div className="max-w-xl mx-auto px-4">
              <SetPasswordForm
                onDone={(updatedUser) => setUser(updatedUser)}
                onNavigate={(to) => navigate(to)}
              />
            </div>
          </div>
        )}

        {view === 'NOT_FOUND' && (
          <div className="bg-gray-50 py-24 min-h-[calc(100vh-theme(spacing.24))]">
            <div className="max-w-2xl mx-auto px-4 text-center">
              <p className="font-mono text-skoczek-primary text-5xl mb-6 tracking-tight">404</p>
              <h1 className="text-3xl font-bold text-ink-900 tracking-tighter mb-4">Nie znaleziono strony</h1>
              <p className="text-ink-600 mb-10 text-[16px] leading-relaxed">
                Strona o tym adresie nie istnieje lub została przeniesiona. Sprawdź cennik, zgłoś
                serwis albo wróć na stronę główną.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/" className="btn-primary">Strona główna</Link>
                <Link to="/cennik" className="btn-ghost">Cennik</Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-line pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-12 md:grid-cols-3">
          <div>
            <p className="text-[19px] font-bold tracking-tight text-ink-900">
              Oddaj<span className="text-skoczek-primary">Amora</span>
            </p>
            <p className="text-ink-500 text-[14px] mt-4 leading-relaxed max-w-xs">
              Profesjonalny serwis amortyzatorów i damperów rowerowych w Łapach koło Białegostoku.
              Przyjmujemy sprzęt osobiście oraz kurierem z całej Polski.
            </p>
          </div>

          <div>
            <h2 className="eyebrow-muted mb-5">Dane kontaktowe</h2>
            <address className="not-italic text-[14px] text-ink-600 space-y-2.5">
              <p>ul. Główna 123, 18-100 Łapy</p>
              <p>
                <a href={`tel:${PHONE.replace(/\s+/g, '')}`} className="font-medium text-ink-900 hover:text-skoczek-primary transition-colors">{PHONE}</a>
              </p>
              <p>
                <a href={`mailto:${EMAIL}`} className="hover:text-skoczek-primary transition-colors break-all">{EMAIL}</a>
              </p>
              <p className="font-mono text-[12px] text-ink-400 pt-1">Pn-Pt 10:00-18:00</p>
            </address>
          </div>

          <div>
            <h2 className="eyebrow-muted mb-5">Serwis</h2>
            <ul className="text-[14px] text-ink-600 space-y-2.5">
              <li><Link to="/cennik" className="hover:text-skoczek-primary transition-colors">Cennik usług</Link></li>
              <li><Link to="/zglos-serwis" className="hover:text-skoczek-primary transition-colors">Zgłoś serwis</Link></li>
              <li><Link to="/kontakt" className="hover:text-skoczek-primary transition-colors">Kontakt</Link></li>
              <li><Link to="/regulamin" className="hover:text-skoczek-primary transition-colors">Regulamin</Link></li>
              <li><Link to="/polityka-prywatnosci" className="hover:text-skoczek-primary transition-colors">Polityka prywatności i RODO</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 pt-6 border-t border-line flex flex-col md:flex-row justify-between gap-2 font-mono text-[11px] text-ink-400">
          <p>&copy; {new Date().getFullYear()} Oddaj Amora &middot; {SITE_URL.replace(/^https?:\/\//, '')}</p>
          <p>Skoczek Suspension Tomasz Pierzchało &middot; NIP 5423158283 &middot; REGON 523948292</p>
        </div>
      </footer>

      <CookieBanner onAccept={handleAcceptCookies} />
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={(u) => { setUser(u); setIsAuthModalOpen(false); }} />}
      {isChangePasswordOpen && user && (
        <ChangePasswordModal user={user} onClose={() => setIsChangePasswordOpen(false)} />
      )}
      <Analytics />
    </div>
    </RouterContext.Provider>
  );
};

export default App;
