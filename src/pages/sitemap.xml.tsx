import fs from 'fs';
import path from 'path';
import type { GetServerSideProps } from 'next';
import { globby } from 'globby';

const SITE_URL = 'https://ragnapi.com';
const PUBLIC_ROUTES = ['/', '/documentation', '/about'];

const pageGlobs = [
  'src/pages/*.tsx',
  'data/**/*.mdx',
  '!data/*.mdx',
  '!src/pages/_*.tsx',
  '!src/pages/api/**',
  '!src/pages/404.tsx',
  '!src/pages/sitemap.xml.tsx',
];

// Omit optional lastmod until a trustworthy editorial modification date exists.
// Build/source mtimes and request timestamps do not establish content freshness.
function buildUrlEntry(url: string) {
  return `
    <url>
      <loc>${url}</loc>
    </url>
  `;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const manifestPath = path.join(
    process.cwd(),
    '.next/server/pages-manifest.json',
  );
  let urls: string[] = [];
  const normalizeRoute = (route: string) => {
    if (route === '/index' || route === '/') return '';
    return route;
  };

  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(
      fs.readFileSync(manifestPath, 'utf8'),
    ) as Record<string, string>;
    const routes = Object.keys(manifest).filter((route) => {
      if (route.startsWith('/api')) return false;
      if (route === '/_app') return false;
      if (route === '/_document') return false;
      if (route === '/_error') return false;
      if (route === '/404') return false;
      if (route === '/500') return false;
      if (route === '/sitemap.xml') return false;
      return true;
    });

    const routeSet = new Set<string>(
      routes.map((route) => normalizeRoute(route)),
    );
    PUBLIC_ROUTES.forEach((route) => {
      routeSet.add(normalizeRoute(route));
    });

    urls = Array.from(routeSet).map((route) => {
      return buildUrlEntry(`${SITE_URL}${route}`);
    });
  } else {
    const pages = await globby(pageGlobs);
    const routeSet = new Set<string>();
    pages.forEach((page) => {
      const pagePath = page
        .replace('src/pages', '')
        .replace('data', '')
        .replace('.tsx', '')
        .replace('.mdx', '');
      routeSet.add(normalizeRoute(pagePath));
    });
    PUBLIC_ROUTES.forEach((route) => {
      routeSet.add(normalizeRoute(route));
    });

    urls = Array.from(routeSet).map((route) => {
      return buildUrlEntry(`${SITE_URL}${route}`);
    });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>
`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default function Sitemap() {
  return null;
}
