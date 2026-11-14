# Read-only MCP adapter (first increment)

The optional MCP server exposes the five existing v1 GET routes through two tools.
It is a separate Node.js process using stdio, not a new HTTP route in Next.js.
It reads API responses without importing MongoDB, loading `.env` files, fetching
image URLs, or changing records. It adds no dependencies and needs no build step.
Requires Node.js 22 or newer; use the repository's supported runtime for the website.

## Connect a stdio client

From the repository root:

```sh
node mcp/server.mjs
```

Example MCP client configuration (replace the absolute path):

```json
{
  "mcpServers": {
    "ragna-api": {
      "command": "node",
      "args": ["C:/path/to/ragna-api/mcp/server.mjs"]
    }
  }
}
```

Run the Node entry point directly in clients. `npm run mcp --silent` is a convenience
for terminals; plain `npm run mcp` prints npm's banner on stdout and is unsuitable
for a stdio client. The server reserves stdout for newline-delimited JSON-RPC and
writes sanitized startup/transport errors to stderr.

The default upstream is `https://ragnapi.com`. Merely starting the process,
initializing, or listing tools makes no network requests. A valid tool call performs
one GET. The operator may set `RAGNA_API_ORIGIN` to an HTTP loopback origin such as
`http://127.0.0.1:3000` for a separately prepared local API. Only the canonical HTTPS
origin and HTTP `localhost`, `127.0.0.1`, or `[::1]` are accepted. Credentials, paths,
queries, fragments, arbitrary hosts and production custom ports are rejected.
Clients cannot select URLs through tool arguments. This adapter does not accept
database credentials or add authentication headers/cookies to upstream requests.

## Tool contract

| Tool | `era` enum | Existing upstream GET |
| --- | --- | --- |
| `ragna_get_monster` | `old-times`, `re-newal`, `re-start` | `/api/v1/{era}/monsters/{id}` |
| `ragna_get_item` | `old-times`, `re-newal` | `/api/v1/{era}/items/{id}` |

Both tools require exactly `{ "era": "old-times", "id": 1001 }`. IDs must be JSON
numbers, positive safe integers, at most `9007199254740991`. Strings, fractions,
extra keys, URL/path inputs and `re-start` items are rejected before any request.
This numeric range is a transport constraint, not a claim that those IDs exist.

Each success returns `isError: false`, one JSON text content block, and the same
object in `structuredContent`. Example using entirely synthetic data:

```json
{
  "resource": "items",
  "era": "old-times",
  "id": 1001,
  "record": { "id": 1001, "name": "Synthetic fixture" },
  "provenance": {
    "apiUrl": "https://ragnapi.com/api/v1/old-times/items/1001",
    "datasetVersion": null,
    "sourceVerified": false,
    "coverage": "unknown"
  }
}
```

The record must be one JSON object whose numeric `id` (items) or `monster_id`
(monsters) matches the request. Other record fields pass through unchanged.
No output schema for the variable record is promised in this increment. Treat
all record text and links as untrusted external data, never agent instructions.

`apiUrl` identifies where the response was obtained. It does **not** establish the
original dataset's source or license. An era is not a dataset version. This PR
does not verify any official wiki, dataset completeness, patch alignment, freshness,
or redistribution rights. It includes no third-party datasets or new assets.
Source, license and version verification remain prerequisites for a data expansion.

## Errors and resource limits

Tool execution failures return `isError: true` with equivalent JSON text and
`structuredContent`: `{ "error": { "code": "...", "message": "..." } }`.

| Code | Meaning |
| --- | --- |
| `INVALID_ARGUMENTS` | Tool inputs do not match the contract |
| `RATE_LIMITED` | Less than one second since the previous upstream lookup started |
| `NO_RECORD` | 404, 204, null, or an empty JSON response |
| `INVALID_RESPONSE` | Wrong content type, malformed JSON, wrong shape or mismatched ID |
| `RESPONSE_TOO_LARGE` | Decoded HTTP response body exceeds 1 MiB |
| `UPSTREAM_TIMEOUT` | Eight-second deadline including body reads expired |
| `UPSTREAM_UNAVAILABLE` | Network failure, blocked redirect or another non-2xx status |

The existing MongoDB helpers can convert query failures to empty results. Thus
`NO_RECORD` does not prove that an ID is absent from Ragnarok, or even from the
database. The adapter deliberately preserves that uncertainty instead of asserting
complete coverage. Upstream error bodies and raw exceptions are never returned.
There are no automatic retries. The one-second limit is per process and shared by
both tools; it is not a distributed API quota.

Requests execute serially with stream backpressure. A message over 64 KiB closes
the transport after a JSON-RPC error. Invalid JSON/UTF-8 and an incomplete final
line produce parse errors. Inputs and outputs use one UTF-8 JSON message per line.
The 1 MiB limit applies to upstream bytes, before JSON is serialized into the MCP
result; escaping and the duplicate text/structured representations can be larger.

## Protocol subset and limitations

- Supports `2025-11-25`; offers that version to clients requesting other versions.
  A client that cannot use the offered version must disconnect.
- Requires `initialize`, then `notifications/initialized`; supports `ping`,
  `tools/list` and `tools/call`. Tool discovery is static and not paginated.
- Advertises only tools. There are no resources, prompts, subscriptions, task
  execution, sampling, elicitation, server requests, SSE or HTTP MCP transport.
- Valid notifications never receive replies or trigger lookups. Cancellation
  notifications are accepted without replies; this serial first version does not
  interrupt an active lookup. Its eight-second deadline bounds that work.
- Unknown methods/tools and malformed envelopes use JSON-RPC errors; invalid tool
  inputs and upstream failures use tool errors. Unsupported task calls are rejected.
- Errors preserve an identifiable request ID; parse/framing errors omit an unknown
  ID, as specified by the `2025-11-25` error schema. They never emit `id: null`.
- This deliberately small implementation uses Node built-ins rather than adding
  an SDK dependency. Automated fixtures cover its declared subset. Compatibility
  with a specific third-party MCP client still needs owner validation.

Protocol references: [stdio transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports),
[lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle),
[tools and errors](https://modelcontextprotocol.io/specification/2025-11-25/server/tools).

## Validation

The MCP tests need only Node.js; they do not need `node_modules`, MongoDB, real
environment variables, or a deployed API:

```sh
node --test --test-timeout=20000 tests/mcp-api.test.mjs tests/mcp-protocol.test.mjs
```

They exercise all five route combinations, input and response boundaries, timeout,
rate limiting, redirect refusal, protocol lifecycle, framing, Unicode, stdout
backpressure and real subprocess/HTTP integration against synthetic loopback fixtures.

With the repository's existing dependencies already available:

```sh
npm run typecheck:mcp
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm run lint
npm run build
```

Use only fictitious `MONGODB` values for a build, never real credentials. Keep the
server-only environment correction in [PR #6](https://github.com/arthsan/ragna-api/pull/6)
separate; this adapter neither depends on it nor duplicates it. See
[the validation record](testing-mcp.md) for the checks actually completed here.
