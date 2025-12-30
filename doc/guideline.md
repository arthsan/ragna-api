# guideline.md — Engineering Guidelines (Senior Dev Playbook)

> Objetivo: manter o projeto consistente, escalável e fácil de evoluir.  
> Padrões obrigatórios: **SOLID**, **Clean Code**, **Refactoring (Martin Fowler)**, **boas práticas de TypeScript**, **commits atômicos**, e **registro de decisões**.

---

## 1) Estrutura de documentação (obrigatório)

Toda documentação fica em `./doc`.

### Estrutura recomendada

```text
doc/
  decisions.md
  architecture.md
  conventions.md
  setup.md
  testing.md
  release.md
  troubleshooting.md
  adr/
    0001-<titulo>.md
    0002-<titulo>.md
```

### Regras

- Toda decisão relevante **deve** ser registrada em `doc/decisions.md`.
- Discussões longas/decisões grandes **devem** virar uma ADR em `doc/adr/`.
- Qualquer mudança que altere uso, setup, arquitetura, fluxo de deploy, lint/test/build => atualizar docs no mesmo PR.

---

## 2) Workflow de desenvolvimento

### 2.1 Branch & PR

- Branch naming:
  - `feat/<slug>`
  - `fix/<slug>`
  - `chore/<slug>`
  - `refactor/<slug>`
- Todo PR deve conter:
  - Descrição do problema e abordagem
  - Lista de mudanças relevantes
  - Impacto/risco e como validar
  - Evidências (prints/logs) quando fizer sentido
  - Link para decision/ADR quando houver

### 2.2 Commits atômicos (obrigatório)

**Um commit por tarefa resolvida.**  
Se a tarefa tem subpassos significativos, faça commits menores (mas sempre completos e testáveis).

Regras:

- Cada commit deve compilar/rodar testes (quando aplicável).
- Não misturar refactor + feature no mesmo commit, exceto quando o refactor é pré-requisito mínimo e isolado.
- Evitar commits gigantes. Se ficou grande, quebre.

Formato (Conventional Commits):

- `feat(scope): ...`
- `fix(scope): ...`
- `refactor(scope): ...`
- `test(scope): ...`
- `docs(scope): ...`
- `chore(scope): ...`

Boas mensagens:

- `fix(db): reuse MongoClient singleton to prevent connection leaks`
- `refactor(auth): extract token parsing to pure function`
- `docs(architecture): document connection pooling strategy`

---

## 3) Registro de decisões (obrigatório)

### 3.1 “A cada iteração com o chat ou decisão”

Sempre que houver:

- mudança de abordagem
- escolha de biblioteca/padrão
- trade-off relevante (performance vs simplicidade)
- definição de convenções
- decisões de arquitetura/infra/config
- ajustes por limitações de runtime

➡️ **Registrar em `doc/decisions.md`** no mesmo PR.

### 3.2 Template de entrada no `decisions.md`

Cada decisão deve ter:

- Data
- Contexto
- Decisão
- Alternativas consideradas
- Consequências
- Links (PR, issue, docs)

---

## 4) Qualidade de código (Clean Code + Fowler)

### 4.1 Regras práticas

- Funções pequenas e com uma responsabilidade.
- Nomes explícitos > comentários.
- Evitar boolean traps: prefira enums/objetos de opções.
- Evitar `if` aninhado: early returns, guard clauses.
- Zero duplicação: extrair função/objeto/módulo quando repetir lógica.

### 4.2 Refactors “permitidos/encorajados” (Fowler)

- Extract Function / Extract Variable
- Inline Function (quando função só atrapalha)
- Replace Conditional with Polymorphism (Strategy, State)
- Introduce Parameter Object (evitar listas longas)
- Replace Magic Number with Constant
- Split Phase (separar parse/validate/execute)
- Move Function/Field (colocar no lugar certo)

Regra: **refactor sempre em pequenos passos**, com testes/checagens.

---

## 5) SOLID aplicado (prático)

- **S (Single Responsibility):** cada módulo com uma razão clara para mudar.
- **O (Open/Closed):** extensão via composição/polimorfismo, não via `switch` gigante.
- **L (Liskov):** contratos claros; mocks devem respeitar interface real.
- **I (Interface Segregation):** interfaces pequenas; não obrigue implementações a depender do que não usam.
- **D (Dependency Inversion):** domínios dependem de abstrações; infraestrutura adaptada.

Padrões sugeridos:

- Strategy para variações de comportamento (ex.: providers, regras).
- Adapter para integração externa.
- Factory só quando precisar desacoplar criação complexa.

---

## 6) Boas práticas de TypeScript

### 6.1 Tipagem

- `noImplicitAny`, `strict` habilitado (se possível).
- Evitar `any` (só em bordas/interop, com comentário e TODO).
- Preferir `unknown` + type guards.
- Modelar dados de entrada com `zod`/`yup`/`joi` (ou validação equivalente).
- Tipos devem representar o domínio:
  - `type UserId = string & { __brand: "UserId" }` (se fizer sentido)
  - `enum`/`as const` para valores finitos
- Não “tipar por conveniência”. Tipar para prevenir bug.

### 6.2 Estrutura

- Separar:
  - `domain/` (regras, entidades, value objects)
  - `application/` (use cases)
  - `infrastructure/` (db, http, sdk)
  - `interface/` (controllers/routes)
- I/O na borda, pure functions no centro.

### 6.3 Erros e Result

- Preferir erros explícitos (classes) para camada de domínio/app.
- Em integrações: mapear erros externos para erros internos.
- Evitar `throw` espalhado no core sem contexto (usar factories / error mappers).

---

## 7) Padrões de testes

- Testes unitários para regras puras (rápidos e determinísticos).
- Testes de integração apenas onde necessário.
- Mocks devem ser minimamente fiéis ao contrato.
- Cobrir:
  - caminhos felizes
  - bordas (null/undefined/empty)
  - erros esperados
  - idempotência/retry quando aplicável

Regra: **cada bug corrigido deve virar teste** quando possível.

---

## 8) Logs, observabilidade e performance

- Logar eventos importantes com contexto (correlationId/requestId).
- Evitar logs ruidosos em loops.
- Medir: latência, erro, conexões, filas (quando existir).
- Em código crítico, otimizar depois de medir (não “micro-otimizar” cedo).

---

## 9) Checklist obrigatório antes de abrir PR

- [ ] Build/test passam
- [ ] Commits atômicos e bem descritos
- [ ] Docs atualizadas em `doc/`
- [ ] Decisions registradas em `doc/decisions.md` (e ADR se necessário)
- [ ] Sem `any` novo sem justificativa
- [ ] Código segue SOLID/Clean Code
- [ ] Refactors feitos em passos pequenos e seguros
