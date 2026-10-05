import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createServer } from '../server.mjs';
import { quoteMessage } from '../public/validation.js';
import { exportRequests, csvCell } from '../scripts/export-requests.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function fixture(t, options = {}) {
  const qa = path.join(root, 'qa');
  await mkdir(qa, { recursive: true });
  const dir = await mkdtemp(path.join(qa, 'test-')),
    dataDir = path.join(dir, 'solicitudes');
  const server = createServer({ dataDir, maxRequests: 100, ...options });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((r) => server.close(r));
    const resolved = path.resolve(dir);
    assert.ok(resolved.startsWith(path.resolve(qa) + path.sep));
    await rm(resolved, { recursive: true, force: true });
  });
  return { server, base, dataDir, dir };
}
const valid = () => ({
  requestId: randomUUID(),
  name: 'Prueba de integración',
  business: 'Café de prueba',
  phone: '5512345678',
  email: 'prueba@example.test',
  industry: 'Restaurante',
  hasWebsite: 'no',
  projectType: 'local',
  budget: 'Por definir',
  description: 'Solicito una página de prueba con menú y contacto por WhatsApp.',
  features: ['WhatsApp', 'Catálogo'],
  consent: true,
  website: '',
});
const send = (base, data, headers = {}) =>
  fetch(base + '/api/quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base, ...headers },
    body: JSON.stringify(data),
  });
test('guarda la solicitud antes de confirmar y persiste tras reiniciar el servidor', async (t) => {
  const f = await fixture(t),
    data = valid();
  const response = await send(f.base, data);
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true, id: data.requestId });
  const saved = JSON.parse(await readFile(path.join(f.dataDir, data.requestId + '.json'), 'utf8'));
  assert.equal(saved.business, data.business);
  assert.equal(saved.consent, true);
  assert.equal(saved.status, 'pendiente');
  assert.ok(saved.createdAt);
  await new Promise((r) => f.server.close(r));
  await new Promise((r) => f.server.listen(0, '127.0.0.1', r));
  const again = await send(`http://127.0.0.1:${f.server.address().port}`, data);
  assert.equal(again.status, 200);
});
test('reintentos concurrentes no duplican ni sobrescriben datos', async (t) => {
  const f = await fixture(t),
    data = valid();
  const results = await Promise.all(Array.from({ length: 4 }, () => send(f.base, data)));
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 200, 200, 201]);
  assert.equal((await readdir(f.dataDir)).length, 1);
  const changed = await send(f.base, { ...data, business: 'Otro negocio' });
  assert.equal(changed.status, 409);
  assert.equal(
    JSON.parse(await readFile(path.join(f.dataDir, data.requestId + '.json'), 'utf8')).business,
    data.business,
  );
});
test('rechaza campos inválidos, funciones desconocidas y falta de consentimiento', async (t) => {
  const f = await fixture(t);
  const response = await send(f.base, {
    ...valid(),
    phone: 'abc',
    email: 'no-es-correo',
    description: 'corto',
    features: ['inventado'],
    consent: false,
  });
  assert.equal(response.status, 422);
  const body = await response.json();
  for (const key of ['phone', 'email', 'description', 'features', 'consent'])
    assert.ok(body.errors[key]);
  assert.deepEqual(await readdir(f.dataDir).catch(() => []), []);
});
test('tolera campos opcionales vacíos y rechaza tipos inesperados', async (t) => {
  const f = await fixture(t);
  assert.equal(
    (await send(f.base, { ...valid(), email: '', budget: '', features: [] })).status,
    201,
  );
  for (const body of [
    null,
    [],
    { ...valid(), name: { bad: true } },
    { ...valid(), phone: 123 },
    { ...valid(), requestId: '../../secret' },
  ])
    assert.equal((await send(f.base, body)).status, 422);
});
test('rechaza origen ajeno, formatos incorrectos, JSON dañado y solicitudes grandes', async (t) => {
  const f = await fixture(t);
  assert.equal((await send(f.base, valid(), { Origin: 'https://otro.example' })).status, 403);
  assert.equal((await send(f.base, valid(), { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal(
    (
      await fetch(f.base + '/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      })
    ).status,
    400,
  );
  assert.equal((await send(f.base, { ...valid(), description: 'a'.repeat(25000) })).status, 413);
});
test('detecta spam básico y limita los envíos', async (t) => {
  const f = await fixture(t, { maxRequests: 2 });
  assert.equal((await send(f.base, { ...valid(), website: 'spam.example' })).status, 422);
  assert.equal((await send(f.base, valid())).status, 201);
  const r = await send(f.base, valid());
  assert.equal(r.status, 429);
  assert.ok(r.headers.get('retry-after'));
});
test('un fallo de almacenamiento nunca devuelve confirmación', async (t) => {
  const f = await fixture(t);
  await writeFile(f.dataDir, 'Esto no es una carpeta');
  const r = await send(f.base, valid());
  assert.equal(r.status, 503);
  assert.notEqual((await r.json()).ok, true);
});
test('sirve todas las rutas públicas y protege archivos privados', async (t) => {
  const f = await fixture(t);
  for (const url of [
    '/',
    '/styles.css',
    '/app.js',
    '/config.js',
    '/validation.js',
    '/privacidad.html',
    '/demos/?proyecto=restaurante',
    '/assets/logo.png',
    '/assets/mesa-barrio.webp',
  ])
    assert.equal((await fetch(f.base + url)).status, 200, url);
  for (const url of [
    '/server.mjs',
    '/package.json',
    '/data/solicitudes/secreto.json',
    '/exports/solicitudes.html',
    '/.env',
    '/%2e%2e%5cserver.mjs',
  ])
    assert.equal((await fetch(f.base + url)).status, 404, url);
  assert.equal((await fetch(f.base + '/api/quotes')).status, 405);
  assert.equal((await fetch(f.base + '/no-existe')).status, 404);
  assert.match(
    (await fetch(f.base + '/')).headers.get('content-security-policy'),
    /frame-ancestors 'none'/,
  );
});
test('WhatsApp conserva acentos y funciones seleccionadas', () => {
  const data = valid(),
    message = quoteMessage(data),
    url = new URL('https://wa.me/527205080235?text=' + encodeURIComponent(message));
  assert.equal(url.searchParams.get('text'), message);
  assert.match(message, /Café de prueba/);
  assert.match(message, /WhatsApp, Catálogo/);
});
test('reporte privado escapa HTML y neutraliza fórmulas CSV', async (t) => {
  const f = await fixture(t),
    data = { ...valid(), name: '<img src=x onerror=alert(1)>', business: '=SUM(1,1)' };
  assert.equal((await send(f.base, data)).status, 201);
  const report = await exportRequests({
    dataDir: f.dataDir,
    outputDir: path.join(f.dir, 'exports'),
  });
  const html = await readFile(report.htmlPath, 'utf8');
  assert.equal(report.count, 1);
  assert.ok(html.includes('&lt;img'));
  assert.ok(!html.includes('<img src=x'));
  assert.match(csvCell('=SUM(1,1)'), /^"'/);
  assert.match(html, /Preparar seguimiento por WhatsApp/);
});
