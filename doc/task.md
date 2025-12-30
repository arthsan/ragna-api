# CODEX TASK — MongoDB Connection Threshold / Pool Exhaustion Audit

## Contexto
Recebi alerta do MongoDB dizendo que minha API atingiu o máximo (threshold) de conexões simultâneas. 
Seu objetivo é investigar o repositório, identificar a causa raiz (bugs de implementação e/ou uso incorreto de pool), e aplicar correções robustas.

## Objetivo principal
1) Encontrar por que a aplicação está abrindo conexões demais (conexões “vazando” ou múltiplas instâncias de client).
2) Garantir que exista **apenas um MongoClient por processo** (ou por runtime, no caso de serverless) e que o pool seja configurado corretamente.
3) Validar que o código não está criando conexão por request/handler, nem em lugares que rodam repetidamente.
4) Implementar instrumentação mínima para confirmar a correção.

---

## Etapa 1 — Descoberta (scan do repo)
Faça uma varredura completa procurando por:
- `new MongoClient(` (mongodb driver)
- `mongoose.connect(` / `createConnection(` / `mongoose.createConnection(`
- `connect()` em arquivos de rota/controller/middleware
- imports de “db” em lugares inesperados
- padrões de factory: `getDb()`, `connectDb()`, `db.ts`, `mongo.ts`, `mongoose.ts`
- inicialização em `handler` (AWS Lambda), `api route` (Next.js), `serverless function`, `edge`, etc.
- re-conexão em loops, retries sem backoff, ou reconectar em erro sem proteção

Produza um relatório com:
- lista de arquivos e trechos relevantes
- para cada ocorrência: “pode causar múltiplas conexões? por quê?”
- identificação do framework/runtime (Express/Fastify/Nest/Next/Serverless/Lambda/etc.)

---

## Etapa 2 — Hipóteses comuns a confirmar
Verifique e confirme (com evidência no código) se ocorre algum destes problemas:

### A) Conexão criada por request
- conexão ou `new MongoClient` dentro de controller/route/middleware.

### B) Singleton ausente ou mal feito
- exporta função que sempre cria client novo
- singleton quebrado por múltiplos imports/paths (duplicação via bundler)
- em TS/JS: múltiplos arquivos “db.ts” diferentes

### C) Hot reload / dev mode
- nodemon/ts-node-dev recriando app e conectando de novo sem fechar
- Next dev criando múltiplas instâncias se não usar cache global

### D) Serverless (Lambda/Vercel/Cloudflare)
- ausência de cache global do client entre invocações
- conexão iniciada no handler sem reutilização
- pool alto em cada instância => “conexões x instâncias” explode

### E) Pool / timeouts ruins
- `maxPoolSize` exagerado (ex.: 100+) ou default sem entender carga
- `minPoolSize` alto
- `maxIdleTimeMS` ausente
- `waitQueueTimeoutMS` ausente (requests penduram e acumulam)
- `serverSelectionTimeoutMS` e `connectTimeoutMS` não configurados

### F) Queries presas / operações longas
- streams/cursors sem fechamento
- `watch()` (change streams) multiplicando watchers
- `aggregate()` pesado sem limites, saturando pool
- transações longas

---

## Etapa 3 — Implementar correção padrão (driver mongodb)
Se o repo usa `mongodb` driver diretamente, implemente um módulo único:

Requisitos:
- um único `MongoClient` por processo (singleton)
- `clientPromise` para evitar corrida (race)
- reutilização em dev/hot reload via `globalThis`
- exportar `getDb()` e opcionalmente `getClient()`
- NUNCA conectar por request

Config recomendada (ajustável depois):
- `maxPoolSize`: começar com 10~30 (depende do tráfego e instâncias)
- `minPoolSize`: 0
- `maxIdleTimeMS`: 60000
- `waitQueueTimeoutMS`: 10000
- `serverSelectionTimeoutMS`: 5000
- `connectTimeoutMS`: 10000

Aplique também:
- garantir `await client.connect()` acontece uma vez
- em shutdown (SIGTERM/SIGINT) chamar `client.close()` (se aplicável)

---

## Etapa 4 — Implementar correção padrão (Mongoose)
Se usa Mongoose:
- garantir que `mongoose.connect()` é chamado uma vez
- usar cache global (especialmente em Next.js / serverless)
- remover `createConnection()` espalhado
- configurar `maxPoolSize` no mongoose (ele repassa ao driver)

---

## Etapa 5 — Instrumentação e verificação
Adicione logs/metrics simples para provar que corrigiu:
- logar 1x por processo: “Mongo connected”
- logar opcional: `client.topology?.s.state` (se existir) / estado de conexão
- expor métrica/contador: número de chamadas a `connectDb()`
- garantir que em 1000 requests não ocorre aumento linear de conexões

Se existir ambiente de staging:
- documentar como validar no MongoDB Atlas/Cloud Manager:
  - gráfico de connections
  - spikes vs deploy
  - correlação com instâncias

---

## Etapa 6 — Checklist de PR (obrigatório)
Antes de finalizar:
- nenhum controller/route cria conexão
- existe apenas um módulo de conexão
- pool configurado e documentado
- comportamento correto em dev + prod
- se serverless: client cacheado em `globalThis`
- testes mínimos (se possível) garantindo que `connect` não é chamado múltiplas vezes

---

## Saída esperada
1) Relatório de causa raiz com evidências (arquivos e motivos).
2) PR com refactor completo de conexão.
3) Recomendações de tuning (pool size) baseado no runtime (monolito vs serverless) e tráfego estimado.
