import http from 'node:http';
import { readFile, mkdir, writeFile, link, unlink, stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { validateQuote } from './public/validation.js';
const root = path.dirname(fileURLToPath(import.meta.url));
const defaultPublicRoot = path.join(root, 'public');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
};
function json(res, status, data, extra = {}) {
  res.writeHead(status, {
    ...securityHeaders,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extra,
  });
  res.end(JSON.stringify(data));
}
function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}
async function readJson(req) {
  let size = 0,
    chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 20000)
      throw httpError(413, 'La solicitud es demasiado grande. Reduce la descripción.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw httpError(400, 'No fue posible leer la solicitud.');
  }
}
export async function saveQuote(directory, id, data) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const file = path.join(directory, `${id}.json`),
    fingerprint = createHash('sha256').update(JSON.stringify(data)).digest('hex');
  const record = {
    id,
    createdAt: new Date().toISOString(),
    status: 'pendiente',
    privacyVersion: '2026-10-05',
    ...data,
    fingerprint,
  };
  delete record.website;
  const temp = path.join(directory, `.${id}.${randomUUID()}.tmp`);
  try {
    await writeFile(temp, JSON.stringify(record, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    try {
      await link(temp, file);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const existing = JSON.parse(await readFile(file, 'utf8'));
      if (existing.fingerprint !== fingerprint)
        throw httpError(
          409,
          'Esta referencia ya se usó con otros datos. Revisa un campo y vuelve a enviar.',
        );
      return { id, duplicate: true };
    }
    return { id, duplicate: false };
  } finally {
    await unlink(temp).catch(() => {});
  }
}
export function createServer(options = {}) {
  const publicRoot = options.publicRoot || defaultPublicRoot,
    dataDir = options.dataDir || process.env.DATA_DIR || path.join(root, 'data', 'solicitudes'),
    limits = new Map(),
    maxRequests = options.maxRequests ?? 10;
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/quotes') {
        if (req.method !== 'POST')
          return json(
            res,
            405,
            { message: 'Usa el formulario para enviar tu solicitud.' },
            { Allow: 'POST' },
          );
        const expectedOrigin = options.publicOrigin || process.env.PUBLIC_ORIGIN,
          origin = req.headers.origin,
          allowed = expectedOrigin
            ? [new URL(expectedOrigin).origin]
            : [`http://${req.headers.host}`];
        if ((origin && !allowed.includes(origin)) || req.headers['sec-fetch-site'] === 'cross-site')
          return json(res, 403, { message: 'Envía la solicitud desde el sitio de Sitio Vecino.' });
        if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || ''))
          return json(res, 415, { message: 'Formato de solicitud no compatible.' });
        const key = req.socket.remoteAddress || 'unknown',
          now = Date.now();
        for (const [ip, b] of limits) if (b.expires <= now) limits.delete(ip);
        const bucket = limits.get(key) || { count: 0, expires: now + 600000 };
        bucket.count++;
        limits.set(key, bucket);
        if (bucket.count > maxRequests)
          return json(
            res,
            429,
            {
              message:
                'Se enviaron varias solicitudes recientemente. Espera unos minutos o escríbeme por WhatsApp.',
            },
            { 'Retry-After': String(Math.ceil((bucket.expires - now) / 1000)) },
          );
        const input = await readJson(req),
          { data, errors } = validateQuote(input);
        if (data.website)
          return json(res, 422, {
            message: 'No fue posible validar el formulario. Inténtalo de nuevo.',
          });
        if (Object.keys(errors).length)
          return json(res, 422, { message: 'Revisa los campos señalados.', errors });
        if (
          typeof input.requestId !== 'string' ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            input.requestId,
          )
        )
          return json(res, 422, {
            message:
              'La referencia del formulario no es válida. Recarga la página e intenta otra vez.',
          });
        const result = await saveQuote(dataDir, input.requestId.toLowerCase(), data);
        return json(res, result.duplicate ? 200 : 201, { ok: true, id: result.id });
      }
      if (url.pathname.startsWith('/api/'))
        return json(res, 404, { message: 'Ruta no encontrada.' });
      if (!['GET', 'HEAD'].includes(req.method))
        return json(res, 405, { message: 'Método no permitido.' }, { Allow: 'GET, HEAD' });
      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        return json(res, 400, { message: 'Dirección no válida.' });
      }
      if (
        pathname.includes('\\') ||
        pathname.includes('\0') ||
        pathname.split('/').some((part) => part.startsWith('.'))
      )
        return json(res, 404, { message: 'Página no encontrada.' });
      if (pathname.endsWith('/')) pathname += 'index.html';
      const file = path.resolve(publicRoot, '.' + pathname),
        relative = path.relative(publicRoot, file);
      if (relative.startsWith('..') || path.isAbsolute(relative))
        return json(res, 404, { message: 'Página no encontrada.' });
      try {
        const canonicalFile = await realpath(file),
          canonicalRoot = await realpath(publicRoot),
          rel = path.relative(canonicalRoot, canonicalFile);
        if (rel.startsWith('..') || path.isAbsolute(rel))
          return json(res, 404, { message: 'Página no encontrada.' });
        const info = await stat(canonicalFile);
        if (!info.isFile()) throw Object.assign(new Error(), { code: 'ENOENT' });
        const content = await readFile(canonicalFile);
        res.writeHead(200, {
          ...securityHeaders,
          'Content-Type': mime[path.extname(canonicalFile)] || 'application/octet-stream',
          'Content-Length': content.length,
          'Cache-Control': /\.(html|js|css)$/.test(file) ? 'no-cache' : 'public, max-age=3600',
        });
        return res.end(req.method === 'HEAD' ? undefined : content);
      } catch (error) {
        if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error;
      }
      const notFound = await readFile(path.join(publicRoot, '404.html'));
      res.writeHead(404, { ...securityHeaders, 'Content-Type': 'text/html; charset=utf-8' });
      res.end(notFound);
    } catch (error) {
      if (res.headersSent) {
        res.end();
        return;
      }
      if (!error.status)
        console.error('No fue posible completar la operación:', error.code || error.name);
      json(res, error.status || 503, {
        message: error.status
          ? error.message
          : 'No pude guardar tu solicitud en este momento. Tus datos siguen en el formulario; intenta de nuevo o continúa por WhatsApp.',
      });
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 4173),
    host = process.env.HOST || '127.0.0.1',
    server = createServer();
  server.requestTimeout = 20000;
  server.headersTimeout = 10000;
  server.on('error', (e) => {
    console.error(
      e.code === 'EADDRINUSE'
        ? `El puerto ${port} está ocupado. Cierra la otra vista previa o cambia PORT.`
        : e.message,
    );
    process.exitCode = 1;
  });
  server.listen(port, host, () =>
    console.log(
      `Sitio Vecino: http://${host}:${server.address().port}\nSolicitudes: ${process.env.DATA_DIR || path.join(root, 'data', 'solicitudes')}`,
    ),
  );
}
