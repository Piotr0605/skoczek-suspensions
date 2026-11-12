import React, { useState, useEffect, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import emailjs from '@emailjs/browser';
import { PricingCategory, PricingCategoryId, User } from './types';
import { ApiService } from './services/api';
import { config } from './config';
import { ADDRESS, PHONE, EMAIL, PRICING_DATA, FULL_REGULATIONS, PRIVACY_POLICY, FAQ_ITEMS } from './constants';
import ServiceForm from './components/ServiceForm';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import CookieBanner from './components/CookieBanner';
import { validatePassword, validateRegistration, validateContactInquiry } from './utils/validation';
import { formatPrice } from './utils/pricing';
import { View, ROUTES, viewFromPath, applyRouteMeta } from './routes';
import {
  Menu, X, MapPin, Phone, Mail, ChevronRight,
  ShieldCheck, User as UserIcon, LogOut,
  CheckCircle, Send, Cookie, ChevronDown, ChevronUp,
  ClipboardList, Package, Search, Wrench, ExternalLink, AlertCircle
} from 'lucide-react';

const COOKIE_KEY = 'skoczek_cookie_consent';
type CookieConsent = 'accepted' | 'rejected' | null;

const PHONE_HREF = `tel:${PHONE.replace(/\s+/g, '')}`;
const MAPS_QUERY = encodeURIComponent(`${ADDRESS}, Galeria Rowerowa`);
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;
const MAPS_EMBED = `https://www.google.com/maps?q=${MAPS_QUERY}&output=embed&hl=pl`;

function readConsent(): CookieConsent {
  const value = localStorage.getItem(COOKIE_KEY);
  if (value === 'true' || value === 'accepted') return 'accepted';
  if (value === 'false' || value === 'rejected') return 'rejected';
  return null;
}

const SuspensionLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true" focusable="false">
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

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}
const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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

  const inputClass = "w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-900 focus:border-skoczek-primary focus:ring-1 focus:ring-skoczek-primary outline-none transition";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden relative border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Zamknij" className="absolute top-4 right-4 text-gray-400 hover:text-black"><X /></button>
        <div className="p-8">
          <h2 id="auth-title" className="text-2xl font-bold text-skoczek-primary mb-2">{isLogin ? 'Zaloguj się' : 'Utwórz konto'}</h2>
          <p className="text-gray-500 text-sm mb-6">Zarządzaj swoimi naprawami w bazie danych Oddaj Amora.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <input required aria-label="Imię i nazwisko" autoComplete="name" maxLength={100} placeholder="Imię i Nazwisko" className={inputClass}
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input required type="tel" aria-label="Telefon" autoComplete="tel" maxLength={30} placeholder="Telefon" className={inputClass}
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </>
            )}
            <input required type="email" aria-label="E-mail" autoComplete="email" placeholder="Email" className={inputClass}
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <input required type="password" aria-label="Hasło" autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="Hasło (min. 8 znaków)" minLength={8} className={inputClass}
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            
            {error && <p role="alert" className="text-red-600 text-sm font-medium bg-red-50 p-2 rounded">{error}</p>}
            
            <button disabled={loading} type="submit" className="w-full bg-skoczek-primary text-white font-bold py-3 rounded hover:bg-skoczek-primaryHover transition uppercase tracking-wide disabled:opacity-50 flex justify-center">
              {loading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : (isLogin ? 'Zaloguj' : 'Zarejestruj')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {isLogin ? 'Nie masz konta? ' : 'Masz już konto? '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-skoczek-primary font-semibold hover:text-skoczek-primaryHover transition">
              {isLogin ? 'Zarejestruj się' : 'Zaloguj się'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CONTACT_COOLDOWN_MS = 60_000;
const CONTACT_LAST_SENT_KEY = 'skoczek_contact_last_sent';

const ContactInquiryForm = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', website: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const mailtoHref = `mailto:${EMAIL}?subject=${encodeURIComponent(form.subject || 'Zapytanie ze strony')}&body=${encodeURIComponent(
    `${form.message}\n\n${form.name}\n${form.email}`
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Honeypot field: hidden from people, filled in by spam bots.
    if (form.website) {
      setStatus('sent');
      return;
    }

    const validationError = validateContactInquiry(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const lastSent = Number(localStorage.getItem(CONTACT_LAST_SENT_KEY) || 0);
    if (Date.now() - lastSent < CONTACT_COOLDOWN_MS) {
      setError('Wiadomość została już wysłana. Odczekaj chwilę przed wysłaniem kolejnej.');
      return;
    }

    setStatus('sending');
    try {
      await emailjs.send(
        config.emailjs.serviceId,
        config.emailjs.templateId,
        {
          to_name: 'Oddaj Amora',
          from_name: form.name.trim(),
          from_email: form.email.trim(),
          reply_to: form.email.trim(),
          from_phone: '-',
          component_model: `[Zapytanie kontaktowe] ${form.subject.trim()}`,
          problem_description: form.message.trim(),
          delivery_method: 'Zapytanie z formularza kontaktowego',
          preferred_date: '-',
        },
        config.emailjs.publicKey
      );
      localStorage.setItem(CONTACT_LAST_SENT_KEY, String(Date.now()));
      setStatus('sent');
      setForm({ name: '', email: '', subject: '', message: '', website: '' });
    } catch (err) {
      console.error('Contact form send failed:', err);
      setStatus('idle');
      setError('Nie udało się wysłać wiadomości. Zadzwoń do nas lub napisz bezpośrednio na adres e-mail.');
    }
  };

  if (status === 'sent') {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-green-50 rounded border border-green-100 animate-fade-in" role="status">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-800">Wiadomość wysłana!</h3>
        <p className="text-green-700 mt-2">Skontaktujemy się z Tobą najszybciej jak to możliwe.</p>
        <button type="button" onClick={() => setStatus('idle')} className="mt-6 text-sm font-bold text-green-800 underline">Wyślij kolejną wiadomość</button>
      </div>
    );
  }

  const inputClass = "w-full bg-white border border-gray-300 rounded p-3 focus:border-skoczek-primary focus:ring-1 focus:ring-skoczek-primary outline-none transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
      <h3 className="font-black text-xl uppercase mb-4">Szybkie zapytanie</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <input required aria-label="Imię" autoComplete="name" maxLength={100} placeholder="Imię" className={inputClass}
           value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
         <input required aria-label="E-mail" autoComplete="email" maxLength={150} placeholder="Email" type="email" className={inputClass}
           value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      </div>
      <input required aria-label="Temat" maxLength={150} placeholder="Temat (np. Wycena serwisu)" className={inputClass}
        value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
      <textarea required aria-label="Wiadomość" rows={4} maxLength={2000} placeholder="Twoja wiadomość..." className={inputClass}
        value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}></textarea>
      <div className="hidden" aria-hidden="true">
        <label>Strona www<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} /></label>
      </div>
      {error && (
        <div role="alert" className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded border border-red-100 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error} <a href={mailtoHref} className="underline font-bold">Napisz e-mail</a></span>
        </div>
      )}
      <button type="submit" disabled={status === 'sending'} className="w-full bg-black text-white font-bold py-3 hover:bg-gray-800 transition flex items-center justify-center gap-2 uppercase text-sm tracking-wider disabled:opacity-50">
        {status === 'sending' ? 'Wysyłanie…' : <>Wyślij Wiadomość <Send className="w-4 h-4" /></>}
      </button>
      <p className="text-xs text-gray-400">
        Wysyłając wiadomość, przekazujesz nam swoje dane w celu udzielenia odpowiedzi (art. 6 ust. 1 lit. f RODO).
      </p>
    </form>
  );
};

