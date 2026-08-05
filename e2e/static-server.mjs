import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? 'out');
const port = Number(process.argv[3] ?? 4173);
const host = '127.0.0.1';

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

function isInsideRoot(filePath) {
  return filePath === root || filePath.startsWith(`${root}${path.sep}`);
}

async function resolveRequestPath(requestPath) {
  const decodedPath = decodeURIComponent(requestPath);
  const relativePath = decodedPath.replace(/^[/\\]+/, '');
  const requested = path.resolve(root, relativePath);

  if (!isInsideRoot(requested)) return null;

  const candidates = [requested];
  if (!path.extname(requested)) {
    candidates.push(`${requested}.html`, path.join(requested, 'index.html'));
  }
  if (decodedPath.endsWith('/') || requested === root) {
    candidates.unshift(path.join(requested, 'index.html'));
  }

  for (const candidate of candidates) {
    if (!isInsideRoot(candidate)) continue;
    try {
      const details = await stat(candidate);
      if (details.isFile()) return candidate;
    } catch {
      // Try the next static-export candidate.
    }
  }

  return null;
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${host}:${port}`);
    const filePath = await resolveRequestPath(url.pathname);

    const status = filePath ? 200 : 404;
    const responsePath = filePath ?? (await resolveRequestPath('/404.html'));
    if (!responsePath) {
      response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    const body = await readFile(responsePath);
    response.writeHead(status, {
      'Cache-Control': 'no-cache',
      'Content-Type': contentTypes[path.extname(responsePath)] ?? 'application/octet-stream',
    });
    if (request.method === 'HEAD') response.end();
    else response.end(body);
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(error instanceof Error ? error.message : 'Internal server error');
  }
});

server.listen(port, host, () => {
  console.log(`Static E2E server listening at http://${host}:${port}`);
});

function closeServer() {
  server.close(() => process.exit(0));
}

process.once('SIGINT', closeServer);
process.once('SIGTERM', closeServer);
