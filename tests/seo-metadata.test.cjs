const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
function load(file, mocks) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  const moduleBox = { exports: {} };
  vm.runInNewContext(output, { module: moduleBox, exports: moduleBox.exports, React, process: { cwd: () => '/virtual' }, require: id => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === 'path') return path;
    throw new Error(`Unexpected dependency ${id}`);
  } }, { filename: file });
  return moduleBox.exports;
}
for (const manifest of [true, false]) {
  test(`sitemap preserves routes and omits unverifiable lastmod (manifest=${manifest})`, async () => {
    const handler = load('src/pages/sitemap.xml.tsx', {
      fs: { existsSync: () => manifest, readFileSync: () => JSON.stringify({ '/': 'pages/index.html', '/about': 'pages/about.html', '/api/private': 'api.js', '/_app': '_app.js' }), statSync: () => { throw new Error('mtime must never be consulted'); } },
      globby: { globby: async () => ['src/pages/index.tsx', 'src/pages/about.tsx'] },
    });
    let body = '', ended = false; const headers = {};
    await handler.getServerSideProps({ res: { setHeader: (k,v) => headers[k]=v, write: s => body += s, end: () => ended=true } });
    assert.equal(ended, true); assert.equal(headers['Content-Type'], 'application/xml; charset=utf-8');
    assert.equal((body.match(/<url>/g) || []).length, 3);
    for (const suffix of ['', '/about', '/documentation']) assert.ok(body.includes(`<loc>https://ragnapi.com${suffix}</loc>`));
    assert.doesNotMatch(body, /lastmod|\/api\/|_app|Invalid Date/);
  });
}
test('document and page SEO render exactly one description', () => {
  const Document = load('src/pages/_document.tsx', { 'next/document': { __esModule: true, default: React.Component, Html: 'html', Head: 'head', Main: () => null, NextScript: () => null } }).default;
  const { Seo } = load('src/components/Seo/index.tsx', { 'next/head': { __esModule: true, default: React.Fragment }, 'lib/seo': { defaultOgImage: 'https://ragnapi.com/image.png', siteName: 'RagnaAPI', siteUrl: 'https://ragnapi.com' } });
  const document = renderToStaticMarkup(React.createElement(Document));
  const page = renderToStaticMarkup(React.createElement(Seo, { title: 'Page title', description: 'Page specific description', path: '/' }));
  assert.equal(((document + page).match(/name="description"/g) || []).length, 1);
  assert.match(page, /content="Page specific description"/);
  assert.match(page, /rel="canonical" href="https:\/\/ragnapi.com\/"/);
});
