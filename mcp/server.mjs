import { once } from 'node:events';
import { pathToFileURL } from 'node:url';
import { createApiClient } from './api.mjs';
import { createProtocol, rpcError } from './protocol.mjs';

export const MAX_LINE_BYTES = 64 * 1024;

/**
 * Process serially so stdin/stdout backpressure bounds queued work.
 * @param {AsyncIterable<Buffer>} input
 * @param {NodeJS.WritableStream} output
 * @param {ReturnType<typeof createProtocol>} handle
 */
export async function serve(input, output, handle) {
  let pending = Buffer.alloc(0);
  /** @param {unknown} message */
  async function write(message) {
    if (!output.write(`${JSON.stringify(message)}\n`)) await once(output, 'drain');
  }
  /** @param {Buffer} line */
  async function processLine(line) {
    let message;
    try {
      message = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(line));
    } catch {
      await write(rpcError(undefined, -32700, 'Parse error'));
      return;
    }
    const response = await handle(message);
    if (response !== null) await write(response);
  }
  for await (const chunk of input) {
    let start = 0;
    while (start < chunk.length) {
      const newline = chunk.indexOf(10, start);
      const end = newline === -1 ? chunk.length : newline;
      if (pending.length + end - start > MAX_LINE_BYTES) {
        await write(rpcError(undefined, -32600, 'Message exceeds 64 KiB; closing transport'));
        return;
      }
      pending = Buffer.concat([pending, chunk.subarray(start, end)]);
      if (newline === -1) break;
      await processLine(pending);
      pending = Buffer.alloc(0);
      start = newline + 1;
    }
  }
  if (pending.length) await write(rpcError(undefined, -32700, 'Incomplete message: expected newline'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const lookup = createApiClient({ origin: process.env.RAGNA_API_ORIGIN });
    await serve(process.stdin, process.stdout, createProtocol(lookup));
  } catch {
    process.stderr.write('RagnaAPI MCP stopped: invalid configuration or transport failure.\n');
    process.exitCode = 1;
  }
}
