import { supabase } from './supabaseClient';
import { PricingCategory, PricingBrand, PricingRow } from '../types';
import { PRICING_DATA } from '../constants';

export const PRICING_KEY = 'pricing';

const MAX_TEXT = 160;
const MAX_ROWS_PER_BRAND = 100;
const MAX_BRANDS = 60;
const MAX_SERVICES = 100;

export interface PricingPayload {
  categories: PricingCategory[];
  updatedAt: string | null;
  /** true when the built-in list from src/constants.ts is being used. */
  isDefault: boolean;
  /**
   * Set when the price list could not be read from the database (network
   * problem, paused project, missing table). The public page silently falls
   * back to the built-in list; the admin editor blocks saving so a failed
   * read can never overwrite stored prices.
   */
  error: string | null;
}

function text(value: unknown, max = MAX_TEXT): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function optionalText(value: unknown): string | null {
  const result = text(value);
  return result.length > 0 ? result : null;
}

/**
 * The price list is written by an administrator, but it still arrives from the
 * database as untyped JSON — normalize it so a malformed row can never break
 * rendering of the public page.
 */
export function normalizePricing(value: unknown): PricingCategory[] | null {
  if (!Array.isArray(value)) return null;

  const categories: PricingCategory[] = [];

  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const candidate = raw as Record<string, unknown>;
    const id = text(candidate.id, 10);
    if (id !== 'FRONT' && id !== 'REAR' && id !== 'OTHER') continue;

    const category: PricingCategory = {
      id,
      title: text(candidate.title) || id,
    };

    if (Array.isArray(candidate.brands)) {
      const brands: PricingBrand[] = [];
      for (const rawBrand of candidate.brands.slice(0, MAX_BRANDS)) {
        if (!rawBrand || typeof rawBrand !== 'object') continue;
        const brandCandidate = rawBrand as Record<string, unknown>;
        const rows: PricingRow[] = [];
        if (Array.isArray(brandCandidate.rows)) {
          for (const rawRow of brandCandidate.rows.slice(0, MAX_ROWS_PER_BRAND)) {
            if (!rawRow || typeof rawRow !== 'object') continue;
            const rowCandidate = rawRow as Record<string, unknown>;
            const model = text(rowCandidate.model);
            if (!model) continue;
            rows.push({
              model,
              priceService: optionalText(rowCandidate.priceService),
              priceFull: optionalText(rowCandidate.priceFull),
            });
          }
        }
        const name = text(brandCandidate.name);
        if (!name) continue;
        brands.push({ name, rows });
      }
      category.brands = brands;
    }

    if (Array.isArray(candidate.services)) {
      const services: { name: string; price: string }[] = [];
      for (const rawService of candidate.services.slice(0, MAX_SERVICES)) {
        if (!rawService || typeof rawService !== 'object') continue;
        const serviceCandidate = rawService as Record<string, unknown>;
        const name = text(serviceCandidate.name, 300);
        if (!name) continue;
        services.push({ name, price: text(serviceCandidate.price) });
      }
      category.services = services;
    }

    categories.push(category);
  }

  return categories.length > 0 ? categories : null;
}

const DEFAULT_PAYLOAD: PricingPayload = {
  categories: PRICING_DATA,
  updatedAt: null,
  isDefault: true,
  error: 'Przekroczono czas oczekiwania na odpowiedź bazy danych.',
};

/** Resolves to the built-in price list if the database does not answer in time. */
function withTimeout(promise: Promise<PricingPayload>, ms: number): Promise<PricingPayload> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(DEFAULT_PAYLOAD), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(DEFAULT_PAYLOAD);
      });
  });
}

export const PricingService = {
  /**
   * Public read — falls back to the built-in list when nothing is stored yet,
   * when the stored value is malformed, or when the database is unreachable.
   */
  get: (timeoutMs = 4000): Promise<PricingPayload> => withTimeout(PricingService.fetch(), timeoutMs),

  fetch: async (): Promise<PricingPayload> => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('value, updated_at')
        .eq('key', PRICING_KEY)
        .maybeSingle();

      if (error) {
        return {
          categories: PRICING_DATA,
          updatedAt: null,
          isDefault: true,
          error: error.message || 'Błąd odczytu z bazy danych.',
        };
      }

      // No row yet: the built-in list is the current content.
      if (!data) {
        return { categories: PRICING_DATA, updatedAt: null, isDefault: true, error: null };
      }

      const categories = normalizePricing(data.value);
      if (!categories) {
        return { categories: PRICING_DATA, updatedAt: null, isDefault: true, error: null };
      }

      return {
        categories,
        updatedAt: (data.updated_at as string | null) ?? null,
        isDefault: false,
        error: null,
      };
    } catch (err) {
      return {
        categories: PRICING_DATA,
        updatedAt: null,
        isDefault: true,
        error: err instanceof Error ? err.message : 'Błąd połączenia z bazą danych.',
      };
    }
  },

  /** Admin write — RLS (public.is_admin()) is the actual authorization check. */
  save: async (categories: PricingCategory[]): Promise<string> => {
    const normalized = normalizePricing(categories);
    if (!normalized) {
      throw new Error('Cennik jest pusty lub ma nieprawidłowy format.');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Sesja wygasła. Zaloguj się ponownie.');
    }

    const { data, error } = await supabase
      .from('site_content')
      .upsert(
        {
          key: PRICING_KEY,
          value: normalized,
          updated_by: session.user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      )
      .select('updated_at')
      .single();

    if (error) {
      console.error('Pricing save error:', error);
      throw new Error(
        'Nie udało się zapisać cennika. Sprawdź uprawnienia administratora i czy tabela site_content istnieje.',
      );
    }

    return (data?.updated_at as string) ?? new Date().toISOString();
  },

  /** The built-in list shipped with the code (used by "restore defaults"). */
  defaults: (): PricingCategory[] => JSON.parse(JSON.stringify(PRICING_DATA)) as PricingCategory[],
};
