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
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-skoczek-ink bg-skoczek-card p-4">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <p className="text-sm text-skoczek-muted">
          <span className="font-semibold text-skoczek-ink">Mapa dojazdu używa cookies. </span>
          Bez zgody adres zostaje, a mapa Google się nie ładuje.
        </p>
        <button
          onClick={handleAccept}
          className="bg-skoczek-ink px-4 py-2 text-sm font-semibold text-skoczek-paper"
        >
          Zgadzam się
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
