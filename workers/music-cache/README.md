# Música continua y caché de Cloudflare

El reproductor vive junto a `ApplicationLayout`, fuera de sus wrappers dependientes de la ruta. Cambiar de disco, volver al archivo, buscar o entrar al feed conserva el mismo elemento de audio y su cola. Cerrar el reproductor o cerrar sesión conserva la limpieza existente.

## Diseño

```mermaid
flowchart LR
  P[Reproductor persistente] --> S[Next.js: verifica usuario y RLS]
  S --> U[URL firmada, máximo 1 hora]
  U --> W[Worker: valida firma en cada petición]
  W --> C[Cache API: audio por clave R2]
  C -->|MISS| R[Bucket R2 privado]
  Q[Búsqueda y autocompletado] --> V[Next.js: identidad verificada]
  V --> K[Hash de usuario, consulta y límite]
  K --> J[Worker: JSON privado, 30 segundos]
  J -->|MISS o fallo| D[Supabase con sesión y RLS]
  D --> J
  I[Portadas] --> F[Cloudflare Images existente]
```

| Dato | Clave y duración | Acceso e invalidación |
| --- | --- | --- |
| Audio | Clave R2; 1 hora en el centro de datos de Cloudflare | HMAC SHA-256 y expiración se verifican **antes** de consultar caché. Cada nueva URL se emite después de RLS. |
| Búsqueda completa y autocompletado | SHA-256 de usuario verificado (o invitado), consulta y límite; 30 s | Solo Next.js puede firmar lecturas y escrituras. Un usuario nunca reutiliza resultados de otro. No se guardan errores de DB ni resultados tras fallo de autenticación. |
| Portadas | ID y variante existentes (`avatar`, `thumbnail`, `public`) | Entrega y caché de Cloudflare Images, sin duplicar archivos. |

Se usa **Cache API** para almacenar respuestas de búsquedas calculadas por Next.js bajo RLS y para comprobar autorización en cada petición de audio. El endpoint exterior devuelve `private, no-store`; solo el almacenamiento explícito del Worker comparte bytes. No habilitar caché pública delante del Worker ni hacer público el bucket. Las firmas de búsquedas no llegan al navegador.

El audio se transmite como stream, admite GET, HEAD y rangos de bytes (incluidos sufijos y respuestas 416). En un MISS se lee R2 y se llena la caché en segundo plano con un stream independiente para evitar acumular en RAM los bytes pendientes de un oyente lento. Esa primera lectura puede suponer dos GET a R2. Solo se cachean objetos de hasta 100 MiB; los mayores siguen sirviéndose desde R2. No se modifica ningún objeto del bucket.

La caché es local al centro de datos, no promete persistencia ni tiered caching. Una búsqueda conserva como máximo 30 s en el Worker, además de la memoria de 60 s que ya usa el autocompletado. La autorización de reproducción siempre se vuelve a comprobar al emitir una firma. Una firma ya emitida mantiene su ventana máxima de 1 hora, como las firmas R2 anteriores; vaciar la cola no revoca copias de esa firma. No hay reproducción offline ni continuidad después de cerrar o recargar la pestaña.

## Configuración y activación

Cuenta: `97e7fd9a393f52945ed697222f9ec3e2`; bucket existente: `yebaam-music-archive`; Worker publicado: `yebaam-music-cache`. Origen: `https://yebaam-music-cache.yebaam19.workers.dev`. No requiere migración de DB, cambios DNS ni un bucket público.

El Worker ya tiene el binding `MUSIC` y `MUSIC_CACHE_SECRET` cifrado. La app local está conectada mediante `.env.local`. En Vercel, proyecto `yebaam`, ambas variables están configuradas para **Production**: `MUSIC_CACHE_ORIGIN` como Config y `MUSIC_CACHE_SECRET` como Secret oculto. El secreto local está en el archivo ignorado `workers/music-cache/.dev.vars`; no sustituirlo sin actualizar ambos destinos.

Se conservan los logs de errores del código, que no incluyen URLs. Los logs automáticos de invocaciones y las trazas están desactivados para no registrar firmas. `redact_query_string` está preparado en Wrangler para futuros despliegues; el panel no ofrecía este control.

