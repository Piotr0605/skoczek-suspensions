import React, { useState } from 'react';
import { PricingCategory } from '../types';

interface PricingTablesProps {
  categories: PricingCategory[];
  loading?: boolean;
}

const TAB_LABELS: Record<string, string> = {
  FRONT: 'Przód',
  REAR: 'Tył / Dampery',
  OTHER: 'Inne',
};

const PricingTables: React.FC<PricingTablesProps> = ({ categories, loading }) => {
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.id ?? 'FRONT');

  const activeData = categories.find((c) => c.id === activeTab) ?? categories[0];

  if (loading) {
    return (
      <div className="p-16 text-center text-gray-400 animate-pulse" role="status">
        Wczytywanie cennika...
      </div>
    );
  }

  if (!activeData) {
    return <div className="p-10 text-center text-gray-500">Cennik jest obecnie niedostępny.</div>;
  }

  return (
    <div>
      <div
        className="flex gap-8 mb-10 overflow-x-auto w-full border-b border-line"
        role="tablist"
        aria-label="Kategorie cennika"
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={activeTab === cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`relative -mb-px pb-4 text-[14px] font-medium tracking-tight transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === cat.id
                ? 'border-skoczek-primary text-ink-900'
                : 'border-transparent text-ink-400 hover:text-ink-900'
            }`}
          >
            {TAB_LABELS[cat.id] ?? cat.title}
          </button>
        ))}
      </div>

      <div>
        <h2 className="sr-only">{activeData.title}</h2>

        {activeData.services && activeData.services.length > 0 && (
          <div className="border-t border-line mb-10">
            <table className="w-full text-left">
              <caption className="sr-only">{activeData.title} - cennik</caption>
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="p-5 border-b border-gray-200">
                    Usługa
                  </th>
                  <th scope="col" className="p-5 border-b border-gray-200 w-32 text-right">
                    Cena (PLN)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeData.services.map((svc, idx) => (
                  <tr key={`${svc.name}-${idx}`} className="hover:bg-gray-50 transition">
                    <td className="p-5 font-bold text-black">{svc.name}</td>
                    <td className="p-5 text-right font-semibold text-skoczek-primary">{svc.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeData.brands && activeData.brands.length > 0 && (
          <div className="space-y-12">
            {activeData.brands.map((brand) => (
              <div key={brand.name}>
                <div className="flex items-baseline gap-4 pb-3 border-b-2 border-ink-900">
                  <h3 className="text-[17px] font-semibold text-ink-900 tracking-tight">
                    {brand.name}
                  </h3>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">
                    {brand.rows.length} {brand.rows.length === 1 ? 'pozycja' : 'pozycji'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <caption className="sr-only">
                      {brand.name} - ceny serwisu ({activeData.title})
                    </caption>
                    <thead>
                      <tr className="border-b border-line">
                        <th scope="col" className="py-3 pr-4 w-1/2 font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-ink-400">
                          Model
                        </th>
                        <th scope="col" className="py-3 px-4 text-right font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-ink-400">
                          Cena serwisu
                        </th>
                        <th scope="col" className="py-3 pl-4 text-right font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-ink-400">
                          Z uszczelkami
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {brand.rows.map((row, idx) => (
                        <tr key={`${row.model}-${idx}`} className="border-b border-line hover:bg-ink-50/60 transition-colors">
                          <td className="py-3.5 pr-4 text-[15px] text-ink-800">{row.model}</td>
                          <td className="py-3.5 px-4 text-right font-mono text-[15px] text-ink-900">
                            {row.priceService || <span className="text-ink-300">&mdash;</span>}
                          </td>
                          <td className="py-3.5 pl-4 text-right font-mono text-[15px] text-skoczek-primary">
                            {row.priceFull || <span className="text-ink-300">&mdash;</span>}
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
  );
};

export default PricingTables;
