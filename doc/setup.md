# setup.md

## Prerequisites

- Node.js 26.13.1 LTS (see `.nvmrc`; use `nvm use` when already available).
- Vercel uses `package.json#engines.node: 26.x` for new builds and Node Functions.
- Yarn v1.

## Install

```bash
yarn install
```

Cloud typechecks, build and synthetic HTTP/MCP checks passed on Node 26.13.1. Lint tooling and browser verification remain pending; see the [verification record](node-runtime.md).

## Development

```bash
yarn dev
```

## Build

```bash
yarn build
yarn start
```
