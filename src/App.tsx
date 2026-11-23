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
      className={`text-sm font-bold tracking-wider uppercase transition-colors ${
        normalizePath(to) === path
          ? 'text-skoczek-primary'
          : 'text-gray-700 hover:text-skoczek-primary'
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
  <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-8">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center shrink-0 text-skoczek-primary">
        <MapPin className="w-6 h-6" aria-hidden="true" />
      </div>
      <div>
        <h2 className="font-bold uppercase text-sm text-gray-400 mb-1">Adres</h2>
        <p className="font-bold text-lg text-black">{ADDRESS}</p>
        <p className="text-sm text-gray-500">Łapy, powiat białostocki, woj. podlaskie</p>
      </div>
    </div>

    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center shrink-0 text-skoczek-primary">
        <Phone className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <h2 className="font-bold uppercase text-sm text-gray-400 mb-1">Telefon</h2>
        <p className="font-bold text-2xl text-black mb-2">{PHONE}</p>
        <p className="text-sm text-gray-500 mb-2">Poniedziałek - piątek, 10:00 - 18:00</p>
        <a href={`tel:${PHONE.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 bg-skoczek-primary text-white px-4 py-2 rounded text-sm font-bold uppercase hover:bg-skoczek-primaryHover transition shadow-lg shadow-skoczek-primary/30">
          <Phone className="w-3 h-3" aria-hidden="true" /> Zadzwoń teraz
        </a>
      </div>
    </div>

    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center shrink-0 text-skoczek-primary">
        <Mail className="w-6 h-6" aria-hidden="true" />
      </div>
      <div>
        <h2 className="font-bold uppercase text-sm text-gray-400 mb-1">Email</h2>
        <p className="font-bold text-lg text-black mb-2 break-all">{EMAIL}</p>
        <a href={`mailto:${EMAIL}`} className="text-skoczek-primary text-sm font-bold uppercase border-b-2 border-skoczek-primary/20 hover:border-skoczek-primary transition pb-0.5">
          Napisz wiadomość
        </a>
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
      <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden relative border border-gray-200">
        <button onClick={onClose} aria-label="Zamknij okno logowania" className="absolute top-4 right-4 text-gray-400 hover:text-black"><X /></button>
        <div className="p-8">
          <h2 id="auth-modal-title" className="text-2xl font-bold text-skoczek-primary mb-2">
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
                <input id="auth-name" required autoComplete="name" placeholder="Imię i Nazwisko" className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-900 focus:border-skoczek-primary focus:ring-1 focus:ring-skoczek-primary outline-none transition"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <label className="sr-only" htmlFor="auth-phone">Telefon</label>
                <input id="auth-phone" required autoComplete="tel" type="tel" placeholder="Telefon" className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-900 focus:border-skoczek-primary focus:ring-1 focus:ring-skoczek-primary outline-none transition"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </>
            )}
            <label className="sr-only" htmlFor="auth-email">Adres e-mail</label>
            <input id="auth-email" required type="email" autoComplete="email" placeholder="Email" className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-900 focus:border-skoczek-primary focus:ring-1 focus:ring-skoczek-primary outline-none transition"
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            {!isReset && (
              <>
                <label className="sr-only" htmlFor="auth-password">Hasło</label>
                <input id="auth-password" required type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="Hasło (min. 8 znaków)" minLength={8} className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-900 focus:border-skoczek-primary focus:ring-1 focus:ring-skoczek-primary outline-none transition"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </>
            )}

            {isLogin && (
              <div className="text-right">
                <button type="button" onClick={() => switchMode('reset')} className="text-xs font-bold text-gray-500 hover:text-skoczek-primary transition uppercase tracking-wide">
                  Nie pamiętasz hasła?
                </button>
              </div>
            )}

            {error && <p role="alert" className="text-red-600 text-sm font-medium bg-red-50 p-2 rounded">{error}</p>}

            <button disabled={loading} type="submit" className="w-full bg-skoczek-primary text-white font-bold py-3 rounded hover:bg-skoczek-primaryHover transition uppercase tracking-wide disabled:opacity-50 flex justify-center">
              {loading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : isReset ? 'Wyślij link' : isLogin ? 'Zaloguj' : 'Zarejestruj'}
            </button>
          </form>
          )}

          {!resetSent && (
            <div className="mt-6 text-center text-sm text-gray-500">
              {isReset ? (
                <button onClick={() => switchMode('login')} className="text-skoczek-primary font-semibold hover:text-skoczek-primaryHover transition">
                  Wróć do logowania
                </button>
              ) : (
                <>
                  {isLogin ? 'Nie masz konta? ' : 'Masz już konto? '}
                  <button onClick={() => switchMode(isLogin ? 'register' : 'login')} className="text-skoczek-primary font-semibold hover:text-skoczek-primaryHover transition">
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
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-800">Wiadomość wysłana!</h3>
        <p className="text-green-700 mt-2">Skontaktujemy się z Tobą najszybciej jak to możliwe.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 text-sm font-bold uppercase text-green-800 underline"
        >
          Wyślij kolejną wiadomość
        </button>
      </div>
    );
  }

  const inputClass =
    'w-full bg-white border border-gray-300 rounded p-3 focus:border-skoczek-primary focus:ring-1 focus:ring-skoczek-primary outline-none transition';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="font-black text-xl uppercase mb-4">Szybkie zapytanie</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="block text-xs font-bold text-gray-500 uppercase mb-1">Imię</label>
          <input id="contact-name" required autoComplete="name" className={inputClass} value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
          <input id="contact-email" required type="email" autoComplete="email" className={inputClass} value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
      </div>
      <div>
        <label htmlFor="contact-subject" className="block text-xs font-bold text-gray-500 uppercase mb-1">Temat</label>
        <input id="contact-subject" required placeholder="np. Wycena serwisu RockShox Pike" className={inputClass} value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-xs font-bold text-gray-500 uppercase mb-1">Wiadomość</label>
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
        className="w-full bg-black text-white font-bold py-3 hover:bg-gray-800 transition flex items-center justify-center gap-2 uppercase text-sm tracking-wider disabled:opacity-50">
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
        <div className="animate-spin h-10 w-10 border-4 border-skoczek-primary border-t-transparent rounded-full" role="status" aria-label="Wczytywanie"></div>
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

      <div className="bg-skoczek-primary text-white text-xs py-2 px-4 text-center font-bold tracking-wider">
        DARMOWA WYCENA SERWISU • WYSYŁKA Z CAŁEJ POLSKI
      </div>

      <header className="sticky top-0 w-full z-40 bg-white border-b border-gray-200 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Menu główne">
          <div className="flex justify-between h-24 items-center">
            <Link to="/" className="flex items-center gap-3" ariaLabel="Oddaj Amora - strona główna">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <SuspensionLogo className="w-full h-full text-skoczek-primary" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-2xl font-black tracking-tighter text-black uppercase">ODDAJ</span>
                <span className="text-sm font-bold tracking-widest text-gray-500 uppercase">AMORA</span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              <NavLink label="Start" to="/" />
              <NavLink label="Cennik" to="/cennik" />
              <NavLink label="Zgłoś Serwis" to="/zglos-serwis" />
              <NavLink label="Regulamin" to="/regulamin" />
              <NavLink label="Kontakt" to="/kontakt" />

              {user && user.role === UserRole.ADMIN && <NavLink label="Panel Mechanika" to="/panel-mechanika" />}
              {user && user.role !== UserRole.ADMIN && <NavLink label="Moje Konto" to="/panel-klienta" />}

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
                  className="flex items-center gap-2 text-sm font-bold bg-gray-100 text-black hover:bg-gray-200 px-5 py-3 rounded-full transition uppercase"
                >
                  <UserIcon className="w-4 h-4" aria-hidden="true" /> Strefa Klienta
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
                <NavLink label="Strona Główna" to="/" />
                <NavLink label="Cennik" to="/cennik" />
                <NavLink label="Zgłoś Serwis" to="/zglos-serwis" />
                <NavLink label="Regulamin" to="/regulamin" />
                <NavLink label="Kontakt" to="/kontakt" />

                {user && user.role === UserRole.ADMIN && <NavLink label="Panel Mechanika" to="/panel-mechanika" />}
                {user && user.role !== UserRole.ADMIN && <NavLink label="Moje Konto" to="/panel-klienta" />}

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
            <section className="relative py-20 lg:py-32 bg-white overflow-hidden">
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <svg className="absolute top-0 left-0 w-full h-full opacity-[0.03]" width="100%" height="100%">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="black" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                <div className="absolute right-0 top-0 h-full w-1/2 md:w-1/3 hidden md:flex items-center justify-center opacity-[0.05]">
                  <SuspensionLogo className="h-[600px] w-auto text-black" />
                </div>
              </div>

              <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-12">
                <div className="flex-1 text-center md:text-left">
                  <p className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 font-bold text-xs px-3 py-1 rounded mb-6 uppercase tracking-widest">
                    <CheckCircle className="w-3 h-3 text-skoczek-primary" aria-hidden="true" /> Łapy k. Białegostoku · Autoryzowany punkt serwisowy
                  </p>

                  <h1 className="text-4xl md:text-6xl font-black text-black uppercase leading-tight tracking-tight mb-6 pl-0 md:pl-6 border-l-0 md:border-l-4 border-skoczek-primary">
                    Serwis amortyzatorów<br className="hidden md:block" /> rowerowych
                  </h1>

                  <p className="text-gray-600 text-lg mb-8 max-w-xl font-medium leading-relaxed">
                    Kompleksowo zajmiemy się zawieszeniem w Twoim rowerze. Serwis olejowy, wymiana
                    uszczelek, naprawa i ustawienie amortyzatorów oraz damperów marek FOX, RockShox,
                    Marzocchi, Öhlins, Manitou i SR Suntour. Przyjmujemy sprzęt osobiście w Łapach
                    koło Białegostoku i kurierem z całej Polski.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <Link to="/zglos-serwis" className="bg-skoczek-primary text-white font-black px-8 py-3 rounded hover:bg-skoczek-primaryHover shadow-lg shadow-skoczek-primary/30 transition duration-300 flex items-center justify-center gap-2 uppercase tracking-wider text-sm group">
                      Zleć Naprawę <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" aria-hidden="true" />
                    </Link>
                    <Link to="/cennik" className="bg-white text-gray-900 border border-gray-300 font-black px-8 py-3 rounded hover:border-skoczek-primary hover:text-skoczek-primary transition duration-300 uppercase tracking-wider text-sm flex items-center justify-center">
                      Zobacz Cennik
                    </Link>
                  </div>
                </div>

                <div className="hidden md:block w-1/3 h-64 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl shadow-inner relative overflow-hidden group">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-200 group-hover:text-skoczek-primary/20 transition duration-700">
                    <SuspensionLogo className="w-32 h-32" />
                  </div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="text-sm font-bold text-black uppercase mb-1">Szybka realizacja</div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-skoczek-primary"></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="border-y border-gray-100 bg-gray-50/50 py-12" aria-label="Dlaczego my">
              <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3 pl-4 md:pl-0">
                  <ShieldCheck className="w-8 h-8 text-skoczek-primary mb-1" aria-hidden="true" />
                  <div>
                    <h2 className="font-bold text-black uppercase text-sm">Gwarancja</h2>
                    <p className="text-xs text-gray-500 mt-1">12 miesięcy na usługi</p>
                  </div>
                </div>
                <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
                  <SuspensionLogo className="w-8 h-8 text-skoczek-primary mb-1" />
                  <div>
                    <h2 className="font-bold text-black uppercase text-sm">Oryginalne Części</h2>
                    <p className="text-xs text-gray-500 mt-1">Korzystamy wyłącznie z najwyższej jakości produktów</p>
                  </div>
                </div>
                <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
                  <MapPin className="w-8 h-8 text-skoczek-primary mb-1" aria-hidden="true" />
                  <div>
                    <h2 className="font-bold text-black uppercase text-sm">Lokalizacja</h2>
                    <p className="text-xs text-gray-500 mt-1">Łapy k. Białegostoku</p>
                  </div>
                </div>
                <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
                  <Phone className="w-8 h-8 text-skoczek-primary mb-1" aria-hidden="true" />
                  <div>
                    <h2 className="font-bold text-black uppercase text-sm">Wsparcie</h2>
                    <p className="text-xs text-gray-500 mt-1">Doradztwo techniczne</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="py-20 px-4 max-w-7xl mx-auto" aria-labelledby="uslugi-heading">
              <div className="mb-10">
                <h2 id="uslugi-heading" className="text-3xl font-black text-black uppercase tracking-tight">Zakres usług serwisowych</h2>
                <p className="text-gray-500 mt-2 max-w-3xl">
                  Serwisujemy zawieszenie rowerów MTB, gravel i e-bike - od prostego serwisu olejowego
                  po pełną regenerację z wymianą uszczelek i tulei ślizgowych.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <article className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <Wrench className="w-8 h-8 text-skoczek-primary mb-4" aria-hidden="true" />
                  <h3 className="font-black text-lg uppercase text-black mb-2">Amortyzatory przednie</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Serwis widelców RockShox (Pike, Lyrik, SID, Judy, Reba), FOX (32, 34, 36, 38, 40),
                    Manitou, DT Swiss, SR Suntour, Marzocchi, DVO, Öhlins oraz Cannondale Lefty.
                    Wymiana oleju, uszczelek, tulei i serwis kartridża.
                  </p>
                  {frontFrom && (
                    <p className="text-sm font-black text-skoczek-primary uppercase">już od {frontFrom} zł</p>
                  )}
                </article>

                <article className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <Package className="w-8 h-8 text-skoczek-primary mb-4" aria-hidden="true" />
                  <h3 className="font-black text-lg uppercase text-black mb-2">Amortyzatory tylne (dampery)</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Serwis damperów powietrznych i sprężynowych: RockShox Monarch, Deluxe, Super Deluxe,
                    Vivid, FOX Float DPS, DPX2, X2, DHX, Manitou, Cane Creek, Öhlins TTX i DT Swiss.
                  </p>
                  {rearFrom && (
                    <p className="text-sm font-black text-skoczek-primary uppercase">już od {rearFrom} zł</p>
                  )}
                </article>

                <article className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <Truck className="w-8 h-8 text-skoczek-primary mb-4" aria-hidden="true" />
                  <h3 className="font-black text-lg uppercase text-black mb-2">Sztyce i montaż</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Serwis sztyc regulowanych (dropperów) hydraulicznych i mechanicznych, montaż
                    i demontaż amortyzatora lub dampera w ramie, doradztwo przy doborze ustawień.
                  </p>
                  {otherFrom && (
                    <p className="text-sm font-black text-skoczek-primary uppercase">już od {otherFrom} zł</p>
                  )}
                </article>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/cennik" className="bg-skoczek-primary text-white font-black px-8 py-3 rounded hover:bg-skoczek-primaryHover transition uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                  Pełny cennik usług <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link to="/zglos-serwis" className="bg-white text-gray-900 border border-gray-300 font-black px-8 py-3 rounded hover:border-skoczek-primary hover:text-skoczek-primary transition uppercase tracking-wider text-sm flex items-center justify-center">
                  Zgłoś serwis online
                </Link>
              </div>
            </section>

            <section className="bg-gray-50 border-y border-gray-100 py-20 px-4" aria-labelledby="proces-heading">
              <div className="max-w-7xl mx-auto">
                <h2 id="proces-heading" className="text-3xl font-black text-black uppercase tracking-tight mb-10">Jak przebiega serwis</h2>
                <ol className="grid md:grid-cols-4 gap-6">
                  {[
                    { icon: <Send className="w-6 h-6" aria-hidden="true" />, title: '1. Zgłoszenie', text: 'Wypełniasz formularz serwisowy online - opisujesz model i usterkę.' },
                    { icon: <Truck className="w-6 h-6" aria-hidden="true" />, title: '2. Dostarczenie', text: 'Przywozisz sprzęt na ul. Główną 123 w Łapach lub wysyłasz kurierem.' },
                    { icon: <Clock className="w-6 h-6" aria-hidden="true" />, title: '3. Diagnoza i wycena', text: 'W ciągu maksymalnie 3 dni roboczych otrzymujesz szczegółową wycenę do akceptacji.' },
                    { icon: <CheckCircle className="w-6 h-6" aria-hidden="true" />, title: '4. Naprawa i zwrot', text: 'Po akceptacji wykonujemy serwis i odsyłamy sprzęt - z 12-miesięczną gwarancją.' },
                  ].map((step) => (
                    <li key={step.title} className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="w-12 h-12 rounded bg-skoczek-light text-skoczek-primary flex items-center justify-center mb-4">
                        {step.icon}
                      </div>
                      <h3 className="font-black uppercase text-black text-sm mb-2">{step.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{step.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <section className="py-20 px-4 max-w-4xl mx-auto" aria-labelledby="faq-heading">
              <h2 id="faq-heading" className="text-3xl font-black text-black uppercase tracking-tight mb-2">Najczęstsze pytania</h2>
              <p className="text-gray-500 mb-8">Serwis amortyzatorów - koszty, terminy, wysyłka i gwarancja.</p>

              <div className="space-y-3">
                {FAQ_ITEMS.map((item) => (
                  <details key={item.q} className="group bg-white border border-gray-200 rounded-xl p-5 open:shadow-sm">
                    <summary className="font-bold text-black cursor-pointer list-none flex items-start justify-between gap-4">
                      <h3 className="text-base font-bold">{item.q}</h3>
                      <ChevronRight className="w-5 h-5 text-skoczek-primary shrink-0 transition group-open:rotate-90" aria-hidden="true" />
                    </summary>
                    <p className="text-gray-600 text-sm leading-relaxed mt-4">{item.a}</p>
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

            <section className="bg-gray-900 text-white py-20 relative overflow-hidden" aria-labelledby="kontakt-heading">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" aria-hidden="true"></div>

              <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center relative z-10">
                <div>
                  <h2 id="kontakt-heading" className="text-2xl font-black mb-8 uppercase tracking-wide border-l-4 border-skoczek-primary pl-4">Kontakt</h2>
                  <div className="space-y-8">
                    <div className="flex gap-6">
                      <div className="w-10 h-10 bg-gray-800 flex items-center justify-center text-white shrink-0 rounded">
                        <MapPin className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Adres Serwisu</h3>
                        <p className="text-gray-400 mt-1 text-sm leading-relaxed">ul. Główna 123<br/>18-100 Łapy<br/>(powiat białostocki)</p>
                      </div>
                    </div>

                    <a href={`tel:${PHONE.replace(/\s+/g, '')}`} className="flex gap-6 group cursor-pointer hover:bg-white/5 p-2 -ml-2 rounded transition">
                      <div className="w-10 h-10 bg-gray-800 group-hover:bg-skoczek-primary transition flex items-center justify-center text-white shrink-0 rounded">
                        <Phone className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">Infolinia <span className="text-xs font-normal bg-skoczek-primary px-1.5 rounded">Zadzwoń</span></h3>
                        <p className="text-gray-400 mt-1 text-sm group-hover:text-white transition">{PHONE}<br/><span className="text-gray-600 group-hover:text-gray-400">Pn-Pt 10:00 - 18:00</span></p>
                      </div>
                    </a>

                    <Link to="/kontakt" className="flex gap-6 group cursor-pointer hover:bg-white/5 p-2 -ml-2 rounded transition w-full text-left">
                      <div className="w-10 h-10 bg-gray-800 group-hover:bg-skoczek-primary transition flex items-center justify-center text-white shrink-0 rounded">
                        <Mail className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">Email <span className="text-xs font-normal bg-skoczek-primary px-1.5 rounded">Napisz</span></h3>
                        <p className="text-gray-400 mt-1 text-sm group-hover:text-white transition break-all">{EMAIL}</p>
                      </div>
                    </Link>
                  </div>
                </div>

                <div className="h-[350px] w-full bg-gray-800 rounded border border-gray-700 shadow-2xl overflow-hidden">
                  <MapComponent consent={cookieConsent} onAccept={acceptCookiesFromMap} />
                </div>
              </div>
            </section>
          </>
        )}

        {view === 'PRICING' && (
          <div className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4">
              <header className="mb-10 border-b border-gray-100 pb-8">
                <h1 className="text-3xl md:text-4xl font-black text-black uppercase tracking-tight border-l-4 border-skoczek-primary pl-6">
                  Cennik serwisu amortyzatorów
                </h1>
                <p className="text-gray-600 mt-4 max-w-3xl leading-relaxed">
                  Poniżej znajdziesz orientacyjne ceny serwisu amortyzatorów przednich, damperów
                  i sztyc regulowanych (ceny brutto w PLN). Kolumna &bdquo;cena serwisu&rdquo; obejmuje
                  robociznę i olej, a &bdquo;z uszczelkami&rdquo; - pełny serwis wraz z kompletem uszczelek.
                  Ostateczny koszt potwierdzamy wyceną po diagnozie sprzętu, a każda zmiana zakresu prac
                  wymaga Twojej akceptacji.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <Link to="/zglos-serwis" className="bg-skoczek-primary text-white font-black px-8 py-3 rounded hover:bg-skoczek-primaryHover transition uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                    Zgłoś serwis <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                  <a href={`tel:${PHONE.replace(/\s+/g, '')}`} className="bg-white text-gray-900 border border-gray-300 font-black px-8 py-3 rounded hover:border-skoczek-primary hover:text-skoczek-primary transition uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" aria-hidden="true" /> {PHONE}
                  </a>
                </div>
              </header>

              <PricingTables categories={pricing} />

              <p className="text-sm text-gray-500 mt-10 bg-gray-50 border border-gray-200 rounded-xl p-6">
                Ceny mają charakter informacyjny i nie stanowią oferty w rozumieniu Kodeksu cywilnego.
                Koszt części zamiennych oraz przesyłki zwrotnej doliczany jest do wyceny. Szczegółowe
                zasady realizacji zleceń opisuje{' '}
                <Link to="/regulamin" className="text-skoczek-primary font-bold underline">regulamin serwisu</Link>.
              </p>
            </div>
          </div>
        )}

        {view === 'REGULATIONS' && (
          <div className="bg-gray-50 py-16 min-h-[calc(100vh-theme(spacing.24))]">
            <div className="max-w-4xl mx-auto px-4">
              <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-200">
                <h1 className="text-3xl font-black text-black uppercase tracking-tight mb-8 border-l-4 border-skoczek-primary pl-6">Regulamin Serwisu</h1>
                <p className="text-gray-600 mb-6 font-medium">
                  Prosimy o zapoznanie się z poniższymi zasadami świadczenia usług serwisowych przez Oddaj Amora.
                </p>
                <div className="bg-gray-50 p-6 rounded border border-gray-200 text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                  {FULL_REGULATIONS}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'PRIVACY' && (
          <div className="bg-gray-50 py-16 min-h-[calc(100vh-theme(spacing.24))]">
            <div className="max-w-4xl mx-auto px-4">
              <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-200">
                <h1 className="text-3xl font-black text-black uppercase tracking-tight mb-8 border-l-4 border-skoczek-primary pl-6">Polityka Prywatności i RODO</h1>
                <div className="bg-gray-50 p-6 rounded border border-gray-200 text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
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
                    <h1 className="text-3xl font-black text-black uppercase tracking-tight mb-2">Kontakt</h1>
                    <p className="text-gray-500">
                      Serwis amortyzatorów rowerowych Oddaj Amora - Łapy koło Białegostoku,
                      ul. Główna 123. Wybierz preferowaną formę kontaktu.
                    </p>
                  </div>

                  <ContactDetails />

                  <div className="h-[280px] w-full bg-gray-800 rounded-xl border border-gray-200 overflow-hidden">
                    <MapComponent consent={cookieConsent} onAccept={acceptCookiesFromMap} />
                  </div>
                </div>

                <div className="md:w-1/2">
                  <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
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
              <p className="text-skoczek-primary font-black text-6xl mb-4">404</p>
              <h1 className="text-3xl font-black text-black uppercase tracking-tight mb-4">Nie znaleziono strony</h1>
              <p className="text-gray-600 mb-8">
                Strona o tym adresie nie istnieje lub została przeniesiona. Sprawdź cennik, zgłoś
                serwis albo wróć na stronę główną.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/" className="bg-skoczek-primary text-white font-black px-8 py-3 rounded hover:bg-skoczek-primaryHover transition uppercase tracking-wider text-sm">
                  Strona główna
                </Link>
                <Link to="/cennik" className="bg-white text-gray-900 border border-gray-300 font-black px-8 py-3 rounded hover:border-skoczek-primary transition uppercase tracking-wider text-sm">
                  Cennik
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 grid gap-10 md:grid-cols-3">
          <div>
            <p className="text-xl font-black text-black uppercase tracking-tighter">ODDAJ <span className="text-skoczek-primary">AMORA</span></p>
            <p className="text-gray-500 text-sm mt-3 leading-relaxed">
              Profesjonalny serwis amortyzatorów i damperów rowerowych w Łapach koło Białegostoku.
              Przyjmujemy sprzęt osobiście oraz kurierem z całej Polski.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Dane kontaktowe</h2>
            <address className="not-italic text-sm text-gray-600 space-y-2">
              <p>ul. Główna 123, 18-100 Łapy</p>
              <p>
                <a href={`tel:${PHONE.replace(/\s+/g, '')}`} className="hover:text-skoczek-primary transition font-bold">{PHONE}</a>
              </p>
              <p>
                <a href={`mailto:${EMAIL}`} className="hover:text-skoczek-primary transition break-all">{EMAIL}</a>
              </p>
              <p className="text-gray-400">Pn-Pt 10:00 - 18:00</p>
            </address>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Serwis</h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li><Link to="/cennik" className="hover:text-skoczek-primary transition">Cennik usług</Link></li>
              <li><Link to="/zglos-serwis" className="hover:text-skoczek-primary transition">Zgłoś serwis</Link></li>
              <li><Link to="/kontakt" className="hover:text-skoczek-primary transition">Kontakt</Link></li>
              <li><Link to="/regulamin" className="hover:text-skoczek-primary transition">Regulamin</Link></li>
              <li><Link to="/polityka-prywatnosci" className="hover:text-skoczek-primary transition">Polityka prywatności i RODO</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-10 pt-8 border-t border-gray-100 text-center text-gray-400 text-xs space-y-1">
          <p>&copy; {new Date().getFullYear()} Oddaj Amora - {SITE_URL.replace(/^https?:\/\//, '')}</p>
          <p>Skoczek Suspension Tomasz Pierzchało, ul. Główna 123, 18-100 Łapy, NIP 5423158283, REGON 523948292</p>
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
