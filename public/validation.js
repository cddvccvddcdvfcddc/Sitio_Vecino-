import { services, features } from './config.js';
const max = {
  name: 100,
  business: 150,
  phone: 25,
  email: 254,
  industry: 120,
  hasWebsite: 20,
  projectType: 40,
  budget: 100,
  description: 4000,
  website: 200,
};
export function validateQuote(input) {
  const errors = {},
    data = {};
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return { errors: { form: 'La solicitud no tiene un formato válido.' }, data };
  for (const [key, limit] of Object.entries(max)) {
    if (input[key] !== undefined && typeof input[key] !== 'string') {
      errors[key] = 'Usa texto para este campo.';
      data[key] = '';
      continue;
    }
    data[key] = (input[key] || '').trim();
    if (data[key].length > limit) errors[key] = `Usa como máximo ${limit} caracteres.`;
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(data[key]))
      errors[key] = 'El texto contiene caracteres no admitidos.';
  }
  for (const [key, label] of [
    ['name', 'tu nombre'],
    ['business', 'el nombre del negocio'],
    ['industry', 'el giro de tu negocio'],
  ])
    if (!data[key]) errors[key] = `Escribe ${label}.`;
  if (
    !data.phone ||
    !/^\+?[\d\s().-]+$/.test(data.phone) ||
    data.phone.replace(/\D/g, '').length < 10 ||
    data.phone.replace(/\D/g, '').length > 15
  )
    errors.phone = 'Escribe un teléfono de 10 a 15 dígitos, con clave de país si corresponde.';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = 'Revisa el formato de tu correo electrónico.';
  if (!['no', 'si', 'proceso'].includes(data.hasWebsite))
    errors.hasWebsite = 'Selecciona si ya tienes página web.';
  if (![...services.map((s) => s.id), 'orientacion'].includes(data.projectType))
    errors.projectType = 'Selecciona el tipo de proyecto.';
  if (data.description.length < 20)
    errors.description = 'Cuéntame un poco más: escribe al menos 20 caracteres.';
  if (
    !Array.isArray(input.features) ||
    input.features.length > features.length ||
    input.features.some((f) => typeof f !== 'string' || !features.includes(f))
  )
    errors.features = 'Revisa las funciones seleccionadas.';
  data.features = [
    ...new Set(
      Array.isArray(input.features) ? input.features.filter((f) => features.includes(f)) : [],
    ),
  ];
  data.consent = input.consent === true;
  if (!data.consent) errors.consent = 'Necesito tu autorización para responder a la solicitud.';
  return { data, errors };
}
export function quoteMessage(data) {
  const project = services.find((s) => s.id === data.projectType)?.title || 'una página web';
  return `Hola, soy ${data.name || 'una persona interesada'}. Contacté a Sitio Vecino desde su página web. Mi negocio es ${data.business || 'un negocio'}${data.industry ? ` (${data.industry})` : ''} y me interesa ${project.toLowerCase()}.${data.features?.length ? ` Necesito: ${data.features.join(', ')}.` : ''}${data.description ? ` Mi idea: ${data.description.slice(0, 700)}` : ''}`;
}
