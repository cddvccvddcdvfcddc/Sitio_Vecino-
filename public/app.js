import { site, services, features, projects, faqs } from './config.js';
import { validateQuote, quoteMessage } from './validation.js';
const $ = (s) => document.querySelector(s);
// crypto.randomUUID solo existe en HTTPS o localhost; getRandomValues funciona siempre.
const newId = () =>
  crypto.randomUUID?.() ??
  '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16),
  );
const timeoutSignal = (ms) => {
  if (AbortSignal.timeout) return AbortSignal.timeout(ms);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
};
const iconPaths = {
  window: 'M3 5h18v14H3zM3 9h18M7 7h.01M10 7h.01',
  shop: 'M4 10v10h16V10M3 10l2-6h14l2 6M3 10h18M9 20v-6h6v6',
  file: 'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5',
  calendar: 'M4 5h16v16H4zM8 3v5M16 3v5M4 10h16M8 14h2M14 14h2',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  chat: 'M21 11a8 8 0 0 1-12 7l-6 3 2-6a8 8 0 1 1 16-4ZM8 10h8M8 13h5',
  briefcase: 'M3 7h18v14H3zM8 7V3h8v4M3 12h18M10 12v3h4v-3',
  spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z',
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${iconPaths[name] || iconPaths.spark}"/></svg>`;
$('#services-grid').innerHTML = services
  .map(
    (s) =>
      `<article class="service-card"><div class="service-icon">${icon(s.icon)}</div><h3>${s.title}</h3><p>${s.text}</p><a class="text-link service-interest" href="#cotizacion" data-service="${s.id}" aria-label="Me interesa: ${s.title}">Me interesa</a></article>`,
  )
  .join('');
$('#portfolio-grid').innerHTML = projects
  .map((p) => {
    const demo = p.demo !== false,
      url = p.url || `/demos/?proyecto=${p.id}`,
      image = p.image || `/assets/demo-${p.id}.webp`;
    const external = /^https?:\/\//.test(url) ? 'target="_blank" rel="noopener noreferrer"' : '';
    return `<article class="project-card"><a class="project-visual" style="--project-bg:${p.color};--project-ink:${p.ink}" href="${url}" ${external} aria-label="Ver proyecto ${demo ? 'demo ' : ''}${p.name}"><img class="project-screenshot" src="${image}" width="1200" height="675" alt="Captura del sitio ${demo ? 'demo ' : ''}${p.name}" loading="lazy" decoding="async"></a><div class="project-info"><div class="project-title-row"><h3>${p.name}</h3><span class="demo-pill">${demo ? 'DEMO' : 'PROYECTO REAL'}</span></div><p class="project-category">${p.category}</p><div class="project-tags">${p.tags.map((t) => `<span>${t}</span>`).join('')}</div><a class="text-link" href="${url}" ${external}>Ver proyecto</a></div></article>`;
  })
  .join('');
$('#benefits').innerHTML = [
  'Diseño para celular, tablet y computadora',
  'Atención directa, de principio a fin',
  'Soluciones a la medida de tu negocio',
  'Contacto sencillo por WhatsApp',
  'Sitios ligeros y rápidos',
  'Navegación clara y sencilla',
  'Acompañamiento durante el proyecto',
  'Espacio para crecer con nuevas funciones',
]
  .map(
    (t) =>
      `<div class="benefit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg><h3>${t}</h3></div>`,
  )
  .join('');
$('#projectType').insertAdjacentHTML(
  'beforeend',
  services.map((s) => `<option value="${s.id}">${s.title}</option>`).join('') +
    '<option value="orientacion">Aún no sé, necesito orientación</option>',
);
$('#feature-options').innerHTML = features
  .map(
    (f, i) =>
      `<label class="feature-chip"><input type="checkbox" name="features" value="${f}" id="feature-${i}"><span>${f}</span></label>`,
  )
  .join('');
$('#faq-list').innerHTML = faqs
  .map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`)
  .join('');
$('#year').textContent = new Date().getFullYear();
const whatsappUrl = (message) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
document.querySelectorAll('[data-whatsapp]').forEach((a) => {
  a.href = whatsappUrl(
    'Hola, Mario. Me interesa una página web para mi negocio. ¿Podemos platicar?',
  );
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
});
document.querySelectorAll('[data-facebook]').forEach((a) => {
  a.hidden = !site.facebook;
  a.href = site.facebook;
});
document.querySelectorAll('[data-email]').forEach((a) => {
  a.hidden = !site.email;
  a.href = `mailto:${site.email}`;
  a.textContent = site.email;
});
document.querySelectorAll('[data-instagram]').forEach((a) => {
  a.hidden = !site.instagram;
  a.href = site.instagram;
});
const menu = $('.menu-toggle');
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Abrir menú');
  $('#main-nav').classList.remove('is-open');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  $('#main-nav').classList.toggle('is-open', open);
});
$('#main-nav').addEventListener('click', (e) => {
  if (e.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menu.focus();
  }
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.site-header')) closeMenu();
});
document.querySelectorAll('[data-service]').forEach((a) =>
  a.addEventListener('click', () => {
    $('#quote-form').hidden = false;
    $('#quote-success').hidden = true;
    $('#projectType').value = a.dataset.service;
    $('#projectType').dispatchEvent(new Event('change', { bubbles: true }));
  }),
);
const form = $('#quote-form');
let submitting = false,
  requestId = newId();
const fields = [
  'name',
  'business',
  'phone',
  'email',
  'industry',
  'hasWebsite',
  'projectType',
  'budget',
  'description',
  'consent',
];
fields.forEach((key) => $('#' + key).setAttribute('aria-describedby', `${key}-error`));
function readForm() {
  const fd = new FormData(form);
  return Object.fromEntries([
    ...fields.filter((f) => f !== 'consent').map((key) => [key, fd.get(key) || '']),
    ['features', fd.getAll('features')],
    ['consent', fd.get('consent') === 'on'],
    ['website', fd.get('website') || ''],
  ]);
}
function showErrors(errors) {
  fields.forEach((key) => {
    $('#' + key).setAttribute('aria-invalid', String(Boolean(errors[key])));
    $('#' + key + '-error').textContent = errors[key] || '';
  });
  const summary = $('#form-errors');
  summary.hidden = Object.keys(errors).length === 0;
  summary.textContent =
    errors.form || errors.features || 'Revisa los campos marcados para poder enviar tu solicitud.';
}
// Borrador en este navegador: lo escrito sobrevive a recargar o a volver desde el aviso de privacidad.
const DRAFT_KEY = 'sitio-vecino:borrador',
  DRAFT_DAYS = 7;
function saveDraft() {
  try {
    const { consent, website, ...draft } = readForm();
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), draft }));
  } catch {
    /* Almacenamiento no disponible; el formulario funciona igual. */
  }
}
function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* Sin almacenamiento no hay nada que borrar. */
  }
}
function restoreDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (!saved) return;
    if (Date.now() - saved.savedAt > DRAFT_DAYS * 86400000) return clearDraft();
    for (const [key, value] of Object.entries(saved.draft)) {
      if (key === 'features')
        document
          .querySelectorAll('[name=features]')
          .forEach((el) => (el.checked = value.includes(el.value)));
      else if (fields.includes(key)) $('#' + key).value = value;
    }
    $('#description').dispatchEvent(new Event('input'));
  } catch {
    clearDraft();
  }
}
$('#description').addEventListener('input', () => {
  $('#char-count').textContent = `${$('#description').value.length} / 4000`;
});
restoreDraft();
form.addEventListener('input', (e) => {
  requestId = newId();
  saveDraft();
  const key = e.target.name;
  if (fields.includes(key)) {
    e.target.removeAttribute('aria-invalid');
    $('#' + key + '-error').textContent = '';
  }
});
form.addEventListener('change', () => {
  requestId = newId();
  saveDraft();
});
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (submitting) return;
  const { data, errors } = validateQuote(readForm());
  showErrors(errors);
  $('#submit-status').hidden = true;
  $('#fallback-whatsapp').hidden = true;
  if (Object.keys(errors).length) {
    const first = fields.find((key) => errors[key]);
    (first ? $('#' + first) : $('#form-errors')).focus();
    return;
  }
  submitting = true;
  $('#submit-quote').disabled = true;
  $('#submit-quote').textContent = 'Enviando tu solicitud…';
  const submittedId = requestId,
    submittedData = { ...data };
  try {
    const response = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...submittedData, requestId: submittedId }),
      signal: timeoutSignal(15000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (result.errors) showErrors(result.errors);
      throw new Error(
        result.message || 'No pude confirmar el envío. Intenta de nuevo o continúa por WhatsApp.',
      );
    }
    if (!result.ok || typeof result.id !== 'string')
      throw new Error('No pude confirmar que tu solicitud se haya guardado. Intenta otra vez.');
    $('#success-whatsapp').href = whatsappUrl(quoteMessage(submittedData));
    $('#request-reference').textContent = `Tu referencia: ${result.id.slice(0, 8).toUpperCase()}`;
    form.reset();
    $('#char-count').textContent = '0 / 4000';
    clearDraft();
    form.hidden = true;
    $('#quote-success').hidden = false;
    $('#quote-success').focus();
    $('#quote-success').scrollIntoView({
      block: 'center',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  } catch (error) {
    const status = $('#submit-status');
    status.hidden = false;
    status.classList.add('error-message');
    status.textContent =
      error.name === 'TimeoutError' || error.name === 'AbortError'
        ? 'El envío tardó más de lo esperado. Tus datos siguen aquí; puedes intentar de nuevo sin duplicar la solicitud.'
        : error instanceof TypeError
          ? 'No pude conectar para confirmar el envío. Tus datos siguen aquí. Revisa tu conexión, intenta otra vez o continúa por WhatsApp.'
          : error.message;
    $('#fallback-whatsapp').href = whatsappUrl(quoteMessage(submittedData));
    $('#fallback-whatsapp').hidden = false;
    status.setAttribute('tabindex', '-1');
    status.focus();
  } finally {
    submitting = false;
    $('#submit-quote').disabled = false;
    $('#submit-quote').textContent = 'Solicitar cotización';
  }
});
$('#new-request').addEventListener('click', () => {
  form.reset();
  clearDraft();
  showErrors({});
  $('#char-count').textContent = '0 / 4000';
  requestId = newId();
  form.hidden = false;
  $('#quote-success').hidden = true;
  $('#name').focus();
});
const requestedProject = new URLSearchParams(location.search).get('proyecto');
if (requestedProject) {
  const p = projects.find((p) => p.id === requestedProject);
  if (p && !$('#description').value) {
    $('#projectType').value = 'local';
    $('#description').value =
      `Me interesa una página para mi negocio con un estilo similar al demo ${p.name}. `;
    $('#description').dispatchEvent(new Event('input'));
  }
}
if (site.publicUrl) {
  try {
    const url = new URL(site.publicUrl);
    if (url.protocol === 'https:') {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = url.href;
      document.head.append(link);
      const og = document.createElement('meta');
      og.setAttribute('property', 'og:url');
      og.content = url.href;
      document.head.append(og);
    }
  } catch {
    /* No inventar un dominio. */
  }
}
// Preparar el formulario es una acción visible; este acceso nunca envía una solicitud.
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  try {
    Promise.resolve(
      document.modelContext.registerTool(
        {
          name: 'prepare_quote',
          title: 'Preparar una cotización de Sitio Vecino',
          description:
            'Selecciona el servicio y las funciones en el formulario visible. No rellena datos personales, no acepta el aviso y no envía la solicitud.',
          inputSchema: {
            type: 'object',
            properties: {
              projectType: { type: 'string', enum: [...services.map((s) => s.id), 'orientacion'] },
              features: {
                type: 'array',
                items: { type: 'string', enum: features },
                uniqueItems: true,
              },
            },
            required: ['projectType'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            if (submitting) throw new Error('Espera a que termine el envío actual.');
            if (
              !input ||
              typeof input !== 'object' ||
              ![...services.map((s) => s.id), 'orientacion'].includes(input.projectType) ||
              Object.keys(input).some((k) => !['projectType', 'features'].includes(k)) ||
              (input.features !== undefined &&
                (!Array.isArray(input.features) ||
                  input.features.some((f) => !features.includes(f))))
            )
              throw new Error('Selecciona un servicio y funciones válidos.');
            form.hidden = false;
            $('#quote-success').hidden = true;
            $('#projectType').value = input.projectType;
            document
              .querySelectorAll('[name=features]')
              .forEach((el) => (el.checked = (input.features || []).includes(el.value)));
            requestId = newId();
            $('#cotizacion').scrollIntoView({ behavior: 'instant' });
            $('#projectType').focus({ preventScroll: true });
            return {
              status: 'prepared',
              projectType: $('#projectType').value,
              features: [...document.querySelectorAll('[name=features]:checked')].map(
                (el) => el.value,
              ),
              submitted: false,
            };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
  } catch {
    /* Función opcional; el formulario funciona sin ella. */
  }
  addEventListener('pagehide', () => lifecycle.abort(), { once: true });
}
