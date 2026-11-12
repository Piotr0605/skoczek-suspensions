import React, { useEffect, useMemo, useState } from 'react';
import { PricingBrand, PricingCategory, PricingCategoryId, PricingRow, PricingService } from '../types';
import { ApiService } from '../services/api';
import { PRICING_DATA } from '../constants';
import { PRICING_LIMITS, sanitizePricing } from '../utils/pricing';
import { ArrowDown, ArrowUp, CheckCircle, Plus, RotateCcw, Save, Trash2, AlertCircle, Undo2 } from 'lucide-react';

interface PricingEditorProps {
  pricing: PricingCategory[];
  source: 'database' | 'default';
  updatedAt?: string;
  onSaved: (pricing: PricingCategory[]) => void;
}

const CATEGORY_LABELS: Record<PricingCategoryId, string> = {
  FRONT: 'Przód',
  REAR: 'Tył / Dampery',
  OTHER: 'Inne usługi',
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const copy = [...list];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

const inputClass =
  'w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:border-skoczek-primary focus:ring-1 focus:ring-skoczek-primary outline-none transition';

const iconButton =
  'p-2 rounded border border-gray-200 bg-white text-gray-500 hover:text-skoczek-primary hover:border-skoczek-primary transition disabled:opacity-30 disabled:hover:text-gray-500 disabled:hover:border-gray-200';

const PricingEditor: React.FC<PricingEditorProps> = ({ pricing, source, updatedAt, onSaved }) => {
  const [draft, setDraft] = useState<PricingCategory[]>(() => clone(pricing));
  const [activeTab, setActiveTab] = useState<PricingCategoryId>('FRONT');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setDraft(clone(pricing));
  }, [pricing]);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(pricing), [draft, pricing]);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const category = draft.find((c) => c.id === activeTab);

  const updateCategory = (updater: (cat: PricingCategory) => PricingCategory) => {
    setMessage(null);
    setDraft((prev) => prev.map((c) => (c.id === activeTab ? updater(c) : c)));
  };

  const updateBrands = (updater: (brands: PricingBrand[]) => PricingBrand[]) =>
    updateCategory((c) => ({ ...c, brands: updater(c.brands || []) }));

  const updateBrand = (brandIndex: number, updater: (brand: PricingBrand) => PricingBrand) =>
    updateBrands((brands) => brands.map((b, i) => (i === brandIndex ? updater(b) : b)));

  const updateRow = (brandIndex: number, rowIndex: number, field: keyof PricingRow, value: string) =>
    updateBrand(brandIndex, (b) => ({
      ...b,
      rows: b.rows.map((r, i) => (i === rowIndex ? { ...r, [field]: field === 'model' ? value : value || null } : r)),
    }));

  const updateServices = (updater: (services: PricingService[]) => PricingService[]) =>
    updateCategory((c) => ({ ...c, services: updater(c.services || []) }));

  const handleSave = async () => {
    setMessage(null);
    const sanitized = sanitizePricing(draft);
    if (!sanitized) {
      setMessage({ type: 'error', text: 'Cennik nie może być pusty.' });
      return;
    }
    setSaving(true);
    try {
      const saved = await ApiService.pricing.save(draft);
      onSaved(saved);
      setMessage({ type: 'success', text: 'Cennik zapisany. Zmiany są już widoczne na stronie.' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Błąd zapisu cennika.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    setDraft(clone(pricing));
    setMessage(null);
  };

  const handleRestoreDefaults = () => {
    if (!window.confirm('Załadować do edytora domyślny cennik? Zmiany zostaną zapisane dopiero po kliknięciu "Zapisz cennik".')) return;
    setDraft(clone(PRICING_DATA));
    setMessage(null);
  };

  const confirmDelete = (label: string) => window.confirm(`Usunąć ${label}?`);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight text-black">Edycja cennika</h3>
          <p className="text-sm text-gray-500 mt-1">
            {source === 'database' ? (
              <>Cennik z bazy danych{updatedAt && <> · ostatnia zmiana: {new Date(updatedAt).toLocaleString('pl-PL')}</>}</>
            ) : (
              <>Na stronie wyświetlany jest cennik domyślny. Po pierwszym zapisie będzie pobierany z bazy danych.</>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRestoreDefaults}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-skoczek-primary transition shrink-0"
        >
          <RotateCcw className="w-4 h-4" /> Przywróć domyślny
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Kategorie cennika">
        {draft.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={activeTab === c.id}
            onClick={() => setActiveTab(c.id)}
            className={`px-5 py-2.5 font-bold uppercase text-xs tracking-wider rounded transition whitespace-nowrap ${
              activeTab === c.id ? 'bg-skoczek-primary text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {CATEGORY_LABELS[c.id]}
          </button>
        ))}
      </div>

      {category && (
        <div className="space-y-6">
          <label className="block">
            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nazwa kategorii</span>
            <input
              className={inputClass}
              value={category.title}
              maxLength={PRICING_LIMITS.text}
              onChange={(e) => updateCategory((c) => ({ ...c, title: e.target.value }))}
            />
          </label>

          {category.id === 'OTHER' ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="hidden md:grid grid-cols-[1fr_10rem_7rem] gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500">
                <span>Usługa</span>
                <span>Cena (PLN)</span>
                <span className="text-right">Kolejność</span>
              </div>
              <div className="divide-y divide-gray-100">
                {(category.services || []).map((svc, i, all) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_10rem_7rem] gap-3 p-4 items-center">
                    <input
                      className={inputClass}
                      aria-label="Nazwa usługi"
                      placeholder="Nazwa usługi"
                      value={svc.name}
                      maxLength={PRICING_LIMITS.text}
                      onChange={(e) => updateServices((s) => s.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    />
                    <input
                      className={inputClass}
                      aria-label="Cena"
                      placeholder="np. 150 lub 50-100"
                      value={svc.price}
                      maxLength={PRICING_LIMITS.price}
                      onChange={(e) => updateServices((s) => s.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
                    />
                    <div className="flex gap-1 md:justify-end">
                      <button type="button" className={iconButton} title="W górę" aria-label="Przesuń w górę" disabled={i === 0} onClick={() => updateServices((s) => move(s, i, -1))}>
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button type="button" className={iconButton} title="W dół" aria-label="Przesuń w dół" disabled={i === all.length - 1} onClick={() => updateServices((s) => move(s, i, 1))}>
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className={`${iconButton} hover:!text-red-600 hover:!border-red-300`}
                        title="Usuń"
                        aria-label="Usuń usługę"
                        onClick={() => confirmDelete(`usługę "${svc.name || 'bez nazwy'}"`) && updateServices((s) => s.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => updateServices((s) => [...s, { name: '', price: '' }])}
                  className="inline-flex items-center gap-2 text-sm font-bold text-skoczek-primary hover:text-skoczek-primaryHover"
                >
                  <Plus className="w-4 h-4" /> Dodaj usługę
                </button>
              </div>
            </div>
          ) : (
            <>
              {(category.brands || []).map((brand, bi, brands) => (
                <div key={bi} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center p-4 bg-gray-50 border-b border-gray-200">
                    <input
                      className={`${inputClass} font-black uppercase sm:max-w-xs`}
                      aria-label="Marka"
                      placeholder="Marka (np. FOX)"
                      value={brand.name}
                      maxLength={PRICING_LIMITS.text}
                      onChange={(e) => updateBrand(bi, (b) => ({ ...b, name: e.target.value }))}
                    />
                    <div className="flex gap-1 sm:ml-auto">
                      <button type="button" className={iconButton} title="Marka w górę" aria-label="Przesuń markę w górę" disabled={bi === 0} onClick={() => updateBrands((b) => move(b, bi, -1))}>
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button type="button" className={iconButton} title="Marka w dół" aria-label="Przesuń markę w dół" disabled={bi === brands.length - 1} onClick={() => updateBrands((b) => move(b, bi, 1))}>
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className={`${iconButton} hover:!text-red-600 hover:!border-red-300`}
                        title="Usuń markę"
                        aria-label="Usuń markę"
                        onClick={() => confirmDelete(`markę "${brand.name || 'bez nazwy'}" wraz ze wszystkimi pozycjami`) && updateBrands((b) => b.filter((_, j) => j !== bi))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="hidden md:grid grid-cols-[1fr_9rem_9rem_7rem] gap-3 px-4 pt-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                    <span>Model</span>
                    <span>Cena serwisu</span>
                    <span>Z uszczelkami</span>
                    <span className="text-right">Kolejność</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {brand.rows.map((row, ri) => (
                      <div key={ri} className="grid grid-cols-2 md:grid-cols-[1fr_9rem_9rem_7rem] gap-3 p-4 items-center">
                        <input
                          className={`${inputClass} col-span-2 md:col-span-1`}
                          aria-label="Model"
                          placeholder="Model"
                          value={row.model}
                          maxLength={PRICING_LIMITS.text}
                          onChange={(e) => updateRow(bi, ri, 'model', e.target.value)}
                        />
                        <input
                          className={inputClass}
                          aria-label="Cena serwisu"
                          placeholder="Serwis"
                          value={row.priceService ?? ''}
                          maxLength={PRICING_LIMITS.price}
                          onChange={(e) => updateRow(bi, ri, 'priceService', e.target.value)}
                        />
                        <input
                          className={inputClass}
                          aria-label="Cena z uszczelkami"
                          placeholder="Z uszczelkami"
                          value={row.priceFull ?? ''}
                          maxLength={PRICING_LIMITS.price}
                          onChange={(e) => updateRow(bi, ri, 'priceFull', e.target.value)}
                        />
                        <div className="flex gap-1 col-span-2 md:col-span-1 md:justify-end">
                          <button type="button" className={iconButton} title="W górę" aria-label="Przesuń w górę" disabled={ri === 0} onClick={() => updateBrand(bi, (b) => ({ ...b, rows: move(b.rows, ri, -1) }))}>
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button type="button" className={iconButton} title="W dół" aria-label="Przesuń w dół" disabled={ri === brand.rows.length - 1} onClick={() => updateBrand(bi, (b) => ({ ...b, rows: move(b.rows, ri, 1) }))}>
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className={`${iconButton} hover:!text-red-600 hover:!border-red-300`}
                            title="Usuń pozycję"
                            aria-label="Usuń pozycję"
                            onClick={() => confirmDelete(`pozycję "${row.model || 'bez nazwy'}"`) && updateBrand(bi, (b) => ({ ...b, rows: b.rows.filter((_, j) => j !== ri) }))}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => updateBrand(bi, (b) => ({ ...b, rows: [...b.rows, { model: '', priceService: null, priceFull: null }] }))}
                      className="inline-flex items-center gap-2 text-sm font-bold text-skoczek-primary hover:text-skoczek-primaryHover"
                    >
                      <Plus className="w-4 h-4" /> Dodaj pozycję
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => updateBrands((b) => [...b, { name: '', rows: [{ model: '', priceService: null, priceFull: null }] }])}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-sm font-bold uppercase tracking-wider text-gray-500 hover:border-skoczek-primary hover:text-skoczek-primary transition inline-flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Dodaj markę
              </button>
            </>
          )}

          <p className="text-xs text-gray-400">
            Ceny wpisuj jako tekst, np. <code>250</code>, <code>250-300</code> lub <code>270 / 350</code>. Puste pole oznacza brak ceny ("-").
            Pozycje bez nazwy są pomijane przy zapisie.
          </p>
        </div>
      )}

      <div className="sticky bottom-4 z-10">
        <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between rounded-xl border p-4 shadow-lg transition ${isDirty ? 'bg-orange-50 border-skoczek-primary/40' : 'bg-white border-gray-200'}`}>
          <div className="text-sm font-medium" aria-live="polite">
            {message ? (
              <span className={`inline-flex items-center gap-2 ${message.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {message.text}
              </span>
            ) : isDirty ? (
              <span className="text-orange-800 font-bold">Masz niezapisane zmiany w cenniku.</span>
            ) : (
              <span className="text-gray-500">Brak niezapisanych zmian.</span>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRevert}
              disabled={!isDirty || saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded border border-gray-300 bg-white text-sm font-bold uppercase text-gray-600 hover:border-gray-400 transition disabled:opacity-40"
            >
              <Undo2 className="w-4 h-4" /> Cofnij
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded bg-skoczek-primary text-white text-sm font-bold uppercase hover:bg-skoczek-primaryHover transition shadow-md disabled:opacity-40 disabled:shadow-none"
            >
              <Save className="w-4 h-4" /> {saving ? 'Zapisywanie…' : 'Zapisz cennik'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingEditor;