1. Dar al mecanismo de despliegue acceso de edición de Workers Scripts para esta cuenta y acceso a su subdominio `workers.dev`. No cambiar permisos de lectura pública del bucket.
2. Reutilizar el secreto configurado. Solo en una instalación nueva, generar al menos 32 bytes aleatorios y guardarlos como `MUSIC_CACHE_SECRET` en un archivo local ignorado `.dev.vars` con permisos 600 y en el gestor de secretos del hosting de Next.js. No pegarlo en terminales compartidas, historial ni documentación.
3. Validar desde la raíz: `pnpm music-cache:check`.
4. Publicar con `pnpm exec wrangler deploy -c workers/music-cache/wrangler.jsonc --secrets-file workers/music-cache/.dev.vars`.
5. Configurar `MUSIC_CACHE_ORIGIN` en Next.js con el origen HTTPS devuelto por el despliegue, sin rutas, y el mismo `MUSIC_CACHE_SECRET`. Ambas variables son **server-only**.
6. Probar un audio firmado: primer GET/Range `MISS`, siguiente `HIT`, seek correcto, petición sin firma o vencida `403`, búsqueda repetida `200` y otra identidad sin ese resultado. Publicar la app mediante el flujo habitual del proyecto.

Sin ambas variables, Next.js continúa firmando URLs R2 y consultando Supabase. Las búsquedas toleran fallos del Worker con timeout de 800 ms por operación. Para retirar el Worker del camino de audio, vaciar `MUSIC_CACHE_ORIGIN` y volver a publicar Next.js; las URLs ya cargadas seguirán vigentes hasta que se renueven o se vuelva a abrir el reproductor. No hay conmutación automática a R2 si falla un Worker ya activado.

## Verificación de esta entrega (3 de octubre de 2026)

- La prueba de navegación falló antes del arreglo al pasar de un álbum a `/musica` (el `<audio>` desaparecía). Después conserva audio, posición, cola y reproducción al navegar por archivo, búsqueda, otro álbum, feed y chat. Cerrar el reproductor sigue liberando el recurso.
- Pruebas del Worker sobre workerd/Miniflare: MISS→HIT, rangos, HEAD, 416, firma expirada/manipulada/ausente incluso con caché caliente, separación por método, límite de JSON y búsqueda inexistente.
- Chrome con sesión abierta y audio real de R2: salida del disco al archivo conservó reproducción (141.14→142.31 s); búsqueda de Tito Schipa conservó la canción Cuesta Abajo (156.76 s); se abrió otro álbum con la barra todavía activa. Chrome también mostró la pestaña musical no seleccionada con el indicador «Audio playing». La prueba automática adicional cubre `visibilitychange` a hidden/visible sin pausa ni recarga.
- TypeScript, lint de archivos modificados y build de producción aprobaron. Build ejecutado con `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` y `SENTRY_PROJECT` vacíos para no subir artefactos.
- La suite global reportó 3 fallos previos: dos pruebas de ciudades esperan 8 registros pero la DB tiene 9; una prueba de login omite el parámetro `redirect` que ya devuelve el formulario. El lint global reportó 264 errores y 342 avisos ajenos a los archivos modificados.
- **Worker remoto publicado y probado.** El token de terminal y el MCP rechazaron escrituras con HTTP 403; se publicó mediante la sesión autorizada del panel. Audio real: primer rango de 1024 bytes `206/MISS`, segundo rango `206/HIT`, HEAD `200/HIT`, acceso sin firma o vencido `403`. Búsqueda de prueba: `404` inicial, escritura `204`, lectura `200`, acceso sin firma `403`. Las respuestas externas mantuvieron `private, no-store`.
- Chrome, con caché activada en la app local: «Un Viejo Amor» usó `yebaam-music-cache.yebaam19.workers.dev`, avanzó de 5.15 a 17.91 s al salir del álbum y buscar «Carlos Gardel», con `paused=false`, `readyState=4` y sin error de audio. Cerrar el reproductor retiró sus controles correctamente.
- Las 69 pruebas enfocadas de la app y las 3 pruebas del Worker pasaron. No se modificaron objetos R2 ni datos de Supabase durante las pruebas de caché.
- **Vercel Production activado.** Se agregaron ambas variables y se redesplegó el commit existente `b57fb15`. [Despliegue 9YiqJwVCB](https://vercel.com/yebaam19-3767s-projects/yebaam/9YiqJwVCBw2yeGaGNobZ9pB65dbJ) quedó `Ready` y asignado a `www.yebaam.com`. Chrome reprodujo «Un Viejo Amor» desde el Worker: 6.23→22.61 s al salir del álbum y buscar «Carlos Gardel», con `paused=false`, `readyState=4` y sin error de audio. La búsqueda devolvió el artista y su álbum.

Referencias: [Cache API y rangos](https://developers.cloudflare.com/workers/runtime-apis/cache/), [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/), [Workers Cache y diferencias con Cache API](https://developers.cloudflare.com/workers/cache/limitations/).
