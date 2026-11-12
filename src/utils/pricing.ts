import { PricingBrand, PricingCategory, PricingCategoryId, PricingRow, PricingService } from '../types';

export const PRICING_LIMITS = {
  text: 200,
  price: 40,
  brands: 50,
  rows: 100,
};

const CATEGORY_IDS: PricingCategoryId[] = ['FRONT', 'REAR', 'OTHER'];

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function optionalPrice(value: unknown): string | null {
  const price = str(value, PRICING_LIMITS.price);
  return price ? price : null;
}

function sanitizeRow(raw: unknown): PricingRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const model = str(r.model, PRICING_LIMITS.text);
  if (!model) return null;
  return { model, priceService: optionalPrice(r.priceService), priceFull: optionalPrice(r.priceFull) };
}

function sanitizeBrand(raw: unknown): PricingBrand | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  const name = str(b.name, PRICING_LIMITS.text);
  if (!name) return null;
  const rows = Array.isArray(b.rows)
    ? b.rows.slice(0, PRICING_LIMITS.rows).map(sanitizeRow).filter((r): r is PricingRow => r !== null)
    : [];
  return { name, rows };
}

function sanitizeService(raw: unknown): PricingService | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  const name = str(s.name, PRICING_LIMITS.text);
  if (!name) return null;
  return { name, price: str(s.price, PRICING_LIMITS.price) };
}

/**
 * Normalizes price-list data coming from the database or the admin editor:
 * drops unknown keys, empty rows and over-long values. Returns null when the
 * input does not resemble a price list at all.
 */
export function sanitizePricing(raw: unknown): PricingCategory[] | null {
  if (!Array.isArray(raw)) return null;
  const result: PricingCategory[] = [];

  for (const id of CATEGORY_IDS) {
    const source = raw.find((c) => c && typeof c === 'object' && (c as Record<string, unknown>).id === id) as
      | Record<string, unknown>
      | undefined;
    if (!source) continue;
    const title = str(source.title, PRICING_LIMITS.text);

    if (id === 'OTHER') {
      const services = Array.isArray(source.services)
        ? source.services.slice(0, PRICING_LIMITS.rows).map(sanitizeService).filter((s): s is PricingService => s !== null)
        : [];
      result.push({ id, title, services });
    } else {
      const brands = Array.isArray(source.brands)
        ? source.brands.slice(0, PRICING_LIMITS.brands).map(sanitizeBrand).filter((b): b is PricingBrand => b !== null)
        : [];
      result.push({ id, title, brands });
    }
  }

  return result.length > 0 ? result : null;
}

export function formatPrice(price: string | null | undefined): string | null {
  if (!price) return null;
  return /\d$/.test(price) ? `${price} zł` : price;
}
