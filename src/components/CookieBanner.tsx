import React from 'react';

interface CookieBannerProps {
  onAccept: () => void;
  onReject: () => void;
  onOpenPrivacy: () => void;
}

const CookieBanner: React.FC<CookieBannerProps> = ({ onAccept, onReject, onOpenPrivacy }) => (
  <div
    role="dialog"
    aria-live="polite"
    aria-label="Zgoda na pliki cookies"
    className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-skoczek-primary z-50 p-6 shadow-[0_-5px_40px_rgba(0,0,0,0.1)] animate-slide-up"
  >
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="text-gray-600 text-sm md:text-base">
        <p className="font-bold text-black mb-1">Szanujemy Twoją prywatność</p>
        <p>
          Używamy niezbędnych plików cookies do działania panelu klienta. Za Twoją zgodą wyświetlimy też mapę Google,
          która zapisuje własne pliki cookies. Szczegóły w{' '}
          <button type="button" onClick={onOpenPrivacy} className="underline font-medium text-gray-800 hover:text-skoczek-primary">
            polityce prywatności
          </button>
          .
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
        <button
          type="button"
          onClick={onReject}
          className="border border-gray-300 text-gray-700 font-bold px-6 py-3 rounded hover:border-gray-500 transition whitespace-nowrap uppercase tracking-wider text-sm"
        >
          Tylko niezbędne
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="bg-skoczek-primary text-white font-black px-8 py-3 rounded hover:bg-skoczek-primaryHover transition whitespace-nowrap uppercase tracking-wider text-sm shadow-lg shadow-skoczek-primary/20"
        >
          Akceptuję wszystkie
        </button>
      </div>
    </div>
  </div>
);

export default CookieBanner;
