# PROMPT PARA CODEX — Auditoria e Implementação de SEO (ragnapi.com)

Você é um senior engineer especializado em SEO técnico para aplicações Next.js.  
Objetivo: configurar SEO “production-grade” no site https://ragnapi.com/ (landing + docs), garantindo indexação correta, bons snippets, compartilhamento social (OG/Twitter), sitemap/robots, canonicalização e eliminação de problemas que impedem crawlers (ex.: links quebrados como /about retornando 404).

## 0) Regras de trabalho (obrigatório)
- Faça commits atômicos por tarefa (feat/fix/docs/refactor) e descreva bem.
- Crie/atualize documentação em `doc/`.
- Registre cada decisão relevante em `doc/decisions.md` (ex.: padrão de metadata, estratégia de sitemap, canonical, noindex para rotas).
- Não introduza regressões de performance (Core Web Vitals) nem acessibilidade.
- Sempre valide no final com checklist (ver seção 8).

---

## 1) Auditoria inicial (antes de mudar código)
1.1 Verificar o framework/estrutura:
- Confirmar se o projeto usa Next.js App Router (`app/`) ou Pages Router (`pages/`).
- Identificar como o HTML `<head>` é gerado hoje (Head component, next/head, Metadata API, etc).

1.2 Crawling/Indexabilidade:
- Verificar se existem e estão acessíveis:
  - `/robots.txt`
  - `/sitemap.xml` (ou índice de sitemaps)
- Verificar se páginas públicas retornam `200` com HTML indexável (sem bloquear por JS).
- Verificar se existem `noindex`, `nofollow` ou bloqueios indevidos.
- Checar canonical atual (se existe) e consistência de `www` vs apex.
- Checar redirects HTTP->HTTPS e trailing slash.

1.3 On-page:
- Confirmar se cada rota pública tem:
  - `<title>` único e descritivo
  - `<meta name="description">` único
  - H1 único (uma vez por página), headings bem hierarquizados (H2/H3)
  - Conteúdo textual suficiente na landing (evitar só “Still in development!!” como mensagem principal)
- Detectar e corrigir links internos quebrados. Ex.: o menu possui “About”, mas `GET /about` retorna 404 (corrigir). 

1.4 Social cards:
- Verificar OG/Twitter: `og:title`, `og:description`, `og:image`, `twitter:card`, etc.

1.5 Structured data (JSON-LD):
- Validar se existe schema.org (WebSite / Organization / WebPage / BreadcrumbList quando aplicável).
- Planejar inserir JSON-LD simples e consistente.

1.6 Performance:
- Rodar Lighthouse (Mobile/Desktop) e capturar métricas:
  - LCP, CLS, INP
- Verificar carregamento de imagens e uso de `next/image` onde aplicável.
- Garantir caching correto para assets.

> Entregável: criar `doc/seo-audit.md` com o diagnóstico (bullets) e o plano de correção.

---

## 2) Corrigir estrutura e páginas essenciais (UX + SEO)
2.1 Consertar navegação e rotas quebradas
- Implementar `/about` (ou ajustar o menu para não linkar para rota inexistente).
- O /about deve ter conteúdo real: o que é RagnaAPI, proposta, público-alvo, links para docs e GitHub.

2.2 Separar claramente “Site” vs “API”
- Garantir que endpoints de API (`/api/...`) não sejam confundidos com páginas para indexação.
- Adicionar `noindex` para rotas que não devem rankear (ex.: páginas puramente técnicas/JSON, se existirem).

> Aceite: zero links internos quebrados; navegação consistente.

---

## 3) Implementar Metadata (SEO) por rota
Objetivo: cada página ter metadata completa e única.

3.1 Definir padrão de títulos
- Padrão sugerido:  
  - Home: `RagnaAPI — Ragnarok Online REST API (Monsters, Items, Skills, Maps)`
  - Docs: `Documentation — RagnaAPI`
  - About: `About — RagnaAPI`
- Evitar títulos repetidos/boilerplate.

3.2 Definir meta descriptions únicas
- Criar descriptions claras e úteis, focadas no conteúdo da página.
- Evitar keyword stuffing.
- Mantê-las concisas e informativas.

