import tls from 'node:tls';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { services } from './public/config.js';
const b64 = (text) => Buffer.from(text, 'utf8').toString('base64');
const encodedWord = (text) => `=?UTF-8?B?${b64(text)}?=`;
// Cliente SMTP mínimo (TLS directo, AUTH LOGIN). Suficiente para Gmail con contraseña de aplicación.
export function sendMail({ user, pass, to, subject, text, replyTo, host, port }) {
  host ||= 'smtp.gmail.com';
  const message = [
    `From: ${encodedWord('Sitio Vecino')} <${user}>`,
    `To: <${to}>`,
    ...(replyTo ? [`Reply-To: <${replyTo}>`] : []),
    `Subject: ${encodedWord(subject)}`,
    `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${randomUUID()}@sitiovecino>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    ...b64(text).match(/.{1,76}/g),
  ].join('\r\n');
  const steps = [
    ['220', 'EHLO sitiovecino'],
    ['250', 'AUTH LOGIN'],
    ['334', b64(user)],
    ['334', b64(pass)],
    ['235', `MAIL FROM:<${user}>`],
    ['250', `RCPT TO:<${to}>`],
    ['250', 'DATA'],
    ['354', message + '\r\n.'],
    ['250', 'QUIT'],
  ];
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port: port || 465, servername: host });
    let buffer = '',
      step = 0;
    socket.setEncoding('utf8');
    socket.setTimeout(15000, () => socket.destroy(new Error('El servidor de correo no respondió.')));
    socket.on('data', (chunk) => {
      buffer += chunk;
      let reply;
      while ((reply = buffer.match(/^(?:\d{3}-.*\r\n)*(\d{3}) (.*)\r\n/))) {
        buffer = buffer.slice(reply[0].length);
        if (step >= steps.length) return socket.end();
        const [expected, command] = steps[step++];
        if (reply[1] !== expected) {
          socket.destroy();
          return reject(new Error(`Correo rechazado (${reply[1]}): ${reply[2]}`));
        }
        socket.write(command + '\r\n');
        if (step === steps.length) resolve();
      }
    });
    socket.on('error', reject);
    socket.on('close', () => reject(new Error('La conexión de correo se cerró antes de terminar.')));
  });
}
export function quoteEmail(record) {
  const project =
      services.find((s) => s.id === record.projectType)?.title || 'Necesita orientación',
    digits = record.phone.replace(/\D/g, ''),
    hasWebsite = { no: 'Todavía no', si: 'Sí, quiere mejorarla', proceso: 'Está en proceso' };
  return {
    subject: `Nueva cotización: ${record.business.slice(0, 40)}`,
    replyTo: /^[\w.+-]+@[\w.-]+$/.test(record.email) ? record.email : undefined,
    text: [
      `Nombre: ${record.name}`,
      `Negocio: ${record.business}`,
      `Giro: ${record.industry}`,
      `WhatsApp: ${record.phone}`,
      `Abrir chat: https://wa.me/${digits.length === 10 ? '52' + digits : digits}`,
      `Correo: ${record.email || 'No lo indicó'}`,
      `¿Ya tiene página?: ${hasWebsite[record.hasWebsite]}`,
      `Tipo de proyecto: ${project}`,
      `Presupuesto: ${record.budget || 'No lo indicó'}`,
      `Funciones: ${record.features.join(', ') || 'Ninguna seleccionada'}`,
      '',
      'Descripción:',
      record.description,
      '',
      `Referencia: ${record.id.slice(0, 8).toUpperCase()} · ${record.createdAt}`,
    ].join('\r\n'),
  };
}
// Devuelve la función de aviso, o null si faltan SMTP_USER y SMTP_PASS.
export function mailNotifier(env = process.env) {
  const user = env.SMTP_USER?.trim(),
    pass = env.SMTP_PASS?.replace(/\s/g, '');
  if (!user || !pass) return null;
  const to = env.NOTIFY_TO?.trim() || user;
  return (record) => sendMail({ user, pass, to, ...quoteEmail(record) });
}
export function loadEnv(root) {
  try {
    process.loadEnvFile(path.join(root, '.env'));
  } catch {
    /* Sin archivo .env se usan las variables del entorno. */
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  loadEnv(path.dirname(fileURLToPath(import.meta.url)));
  const notify = mailNotifier();
  if (!notify) {
    console.error('Falta configurar SMTP_USER y SMTP_PASS en el archivo .env. Consulta LEEME.md.');
    process.exitCode = 1;
  } else
    notify({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      name: 'Prueba de Sitio Vecino',
      business: 'Correo de prueba',
      industry: 'Prueba',
      phone: '55 1234 5678',
      email: '',
      hasWebsite: 'no',
      projectType: 'informativa',
      budget: '',
      features: [],
      description: 'Si lees este correo, los avisos de solicitudes ya funcionan.',
    }).then(
      () => console.log('Correo de prueba enviado. Revisa tu bandeja de entrada.'),
      (error) => {
        console.error('No se pudo enviar el correo de prueba:', error.message);
        process.exitCode = 1;
      },
    );
}