const CATEGORY_TABS: Record<PricingCategoryId, string> = {
  FRONT: 'Przód',
  REAR: 'Tył / Dampery',
  OTHER: 'Inne',
};

const PricingSection: React.FC<{ pricing: PricingCategory[] }> = ({ pricing }) => {
  const [activeTab, setActiveTab] = useState<PricingCategoryId>('FRONT');
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const activeData = pricing.find(d => d.id === activeTab) ?? pricing[0];

  return (
    <section id="cennik" aria-labelledby="cennik-heading" className="py-20 px-4 max-w-7xl mx-auto scroll-mt-28">
       <div className="flex flex-col mb-8 border-b border-gray-100 pb-6">
         <div>
            <h2 id="cennik-heading" className="text-3xl font-black text-black uppercase tracking-tight">Cennik serwisu amortyzatorów</h2>
            <p className="text-gray-500 mt-2">Orientacyjne ceny serwisu w PLN brutto. Dokładną wycenę przygotujemy po diagnozie sprzętu.</p>
         </div>
         
         <button 
           onClick={() => setIsMobileExpanded(!isMobileExpanded)}
           aria-expanded={isMobileExpanded}
           aria-controls="cennik-content"
           className="md:hidden mt-6 w-full flex items-center justify-center gap-2 bg-white border border-gray-200 py-3 rounded font-bold uppercase text-sm shadow-sm hover:border-skoczek-primary transition text-gray-800"
         >
           {isMobileExpanded ? 'Zwiń cennik' : 'Rozwiń cennik'}
           {isMobileExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
         </button>
       </div>

       <div id="cennik-content" className={`${isMobileExpanded ? 'block' : 'hidden'} md:block animate-fade-in`}>
         <div className="flex gap-2 mb-8 overflow-x-auto w-full pb-2 md:pb-0" role="tablist" aria-label="Kategorie cennika">
            {pricing.map(cat => (
                <button
                   key={cat.id}
                   role="tab"
                   aria-selected={activeTab === cat.id}
                   onClick={() => setActiveTab(cat.id)}
                   className={`px-6 py-3 font-bold uppercase text-sm tracking-wider rounded transition whitespace-nowrap shrink-0 ${
                       activeTab === cat.id 
                       ? 'bg-skoczek-primary text-white shadow-lg shadow-skoczek-primary/20' 
                       : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                   }`}
                >
                   {CATEGORY_TABS[cat.id]}
                </button>
            ))}
         </div>

         <div role="tabpanel">
            {activeData?.title && <h3 className="sr-only">{activeData.title}</h3>}
            {activeData?.id === 'OTHER' ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th scope="col" className="p-4 md:p-5 border-b border-gray-200">Usługa</th>
                                <th scope="col" className="p-4 md:p-5 border-b border-gray-200 w-32 text-right">Cena</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {activeData.services?.map((svc, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition">
                                    <td className="p-4 md:p-5 font-bold text-black">{svc.name}</td>
                                    <td className="p-4 md:p-5 text-right font-black text-skoczek-primary whitespace-nowrap">{formatPrice(svc.price) || <span className="text-gray-300">-</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid gap-8 lg:grid-cols-2">
                    {activeData?.brands?.map((brand) => (
                        <div key={brand.name} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-skoczek-primary rounded-full" aria-hidden="true"></span>
                                <h4 className="font-black text-lg text-black uppercase tracking-tight">{brand.name}</h4>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left min-w-[420px]">
                                  <thead className="bg-white text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                      <tr>
                                          <th scope="col" className="p-4 w-1/2">Model</th>
                                          <th scope="col" className="p-4 text-right">Serwis</th>
                                          <th scope="col" className="p-4 text-right">Z uszczelkami</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                      {brand.rows.map((row, idx) => (
                                          <tr key={idx} className="hover:bg-gray-50 transition">
                                              <td className="p-4 font-medium text-gray-800">{row.model}</td>
                                              <td className="p-4 text-right font-bold text-gray-900 whitespace-nowrap">
                                                  {formatPrice(row.priceService) || <span className="text-gray-300">-</span>}
                                              </td>
                                              <td className="p-4 text-right font-black text-skoczek-primary whitespace-nowrap">
                                                  {formatPrice(row.priceFull) || <span className="text-gray-300">-</span>}
                                              </td>
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
       </div>
    </section>
  );
}

const HOW_IT_WORKS = [
  { icon: ClipboardList, title: 'Zgłoś serwis online', text: 'Wypełnij krótki formularz – opisz model amortyzatora i problem.' },
  { icon: Package, title: 'Dostarcz sprzęt', text: 'Przynieś go do Galerii Rowerowej w Białymstoku lub wyślij kurierem z całej Polski.' },
  { icon: Search, title: 'Diagnoza i wycena', text: 'Wycenę otrzymasz do 3 dni roboczych. Pracę zaczynamy dopiero po Twojej akceptacji.' },
  { icon: Wrench, title: 'Serwis i odbiór', text: 'Status naprawy śledzisz w panelu klienta. Wysyłka zwrotna w 1 dzień roboczy od płatności.' },
];

const PageShell: React.FC<{ children: React.ReactNode; width?: string }> = ({ children, width = 'max-w-4xl' }) => (
  <div className="bg-gray-50 py-16 min-h-[calc(100vh-theme(spacing.24))]">
    <div className={`${width} mx-auto px-4`}>{children}</div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<View>(() => viewFromPath(window.location.pathname));
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [cookieConsent, setCookieConsent] = useState<CookieConsent>(() => readConsent());
  const [pricing, setPricing] = useState<{ data: PricingCategory[]; source: 'database' | 'default'; updatedAt?: string }>({
    data: PRICING_DATA,
    source: 'default',
  });

  const navigate = useCallback((target: View, hash?: string) => {
    const path = ROUTES[target].path || '/';
    const url = `${path}${hash ? `#${hash}` : ''}`;
    if (`${window.location.pathname}${window.location.hash}` !== url) {
      window.history.pushState({ view: target }, '', url);
    }
    setView(target);
    setMobileMenuOpen(false);
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }));
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    const onPopState = () => setView(viewFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    applyRouteMeta(view);
  }, [view]);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      setTimeout(() => document.getElementById(id)?.scrollIntoView(), 50);
    }

    ApiService.auth.me()
      .then((currentUser) => { if (currentUser) setUser(currentUser); })
      .catch((e) => console.error('Session check failed', e))
      .finally(() => setAuthLoading(false));

    ApiService.pricing.get()
      .then(setPricing)
      .catch((e) => console.error('Pricing load failed', e));
  }, []);

  const updateConsent = (value: 'accepted' | 'rejected') => {
    localStorage.setItem(COOKIE_KEY, value);
    setCookieConsent(value);
  };

  const handleLogout = async () => {
    await ApiService.auth.logout();
    setUser(null);
    navigate('HOME');
  };

  const linkHandler = (target: View, hash?: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigate(target, hash);
  };

  const hrefFor = (target: View, hash?: string) => `${ROUTES[target].path || '/'}${hash ? `#${hash}` : ''}`;

  const navLink = (label: string, target: View, hash?: string) => {
    const active = view === target && !hash;
    return (
      <a
        key={`${target}-${hash ?? ''}-${label}`}
        href={hrefFor(target, hash)}
        onClick={linkHandler(target, hash)}
        aria-current={active ? 'page' : undefined}
        className={`text-sm font-bold tracking-wider uppercase transition-colors ${active ? 'text-skoczek-primary' : 'text-gray-700 hover:text-skoczek-primary'}`}
      >
        {label}
      </a>
    );
  };

  const renderMap = () => {
    if (cookieConsent !== 'accepted') {
        return (
            <div className="h-full w-full bg-gray-800 flex flex-col items-center justify-center p-8 text-center border border-gray-700">
                <Cookie className="w-12 h-12 text-gray-500 mb-4" aria-hidden="true" />
                <h3 className="text-white font-bold text-lg mb-2">Mapa niedostępna</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-xs">
                    Mapy Google wymagają plików cookies. Zaakceptuj cookies, aby zobaczyć lokalizację, lub otwórz ją bezpośrednio w Mapach Google.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                      onClick={() => updateConsent('accepted')}
                      className="bg-skoczek-primary text-white font-bold py-2 px-6 rounded hover:bg-skoczek-primaryHover transition uppercase text-xs tracking-wider"
                  >
                      Zaakceptuj Cookies
                  </button>
                  <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 border border-gray-600 text-gray-200 font-bold py-2 px-6 rounded hover:border-white transition uppercase text-xs tracking-wider">
                      Otwórz mapę <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
            </div>
        );
    }

    return (
        <iframe 
            title={`Mapa dojazdu – ${ADDRESS}`}
            src={MAPS_EMBED}
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
    );
  };

  const renderAuthRequired = (message: string) => (
    <PageShell>
      <div className="bg-white p-10 rounded-xl border border-gray-200 shadow-sm text-center">
        {authLoading ? (
          <div className="animate-spin h-10 w-10 border-4 border-skoczek-primary border-t-transparent rounded-full mx-auto" aria-label="Ładowanie"></div>
        ) : (
          <>
            <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
            <h1 className="text-2xl font-black uppercase text-black mb-2">Wymagane logowanie</h1>
            <p className="text-gray-500 mb-6">{message}</p>
            {!user && (
              <button onClick={() => setIsAuthModalOpen(true)} className="bg-skoczek-primary text-white font-bold py-3 px-8 rounded hover:bg-skoczek-primaryHover transition uppercase text-sm tracking-wider">
                Zaloguj się
              </button>
            )}
          </>
        )}
      </div>
    </PageShell>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-gray-900">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow">
        Przejdź do treści
      </a>
      <div className="bg-skoczek-primary text-white text-xs py-2 px-4 text-center font-bold tracking-wider">
        DARMOWA WYCENA SERWISU • AUTORYZOWANY PUNKT • WYSYŁKA Z CAŁEJ POLSKI
      </div>

      <header className="sticky top-0 w-full z-40 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <nav aria-label="Główna nawigacja" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 md:h-24 items-center">
            <a href="/" onClick={linkHandler('HOME')} className="flex items-center gap-3" aria-label="Oddaj Amora – strona główna">
               <div className="relative w-12 h-12 flex items-center justify-center">
                  <SuspensionLogo className="w-full h-full text-skoczek-primary" />
               </div>
               <div className="flex flex-col leading-none">
                 <span className="text-2xl font-black tracking-tighter text-black uppercase">ODDAJ</span>
                 <span className="text-sm font-bold tracking-widest text-gray-500 uppercase">AMORA</span>
               </div>
            </a>

            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              {navLink('Start', 'HOME')}
              {navLink('Cennik', 'HOME', 'cennik')}
              {navLink('Zgłoś Serwis', 'FORM')}
              {navLink('Regulamin', 'REGULATIONS')}
              {navLink('Kontakt', 'CONTACT')}
              
              {user && user.role === 'ADMIN' && navLink('Panel Mechanika', 'ADMIN')}
              {user && user.role !== 'ADMIN' && navLink('Moje Konto', 'DASHBOARD')}
              
              <div className="h-6 w-px bg-gray-300 mx-2" aria-hidden="true"></div>
              
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="block text-xs text-gray-400 font-bold uppercase">
                        {user.role === 'ADMIN' ? 'Administrator' : 'Zalogowany jako'}
                    </span>
                    <span className="block text-sm font-bold text-black">{user.name}</span>
                  </div>
                  <button onClick={handleLogout} aria-label="Wyloguj się" title="Wyloguj się" className="text-gray-400 hover:text-skoczek-primary"><LogOut className="w-5 h-5" /></button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 text-sm font-bold bg-gray-100 text-black hover:bg-gray-200 px-5 py-3 rounded-full transition uppercase"
                >
                  <UserIcon className="w-4 h-4" /> Strefa Klienta
                </button>
              )}
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Zamknij menu' : 'Otwórz menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                className="text-black p-2"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden bg-white border-b border-gray-100 p-4 space-y-4 absolute w-full shadow-xl z-50">
             <div className="flex flex-col gap-4 text-center">
                {navLink('Strona Główna', 'HOME')}
                {navLink('Cennik', 'HOME', 'cennik')}
                {navLink('Zgłoś Serwis', 'FORM')}
                {navLink('Regulamin', 'REGULATIONS')}
                {navLink('Kontakt', 'CONTACT')}
                
                {user && user.role === 'ADMIN' && navLink('Panel Mechanika', 'ADMIN')}
                {user && user.role !== 'ADMIN' && navLink('Moje Konto', 'DASHBOARD')}
                
                <hr className="border-gray-100" />
                {user ? (
                  <button onClick={handleLogout} className="text-red-500 font-bold uppercase py-2">Wyloguj się</button>
                ) : (
                  <button onClick={() => { setIsAuthModalOpen(true); setMobileMenuOpen(false); }} className="bg-skoczek-primary text-white py-3 font-bold uppercase rounded">Zaloguj się</button>
                )}
             </div>
          </div>
        )}
      </header>

      <main id="main" className="flex-grow">
        {view === 'HOME' && (
          <>
            <section className="relative py-16 lg:py-28 bg-white overflow-hidden">
               <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
                  <svg className="absolute top-0 left-0 w-full h-full opacity-[0.03]" width="100%" height="100%">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="black" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
               </div>

               <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                  <div className="flex-1 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 font-bold text-xs px-3 py-1 rounded mb-6 uppercase tracking-widest">
                         <CheckCircle className="w-3 h-3 text-skoczek-primary" aria-hidden="true" /> Autoryzowany Punkt Serwisowy
                      </div>
                      
                      <h1 className="text-4xl md:text-6xl font-black text-black uppercase leading-tight tracking-tight mb-6 pl-0 md:pl-6 border-l-0 md:border-l-4 border-skoczek-primary">
                        Profesjonalny <br/>
                        Serwis Amortyzatorów
                        <span className="block text-xl md:text-2xl tracking-widest text-skoczek-primary mt-3">Rowerowych · Białystok</span>
                      </h1>
                      
                      <p className="text-gray-600 text-lg mb-8 max-w-xl mx-auto md:mx-0 font-medium leading-relaxed">
                       Kompleksowo zajmiemy się zawieszeniem w Twoim rowerze. 
                       Oferujemy najwyższej jakości usługi w zakresie serwisu, naprawy oraz ustawienia amortyzatorów
                       oraz damperów rowerowych wielu marek, takich jak FOX, Marzocchi, Rock Shox, Ohlins, SR Suntour
                       i innych.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <a href={hrefFor('FORM')} onClick={linkHandler('FORM')} className="bg-skoczek-primary text-white font-black px-8 py-3 rounded hover:bg-skoczek-primaryHover shadow-lg shadow-skoczek-primary/30 transition duration-300 flex items-center justify-center gap-2 uppercase tracking-wider text-sm group">
                          Zleć Naprawę <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" aria-hidden="true" />
                        </a>
                        <a href="#cennik" className="bg-white text-gray-900 border border-gray-300 font-black px-8 py-3 rounded hover:border-skoczek-primary hover:text-skoczek-primary transition duration-300 uppercase tracking-wider text-sm flex items-center justify-center">
                          Zobacz Cennik
                        </a>
                      </div>
                  </div>
                  
                  <div className="hidden md:flex w-1/3 max-w-sm aspect-square bg-gradient-to-br from-orange-50 via-white to-gray-50 border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/60 relative overflow-hidden group items-center justify-center" aria-hidden="true">
                       <div className="absolute inset-6 rounded-2xl border border-dashed border-skoczek-primary/20"></div>
                       <SuspensionLogo className="w-2/3 h-2/3 text-skoczek-primary drop-shadow-xl group-hover:scale-105 transition duration-700" />
                       <div className="absolute bottom-5 left-5 right-5 bg-white/90 backdrop-blur rounded-xl p-3 shadow border border-gray-100">
                           <div className="text-xs font-bold text-black uppercase mb-1.5 flex justify-between"><span>Szybka realizacja</span><span className="text-skoczek-primary">12 mies. gwarancji</span></div>
                           <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                               <div className="h-full w-3/4 bg-skoczek-primary"></div>
                           </div>
                       </div>
                  </div>
               </div>
            </section>

            <section aria-labelledby="atuty-heading" className="border-y border-gray-100 bg-gray-50/50 py-12">
               <h2 id="atuty-heading" className="sr-only">Dlaczego Oddaj Amora</h2>
               <ul className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                    { icon: <ShieldCheck className="w-8 h-8 text-skoczek-primary mb-1" aria-hidden="true" />, title: 'Gwarancja', text: '12 miesięcy na usługi' },
                    { icon: <SuspensionLogo className="w-8 h-8 text-skoczek-primary mb-1" />, title: 'Oryginalne Części', text: 'Korzystamy wyłącznie z najwyższej jakości produktów' },
                    { icon: <MapPin className="w-8 h-8 text-skoczek-primary mb-1" aria-hidden="true" />, title: 'Lokalizacja', text: 'Centrum Białegostoku' },
                    { icon: <Phone className="w-8 h-8 text-skoczek-primary mb-1" aria-hidden="true" />, title: 'Wsparcie', text: 'Doradztwo techniczne' },
                  ].map((item) => (
                    <li key={item.title} className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
                       {item.icon}
                       <div>
                         <h3 className="font-bold text-black uppercase text-sm">{item.title}</h3>
                         <p className="text-xs text-gray-500 mt-1">{item.text}</p>
                       </div>
                    </li>
                  ))}
               </ul>
            </section>

            <PricingSection pricing={pricing.data} />

            <section aria-labelledby="jak-heading" className="bg-gray-50 border-y border-gray-100 py-20 px-4">
              <div className="max-w-7xl mx-auto">
                <h2 id="jak-heading" className="text-3xl font-black text-black uppercase tracking-tight mb-2">Jak to działa?</h2>
                <p className="text-gray-500 mb-10">Serwis amortyzatora w czterech prostych krokach – na miejscu w Białymstoku lub wysyłkowo.</p>
                <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {HOW_IT_WORKS.map((step, i) => (
                    <li key={step.title} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm relative">
                      <span className="absolute top-4 right-5 text-5xl font-black text-gray-100 select-none" aria-hidden="true">{i + 1}</span>
                      <div className="w-11 h-11 rounded-lg bg-orange-50 text-skoczek-primary flex items-center justify-center mb-4">
                        <step.icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <h3 className="font-black uppercase text-black mb-2">{step.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{step.text}</p>
                    </li>
                  ))}
                </ol>
                <div className="mt-10 text-center">
                  <a href={hrefFor('FORM')} onClick={linkHandler('FORM')} className="inline-flex items-center gap-2 bg-black text-white font-bold px-8 py-3 rounded hover:bg-gray-800 transition uppercase tracking-wider text-sm">
                    Zgłoś serwis online <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </section>

            <section aria-labelledby="faq-heading" className="py-20 px-4">
              <div className="max-w-4xl mx-auto">
                <h2 id="faq-heading" className="text-3xl font-black text-black uppercase tracking-tight mb-8">Najczęstsze pytania</h2>
                <div className="space-y-3">
                  {FAQ_ITEMS.map((item) => (
                    <details key={item.question} className="group bg-white border border-gray-200 rounded-lg open:shadow-sm">
                      <summary className="cursor-pointer list-none flex items-center justify-between gap-4 p-5 font-bold text-black">
                        <h3 className="text-base">{item.question}</h3>
                        <ChevronDown className="w-5 h-5 text-skoczek-primary shrink-0 transition group-open:rotate-180" aria-hidden="true" />
                      </summary>
                      <p className="px-5 pb-5 -mt-1 text-gray-600 leading-relaxed">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>

            <section aria-labelledby="kontakt-heading" className="bg-gray-900 text-white py-20 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" aria-hidden="true"></div>
              
              <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center relative z-10">
                <div>
                   <h2 id="kontakt-heading" className="text-2xl font-black mb-8 uppercase tracking-wide border-l-4 border-skoczek-primary pl-4">Kontakt</h2>
                   <address className="space-y-8 not-italic">
                     <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="flex gap-6 group hover:bg-white/5 p-2 -ml-2 rounded transition">
                       <div className="w-10 h-10 bg-gray-800 group-hover:bg-skoczek-primary transition flex items-center justify-center text-white shrink-0 rounded">
                          <MapPin className="w-5 h-5" aria-hidden="true" />
                       </div>
                       <div>
                         <h3 className="font-bold text-lg">Adres Serwisu</h3>
                         <p className="text-gray-400 mt-1 text-sm leading-relaxed group-hover:text-white transition">ul. Mickiewicza 39<br/>15-213 Białystok<br/>(w lokalu Galerii Rowerowej)</p>
                       </div>
                     </a>
                     
                     <a href={PHONE_HREF} className="flex gap-6 group hover:bg-white/5 p-2 -ml-2 rounded transition">
                       <div className="w-10 h-10 bg-gray-800 group-hover:bg-skoczek-primary transition flex items-center justify-center text-white shrink-0 rounded">
                          <Phone className="w-5 h-5" aria-hidden="true" />
                       </div>
                       <div>
                         <h3 className="font-bold text-lg flex items-center gap-2">Infolinia <span className="text-xs font-normal bg-skoczek-primary px-1.5 rounded">Zadzwoń</span></h3>
                         <p className="text-gray-400 mt-1 text-sm group-hover:text-white transition">{PHONE}<br/><span className="text-gray-500 group-hover:text-gray-300">Pn-Pt 10:00 - 18:00</span></p>
                       </div>
                     </a>

                     <a href={hrefFor('CONTACT')} onClick={linkHandler('CONTACT')} className="flex gap-6 group hover:bg-white/5 p-2 -ml-2 rounded transition">
                       <div className="w-10 h-10 bg-gray-800 group-hover:bg-skoczek-primary transition flex items-center justify-center text-white shrink-0 rounded">
                          <Mail className="w-5 h-5" aria-hidden="true" />
                       </div>
                       <div>
                         <h3 className="font-bold text-lg flex items-center gap-2">Email <span className="text-xs font-normal bg-skoczek-primary px-1.5 rounded">Napisz</span></h3>
                         <p className="text-gray-400 mt-1 text-sm group-hover:text-white transition break-all">{EMAIL}</p>
                       </div>
                     </a>
                   </address>
                </div>
                
                <div className="h-[350px] w-full bg-gray-800 rounded border border-gray-700 shadow-2xl overflow-hidden">
                  {renderMap()}
                </div>
              </div>
            </section>
          </>
        )}

        {view === 'REGULATIONS' && (
           <PageShell>
                 <article className="bg-white p-6 md:p-12 rounded-xl shadow-sm border border-gray-200">
                    <h1 className="text-3xl font-black text-black uppercase tracking-tight mb-8 border-l-4 border-skoczek-primary pl-6">Regulamin Serwisu</h1>
                    <p className="text-gray-600 mb-6 font-medium">
                       Prosimy o zapoznanie się z poniższymi zasadami świadczenia usług serwisowych przez Oddaj Amora.
                    </p>
                    <div className="bg-gray-50 p-6 rounded border border-gray-200 text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                       {FULL_REGULATIONS}
                    </div>
                 </article>
           </PageShell>
        )}
        
        {view === 'PRIVACY' && (
           <PageShell>
                 <article className="bg-white p-6 md:p-12 rounded-xl shadow-sm border border-gray-200">
                    <h1 className="text-3xl font-black text-black uppercase tracking-tight mb-8 border-l-4 border-skoczek-primary pl-6">Polityka Prywatności i RODO</h1>
                    <div className="bg-gray-50 p-6 rounded border border-gray-200 text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                        {PRIVACY_POLICY}
                    </div>
                 </article>
           </PageShell>
        )}

        {view === 'CONTACT' && (
           <PageShell width="max-w-6xl">
                <div className="flex flex-col md:flex-row gap-12">
                   <div className="md:w-1/2 space-y-8">
                      <div>
                        <h1 className="text-3xl font-black text-black uppercase tracking-tight mb-2">Skontaktuj się</h1>
                        <p className="text-gray-500">Wybierz preferowaną formę kontaktu.</p>
                      </div>
                      
                      <address className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-8 not-italic">
                         <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center shrink-0 text-skoczek-primary">
                               <MapPin className="w-6 h-6" aria-hidden="true" />
                            </div>
                            <div>
                               <h2 className="font-bold uppercase text-sm text-gray-400 mb-1">Adres</h2>
                               <p className="font-bold text-lg text-black">{ADDRESS}</p>
                               <p className="text-sm text-gray-500">Białystok, woj. podlaskie (w lokalu Galerii Rowerowej)</p>
                               <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-skoczek-primary text-sm font-bold uppercase border-b-2 border-skoczek-primary/20 hover:border-skoczek-primary transition pb-0.5">
                                 Wyznacz trasę <ExternalLink className="w-3 h-3" aria-hidden="true" />
                               </a>
                            </div>
                         </div>

                         <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center shrink-0 text-skoczek-primary">
                               <Phone className="w-6 h-6" aria-hidden="true" />
                            </div>
                            <div className="flex-1">
                               <h2 className="font-bold uppercase text-sm text-gray-400 mb-1">Telefon</h2>
                               <p className="font-bold text-2xl text-black">{PHONE}</p>
                               <p className="text-sm text-gray-500 mb-2">Pn–Pt 10:00 – 18:00</p>
                               <a href={PHONE_HREF} className="inline-flex items-center gap-2 bg-skoczek-primary text-white px-4 py-2 rounded text-sm font-bold uppercase hover:bg-skoczek-primaryHover transition shadow-lg shadow-skoczek-primary/30">
                                  <Phone className="w-3 h-3" aria-hidden="true" /> Zadzwoń teraz
                               </a>
                            </div>
                         </div>

                         <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center shrink-0 text-skoczek-primary">
                               <Mail className="w-6 h-6" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                               <h2 className="font-bold uppercase text-sm text-gray-400 mb-1">Email</h2>
                               <p className="font-bold text-lg text-black mb-2 break-all">{EMAIL}</p>
                               <a href={`mailto:${EMAIL}`} className="text-skoczek-primary text-sm font-bold uppercase border-b-2 border-skoczek-primary/20 hover:border-skoczek-primary transition pb-0.5">
                                  Otwórz program pocztowy
                               </a>
                            </div>
                         </div>
                      </address>
                   </div>

                   <div className="md:w-1/2">
                      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
                         <ContactInquiryForm />
                      </div>
                   </div>
                </div>
           </PageShell>
        )}

        {view === 'FORM' && (
          <PageShell width="max-w-3xl">
              <ServiceForm 
                user={user} 
                onSuccess={() => navigate('DASHBOARD')} 
                onRequestLogin={() => setIsAuthModalOpen(true)}
                onOpenRegulations={() => navigate('REGULATIONS')}
                onOpenPrivacy={() => navigate('PRIVACY')}
              />
          </PageShell>
        )}

        {view === 'DASHBOARD' && (
          user && user.role !== 'ADMIN' ? (
            <PageShell width="max-w-6xl">
              <Dashboard user={user} />
            </PageShell>
          ) : (
            renderAuthRequired(user ? 'To konto nie ma panelu klienta.' : 'Zaloguj się, aby zobaczyć historię i status swoich napraw.')
          )
        )}

        {view === 'ADMIN' && (
          user && user.role === 'ADMIN' ? (
            <PageShell width="max-w-7xl">
              <AdminDashboard
                pricing={pricing.data}
                pricingSource={pricing.source}
                pricingUpdatedAt={pricing.updatedAt}
                onPricingSaved={(data) => setPricing({ data, source: 'database', updatedAt: new Date().toISOString() })}
              />
            </PageShell>
          ) : (
            renderAuthRequired(user ? 'Brak uprawnień administratora.' : 'Panel mechanika jest dostępny po zalogowaniu na konto administratora.')
          )
        )}

        {view === 'NOT_FOUND' && (
          <PageShell>
            <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
              <p className="text-7xl font-black text-skoczek-primary mb-4">404</p>
              <h1 className="text-2xl font-black uppercase text-black mb-2">Nie znaleziono strony</h1>
              <p className="text-gray-500 mb-8">Strona, której szukasz, nie istnieje lub została przeniesiona.</p>
              <a href="/" onClick={linkHandler('HOME')} className="bg-skoczek-primary text-white font-bold py-3 px-8 rounded hover:bg-skoczek-primaryHover transition uppercase text-sm tracking-wider">
                Strona główna
              </a>
            </div>
          </PageShell>
        )}

      </main>

      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
           <div>
             <p className="text-xl font-black text-black uppercase tracking-tighter">ODDAJ <span className="text-skoczek-primary">AMORA</span></p>
             <p className="text-gray-500 text-sm mt-2">
               Profesjonalny serwis amortyzatorów rowerowych w Białymstoku.
             </p>
             <p className="text-gray-400 text-xs mt-1">{ADDRESS} · <a href={PHONE_HREF} className="hover:text-skoczek-primary">{PHONE}</a></p>
           </div>
           
           <nav aria-label="Stopka" className="text-sm text-gray-500 font-medium flex flex-wrap justify-center gap-x-3 gap-y-2">
              <a href={hrefFor('REGULATIONS')} onClick={linkHandler('REGULATIONS')} className="hover:text-skoczek-primary transition">Regulamin</a>
              <span className="text-gray-300" aria-hidden="true">|</span>
              <a href={hrefFor('PRIVACY')} onClick={linkHandler('PRIVACY')} className="hover:text-skoczek-primary transition">Polityka Prywatności i RODO</a>
              <span className="text-gray-300" aria-hidden="true">|</span>
              <a href={hrefFor('CONTACT')} onClick={linkHandler('CONTACT')} className="hover:text-skoczek-primary transition">Kontakt</a>
              <span className="text-gray-300" aria-hidden="true">|</span>
              <a href={hrefFor('FORM')} onClick={linkHandler('FORM')} className="hover:text-skoczek-primary transition">Zgłoś Serwis</a>
              <span className="text-gray-300" aria-hidden="true">|</span>
              <button type="button" onClick={() => { localStorage.removeItem(COOKIE_KEY); setCookieConsent(null); }} className="hover:text-skoczek-primary transition">Ustawienia cookies</button>
           </nav>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-gray-100 text-center text-gray-400 text-xs">
           &copy; {new Date().getFullYear()} Oddaj Amora · Galeria Rowerowa Sp. z o.o.
        </div>
      </footer>

      {cookieConsent === null && (
        <CookieBanner
          onAccept={() => updateConsent('accepted')}
          onReject={() => updateConsent('rejected')}
          onOpenPrivacy={() => navigate('PRIVACY')}
        />
      )}
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={(u) => { setUser(u); setIsAuthModalOpen(false); }} />}
      <Analytics />
    </div>
  );
};

export default App;
