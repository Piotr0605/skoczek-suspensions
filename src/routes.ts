export type View = 'HOME' | 'DASHBOARD' | 'FORM' | 'REGULATIONS' | 'CONTACT' | 'ADMIN' | 'PRIVACY' | 'NOT_FOUND';

export const SITE_URL = 'https://oddajamora.pl';

interface RouteMeta {
  path: string;
  title: string;
  description: string;
  index: boolean;
}

const DEFAULT_DESCRIPTION =
  'Profesjonalny serwis amortyzatorów i damperów rowerowych w Białymstoku: FOX, RockShox, Marzocchi, Ohlins, SR Suntour, Manitou, DVO. Przejrzysty cennik, wysyłka z całej Polski, 12 miesięcy gwarancji.';

export const ROUTES: Record<View, RouteMeta> = {
  HOME: {
    path: '/',
    title: 'Serwis amortyzatorów rowerowych Białystok | Oddaj Amora',
    description: DEFAULT_DESCRIPTION,
    index: true,
  },
  FORM: {
    path: '/zglos-serwis',
    title: 'Zgłoś serwis amortyzatora online | Oddaj Amora',
    description:
      'Zgłoś serwis amortyzatora lub dampera rowerowego online. Dostarcz sprzęt osobiście w Białymstoku lub wyślij kurierem – wycena do 3 dni roboczych.',
    index: true,
  },
  CONTACT: {
    path: '/kontakt',
    title: 'Kontakt – serwis amortyzatorów Białystok, ul. Mickiewicza 39 | Oddaj Amora',
    description:
      'Serwis amortyzatorów Oddaj Amora: ul. Mickiewicza 39, 15-213 Białystok (Galeria Rowerowa). Tel. +48 884 343 148, pn–pt 10:00–18:00.',
    index: true,
  },
  REGULATIONS: {
    path: '/regulamin',
    title: 'Regulamin serwisu | Oddaj Amora',
    description: 'Regulamin serwisu amortyzatorów rowerowych oddajamora.pl – przyjęcie zlecenia, wycena, gwarancja i reklamacje.',
    index: true,
  },
  PRIVACY: {
    path: '/polityka-prywatnosci',
    title: 'Polityka prywatności i RODO | Oddaj Amora',
    description: 'Polityka prywatności i klauzula informacyjna RODO serwisu oddajamora.pl.',
    index: true,
  },
  DASHBOARD: {
    path: '/moje-konto',
    title: 'Moje konto | Oddaj Amora',
    description: DEFAULT_DESCRIPTION,
    index: false,
  },
  ADMIN: {
    path: '/panel-mechanika',
    title: 'Panel mechanika | Oddaj Amora',
    description: DEFAULT_DESCRIPTION,
    index: false,
  },
  NOT_FOUND: {
    path: '',
    title: 'Nie znaleziono strony | Oddaj Amora',
    description: DEFAULT_DESCRIPTION,
    index: false,
  },
};

export function viewFromPath(pathname: string): View {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const match = (Object.keys(ROUTES) as View[]).find((v) => ROUTES[v].path === normalized);
  return match ?? 'NOT_FOUND';
}

function setMeta(selector: string, attr: 'content' | 'href', value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

export function applyRouteMeta(view: View) {
  const meta = ROUTES[view];
  const url = `${SITE_URL}${meta.path || window.location.pathname}`;
  document.title = meta.title;
  setMeta('meta[name="description"]', 'content', meta.description);
  setMeta('meta[property="og:title"]', 'content', meta.title);
  setMeta('meta[name="twitter:title"]', 'content', meta.title);
  setMeta('meta[property="og:description"]', 'content', meta.description);
  setMeta('meta[name="twitter:description"]', 'content', meta.description);
  setMeta('meta[property="og:url"]', 'content', url);
  setMeta('link[rel="canonical"]', 'href', url);
  setMeta('meta[name="robots"]', 'content', meta.index ? 'index, follow, max-image-preview:large' : 'noindex, nofollow');
}