3.3 Canonical
- Definir canonical absoluto para cada rota pública.
- Garantir consistência com domínio canônico (apex vs www).

3.4 Open Graph + Twitter
- Configurar:
  - `og:title`, `og:description`, `og:url`, `og:site_name`
  - `og:image` (imagem 1200x630), `og:type=website` (home) e `article` se tiver páginas tipo artigo
  - `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`

3.5 Favicons / App icons
- Incluir favicon.ico e ícones (png) e `manifest.webmanifest` se fizer sentido.

> Implementação:
- Se App Router: usar `export const metadata` / `generateMetadata` e arquivos de metadata do Next.js.
- Se Pages Router: centralizar via `next/head` e criar utilitário de SEO por página (com tipagem TS).

> Aceite: cada rota pública possui title/description/og/twitter/canonical.

---

## 4) robots.txt e sitemap.xml (técnico)
4.1 robots.txt
- Criar `robots.txt` permitindo indexação do site e apontando para sitemap:
  - Allow: /
  - Disallow: rotas privadas/internas (se existirem)
  - Sitemap: https://ragnapi.com/sitemap.xml

4.2 sitemap.xml
- Gerar sitemap com:
  - `/` (home)
  - `/documentation` (docs)
  - `/about`
  - Outras páginas públicas relevantes
- Incluir `lastModified` quando viável.

4.3 Política de indexação de API
- Se houver rotas HTML que exibem JSON e não agregam valor de busca, aplicar `noindex`.
- Não bloquear assets necessários ao render.

> Aceite: /robots.txt e /sitemap.xml acessíveis em produção e refletindo as rotas públicas.

---

## 5) Structured Data (JSON-LD) mínimo e correto
Adicionar JSON-LD usando schema.org e boas práticas:
- `WebSite` com `potentialAction` (SearchAction) SE houver busca no site; se não houver busca, não inventar.
- `Organization` (ou `Person`) para o autor/projeto, com `url`, `name`, `logo` (se aplicável).
- `WebPage` por rota (home/docs/about) com `name`, `description`, `url`.
- `BreadcrumbList` se houver breadcrumbs reais na UI.

> Validar no Rich Results Test e garantir JSON-LD válido.

---

## 6) Conteúdo e semântica (on-page SEO)
6.1 Headings e semântica
- Garantir 1 H1 por página.
- Melhorar hierarquia (H2/H3) especialmente na landing e docs.
- Adicionar texto introdutório mais forte na home (o snippet atual é curto; precisa explicar valor e principais recursos).

6.2 Links internos
- Criar seção “Get Started” com links:
  - Documentation
  - Endpoint exemplos (com copy-to-clipboard)
  - GitHub
- Garantir que “Documentation” esteja bem linkada e com âncoras/TOC.

---

## 7) Performance e boas práticas
- Garantir SSR/SSG adequado para páginas públicas (evitar depender 100% de client-side).
- Otimizar imagens (usar next/image quando aplicável).
- Evitar bundles grandes na home (lazy-load onde fizer sentido).
- Configurar caching para assets estáticos.
- Checar Core Web Vitals pós mudanças.

---

## 8) Validação final (checklist de aceite)
8.1 Técnica
- [ ] `curl -I https://ragnapi.com/` retorna 200 e HTML
- [ ] `https://ragnapi.com/about` retorna 200 (sem 404)
- [ ] `https://ragnapi.com/robots.txt` existe e referencia o sitemap
- [ ] `https://ragnapi.com/sitemap.xml` existe e contém URLs públicas
- [ ] Cada rota pública tem `title`, `meta description`, canonical, OG e Twitter
- [ ] JSON-LD válido

8.2 SEO / qualidade
- [ ] Titles únicos, claros e sem stuffing
- [ ] Descriptions únicas e informativas
- [ ] H1 único por página e headings consistentes
- [ ] Zero links internos quebrados

8.3 Evidências
- Criar `doc/seo-validation.md` com:
  - prints/outputs de validações (Lighthouse, curl headers, trechos de head)
  - lista final de URLs indexáveis

---

## 9) Saída esperada
- PR com commits atômicos
- docs adicionadas:
  - `doc/seo-audit.md`
  - `doc/seo-validation.md`
  - atualização em `doc/decisions.md`
- Deploy em Vercel sem erros
