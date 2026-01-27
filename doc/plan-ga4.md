# plan-ga4.md — Plano de implementação GA4 (Google Analytics) para RagnaAPI

## Contexto atual
- Framework: Next.js Pages Router.
- GA no projeto: `gtag.js` via `next/script` em `src/pages/_app.tsx`.
- `.env` usa `GTM_ID=UA-202901013-2` (Universal Analytics — descontinuado).

## Objetivo
Atualizar a instrumentacao para GA4 com boas praticas atuais, evitando pageviews duplicados em SPA, e adicionar eventos relevantes ao produto.
Adicionar eventos server-side para todas as rotas em `src/pages/api/**` via Measurement Protocol.

## Decisões a confirmar
1) GA4 direto (gtag.js) **confirmado**.
2) Measurement ID GA4 (formato `G-XXXXXXX`) — sera fornecido via env em runtime, nao sera salvo localmente.
3) API Secret GA4 (Measurement Protocol) — sera fornecido via env em runtime, nao sera salvo localmente.
4) Eventos obrigatorios (lista final e parametros).

## Plano técnico (alto nível)
1) **Migrar de UA para GA4**
   - Usar `NEXT_PUBLIC_GA_ID` (Measurement ID GA4) em runtime.
   - Remover qualquer referencia a UA.
2) **Boas práticas de SPA**
   - Carregar `gtag.js` somente se `NEXT_PUBLIC_GA_ID` existir.
   - Configurar `send_page_view: false`.
   - Disparar `page_view` manual em cada mudança de rota (Next Router).
3) **Eventos customizados (frontend)**
   - Implementar eventos com `gtag('event', ...)` nos pontos da UI.
   - Padronizar nomes e parâmetros.
4) **Eventos server-side (API)**
   - Enviar eventos via Measurement Protocol para todas as rotas em `src/pages/api/**`.
   - Instrumentacao centralizada para evitar repeticao em cada handler.
   - Envio assincrouno e tolerante a falhas (nao bloquear a resposta da API).
5) **Documentação**
   - Registrar a mudança e a lista de eventos neste arquivo.
   - Se necessário, atualizar `doc/decisions.md`.

## Mudanças previstas (arquivos)
- `src/pages/_app.tsx`  
  - Ajustar script GA4, inicialização e listener de rotas.
- `.env`  
  - **Nao sera alterado localmente**; `NEXT_PUBLIC_GA_ID` e `GA4_API_SECRET` serao injetados via env em runtime.
- (Opcional) `src/lib/analytics.ts`  
  - Centralizar helpers para `pageView` e `trackEvent`.
- (Opcional) `src/lib/ga4-server.ts`
  - Helper para Measurement Protocol (monta payload e envia).
- (Opcional) `src/lib/api-analytics.ts`
  - Wrapper/utility para instrumentar rotas em `src/pages/api/**`.
- `doc/plan-ga4.md`  
  - Atualizar com parâmetros finais e decisões.

## Boas praticas GA4 (resumo)
- Evitar pageview duplicado: `send_page_view: false` + disparo manual.
- Nao carregar GA quando o ID estiver vazio/undefined.
- Separar configuracao do GA (config) do disparo de eventos.
- Padronizar nomes de eventos e parametros (snake_case).
- No server-side, nao bloquear response da API por falha no envio do evento.
- Filtrar dados sensiveis (nao enviar IP, tokens ou payloads completos).

## Eventos propostos (sugestao inicial)
| Evento | Quando dispara | Parâmetros sugeridos |
|---|---|---|
| `page_view` | Em toda mudança de rota | `page_title`, `page_location`, `page_path` |
| `cta_click` | Clique no CTA do G4a (a definir) | `cta_label`, `cta_location`, `link_url` |
| `copy_endpoint` | Clique em “Copy” nos endpoints da home | `endpoint_label`, `endpoint_url` |
| `outbound_link` | Clique em links externos (ex.: GitHub) | `link_url`, `link_text`, `link_location` |
| `doc_route_click` | Clique nas rotas na documentação (se houver) | `route_label`, `route_url` |
| `search_submit` | Busca no SearchBar (se existir e for usada) | `query`, `category` |
| `api_request` | Em toda requisicao nas rotas `src/pages/api/**` | `api_route`, `method`, `status`, `latency_ms`, `resource_type` |

## Mapeamento de pontos de instrumentação
- `src/components/Main/index.tsx`
  - CTA do G4a (a definir).
  - Botão “Copy” dos endpoints.
  - Links externos (GitHub).
- `src/components/SearchBar/index.tsx`
  - Evento de busca (submit/enter).
- `src/pages/documentation.tsx`
  - Clique em rotas/documentação (se aplicável).
- `src/pages/api/**`
  - Evento `api_request` para todas as rotas.

## Checklist de validação
- GA4 ativo com Measurement ID válido.
- Pageviews únicos por rota (sem duplicidade).
- Eventos disparam e aparecem no DebugView.
- Nenhum erro de console relacionado ao `gtag`.
- Eventos server-side visiveis no DebugView (Measurement Protocol).

## Pendências para você confirmar
- Measurement ID final (`G-XXXXXXX`) via env.
- API Secret do GA4 via env.
- Lista final de eventos + nomes/parametrizacao.
