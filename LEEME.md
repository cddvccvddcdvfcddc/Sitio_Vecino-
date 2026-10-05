# Sitio Vecino

Sitio completo para solicitar cotizaciones personalizadas. Todo el proyecto está en esta carpeta, sin dependencias que instalar ni servicios de pago.

## Abrir el sitio

1. Haz doble clic en **INICIAR SITIO.cmd**. Necesitas Node.js 22 o posterior (ya está disponible en esta computadora).
2. Abre **http://127.0.0.1:4173/**.
3. Mantén abierta la ventana del servidor. Para detenerlo, pulsa Ctrl+C en esa ventana.

Si informa que el puerto está ocupado, la vista previa podría estar abierta ya. No necesitas iniciar una segunda copia. Abrir `public/index.html` directamente o usar solamente un servidor estático no ejecuta la recepción del formulario.

## Ver las cotizaciones

Haz doble clic en **VER SOLICITUDES.cmd**. Genera y abre `exports/solicitudes.html`, una consulta privada con los datos recibidos y un botón que prepara el seguimiento por WhatsApp. El mensaje no se envía automáticamente. También genera `exports/solicitudes.csv`, que puedes abrir en Excel.

Vuelve a ejecutar el archivo cada vez que quieras actualizar el reporte. Las solicitudes originales se guardan en `data/solicitudes/`, una por archivo. No hay notificaciones automáticas de correo o WhatsApp. Revisa esta carpeta o el reporte para dar seguimiento.

El formulario confirma recepción después del guardado, valida en el navegador y en el servidor, conserva lo escrito si falla la conexión y evita duplicados al reintentar el mismo envío. Los demos no crean reservas reales ni guardan sus datos.

## Cambiar contenido

- `public/config.js`: número de WhatsApp, redes, correo, servicios, preguntas frecuentes y proyectos del portafolio. Los canales sin datos se ocultan.
- `public/index.html`: textos principales y estructura del sitio.
- `public/styles.css`: colores, tamaños, tipografía y presentación para celular.
- `public/assets/`: recursos optimizados que utiliza la página.
- `public/demos/`: las cinco demostraciones y sus interacciones.
- `public/privacidad.html`: aviso de privacidad, que debe completarse con los datos del responsable antes de publicar.
- `resources/`: originales de las imágenes y especificación del proyecto.
- `server.mjs`: servidor y recepción de solicitudes. Solo sirve el contenido de `public/`.
- `scripts/export-requests.mjs`: consulta privada y exportación a Excel.
- `tests/`: pruebas automatizadas; `qa/`: comprobaciones y datos ficticios de prueba.

Al modificar archivos públicos, recarga el navegador. Si modificas el servidor, reinícialo.

Para añadir un proyecto real al portafolio, agrega una entrada en `projects`, dentro de `public/config.js`, con `demo: false`, su `url` real y la ruta local de su captura en `image`. Completa `id`, `name`, `category`, `tags`, `color` e `ink`. La tarjeta mostrará “PROYECTO REAL” y abrirá ese enlace. Actualiza también el texto introductorio del portafolio cuando combines trabajos reales y demos. Los cinco ejemplos iniciales conservan su etiqueta DEMO.

## Antes de publicarlo

Esta entrega funciona localmente; **127.0.0.1 no es un enlace público**. Para recibir solicitudes de clientes por internet, hace falta publicar el servidor en un alojamiento con Node.js y disco persistente, o adaptar `saveQuote` a una base de datos persistente. No basta con subir `public/` a un alojamiento estático para que el formulario guarde solicitudes.

Pendientes concretos:

- Confirmar que **+52 7205080235** ya funciona en WhatsApp; Facebook antes no reconocía una cuenta activa. Los enlaces están preparados, pero no se verificó la recepción en esa cuenta.
- Añadir correo comercial e Instagram solo si quieres mostrarlos; no se han inventado.
- Elegir dominio y alojamiento. Configurar `PUBLIC_ORIGIN` con el origen HTTPS exacto, `HOST` según el alojamiento y `DATA_DIR` con una carpeta privada persistente. El archivo `.env.example` documenta estas variables; no se carga por sí solo.
- Completar la identidad legal y domicilio del responsable en el aviso de privacidad, definir el plazo operativo de conservación y revisar el aviso antes de recibir datos del público. El documento describe esta implementación; no certifica cumplimiento legal.
- Mantener privadas las carpetas `data/` y `exports/`, preparar copias de seguridad y eliminar solicitudes cuando dejen de ser necesarias.
- Establecer HTTPS y controles de tráfico del alojamiento. El límite básico actual es de 10 envíos por conexión IP cada 10 minutos y se reinicia al reiniciar el proceso. Detrás de un proxy podría agrupar visitantes; ajustarlo en el alojamiento antes de usarlo a gran escala.
- Configurar la URL real y las etiquetas canónicas/Open Graph del documento antes de indexarlo. No se incluyó un dominio ficticio ni una imagen social inventada.

## Comprobaciones

Ejecuta `node --test tests/server.test.mjs` para comprobar recepción, persistencia, reintentos simultáneos, validaciones, errores, privacidad de archivos, límites y exportaciones. Las pruebas usan carpetas temporales dentro de `qa/` y solo eliminan las carpetas que ellas mismas crean. Los datos reales no se tocan.

No se han añadido analítica, cookies publicitarias, paquetes comerciales ni precios. La foto del restaurante es una imagen original generada para un negocio ficticio. Los proyectos demo no se presentan como clientes reales.
