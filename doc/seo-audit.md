# seo-audit.md

## Auditoria inicial (antes das mudancas)

### 1) Framework e head
- Router: Pages Router (`src/pages`).
- HTML `<head>`: uso pontual de `next/head` (apenas `<title>` na home e docs).

### 2) Crawling/Indexabilidade
- `public/robots.txt`: ausente.
- `public/sitemap.xml`: existe, gerado por script em `next.config.js`, mas sem controle de canonical/lastmod.
- Canonical: ausente nas paginas publicas.
- `noindex`: nao configurado para rotas tecnicas (quando aplicavel).
- Redirecionamentos/trailing slash: nao definidos no config.

### 3) On-page
- Home: titulo generico e sem description; H1 duplicado (header + hero).
- Docs: sem title/description unicos; H1 ausente.
- Navegacao: link `/about` existe, mas rota nao existe (404).
- Conteudo da home: texto curto e pouco descritivo do valor da API.

### 4) Social/OG/Twitter
- OG/Twitter tags ausentes nas paginas publicas.

### 5) Structured data (JSON-LD)
- Nenhum JSON-LD presente.

### 5.1) Favicons / Icons
- Nenhum favicon declarado no head e sem `manifest.webmanifest`.

### 6) Performance
- Lighthouse nao executado nesta iteracao.

## Plano de correcao
- Criar componente de SEO com title/description/canonical/OG/Twitter/JSON-LD.
- Criar pagina `/about` com conteudo real e links para docs/GitHub.
- Corrigir H1 unico por pagina e melhorar texto introdutorio da home.
- Adicionar `robots.txt` e garantir sitemap com rotas publicas.
- Adicionar metadados de favicon/icons (usando assets existentes, com recomendacao de upgrade de assets).
- Criar `doc/seo-validation.md` com checklist final e evidencias disponiveis.
