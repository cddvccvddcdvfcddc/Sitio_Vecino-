import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { services } from '../public/config.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export function csvCell(value) {
  const text = String(value ?? '');
  return '"' + (/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replace(/"/g, '""') + '"';
}
export function followUp(record) {
  return `Hola, ${record.name}. Soy Mario de Sitio Vecino. Recibí tu solicitud para ${record.business}. Me gustaría hacerte unas preguntas rápidas para prepararte una propuesta de acuerdo con lo que necesita tu negocio.`;
}
export async function exportRequests({
  dataDir = process.env.DATA_DIR || path.join(root, 'data', 'solicitudes'),
  outputDir = path.join(root, 'exports'),
} = {}) {
  const files = await readdir(dataDir).catch((e) => {
    if (e.code === 'ENOENT') return [];
    throw e;
  });
  const requests = [];
  for (const name of files.filter((n) => /^[\da-f-]{36}\.json$/i.test(n)))
    requests.push(JSON.parse(await readFile(path.join(dataDir, name), 'utf8')));
  requests.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  await mkdir(outputDir, { recursive: true });
  const columns = [
    'Referencia',
    'Fecha',
    'Nombre',
    'Negocio',
    'WhatsApp',
    'Correo',
    'Giro',
    'Tipo de proyecto',
    'Presupuesto',
    'Funciones',
    'Descripción',
    'Seguimiento',
  ];
  const rows = requests.map((r) => [
    r.id,
    r.createdAt,
    r.name,
    r.business,
    r.phone,
    r.email,
    r.industry,
    services.find((s) => s.id === r.projectType)?.title || 'Orientación',
    r.budget,
    r.features.join(', '),
    r.description,
    followUp(r),
  ]);
  await writeFile(
    path.join(outputDir, 'solicitudes.csv'),
    '\uFEFF' + [columns, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n',
    'utf8',
  );
  const cards = requests
    .map((r) => {
      let number = r.phone.replace(/\D/g, '');
      if (number.length === 10) number = '52' + number;
      const link = `https://wa.me/${number}?text=${encodeURIComponent(followUp(r))}`;
      return `<article><p class="meta">${escapeHtml(new Date(r.createdAt).toLocaleString('es-MX'))} · ${escapeHtml(r.id.slice(0, 8).toUpperCase())}</p><h2>${escapeHtml(r.business)}</h2><p><strong>${escapeHtml(r.name)}</strong> · ${escapeHtml(r.phone)}${r.email ? ' · ' + escapeHtml(r.email) : ''}</p><dl><dt>Giro</dt><dd>${escapeHtml(r.industry)}</dd><dt>Proyecto</dt><dd>${escapeHtml(services.find((s) => s.id === r.projectType)?.title || 'Orientación')}</dd><dt>Presupuesto</dt><dd>${escapeHtml(r.budget || 'Por definir')}</dd><dt>Funciones</dt><dd>${escapeHtml(r.features.join(', ') || 'Por definir')}</dd><dt>Descripción</dt><dd class="description">${escapeHtml(r.description)}</dd></dl><a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Preparar seguimiento por WhatsApp</a><p class="meta">Revisa el número y el mensaje antes de enviarlo.</p></article>`;
    })
    .join('');
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Solicitudes · Sitio Vecino</title><style>body{font:16px/1.65 system-ui,sans-serif;background:#eff4f6;color:#082e49;margin:0}main{max-width:900px;margin:40px auto;padding:0 24px}h1{font-size:36px;letter-spacing:-1px}h2{margin:10px 0}article{background:#fff;border:1px solid #d1e0e4;border-radius:12px;padding:28px;margin:24px 0}a{display:inline-block;background:#08795b;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none}.meta{font-size:13px;color:#526574}dt{font-weight:700;margin-top:15px}dd{margin:0;overflow-wrap:anywhere}.description{white-space:pre-wrap}</style></head><body><main><p>SITIO VECINO · CONSULTA PRIVADA</p><h1>${requests.length} solicitud${requests.length === 1 ? '' : 'es'} recibida${requests.length === 1 ? '' : 's'}</h1><p>Generado el ${escapeHtml(new Date().toLocaleString('es-MX'))}. Vuelve a ejecutar “VER SOLICITUDES” para actualizar. Este archivo contiene datos de contacto: mantenlo fuera de la carpeta pública.</p>${cards || '<article><h2>Todavía no hay solicitudes.</h2><p>Los formularios recibidos aparecerán aquí después de actualizar este archivo.</p></article>'}</main></body></html>`;
  const htmlPath = path.join(outputDir, 'solicitudes.html');
  await writeFile(htmlPath, html, 'utf8');
  return { count: requests.length, htmlPath };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = await exportRequests();
    console.log(`${result.count} solicitudes. Abre: ${result.htmlPath}`);
  } catch (e) {
    console.error('No se pudieron preparar las solicitudes:', e.message);
    process.exitCode = 1;
  }
}
