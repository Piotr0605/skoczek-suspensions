import React, { useState, useEffect } from 'react';

interface CookieBannerProps {
  onAccept: () => void;
}

const CookieBanner: React.FC<CookieBannerProps> = ({ onAccept }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('skoczek_cookie_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('skoczek_cookie_consent', 'true');
    setVisible(false);
    onAccept();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-line z-50 px-4 py-5 animate-slide-up">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="text-ink-600 text-[14px] max-w-3xl">
          <p className="font-semibold text-ink-900 mb-1">Szanujemy Twoją prywatność</p>
          <p>
            Ta strona używa plików cookies w celu wyświetlania mapy dojazdu oraz zapewnienia poprawnego działania panelu klienta. 
            Brak zgody spowoduje ukrycie mapy Google.
          </p>
        </div>
        <div className="flex gap-4">
            <button
            onClick={handleAccept}
            className="bg-skoczek-primary text-white font-semibold px-8 py-3 rounded hover:bg-skoczek-primaryHover transition whitespace-nowrap uppercase tracking-wider text-sm "
            >
            Akceptuję Cookies
            </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;