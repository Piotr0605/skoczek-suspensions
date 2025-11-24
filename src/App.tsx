import React, { useState, useEffect } from 'react';
import { User } from './types';
import { ApiService } from './services/api';
import { ADDRESS, PHONE, EMAIL, PRICING_DATA, FULL_REGULATIONS, PRIVACY_POLICY } from './constants';
import ServiceForm from './components/ServiceForm';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import CookieBanner from './components/CookieBanner';
import { 
  Menu, X, MapPin, Phone, Mail, ChevronRight, 
  ShieldCheck, User as UserIcon, LogOut,
  CheckCircle, Send, Cookie, ChevronDown, ChevronUp
} from 'lucide-react';

const SuspensionLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden relative border border-gray-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X /></button>
        <div className="p-8">
          <h2 className="text-2xl font-bold text-skoczek-primary mb-2">{isLogin ? 'Zaloguj się' : 'Utwórz konto'}</h2>
          <p className="text-gray-500 text-sm mb-6">Zarządzaj swoimi naprawami w bazie danych Oddaj Amora.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <input required placeholder="Imię i Nazwisko" className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-900 focus:border-skoczek-primary focus:ring-1 focus:ring-skoczek-primary outline-none transition" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input required placeholder="Telefon" className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-900 focus:border-skoczek-primary focus:ring-1 focus:ring-skoczek-primary outline-none transition" 
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </>
            )}
            <input required type="email" placeholder="Email" className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-900 focus:border-skoczek-primary focus:ring-1 focus:ring-skoczek-primary outline-none transition" 
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <input required type="password" placeholder="Hasło" className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-gray-900 focus:border-skoczek-primary focus:ring-1 focus:ring-skoczek-primary outline-none transition" 
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            
            {error && <p className="text-red-600 text-sm font-medium bg-red-50 p-2 rounded">{error}</p>}
            
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

const ContactInquiryForm = () => {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  if (sent) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-green-50 rounded border border-green-100 animate-fade-in">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-800">Wiadomość wysłana!</h3>
        <p className="text-green-700 mt-2">Skontaktujemy się z Tobą najszybciej jak to możliwe.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-black text-xl uppercase mb-4">Szybkie zapytanie</h3>
      <div className="grid grid-cols-2 gap-4">
         <input required placeholder="Imię" className="w-full bg-white border border-gray-300 rounded p-3 focus:border-skoczek-primary outline-none transition" />
         <input required placeholder="Email" type="email" className="w-full bg-white border border-gray-300 rounded p-3 focus:border-skoczek-primary outline-none transition" />
      </div>
      <input required placeholder="Temat (np. Wycena serwisu)" className="w-full bg-white border border-gray-300 rounded p-3 focus:border-skoczek-primary outline-none transition" />
      <textarea required rows={4} placeholder="Twoja wiadomość..." className="w-full bg-white border border-gray-300 rounded p-3 focus:border-skoczek-primary outline-none transition"></textarea>
      <button type="submit" className="w-full bg-black text-white font-bold py-3 hover:bg-gray-800 transition flex items-center justify-center gap-2 uppercase text-sm tracking-wider">
        Wyślij Wiadomość <Send className="w-4 h-4" />
      </button>
    </form>
  );
};

