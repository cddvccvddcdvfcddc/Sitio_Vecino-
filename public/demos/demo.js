import { projects } from '../config.js';
const id = new URLSearchParams(location.search).get('proyecto') || 'restaurante';
const p = projects.find((p) => p.id === id),
  app = document.querySelector('#demo-app');
if (!p) {
  app.innerHTML =
    '<main class="demo-wrap demo-error" id="demo-main"><h1>Este proyecto no está disponible.</h1><a class="demo-button" href="/#portafolio">Explorar otros proyectos</a></main>';
} else {
  document.title = `${p.name} · Proyecto demo de Sitio Vecino`;
  document.body.dataset.project = p.id;
  document.body.style.setProperty('--demo-bg', p.color);
  document.body.style.setProperty('--demo-ink', p.ink);
  const headings = {
    restaurante: 'El menú de la casa',
    barberia: 'Elige tu próximo corte',
    gimnasio: 'Una clase para cada ritmo',
    consultorio: 'Conoce la atención',
    tienda: 'Explora la colección',
  };
  const activities = {
    restaurante: 'Preparar una reservación de ejemplo',
    barberia: 'Elegir una cita de ejemplo',
    gimnasio: 'Probar una clase de ejemplo',
    consultorio: 'Preparar una consulta de ejemplo',
    tienda: 'Consultar un producto de ejemplo',
  };
  const quote = `/?proyecto=${p.id}#cotizacion`;
  document.querySelector('#demo-quote').href = quote;
  app.innerHTML = `<div class="demo-wrap"><header class="demo-nav"><a class="demo-logo" href="/demos/?proyecto=${p.id}">${p.name}</a><nav aria-label="Navegación del demo"><a href="#opciones">${p.id === 'restaurante' ? 'Menú' : p.id === 'tienda' ? 'Colección' : 'Servicios'}</a><a href="#experiencia">${p.id === 'tienda' ? 'Consulta' : 'Tu visita'}</a><a href="${quote}">Me gusta este sitio</a></nav></header><main id="demo-main"><section class="demo-hero"><div><p class="demo-kicker">${p.kicker}</p><h1>${p.title}</h1><p>${p.subtitle}</p><a class="demo-button" href="#opciones">${p.action}</a></div><aside class="demo-feature">${p.id === 'restaurante' ? '<img src="/assets/mesa-barrio.webp" width="1200" height="800" alt="Pasta con jitomate, ensalada fresca y pan artesanal sobre una mesa">' : `<div class="demo-feature-content"><span>HECHO PARA LO COTIDIANO</span><h2>${p.id === 'barberia' ? 'El detalle hace el estilo.' : p.id === 'gimnasio' ? 'Un paso más, a tu ritmo.' : p.id === 'consultorio' ? 'Una conversación más cercana.' : 'Diseño que te acompaña.'}</h2><p>${p.items[0][1]}</p></div>`}<div class="demo-caption">Concepto de diseño · ${p.category}</div></aside></section><section class="demo-section" id="opciones"><p class="demo-kicker">CONOCE LAS POSIBILIDADES</p><h2>${headings[p.id]}</h2><div class="demo-cards">${p.items.map(([name, desc], i) => `<article class="demo-card"><span>0${i + 1}</span><h3>${name}</h3><p>${desc}</p><button type="button" data-item="${i}">${p.id === 'tienda' ? 'Consultar este producto' : 'Elegir esta opción'}</button></article>`).join('')}</div></section><section class="demo-section" id="experiencia"><p class="demo-kicker">PRUEBA LA EXPERIENCIA</p><h2>${activities[p.id]}</h2><div class="demo-interaction"><p>Explora cómo funcionaría esta interacción en tu página. Esta demostración no guarda datos, no reserva horarios y no envía mensajes.</p><form class="demo-form" id="demo-form"><label>Selecciona una opción<select id="demo-option" required>${p.items.map(([n], i) => `<option value="${i}">${n}</option>`).join('')}</select></label>${p.id === 'tienda' ? '<label>Cantidad de ejemplo<input type="number" id="demo-quantity" value="1" min="1" max="99" required></label>' : '<label>Fecha de ejemplo<input type="date" id="demo-date" required></label>'}<button class="demo-button" type="submit">Ver resumen de ejemplo</button><p class="demo-result" id="demo-result" role="status" hidden></p></form></div></section></main><footer class="demo-footer"><span>${p.name} · Negocio ficticio, creado por Sitio Vecino</span><a href="${quote}">Quiero una página para mi negocio</a></footer></div>`;
  const date = document.querySelector('#demo-date');
  if (date) {
    const today = new Date(),
      min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    date.min = min;
    date.value = min;
  }
  document.querySelectorAll('[data-item]').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelector('#demo-option').value = b.dataset.item;
      document.querySelector('#experiencia').scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
      document.querySelector('#demo-option').focus({ preventScroll: true });
    }),
  );
  document.querySelector('#demo-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const choice = p.items[Number(document.querySelector('#demo-option').value)][0],
      result = document.querySelector('#demo-result');
    result.hidden = false;
    result.textContent = `Ejemplo preparado: ${choice}${date ? ` para el ${new Date(date.value + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}` : ` · cantidad: ${document.querySelector('#demo-quantity').value}`}. Es solo una demostración; no se realizó ninguna solicitud real.`;
  });
}
