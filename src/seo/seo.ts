import { useEffect } from 'react';
import seoConfig from './routes.json';

export type View =
  | 'HOME'
  | 'PRICING'
  | 'FORM'
  | 'CONTACT'
  | 'REGULATIONS'
  | 'PRIVACY'
  | 'DASHBOARD'
  | 'ADMIN'
  | 'SET_PASSWORD'
  | 'NOT_FOUND';

export interface RouteMeta {
  path: string;
  view: View;
  label: string;
  title: string;
  description: string;
  index: boolean;
  priority: number;
  changefreq: string;
}

export const SITE_URL: string =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || seoConfig.siteUrl;

export const SITE_NAME: string = seoConfig.siteName;
export const DEFAULT_IMAGE: string = seoConfig.defaultImage;
export const ROUTES: RouteMeta[] = seoConfig.routes as RouteMeta[];

const NOT_FOUND_ROUTE: RouteMeta = {
  path: '/404',
  view: 'NOT_FOUND',
  label: 'Nie znaleziono strony',
  title: 'Nie znaleziono strony (404) | Oddaj Amora',
  description: 'Strona o podanym adresie nie istnieje.',
  index: false,
  priority: 0,
  changefreq: 'never',
};

/** Normalizes a pathname: no trailing slash (except root), lower case. */
export function normalizePath(pathname: string): string {
  const clean = pathname.split('?')[0].split('#')[0].toLowerCase();
  if (clean.length > 1 && clean.endsWith('/')) return clean.slice(0, -1);
  return clean || '/';
}

export function routeForPath(pathname: string): RouteMeta {
  const path = normalizePath(pathname);
  return ROUTES.find((r) => r.path === path) || NOT_FOUND_ROUTE;
}

export function routeForView(view: View): RouteMeta {
  return ROUTES.find((r) => r.view === view) || NOT_FOUND_ROUTE;
}

export function pathForView(view: View): string {
  return routeForView(view).path;
}

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

const DYNAMIC_LD_ID = 'ld-json-route';

function setStructuredData(data: object | null) {
  let el = document.getElementById(DYNAMIC_LD_ID);
  if (!data) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.id = DYNAMIC_LD_ID;
    (el as HTMLScriptElement).type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function breadcrumbs(route: RouteMeta) {
  if (route.path === '/') return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Strona główna',
        item: `${SITE_URL}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: route.label,
        item: `${SITE_URL}${route.path}`,
      },
    ],
  };
}

/**
 * Keeps document metadata in sync with the current route.
 * The build step (scripts/generate-seo.mjs) writes the same tags statically
 * into a per-route HTML file, so crawlers that do not run JavaScript
 * also receive correct titles, descriptions and canonical URLs.
 */
export function useSeo(route: RouteMeta) {
  useEffect(() => {
    const canonical = `${SITE_URL}${route.path === '/' ? '/' : route.path}`;

    document.title = route.title;
    setMeta('meta[name="description"]', 'name', 'description', route.description);
    setMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      route.index
        ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
        : 'noindex, nofollow',
    );
    setLink('canonical', canonical);

    setMeta('meta[property="og:title"]', 'property', 'og:title', route.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', route.description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', route.title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', route.description);

    setStructuredData(breadcrumbs(route));
  }, [route]);
}
