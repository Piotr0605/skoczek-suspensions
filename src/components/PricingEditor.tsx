import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PricingCategory, PricingBrand } from '../types';
import { PricingService } from '../services/pricing';
import {
  Plus,
  Trash2,
  Save,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle,
  Tag,
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  FRONT: 'Amortyzatory przednie',
  REAR: 'Amortyzatory tylne (dampery)',
  OTHER: 'Inne usługi',
};

const CATEGORY_ORDER: Array<PricingCategory['id']> = ['FRONT', 'REAR', 'OTHER'];

const inputClass =
  'field';

const iconButtonClass =
  'p-2 rounded border border-gray-200 text-gray-500 hover:text-skoczek-primary hover:border-skoczek-primary transition disabled:opacity-30 disabled:hover:text-gray-500 disabled:hover:border-gray-200';

function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const copy = [...items];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

const PricingEditor: React.FC = () => {
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [activeId, setActiveId] = useState<PricingCategory['id']>('FRONT');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    // Long timeout, but never silent: on failure the payload carries `error`,
    // the editor shows a warning and blocks saving, so a failed read can never
    // overwrite the prices stored in the database.
    const payload = await PricingService.get(15000);
    setCategories(payload.categories);
    setUpdatedAt(payload.updatedAt);
    setIsDefault(payload.isDefault);
    setLoadError(payload.error);
    setDirty(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeId),
    [categories, activeId],
  );

  const mutate = (
    id: PricingCategory['id'],
    updater: (category: PricingCategory) => PricingCategory,
  ) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
    setDirty(true);
    setFeedback(null);
  };

  const updateBrands = (updater: (brands: PricingBrand[]) => PricingBrand[]) => {
    if (!activeCategory) return;
    mutate(activeCategory.id, (c) => ({ ...c, brands: updater(c.brands ?? []) }));
  };

  const updateServices = (
    updater: (services: { name: string; price: string }[]) => { name: string; price: string }[],
  ) => {
    if (!activeCategory) return;
    mutate(activeCategory.id, (c) => ({ ...c, services: updater(c.services ?? []) }));
  };

  const addMissingCategory = (id: PricingCategory['id']) => {
    setCategories((prev) => {
      const next = [
        ...prev,
        {
          id,
          title: CATEGORY_LABELS[id],
          ...(id === 'OTHER' ? { services: [] } : { brands: [] }),
        } as PricingCategory,
      ];
      return CATEGORY_ORDER.map((orderId) => next.find((c) => c.id === orderId)).filter(
        Boolean,
      ) as PricingCategory[];
    });
    setActiveId(id);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const savedAt = await PricingService.save(categories);
      setUpdatedAt(savedAt);
      setIsDefault(false);
      setDirty(false);
      setFeedback({ type: 'ok', text: 'Cennik został zapisany i jest widoczny na stronie.' });
    } catch (error) {
      setFeedback({
        type: 'err',
        text: error instanceof Error ? error.message : 'Nie udało się zapisać cennika.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefaults = () => {
    if (
      !window.confirm(
        'Przywrócić domyślny cennik wbudowany w stronę? Niezapisane zmiany zostaną utracone.',
      )
    )
      return;
    setCategories(PricingService.defaults());
    setDirty(true);
    setFeedback(null);
  };

  const handleDiscard = async () => {
    if (dirty && !window.confirm('Odrzucić niezapisane zmiany?')) return;
    await load();
    setFeedback(null);
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-gray-400 animate-pulse" role="status">
        Wczytywanie cennika...
      </div>
    );
  }

  const missingCategories = CATEGORY_ORDER.filter((id) => !categories.some((c) => c.id === id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div>
          <h3 className="font-semibold text-ink-900 tracking-tight flex items-center gap-2">
            <Tag className="w-4 h-4 text-skoczek-primary" /> Edycja cennika strony
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {loadError
              ? 'Nie udało się odczytać cennika z bazy danych.'
              : isDefault
              ? 'Wyświetlany jest domyślny cennik wbudowany w stronę. Pierwszy zapis zapisze go w bazie danych.'
              : updatedAt
                ? `Ostatnia aktualizacja: ${new Date(updatedAt).toLocaleString('pl-PL')}`
                : 'Cennik zapisany w bazie danych.'}
            {dirty && (
              <span className="ml-2 font-bold text-skoczek-primary uppercase text-xs">
                Niezapisane zmiany
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRestoreDefaults}
            type="button"
            className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded text-xs font-bold uppercase hover:border-skoczek-primary hover:text-skoczek-primary transition"
          >
            <RotateCcw className="w-4 h-4" /> Domyślny cennik
          </button>
          <button
            onClick={handleDiscard}
            type="button"
            disabled={saving}
            className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded text-xs font-bold uppercase hover:border-gray-400 transition disabled:opacity-50"
          >
            Odrzuć zmiany
          </button>
          <button
            onClick={handleSave}
            type="button"
            disabled={saving || !dirty || !!loadError}
            className="flex items-center gap-2 bg-skoczek-primary text-white px-5 py-2 rounded text-xs font-bold uppercase hover:bg-skoczek-primaryHover transition disabled:opacity-40 disabled:shadow-none"
          >
            <Save className="w-4 h-4" /> {saving ? 'Zapisywanie...' : 'Zapisz cennik'}
          </button>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex items-start gap-2 p-3 rounded border bg-red-50 border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <strong className="font-bold">Nie udało się pobrać cennika z bazy danych</strong> ({loadError}).
            Zapis został zablokowany, aby nie nadpisać zapisanych cen. Sprawdź połączenie oraz czy
            projekt Supabase jest aktywny, a następnie odśwież stronę.
          </span>
        </div>
      )}

      {feedback && (
        <div
          role="status"
          className={`flex items-center gap-2 p-3 rounded border text-sm font-medium ${
            feedback.type === 'ok'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedback.type === 'ok' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {feedback.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveId(cat.id)}
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition ${
              activeId === cat.id
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
            }`}
          >
            {CATEGORY_LABELS[cat.id] ?? cat.title}
          </button>
        ))}
        {missingCategories.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => addMissingCategory(id)}
            className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wider bg-white border border-dashed border-gray-300 text-gray-500 hover:border-skoczek-primary hover:text-skoczek-primary transition"
          >
            <Plus className="w-3 h-3 inline mr-1" />
            {CATEGORY_LABELS[id]}
          </button>
        ))}
      </div>

      {activeCategory && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Nagłówek sekcji (widoczny na stronie)
            </label>
            <input
              className={`${inputClass} max-w-xl font-bold`}
              value={activeCategory.title}
              onChange={(e) =>
                mutate(activeCategory.id, (c) => ({ ...c, title: e.target.value }))
              }
            />
          </div>

          {activeCategory.id === 'OTHER' ? (
            <div className="panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[640px]">
                  <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 border-b">Nazwa usługi</th>
                      <th className="p-3 border-b w-40">Cena (PLN)</th>
                      <th className="p-3 border-b w-36 text-center">Kolejność / usuń</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(activeCategory.services ?? []).map((service, index) => (
                      <tr key={index}>
                        <td className="p-3">
                          <input
                            className={inputClass}
                            value={service.name}
                            placeholder="np. Montaż dampera do ramy"
                            onChange={(e) =>
                              updateServices((services) =>
                                services.map((s, i) =>
                                  i === index ? { ...s, name: e.target.value } : s,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="p-3">
                          <input
                            className={inputClass}
                            value={service.price}
                            placeholder="np. 50-100"
                            onChange={(e) =>
                              updateServices((services) =>
                                services.map((s, i) =>
                                  i === index ? { ...s, price: e.target.value } : s,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1 justify-center">
                            <button
                              type="button"
                              title="W górę"
                              aria-label="Przenieś w górę"
                              disabled={index === 0}
                              className={iconButtonClass}
                              onClick={() => updateServices((s) => move(s, index, -1))}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="W dół"
                              aria-label="Przenieś w dół"
                              disabled={index === (activeCategory.services?.length ?? 0) - 1}
                              className={iconButtonClass}
                              onClick={() => updateServices((s) => move(s, index, 1))}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Usuń usługę"
                              aria-label="Usuń usługę"
                              className="p-2 rounded border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 transition"
                              onClick={() =>
                                updateServices((s) => s.filter((_, i) => i !== index))
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(activeCategory.services ?? []).length === 0 && (
                <p className="p-6 text-center text-sm text-gray-500">Brak usług w tej sekcji.</p>
              )}
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                  type="button"
                  onClick={() => updateServices((s) => [...s, { name: '', price: '' }])}
                  className="flex items-center gap-2 text-xs font-bold uppercase text-skoczek-primary hover:text-skoczek-primaryHover transition"
                >
                  <Plus className="w-4 h-4" /> Dodaj usługę
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {(activeCategory.brands ?? []).map((brand, brandIndex) => (
                <div
                  key={brandIndex}
                  className="panel overflow-hidden"
                >
                  <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Marka
                      </label>
                      <input
                        className={`${inputClass} font-semibold uppercase`}
                        value={brand.name}
                        placeholder="np. Rock Shox"
                        onChange={(e) =>
                          updateBrands((brands) =>
                            brands.map((b, i) =>
                              i === brandIndex ? { ...b, name: e.target.value } : b,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="flex gap-1 sm:self-end">
                      <button
                        type="button"
                        title="Przenieś markę w górę"
                        aria-label="Przenieś markę w górę"
                        disabled={brandIndex === 0}
                        className={iconButtonClass}
                        onClick={() => updateBrands((b) => move(b, brandIndex, -1))}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Przenieś markę w dół"
                        aria-label="Przenieś markę w dół"
                        disabled={brandIndex === (activeCategory.brands?.length ?? 0) - 1}
                        className={iconButtonClass}
                        onClick={() => updateBrands((b) => move(b, brandIndex, 1))}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Usuń markę"
                        aria-label="Usuń markę"
                        className="p-2 rounded border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 transition"
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Usunąć markę "${brand.name || 'bez nazwy'}" wraz ze wszystkimi cenami?`,
                            )
                          )
                            return;
                          updateBrands((b) => b.filter((_, i) => i !== brandIndex));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[720px]">
                      <thead className="bg-white text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100">
                        <tr>
                          <th className="p-3 w-1/2">Model</th>
                          <th className="p-3 w-32">Cena serwisu</th>
                          <th className="p-3 w-32">Z uszczelkami</th>
                          <th className="p-3 w-36 text-center">Kolejność / usuń</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {brand.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            <td className="p-3">
                              <input
                                className={inputClass}
                                value={row.model}
                                placeholder="np. Pike, Lyrik"
                                onChange={(e) =>
                                  updateBrands((brands) =>
                                    brands.map((b, i) =>
                                      i === brandIndex
                                        ? {
                                            ...b,
                                            rows: b.rows.map((r, j) =>
                                              j === rowIndex ? { ...r, model: e.target.value } : r,
                                            ),
                                          }
                                        : b,
                                    ),
                                  )
                                }
                              />
                            </td>
                            <td className="p-3">
                              <input
                                className={inputClass}
                                value={row.priceService ?? ''}
                                placeholder="np. 250-300"
                                onChange={(e) =>
                                  updateBrands((brands) =>
                                    brands.map((b, i) =>
                                      i === brandIndex
                                        ? {
                                            ...b,
                                            rows: b.rows.map((r, j) =>
                                              j === rowIndex
                                                ? { ...r, priceService: e.target.value || null }
                                                : r,
                                            ),
                                          }
                                        : b,
                                    ),
                                  )
                                }
                              />
                            </td>
                            <td className="p-3">
                              <input
                                className={inputClass}
                                value={row.priceFull ?? ''}
                                placeholder="puste = brak"
                                onChange={(e) =>
                                  updateBrands((brands) =>
                                    brands.map((b, i) =>
                                      i === brandIndex
                                        ? {
                                            ...b,
                                            rows: b.rows.map((r, j) =>
                                              j === rowIndex
                                                ? { ...r, priceFull: e.target.value || null }
                                                : r,
                                            ),
                                          }
                                        : b,
                                    ),
                                  )
                                }
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex gap-1 justify-center">
                                <button
                                  type="button"
                                  title="W górę"
                                  aria-label="Przenieś pozycję w górę"
                                  disabled={rowIndex === 0}
                                  className={iconButtonClass}
                                  onClick={() =>
                                    updateBrands((brands) =>
                                      brands.map((b, i) =>
                                        i === brandIndex
                                          ? { ...b, rows: move(b.rows, rowIndex, -1) }
                                          : b,
                                      ),
                                    )
                                  }
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  title="W dół"
                                  aria-label="Przenieś pozycję w dół"
                                  disabled={rowIndex === brand.rows.length - 1}
                                  className={iconButtonClass}
                                  onClick={() =>
                                    updateBrands((brands) =>
                                      brands.map((b, i) =>
                                        i === brandIndex
                                          ? { ...b, rows: move(b.rows, rowIndex, 1) }
                                          : b,
                                      ),
                                    )
                                  }
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  title="Usuń pozycję"
                                  aria-label="Usuń pozycję"
                                  className="p-2 rounded border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 transition"
                                  onClick={() =>
                                    updateBrands((brands) =>
                                      brands.map((b, i) =>
                                        i === brandIndex
                                          ? { ...b, rows: b.rows.filter((_, j) => j !== rowIndex) }
                                          : b,
                                      ),
                                    )
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 border-t border-gray-100 bg-gray-50">
                    <button
                      type="button"
                      onClick={() =>
                        updateBrands((brands) =>
                          brands.map((b, i) =>
                            i === brandIndex
                              ? {
                                  ...b,
                                  rows: [
                                    ...b.rows,
                                    { model: '', priceService: '', priceFull: null },
                                  ],
                                }
                              : b,
                          ),
                        )
                      }
                      className="flex items-center gap-2 text-xs font-bold uppercase text-skoczek-primary hover:text-skoczek-primaryHover transition"
                    >
                      <Plus className="w-4 h-4" /> Dodaj model
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  updateBrands((brands) => [
                    ...brands,
                    { name: '', rows: [{ model: '', priceService: '', priceFull: null }] },
                  ])
                }
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-4 text-sm font-bold uppercase text-gray-500 hover:border-skoczek-primary hover:text-skoczek-primary transition"
              >
                <Plus className="w-4 h-4" /> Dodaj markę
              </button>
            </div>
          )}

          <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded p-4">
            Wskazówki: puste pole ceny wyświetla się na stronie jako &bdquo;-&rdquo;. Ceny możesz
            wpisywać jako zakres (np. <span className="font-mono">250-300</span>) lub warianty (np.{' '}
            <span className="font-mono">270 / 350</span>). Pozycje bez nazwy modelu nie zostaną
            zapisane. Zmiany są widoczne na stronie natychmiast po zapisaniu.
          </p>
        </div>
      )}
    </div>
  );
};

export default PricingEditor;
