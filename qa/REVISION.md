# Revisión de Sitio Vecino · 5 de octubre de 2026

## Pruebas automáticas

10 pruebas pasadas con `node --test tests/server.test.mjs`:

1. Recepción real y persistencia después de reiniciar el servidor.
2. Cuatro envíos simultáneos con la misma referencia crean una sola solicitud; otro contenido no sobrescribe la original.
3. Validación de teléfono, correo, descripción, funciones y consentimiento.
4. Campos opcionales vacíos y rechazo de formatos de datos incorrectos.
5. Rechazo de origen ajeno, contenido no JSON, JSON dañado y solicitudes demasiado grandes.
6. Campo antispam y límite de envíos.
7. Error de almacenamiento devuelve un error, nunca una confirmación falsa.
8. Rutas públicas disponibles y archivos privados inaccesibles por HTTP.
9. Mensaje de WhatsApp con acentos y funciones seleccionadas.
10. Reporte HTML con texto escapado y CSV con fórmulas neutralizadas.

## Revisión en navegador

- Página principal comprobada a 320, 390, 768 y 1280 píxeles de ancho; sin desbordamiento horizontal.
- Menú completo de ocho enlaces, en celular y escritorio, con cierre al elegir sección.
- Acordeón de preguntas y selección automática del servicio “Catálogo de productos”.
- Todos los enlaces internos apuntan a secciones existentes; un único título principal y sin imágenes rotas detectadas.
- Envío vacío: errores junto a los campos, foco en el primer campo y ninguna confirmación falsa.
- Envío ficticio: confirmación visible, archivo JSON verificado en disco y mensaje de WhatsApp con negocio, giro y funciones.
- El registro ficticio se trasladó a `qa/solicitudes-prueba/`; no aparece entre las solicitudes reales. Su reporte de ejemplo está en `qa/reporte-prueba/`.
- Los cinco demos se probaron en escritorio y celular. La segunda opción de cada uno se refleja en el resumen; no se realizan citas, reservas ni mensajes reales.
- Preparación opcional por WebMCP: servicio y funciones correctos en el formulario; no acepta el aviso ni envía datos. Una entrada inválida se rechaza sin modificar la selección.
- Sin errores de consola observados durante la revisión final.

## Límites de la verificación

La revisión utiliza el navegador integrado de Codex con tamaños de pantalla simulados; no sustituye pruebas en todos los teléfonos físicos. Se verificó la construcción de enlaces de WhatsApp, no la activación de la cuenta ni la recepción de mensajes. No se publicó el sitio, no se probó un dominio externo y no se enviaron mensajes a clientes.

Los archivos PNG de esta carpeta son capturas de revisión. Los recursos que se muestran en el sitio están optimizados en `public/assets/`.
