import fs from 'fs';
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
  const pages = await globby(pageGlobs);
  const urls = pages.map((page) => {
    const path = page
      .replace('src/pages', '')
      .replace('data', '')
      .replace('.tsx', '')
      .replace('.mdx', '');
    const route = path === '/index' ? '' : path;
    const lastmod = fs.statSync(page).mtime.toISOString();
    return buildUrlEntry(`${SITE_URL}${route}`, lastmod);
  });

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
