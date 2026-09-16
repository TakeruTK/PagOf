# Carolina Alfaro · Orfebrería

Sitio de presentación en español con galería y administración protegida.

## Uso
- `/`: portada, galería, ficha de pieza con fotos y comentarios, contacto por Instagram.
- `/admin`: entrar con una cuenta autorizada, crear productos o trabajos, subir hasta 8 fotografías, editar historias, precio en CLP, materiales y disponibilidad. Guardar como borrador o publicar.
- Los borradores y sus fotos requieren autorización del servidor. Los visitantes solo ven publicaciones.
- El acceso a esta propuesta alojada es privado. El correo de Carolina debe incorporarse a `ADMIN_EMAILS` antes de entregarle la administración; no se presume su dirección.

## Contenido por confirmar
Instagram no permitió una consulta automatizada. No se han inventado precios, biografía, ubicación ni productos de Carolina. Las fotografías actuales son ilustrativas, identificadas en pantalla y acreditadas en la galería. Reemplazar con fotos y textos autorizados antes del lanzamiento de la marca. El contacto lleva al Instagram indicado por el usuario.

## Desarrollo
Node 22.13 o superior. Con npm instalado: `npm run install:ci`, `npm run dev`. En esta máquina también se puede ejecutar `node scripts/run-framework.mjs dev --hostname 127.0.0.1` con dependencias ya instaladas. `npm run build` produce el Worker para Sites.

Los datos se guardan en D1 (`DB`) y las fotos en R2 (`BUCKET`). La identidad se obtiene del inicio de sesión de la plataforma. `ADMIN_EMAILS` contiene la lista separada por comas de correos autorizados y se configura como secreto de Sites. No se incluyen contraseñas en el código. La identidad de prueba `seedy@sites.test` funciona exclusivamente en desarrollo local.

Migraciones: esquema en `db/schema.ts`, cambios generados con `npm run db:generate`. Las migraciones de producción se aplican al publicar. Para una base local vacía, después del build: `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_grey_champions.sql`.

## Comprobaciones realizadas
Compilación y TypeScript sin errores. Prueba de subida, creación de borrador, lectura privada, publicación, edición, retiro y eliminación. Rechazo de escrituras sin autorización y de otro origen. Revisión visual móvil y escritorio. Herramienta WebMCP de apertura de formulario validada con entrada válida e inválida.

## Fotografías de referencia
Licencia Pexels: https://www.pexels.com/license/
- Maryam: https://www.pexels.com/photo/golden-ring-under-cloth-17368718/
- Alex Lo: https://www.pexels.com/photo/ring-with-gem-on-stone-16266429/
- Sara Er: https://www.pexels.com/photo/people-in-a-workshop-18425415/

No se incluyen pasarela de pagos, envíos ni comentarios públicos de visitantes: el flujo solicitado es mostrar trabajos con fotos y comentarios de su autora, con consulta por Instagram.
