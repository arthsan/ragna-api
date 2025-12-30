# seo-validation.md

## Validacao (2025-12-30)

### Tecnica
- [x] curl homepage (HTTP 200 em 2025-12-30)
- [ ] /about retorna 200 (404 em 2025-12-30; deploy pendente)
- [ ] /robots.txt acessivel (404 em 2025-12-30; deploy pendente)
- [x] /sitemap.xml acessivel (HTTP 200 em 2025-12-30)
- [x] Title/description/canonical/OG/Twitter por pagina (implementado em codigo)
- [x] JSON-LD minimo por pagina (implementado em codigo)

### SEO / qualidade
- [x] Titles unicos e claros
- [x] Descriptions unicas e informativas
- [x] H1 unico por pagina (header ajustado)
- [x] Links internos corrigidos (About criado)

### Evidencias pendentes
- Lighthouse mobile/desktop
- Validacao Rich Results Test
- Captura de HTML completo para checar head tags (curl -L)

### Evidencias coletadas
- `curl -I https://ragnapi.com/` => 200, content-type text/html (2025-12-30)
- `curl -I https://ragnapi.com/about` => 404 (2025-12-30)
- `curl -I https://ragnapi.com/robots.txt` => 404 (2025-12-30)
- `curl -I https://ragnapi.com/sitemap.xml` => 200, content-type application/xml (2025-12-30)
- `curl -L https://ragnapi.com/` => HTML com `<title>Ragnarok Online API</title>` e metatags antigas (deploy pendente do novo SEO)

### URLs indexaveis
- https://ragnapi.com/
- https://ragnapi.com/documentation
- https://ragnapi.com/about
