import fs from 'fs';
import path from 'path';
import type { GetServerSideProps } from 'next';
import { globby } from 'globby';

const SITE_URL = 'https://ragnapi.com';

const pageGlobs = [
  'src/pages/*.tsx',
  'data/**/*.mdx',
  '!data/*.mdx',
  '!src/pages/_*.tsx',
  '!src/pages/api/**',
  '!src/pages/404.tsx',
  '!src/pages/sitemap.xml.tsx',
];

function buildUrlEntry(url: string, lastmod: string) {
  return `
    <url>
      <loc>${url}</loc>
      <lastmod>${lastmod}</lastmod>
    </url>
  `;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const nowIso = new Date().toISOString();
  const manifestPath = path.join(
    process.cwd(),
    '.next/server/pages-manifest.json',
  );
  let urls: string[] = [];

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

    urls = routes.map((route) => {
      const normalizedRoute = route === '/index' ? '' : route;
      const filePath = path.join(
        process.cwd(),
        '.next/server',
        manifest[route],
      );
      let lastmod = nowIso;
      try {
        lastmod = fs.statSync(filePath).mtime.toISOString();
      } catch {
        lastmod = nowIso;
      }
      return buildUrlEntry(`${SITE_URL}${normalizedRoute}`, lastmod);
    });
  } else {
    const pages = await globby(pageGlobs);
    urls = pages.map((page) => {
      const pagePath = page
        .replace('src/pages', '')
        .replace('data', '')
        .replace('.tsx', '')
        .replace('.mdx', '');
      const route = pagePath === '/index' ? '' : pagePath;
      const lastmod = fs.statSync(page).mtime.toISOString();
      return buildUrlEntry(`${SITE_URL}${route}`, lastmod);
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
