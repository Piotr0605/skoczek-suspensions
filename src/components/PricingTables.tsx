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
        className="flex gap-2 mb-8 overflow-x-auto w-full pb-2 md:pb-0"
        role="tablist"
        aria-label="Kategorie cennika"
      >
        {categories.map((cat) => (
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
            {TAB_LABELS[cat.id] ?? cat.title}
          </button>
        ))}
      </div>

      <div>
        <h2 className="sr-only">{activeData.title}</h2>

        {activeData.services && activeData.services.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-8">
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
                    <td className="p-5 text-right font-black text-skoczek-primary">{svc.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeData.brands && activeData.brands.length > 0 && (
          <div className="space-y-8">
            {activeData.brands.map((brand) => (
              <div
                key={brand.name}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
              >
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-2">
                  <h3 className="font-black text-lg text-black uppercase tracking-tight">
                    {brand.name}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <caption className="sr-only">
                      {brand.name} - ceny serwisu ({activeData.title})
                    </caption>
                    <thead className="bg-white text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <tr>
                        <th scope="col" className="p-4 w-1/2">
                          Model
                        </th>
                        <th scope="col" className="p-4 text-right">
                          Cena serwisu
                        </th>
                        <th scope="col" className="p-4 text-right">
                          Z uszczelkami
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {brand.rows.map((row, idx) => (
                        <tr key={`${row.model}-${idx}`} className="hover:bg-gray-50 transition">
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
  );
};

export default PricingTables;
