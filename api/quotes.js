import { validateQuote } from '../public/validation.js';
import { mailNotifier } from '../mailer.mjs';
// Versión para Vercel de /api/quotes. Vercel no tiene disco persistente:
// la solicitud se confirma solo cuando el correo de aviso se envió, y ese correo es su registro.
const limits = new Map(),
  maxRequests = 10,
  unavailable =
    'No pude recibir tu solicitud en este momento. Tus datos siguen en el formulario; intenta de nuevo o continúa por WhatsApp.';
async function readBody(req) {
  if (req.body !== undefined) return req.body;
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 20000) throw new Error('Solicitud demasiado grande.');
  }
  return JSON.parse(raw);
}
export default async function handler(req, res) {
  const reply = (status, data) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(data));
  };
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(405, { message: 'Usa el formulario para enviar tu solicitud.' });
  }
  const origin = req.headers.origin,
    allowed = process.env.PUBLIC_ORIGIN
      ? [new URL(process.env.PUBLIC_ORIGIN).origin]
      : [`https://${req.headers.host}`, `http://${req.headers.host}`];
  if ((origin && !allowed.includes(origin)) || req.headers['sec-fetch-site'] === 'cross-site')
    return reply(403, { message: 'Envía la solicitud desde el sitio de Sitio Vecino.' });
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || ''))
    return reply(415, { message: 'Formato de solicitud no compatible.' });
  // Límite básico por instancia; Vercel puede repartir visitas entre varias.
  const key = String(req.headers['x-forwarded-for'] || 'unknown')
      .split(',')[0]
      .trim(),
    now = Date.now();
  for (const [ip, b] of limits) if (b.expires <= now) limits.delete(ip);
  const bucket = limits.get(key) || { count: 0, expires: now + 600000 };
  bucket.count++;
  limits.set(key, bucket);
  if (bucket.count > maxRequests)
    return reply(429, {
      message:
        'Se enviaron varias solicitudes recientemente. Espera unos minutos o escríbeme por WhatsApp.',
    });
  let input;
  try {
    input = await readBody(req);
  } catch {
    return reply(400, { message: 'No fue posible leer la solicitud.' });
  }
  const { data, errors } = validateQuote(input);
  if (data.website)
    return reply(422, { message: 'No fue posible validar el formulario. Inténtalo de nuevo.' });
  if (Object.keys(errors).length)
    return reply(422, { message: 'Revisa los campos señalados.', errors });
  if (
    typeof input.requestId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)
  )
    return reply(422, {
      message: 'La referencia del formulario no es válida. Recarga la página e intenta otra vez.',
    });
  const notify = mailNotifier();
  if (!notify) {
    console.error('Faltan SMTP_USER y SMTP_PASS en las variables de entorno de Vercel.');
    return reply(503, { message: unavailable });
  }
  const id = input.requestId.toLowerCase();
  try {
    await notify({ id, createdAt: new Date().toISOString(), ...data });
  } catch (error) {
    console.error('No se pudo enviar la solicitud por correo:', error.message);
    return reply(503, { message: unavailable });
  }
  return reply(201, { ok: true, id });
}