const PricingSection = () => {
  const [activeTab, setActiveTab] = useState<'FRONT' | 'REAR' | 'OTHER'>('FRONT');
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const activeData = PRICING_DATA.find(d => d.id === activeTab);

  return (
    <div id="cennik" className="py-20 px-4 max-w-7xl mx-auto scroll-mt-24">
       <div className="flex flex-col mb-8 border-b border-gray-100 pb-6">
         <div>
            <h2 className="text-3xl font-black text-black uppercase tracking-tight">Cennik Usług</h2>
            <p className="text-gray-500 mt-2">Szczegółowy kosztorys serwisowy (ceny w PLN).</p>
         </div>
         
         <button 
           onClick={() => setIsMobileExpanded(!isMobileExpanded)}
           className="md:hidden mt-6 w-full flex items-center justify-center gap-2 bg-white border border-gray-200 py-3 rounded font-bold uppercase text-sm shadow-sm hover:border-skoczek-primary transition text-gray-800"
         >
           {isMobileExpanded ? 'Zwiń cennik' : 'Rozwiń cennik'}
           {isMobileExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
         </button>
       </div>

       <div className={`${isMobileExpanded ? 'block' : 'hidden'} md:block animate-fade-in`}>
         <div className="flex gap-2 mb-8 overflow-x-auto w-full pb-2 md:pb-0">
            {PRICING_DATA.map(cat => (
                <button
                   key={cat.id}
                   onClick={() => setActiveTab(cat.id as any)}
                   className={`px-6 py-3 font-bold uppercase text-sm tracking-wider rounded transition whitespace-nowrap shrink-0 ${
                       activeTab === cat.id 
                       ? 'bg-skoczek-primary text-white shadow-lg shadow-skoczek-primary/20' 
                       : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                   }`}
                >
                   {cat.id === 'FRONT' ? 'Przód' : cat.id === 'REAR' ? 'Tył / Dampery' : 'Inne'}
                </button>
            ))}
         </div>

         <div>
            {activeTab === 'OTHER' ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="p-5 border-b border-gray-200">Usługa</th>
                                <th className="p-5 border-b border-gray-200 w-32 text-right">Cena</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {activeData?.services?.map((svc, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition">
                                    <td className="p-5 font-bold text-black">{svc.name}</td>
                                    <td className="p-5 text-right font-black text-skoczek-primary">{svc.price}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="space-y-8">
                    {activeData?.brands?.map((brand) => (
                        <div key={brand.name} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-2">
                                <span className="font-black text-lg text-black uppercase tracking-tight">{brand.name}</span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left min-w-[600px]">
                                  <thead className="bg-white text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                      <tr>
                                          <th className="p-4 w-1/2">Model</th>
                                          <th className="p-4 text-right">Cena Serwisu</th>
                                          <th className="p-4 text-right">Z Uszczelkami</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                      {brand.rows.map((row, idx) => (
                                          <tr key={idx} className="hover:bg-gray-50 transition">
                                              <td className="p-4 font-medium text-gray-800">{row.model}</td>
                                              <td className="p-4 text-right font-bold text-gray-900">
                                                  {row.priceService || <span className="text-gray-300">-</span>}
                                              </td>
                                              <td className="p-4 text-right font-black text-skoczek-primary">
                                                  {row.priceFull || <span className="text-gray-300">-</span>}
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
    </div>
  );
}

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

  const NavLink = ({ label, target }: { label: string, target: 'HOME' | 'DASHBOARD' | 'FORM' | 'REGULATIONS' | 'CONTACT' | 'ADMIN' | 'PRIVACY' }) => (
    <button 
      onClick={() => { setView(target); setMobileMenuOpen(false); }}
      className={`text-sm font-bold tracking-wider uppercase transition-colors ${view === target ? 'text-skoczek-primary' : 'text-gray-700 hover:text-skoczek-primary'}`}
    >
      {label}
    </button>
  );

  const MapComponent = () => {
    if (!cookieConsent) {
        return (
            <div className="h-full w-full bg-gray-800 flex flex-col items-center justify-center p-8 text-center border border-gray-700">
                <Cookie className="w-12 h-12 text-gray-600 mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">Mapa niedostępna</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-xs">
                    Mapy Google wymagają plików cookies. Zaakceptuj naszą politykę prywatności, aby zobaczyć lokalizację.
                </p>
                <button 
                    onClick={() => {
                        localStorage.setItem('skoczek_cookie_consent', 'true');
                        setCookieConsent(true);
                    }}
                    className="bg-skoczek-primary text-white font-bold py-2 px-6 rounded hover:bg-skoczek-primaryHover transition uppercase text-xs tracking-wider"
                >
                    Zaakceptuj Cookies
                </button>
            </div>
        );
    }

    return (
        <iframe 
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
          <div className="min-h-screen flex items-center justify-center bg-white text-skoczek-primary">
              <div className="animate-spin h-10 w-10 border-4 border-skoczek-primary border-t-transparent rounded-full"></div>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-gray-900">
      <div className="bg-skoczek-primary text-white text-xs py-2 px-4 text-center font-bold tracking-wider">
        DARMOWA WYCENA SERWISU • AUTORYZOWANY PUNKT
      </div>

      <nav className="sticky top-0 w-full z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24 items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('HOME')}>
               <div className="relative w-12 h-12 flex items-center justify-center">
                  <SuspensionLogo className="w-full h-full text-skoczek-primary" />
               </div>
               <div className="flex flex-col leading-none">
                 <span className="text-2xl font-black tracking-tighter text-black uppercase">ODDAJ</span>
                 <span className="text-sm font-bold tracking-widest text-gray-500 uppercase">AMORA</span>
               </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <NavLink label="Start" target="HOME" />
              <NavLink label="Zgłoś Serwis" target="FORM" />
              <NavLink label="Regulamin" target="REGULATIONS" />
              <NavLink label="Kontakt" target="CONTACT" />
              
              {user && user.role === 'ADMIN' && (
                  <NavLink label="Panel Mechanika" target="ADMIN" />
              )}
              {user && user.role !== 'ADMIN' && (
                  <NavLink label="Moje Konto" target="DASHBOARD" />
              )}
              
              <div className="h-6 w-px bg-gray-300 mx-2"></div>
              
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="block text-xs text-gray-400 font-bold uppercase">
                        {user.role === 'ADMIN' ? 'Administrator' : 'Zalogowany jako'}
                    </span>
                    <span className="block text-sm font-bold text-black">{user.name}</span>
                  </div>
                  <button onClick={handleLogout} className="text-gray-400 hover:text-skoczek-primary"><LogOut className="w-5 h-5" /></button>
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
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-black p-2">
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 p-4 space-y-4 absolute w-full shadow-xl z-50">
             <div className="flex flex-col gap-4 text-center">
                <NavLink label="Strona Główna" target="HOME" />
                <NavLink label="Zgłoś Serwis" target="FORM" />
                <NavLink label="Regulamin" target="REGULATIONS" />
                <NavLink label="Kontakt" target="CONTACT" />
                
                {user && user.role === 'ADMIN' && <NavLink label="Panel Mechanika" target="ADMIN" />}
                {user && user.role !== 'ADMIN' && <NavLink label="Moje Konto" target="DASHBOARD" />}
                
                <hr className="border-gray-100" />
                {user ? (
                  <button onClick={handleLogout} className="text-red-500 font-bold uppercase py-2">Wyloguj się</button>
                ) : (
                  <button onClick={() => { setIsAuthModalOpen(true); setMobileMenuOpen(false); }} className="bg-skoczek-primary text-white py-3 font-bold uppercase rounded">Zaloguj się</button>
                )}
             </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        
        {view === 'HOME' && (
          <>
            <section className="relative py-20 lg:py-32 bg-white overflow-hidden">
               <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
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
                      <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 font-bold text-xs px-3 py-1 rounded mb-6 uppercase tracking-widest">
                         <CheckCircle className="w-3 h-3 text-skoczek-primary" /> Autoryzowany Punkt Serwisowy
                      </div>
                      
                      <div className="flex md:block flex-col items-center">
                          <h1 className="text-4xl md:text-6xl font-black text-black uppercase leading-tight tracking-tight mb-6 pl-0 md:pl-6 border-l-0 md:border-l-4 border-skoczek-primary">
                            Profesjonalny <br/>
                            Serwis Amortyzatorów
                          </h1>
                      </div>
                      
                      <p className="text-gray-600 text-lg mb-8 max-w-xl font-medium leading-relaxed">
                       Kompleksowo zajmiemy się zawieszeniem w Twoim rowerze. 
                       Oferujemy najwyższej jakości usługi w zakresie serwisu, naprawy oraz ustawienia amortyzatorów
                       oraz damperów rowerowych wielu marek, takich jak FOX, Marzocchi, Rock Shox, Ohlins, SR Suntour
                       i innych.

                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <button onClick={() => setView('FORM')} className="bg-skoczek-primary text-white font-black px-8 py-3 rounded hover:bg-skoczek-primaryHover shadow-lg shadow-skoczek-primary/30 transition duration-300 flex items-center justify-center gap-2 uppercase tracking-wider text-sm group">
                          Zleć Naprawę <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                        </button>
                        <a href="#cennik" className="bg-white text-gray-900 border border-gray-300 font-black px-8 py-3 rounded hover:border-skoczek-primary hover:text-skoczek-primary transition duration-300 uppercase tracking-wider text-sm flex items-center justify-center">
                          Zobacz Cennik
                        </a>
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

            <section className="border-y border-gray-100 bg-gray-50/50 py-12">
               <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3 group pl-4 md:pl-0">
                     <ShieldCheck className="w-8 h-8 text-skoczek-primary mb-1" />
                     <div>
                       <h4 className="font-bold text-black uppercase text-sm">Gwarancja</h4>
                       <p className="text-xs text-gray-500 mt-1">12 miesięcy na usługi</p>
                     </div>
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3 group">
                     <SuspensionLogo className="w-8 h-8 text-skoczek-primary mb-1" />
                     <div>
                       <h4 className="font-bold text-black uppercase text-sm">Oryginalne Części</h4>
                       <p className="text-xs text-gray-500 mt-1">Korzystamy wyłącznie z najwyższej jakości produktów</p>
                     </div>
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3 group">
                     <MapPin className="w-8 h-8 text-skoczek-primary mb-1" />
                     <div>
                       <h4 className="font-bold text-black uppercase text-sm">Lokalizacja</h4>
                       <p className="text-xs text-gray-500 mt-1">Centrum Białegostoku</p>
                     </div>
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3 group">
                     <Phone className="w-8 h-8 text-skoczek-primary mb-1" />
                     <div>
                       <h4 className="font-bold text-black uppercase text-sm">Wsparcie</h4>
                       <p className="text-xs text-gray-500 mt-1">Doradztwo techniczne</p>
                     </div>
                  </div>
               </div>
            </section>

            <PricingSection />

            <section className="bg-gray-900 text-white py-20 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center relative z-10">
                <div>
                   <h2 className="text-2xl font-black mb-8 uppercase tracking-wide border-l-4 border-skoczek-primary pl-4">Kontakt</h2>
                   <div className="space-y-8">
                     <div className="flex gap-6 group">
                       <div className="w-10 h-10 bg-gray-800 group-hover:bg-skoczek-primary transition flex items-center justify-center text-white shrink-0 rounded">
                          <MapPin className="w-5 h-5" />
                       </div>
                       <div>
                         <h4 className="font-bold text-lg">Adres Serwisu</h4>
                         <p className="text-gray-400 mt-1 text-sm leading-relaxed">ul. Mickiewicza 39<br/>15-213 Białystok<br/>(w lokalu Galerii Rowerowej)</p>
                       </div>
                     </div>
                     
                     <a href={`tel:${PHONE.replace(/\s+/g, '')}`} className="flex gap-6 group cursor-pointer hover:bg-white/5 p-2 -ml-2 rounded transition">
                       <div className="w-10 h-10 bg-gray-800 group-hover:bg-skoczek-primary transition flex items-center justify-center text-white shrink-0 rounded">
                          <Phone className="w-5 h-5" />
                       </div>
                       <div>
                         <h4 className="font-bold text-lg flex items-center gap-2">Infolinia <span className="text-xs font-normal bg-skoczek-primary px-1.5 rounded">Zadzwoń</span></h4>
                         <p className="text-gray-400 mt-1 text-sm group-hover:text-white transition">{PHONE}<br/><span className="text-gray-600 group-hover:text-gray-400">Pn-Pt 10:00 - 18:00</span></p>
                       </div>
                     </a>

                     <button onClick={() => setView('CONTACT')} className="flex gap-6 group cursor-pointer hover:bg-white/5 p-2 -ml-2 rounded transition w-full text-left">
                       <div className="w-10 h-10 bg-gray-800 group-hover:bg-skoczek-primary transition flex items-center justify-center text-white shrink-0 rounded">
                          <Mail className="w-5 h-5" />
                       </div>
                       <div>
                         <h4 className="font-bold text-lg flex items-center gap-2">Email <span className="text-xs font-normal bg-skoczek-primary px-1.5 rounded">Napisz</span></h4>
                         <p className="text-gray-400 mt-1 text-sm group-hover:text-white transition">{EMAIL}</p>
                       </div>
                     </button>
                   </div>
                </div>
                
                <div className="h-[350px] w-full bg-gray-800 rounded border border-gray-700 shadow-2xl overflow-hidden">
                  <MapComponent />
                </div>
              </div>
            </section>
          </>
        )}

        {view === 'REGULATIONS' && (
           <div className="bg-gray-50 py-16 min-h-[calc(100vh-theme(spacing.24))]">
              <div className="max-w-4xl mx-auto px-4">
                 <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-3xl font-black text-black uppercase tracking-tight mb-8 border-l-4 border-skoczek-primary pl-6">Regulamin Serwisu</h2>
                    <div className="prose max-w-none">
                       <p className="text-gray-600 mb-6 font-medium">
                          Prosimy o zapoznanie się z poniższymi zasadami świadczenia usług serwisowych przez Oddaj Amora.
                       </p>
                       <div className="bg-gray-50 p-6 rounded border border-gray-200 text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                          {FULL_REGULATIONS}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}
        
        {view === 'PRIVACY' && (
           <div className="bg-gray-50 py-16 min-h-[calc(100vh-theme(spacing.24))]">
              <div className="max-w-4xl mx-auto px-4">
                 <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-3xl font-black text-black uppercase tracking-tight mb-8 border-l-4 border-skoczek-primary pl-6">Polityka Prywatności i RODO</h2>
                    <div className="prose max-w-none">
                       <div className="bg-gray-50 p-6 rounded border border-gray-200 text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                           {PRIVACY_POLICY}
                       </div>
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
                        <h2 className="text-3xl font-black text-black uppercase tracking-tight mb-2">Skontaktuj się</h2>
                        <p className="text-gray-500">Wybierz preferowaną formę kontaktu.</p>
                      </div>
                      
                      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-8">
                         <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center shrink-0 text-skoczek-primary">
                               <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                               <h4 className="font-bold uppercase text-sm text-gray-400 mb-1">Adres</h4>
                               <p className="font-bold text-lg text-black">{ADDRESS}</p>
                               <p className="text-sm text-gray-500">Białystok, woj. podlaskie</p>
                            </div>
                         </div>

                         <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center shrink-0 text-skoczek-primary">
                               <Phone className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                               <h4 className="font-bold uppercase text-sm text-gray-400 mb-1">Telefon</h4>
                               <p className="font-bold text-2xl text-black mb-2">{PHONE}</p>
                               <a href={`tel:${PHONE.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 bg-skoczek-primary text-white px-4 py-2 rounded text-sm font-bold uppercase hover:bg-skoczek-primaryHover transition shadow-lg shadow-skoczek-primary/30">
                                  <Phone className="w-3 h-3" /> Zadzwoń teraz
                               </a>
                            </div>
                         </div>

                         <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center shrink-0 text-skoczek-primary">
                               <Mail className="w-6 h-6" />
                            </div>
                            <div>
                               <h4 className="font-bold uppercase text-sm text-gray-400 mb-1">Email</h4>
                               <p className="font-bold text-lg text-black mb-2">{EMAIL}</p>
                               <a href={`mailto:${EMAIL}`} className="text-skoczek-primary text-sm font-bold uppercase border-b-2 border-skoczek-primary/20 hover:border-skoczek-primary transition pb-0.5">
                                  Otwórz program pocztowy
                               </a>
                            </div>
                         </div>
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
                onSuccess={() => setView('DASHBOARD')} 
                onRequestLogin={() => setIsAuthModalOpen(true)}
              />
            </div>
          </div>
        )}

        {view === 'DASHBOARD' && user && user.role !== 'ADMIN' && (
          <div className="bg-gray-50 py-16 min-h-[calc(100vh-theme(spacing.24))]">
            <div className="max-w-6xl mx-auto px-4">
              <Dashboard user={user} />
            </div>
          </div>
        )}

        {view === 'ADMIN' && user && user.role === 'ADMIN' && (
          <div className="bg-gray-50 py-16 min-h-[calc(100vh-theme(spacing.24))]">
            <div className="max-w-7xl mx-auto px-4">
              <AdminDashboard />
            </div>
          </div>
        )}

      </main>

      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
           <div>
             <h4 className="text-xl font-black text-black uppercase tracking-tighter">ODDAJ <span className="text-skoczek-primary">AMORA</span></h4>
             <p className="text-gray-500 text-sm mt-2">
               Profesjonalny serwis rowerowy w Białymstoku.
             </p>
           </div>
           
           <div className="text-sm text-gray-500 font-medium">
              <button onClick={() => setView('REGULATIONS')} className="hover:text-skoczek-primary transition">Regulamin</button>
              <span className="mx-3 text-gray-300">|</span>
              <button onClick={() => setView('PRIVACY')} className="hover:text-skoczek-primary transition">Polityka Prywatności i RODO</button>
              <span className="mx-3 text-gray-300">|</span>
              <button onClick={() => setView('CONTACT')} className="hover:text-skoczek-primary transition">Kontakt</button>
              <span className="mx-3 text-gray-300">|</span>
              <button onClick={() => setView('FORM')} className="hover:text-skoczek-primary transition">Zgłoś Serwis</button>
           </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-gray-100 text-center text-gray-400 text-xs">
           &copy; {new Date().getFullYear()} Oddaj Amora.
        </div>
      </footer>

      <CookieBanner onAccept={handleAcceptCookies} />
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={(u) => { setUser(u); setIsAuthModalOpen(false); }} />}
    </div>
  );
};

export default App;