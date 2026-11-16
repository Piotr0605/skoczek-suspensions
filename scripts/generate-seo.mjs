/**
 * Post-build SEO step.
 *
 * The site is a client-side rendered SPA, so crawlers that do not execute
 * JavaScript would see the same <title>/<meta> for every URL. This script
 * writes one static HTML file per route (with that route's title, description,
 * canonical URL and Open Graph tags baked in) plus robots.txt and sitemap.xml.
 *
 * Vercel's `cleanUrls` serves dist/cennik.html at /cennik, so the React app
 * boots on the right path and simply takes over.
 *
 * Usage: node scripts/generate-seo.mjs  (runs automatically after `vite build`)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');

const config = JSON.parse(readFileSync(join(root, 'src/seo/routes.json'), 'utf8'));
const siteUrl = (process.env.VITE_SITE_URL || config.siteUrl).replace(/\/$/, '');
const image = `${siteUrl}${config.defaultImage}`;

const indexPath = join(dist, 'index.html');
if (!existsSync(indexPath)) {
  console.error('[seo] dist/index.html not found - run `vite build` first.');
  process.exit(1);
}

const template = readFileSync(indexPath, 'utf8');
const START = '<!-- __SEO_START__ -->';
const END = '<!-- __SEO_END__ -->';

if (!template.includes(START) || !template.includes(END)) {
  console.error(`[seo] Markers ${START} / ${END} missing in index.html.`);
  process.exit(1);
}

const escape = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function headFor(route) {
  const canonical = `${siteUrl}${route.path === '/' ? '/' : route.path}`;
  const robots = route.index
    ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    : 'noindex, nofollow';

  return [
    START,
    `    <title>${escape(route.title)}</title>`,
    `    <meta name="description" content="${escape(route.description)}" />`,
    `    <link rel="canonical" href="${canonical}" />`,
    `    <meta name="robots" content="${robots}" />`,
    '',
    '    <meta property="og:type" content="website" />',
    `    <meta property="og:site_name" content="${escape(config.siteName)}" />`,
    '    <meta property="og:locale" content="pl_PL" />',
    `    <meta property="og:title" content="${escape(route.title)}" />`,
    `    <meta property="og:description" content="${escape(route.description)}" />`,
    `    <meta property="og:url" content="${canonical}" />`,
    `    <meta property="og:image" content="${image}" />`,
    '    <meta property="og:image:width" content="1200" />',
    '    <meta property="og:image:height" content="630" />',
    `    <meta property="og:image:alt" content="${escape(config.siteName)} - serwis amortyzatorów rowerowych w Białymstoku" />`,
    '',
    '    <meta name="twitter:card" content="summary_large_image" />',
    `    <meta name="twitter:title" content="${escape(route.title)}" />`,
    `    <meta name="twitter:description" content="${escape(route.description)}" />`,
    `    <meta name="twitter:image" content="${image}" />`,
    `    ${END}`,
  ].join('\n');
}

function renderPage(route) {
  const head = template.slice(0, template.indexOf(START));
  const tail = template.slice(template.indexOf(END) + END.length);
  return `${head}${headFor(route)}${tail}`;
}

const written = [];
for (const route of config.routes) {
  const file = route.path === '/' ? 'index.html' : `${route.path.replace(/^\//, '')}.html`;
  writeFileSync(join(dist, file), renderPage(route), 'utf8');
  written.push(file);
}

// Custom 404 page (Vercel serves dist/404.html for unmatched paths).
const notFound = {
  path: '/404',
  title: 'Nie znaleziono strony (404) | Oddaj Amora',
  description: 'Strona o podanym adresie nie istnieje.',
  index: false,
};
writeFileSync(join(dist, '404.html'), renderPage(notFound), 'utf8');
written.push('404.html');

// ---------------------------------------------------------------- sitemap.xml
const lastmod = new Date().toISOString().split('T')[0];
const urls = config.routes
  .filter((route) => route.index)
  .map((route) =>
    [
      '  <url>',
      `    <loc>${siteUrl}${route.path === '/' ? '/' : route.path}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${route.changefreq}</changefreq>`,
      `    <priority>${route.priority.toFixed(1)}</priority>`,
      '  </url>',
    ].join('\n'),
  )
  .join('\n');

writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  'utf8',
);

// ----------------------------------------------------------------- robots.txt
const disallowed = config.routes.filter((route) => !route.index).map((route) => route.path);
writeFileSync(
  join(dist, 'robots.txt'),
  [
    'User-agent: *',
    'Allow: /',
    ...disallowed.map((path) => `Disallow: ${path}`),
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(
  `[seo] Generated ${written.length} HTML pages, sitemap.xml (${config.routes.filter((r) => r.index).length} URLs) and robots.txt for ${siteUrl}`,
);
