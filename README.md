# Carolina Alfaro · Orfebrería

Sitio de presentación en español con galería y administración protegida.

## Uso
- `/`: portada, galería, ficha de pieza con fotos y comentarios, contacto por Instagram.
- `/admin`: entrar con usuario y contraseña, crear productos o trabajos, subir hasta 8 fotografías, editar historias, precio en CLP, materiales y disponibilidad. Guardar como borrador o publicar.
- Los borradores y sus fotos requieren autorización del servidor. Los visitantes solo ven publicaciones.
- El acceso a esta propuesta alojada sigue siendo privado en Sites. Dentro del sitio, el taller requiere sus propias credenciales; la cuenta de ChatGPT no concede acceso administrativo automáticamente.
- En el primer ingreso, la contraseña temporal de configuración debe reemplazarse por una propia antes de poder usar el taller; luego puede cambiarse de nuevo desde el ícono de llave junto a "Cerrar sesión".

## Despliegue autohospedado (Docker)
Pensado para correr en un servidor propio (por ejemplo, un VPS) detrás de un proxy reverso con TLS (Caddy o Nginx) que termine HTTPS y reenvíe solo el tráfico de ese dominio al contenedor — el `docker-compose.yml` publica el puerto únicamente en `127.0.0.1`. Cuando se tenga el dominio de la clienta, `Caddyfile.example` y `docker-compose.caddy.example.yml` traen una config lista (HTTPS automático vía Let's Encrypt) — solo falta copiar `Caddyfile.example` a `Caddyfile`, reemplazar el dominio de ejemplo por el real, y levantar con `docker compose -f docker-compose.yml -f docker-compose.caddy.example.yml up -d`. Pasos:
1. Generar la credencial inicial: `node scripts/generate-admin-hash.mjs` (o pasar una contraseña propia como argumento) y guardar la línea `ADMIN_PASSWORD_HASH=...` en un `.env` local, **no versionado**, junto a `ADMIN_USERNAME` y `SESSION_COOKIE_SECURE=true`.
2. `docker compose build && docker compose up -d`. Los datos (piezas y fotos) quedan en el volumen nombrado `wrangler-state`; conviene respaldarlo periódicamente (no hay otra copia).
3. La primera persona que entre con esa contraseña temporal debe reemplazarla de inmediato por una propia — el panel lo exige antes de mostrar el taller.
4. El contenedor corre como usuario sin privilegios, con límites de memoria/CPU y sin capacidades adicionales; el healthcheck usa `/api/health`.

## Contenido por confirmar
Instagram no permitió una consulta automatizada. No se han inventado precios, biografía, ubicación ni productos de Carolina. Las fotografías actuales son ilustrativas, identificadas en pantalla y acreditadas en la galería. Reemplazar con fotos y textos autorizados antes del lanzamiento de la marca. El contacto lleva al Instagram indicado por el usuario.

## Desarrollo
Node 22.13 o superior. Con npm instalado: `npm run install:ci`, `npm run dev`. En esta máquina también se puede ejecutar `node scripts/run-framework.mjs dev --hostname 127.0.0.1` con dependencias ya instaladas. `npm run build` produce el Worker para Sites.

Los datos se guardan en D1 (`DB`) y las fotos en R2 (`BUCKET`). Configurar `ADMIN_USERNAME` y `ADMIN_PASSWORD_HASH` en `.env` local (nunca versionado) y como valores de entorno en el servidor — generar el hash con `node scripts/generate-admin-hash.mjs`. Ese valor es solo la credencial de arranque: en el primer ingreso se exige reemplazarla por una propia, que queda guardada en D1 (tabla `admin_credentials`) y desde ahí manda sobre la del entorno. El hash usa el formato `pbkdf2-sha256:<iteraciones>:<sal hexadecimal de 16 bytes>:<hash hexadecimal de 32 bytes>` (600.000 iteraciones por defecto); PBKDF2 recibe la sal como texto UTF-8. No se incluyen contraseñas en el código ni en el navegador. `ADMIN_EMAILS` se conserva por compatibilidad de configuración, pero ya no autoriza el taller.

Las sesiones duran 8 horas, usan una cookie HttpOnly y SameSite=Strict (Secure en producción), y se revocan en D1 al cerrar sesión. Cambiar la contraseña invalida las sesiones anteriores. Todas las escrituras comprueban el origen, y el inicio de sesión limita a 8 intentos por dirección en 15 minutos (por `cf-connecting-ip` si hay Cloudflare delante, o por el `x-forwarded-for`/`x-real-ip` del proxy propio en autohospedado). El usuario de desarrollo de Sites tampoco omite este acceso.

Migraciones: esquema en `db/schema.ts`, cambios generados con `npm run db:generate`. Las migraciones de producción se aplican al publicar (o las ejecuta `scripts/docker-entrypoint.sh` en el arranque del contenedor autohospedado). Para una base local vacía, después del build, aplicar en orden `drizzle/0000_grey_champions.sql`, `0001_common_shriek.sql` y `0002_foamy_prodigy.sql` con: `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/<archivo>.sql`.

## Comprobaciones realizadas
Compilación y TypeScript sin errores. Prueba de subida, creación de borrador, lectura privada, publicación, edición, retiro y eliminación. Rechazo de escrituras sin autorización y de otro origen. Revisión visual móvil y escritorio. Herramienta WebMCP de apertura de formulario validada con entrada válida e inválida.

## Fotografías de referencia
Licencia Pexels: https://www.pexels.com/license/
- Maryam: https://www.pexels.com/photo/golden-ring-under-cloth-17368718/
- Alex Lo: https://www.pexels.com/photo/ring-with-gem-on-stone-16266429/
- Sara Er: https://www.pexels.com/photo/people-in-a-workshop-18425415/

No se incluyen pasarela de pagos, envíos ni comentarios públicos de visitantes: el flujo solicitado es mostrar trabajos con fotos y comentarios de su autora, con consulta por Instagram.
