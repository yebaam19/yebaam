# Perfil institucional de Comunidades

Fuente funcional: `perfil-de-comunidades.pdf`, versión 1.0, 15 páginas.
Estado a 2026-10-08: implementación en curso; no se considera terminado el PDF.

## Arquitectura

El perfil amplía `communities`; no introduce otra entidad de organización ni duplica
autenticación, chat, foro o artículos. Next.js conserva App Router y los wrappers de
Supabase. Las consultas viven en `features/communities/server`, las mutaciones en
`actions`, la validación en `schemas` y la interfaz en `components`.

Supabase Postgres es la autoridad para contenido y permisos. RLS se aplica también
a llamadas directas a PostgREST. Los medios se almacenan en Cloudflare Images y
Stream; los documentos, en R2. Todo nuevo upload debe pasar por `uploadService`.
La base de datos guarda IDs/UIDs/keys, sin URLs de entrega ni URLs firmadas.

### Implementado en esta fase

- `community_profile_roles`: concesiones explícitas del propietario para el perfil
  institucional: administrador, editor o moderador; edición de planes optativa.
  Requiere membresía activa para ejercer una concesión. El propietario conserva
  autoridad. No se confía en el rol legado de `community_members` para conceder
  estos nuevos permisos: su política actual permite inserciones propias y no
  demuestra que un rol elevado haya sido concedido por el propietario.
- `community_sections`: identidad funcional estable, título, orden y visibilidad
  por organización. Tipos: acerca de, reglas, gobierno, economía y dirigentes.
  Las secciones nacen ocultas. Solo propietario/administrador cambia configuración.
- `community_plan_axes` y `community_plan_points`: registros independientes para
  reglas y ambos planes, con borradores, orden y control de versión. No hay límite
  funcional al número de ejes o puntos. Cada lectura devuelve hasta 30 registros,
  con cursor compuesto `(position, id)` e índices por organización y padre.
- Claves foráneas compuestas impiden enlazar padres de otra organización/sección.
  Identidad y sección son inmutables. Los puntos pueden moverse entre ejes de su
  misma sección mediante una RPC transaccional con bloqueo por sección.
- Los nuevos puntos/ejes se agregan al final. Reordenar modifica exclusivamente
  posiciones afectadas del destino. El coste es O(n) en hermanos para esta
  operación editorial infrecuente; no se carga ni reescribe el plan completo desde
  el navegador. La numeración visible debe derivarse del orden, no del ID.
- `community_profile_revisions`: historial de creación, modificación y eliminación,
  con actor, timestamp y antes/después. Ningún cliente puede escribirlo o editarlo.
  Se elimina junto con la organización y el actor se anonimiza al borrar su cuenta.
- Acciones de guardar sección, guardar/eliminar/mover eje o punto. Validan datos,
  verifican usuario, comprueban capacidad, ejecutan con RLS y devuelven errores
  tipados. IDs estables impiden duplicados en reintentos; el conflicto de creación
  se informa para recargar. No se reintentan escrituras no idempotentes.
- La actualización/eliminación exige la versión leída; un formulario obsoleto no
  sobrescribe cambios. Las eliminaciones exigen confirmación explícita.
- HTML de planes saneado al guardar y al leer; medios embebidos arbitrarios se
  descartan. Los adjuntos tipados Cloudflare incluyen selector de biblioteca y lectura paginada.
- Editor reutilizable para reglas, gobierno y economía: ejes/puntos, texto
  enriquecido, borradores, publicación, eliminación confirmada, orden mediante
  arrastre o flechas y traslado entre ejes. Formularios conservan los campos al
  fallar y reutilizan el ID de creación durante un reintento.
- Un único editor activo bloquea mutaciones ajenas y navegación entre ejes hasta
  guardar/cancelar; evita que el refresco de otro punto descarte un borrador.
  El bloqueo se mantiene durante la transición de actualización del servidor.
- Navegación institucional con títulos/orden/visibilidad por organización. Lectura
  sin controles administrativos; configuración visible solo según capacidades.
  Ejes plegables en móvil/tablet y acciones por punto desplegables. Se conservan
  tipografía, paleta del módulo y componentes del sistema existente.
- Importación explícita e idempotente de reglas JSON: RPC comprueba permisos,
  bloquea la comunidad, importa capítulos/puntos y archiva el original en el
  historial privado antes de vaciar `communities.rules`. Una sección oculta nunca
  recupera las reglas antiguas como fallback público. Sin importar, se conserva
  la lectura antigua; no hay migración silenciosa de contenido de usuarios.

### Biblioteca y adjuntos

- `community_library_assets` reúne imágenes, videos y documentos; las carpetas
  están separadas por comunidad y tipo. Todas las entradas nacen como borrador
  con audiencia `editors`. RLS distingue público, miembro activo y editor, aplica
  privacidad de la comunidad, rechaza miembros expulsados y oculta carpetas privadas.
- `community_plan_attachments` referencia archivos existentes, con claves foráneas
  compuestas para impedir cruces entre comunidades. La lectura exige acceso al
  punto y al archivo. Adjuntar es idempotente y devuelve la identidad persistida;
  quitar el vínculo exige confirmación y no elimina el archivo de la biblioteca.
- La finalización es una RPC accesible solo a `service_role`, tras comprobar la
  sesión y capacidad en servidor y verificar el objeto remoto. Revalida el permiso
  en la transacción, conserva actor en el historial, serializa reintentos y exige
  versión al reemplazar. Reemplazar conserva título, carpeta, audiencia y publicación.
- Imágenes: se comprueban propietario, origen de biblioteca, estado de carga y
  ausencia de firma obligatoria. Videos: propietario, origen de la biblioteca y
  `readyToStream` en Stream.
  Ninguna URL de entrega se persiste. Los IDs remotos no son editables por navegador.
- Documentos: `uploadService.uploadDocument(file, progress, { communityId, uploadId })`
  admite PDF, Word, Excel, PowerPoint, TXT y ZIP (máximo 10 MB). La ruta de firma
  verifica usuario/capacidad; el ledger privado fija clave, MIME, tamaño y autor.
  Clave: `<userId>/communities/<communityId>/<uploadId>.<ext>`. Firma PUT de 5 minutos,
  tamaño incluido en la firma y HEAD antes de finalizar. Reintentar conserva ID/clave.
  La finalización y el recibo se actualizan en una sola transacción.
- La descarga/preview pasa por una lectura con RLS y firma GET de 60 segundos.
  Respuesta y objeto llevan `private, no-store`; solo PDF/TXT se abren inline.
  Los demás formatos se descargan. Nunca se acepta una clave R2 enviada por el lector.
- Búsqueda textual con índice GIN; páginas de 30 por cursor `(created_at,id)`.
  Carpetas y adjuntos también están paginados. Caché únicamente por petición.
- Archivar o reemplazar registra en `community_asset_deletions` el objeto remoto
  por retirar, dentro de la misma transacción. El archivo archivado desaparece de
  lecturas normales y ya no se adjunta; el historial permanece privado. El consumidor
  ahora procesa lotes de cinco objetos y acepta 404 como éxito en Images/Stream;
  R2 utiliza DELETE idempotente. Los llamados remotos tienen timeout de 15 segundos.
  La eliminación física no se declara completada antes de confirmar al proveedor.
- Se dividió `upload.service.ts` por transporte, tipos, medios y R2; el XHR permanece
  exclusivamente en el archivo permitido por ESLint. Se conserva el flujo PDF de CV
  y los contratos de audio/imágenes/video. Todos los archivos de código quedan ≤250 líneas.
- Biblioteca reutilizable en `/fotos`, `/videos`, `/archivos` y `/pdf`: búsqueda,
  paginación, filtro de carpeta, títulos/descripciones, audiencia, publicación,
  reemplazo y eliminación confirmada. Carpetas privadas/visibles con creación,
  edición y eliminación confirmada; una carpeta con archivos no se puede eliminar.
  `/pdf` filtra por MIME en servidor, antes de paginar. Los nombres de autores se
  consultan en un lote por página, con RLS de perfiles; no se revelan perfiles ocultos.
- Carga múltiple secuencial de hasta 20 archivos por lote. La cola conserva ID de
  creación y objeto remoto para reintentar finalización sin volver a subirlo. Stream
  comunica su UID tras el upload, antes de procesar, para recuperarse de un timeout.
  Archivos nuevos siguen siendo borradores privados. Reemplazar conserva metadata.
  La cola tiene progreso, estado de procesamiento, errores por archivo y reintento;
  salir con archivos pendientes requiere confirmación local.
- La finalización no invalida RSC en mitad del lote: cerrar la cola refresca la
  página, cuyo nuevo snapshot reemplaza las páginas locales. Las demás mutaciones
  mantienen revalidatePath. Un único editor local bloquea filtros y otras escrituras;
  los campos sobreviven a fallos. No es un guard global contra navegación SPA.
- Documentos en filas compactas; imágenes/videos en galería, con URLs derivadas y
  el reproductor Stream existente. Preview PDF/TXT y descarga pasan por la ruta RLS.
  Las fotos/videos de publicaciones se conservan en un desplegable separado que
  identifica su límite de las 50 publicaciones recientes. Los tabs de Archivos/PDF
  ya abren una biblioteca conectada; no contienen mocks ni el panel Próximamente.
- Pestañas semánticas de navegación con aria-current, desplazables en móvil;
  formularios y filtros se adaptan al ancho. Paleta, Poppins y controles compartidos
  conservados; modos claro/oscuro, feedback accesible y acciones táctiles de 44px.
  El selector de biblioteca se comparte entre adjuntos de planes y medios institucionales.

### Acerca de nosotros

- `community_about` contiene seis campos enriquecidos, fundación, ubicación,
  contacto y redes. El nombre oficial procede de `communities`, sin duplicación.
  Nace sin publicar; la capacidad `content` permite editar sin conceder permisos
  de planes. RLS comprueba sección visible, audiencia, membresía activa y bloqueos.
- HTML saneado en lectura y escritura, límite de 50 KB por campo, enlaces HTTP(S),
  diez redes y 24 KB de JSON como máximo. La fecha excluye infinitos y años fuera
  de 0001–9999. Escrituras con versión optimista y registro de actor en historial.
- Lecturas deduplicadas por petición. Fotos/videos referencian la biblioteca con
  claves compuestas por comunidad, respetan sus permisos y se paginan por cursor.
  Desvincular exige confirmación y conserva el archivo. No hay otro flujo de carga.
- `/acerca` reutiliza navegación, controles y editor del sistema. El formulario
  conserva cada texto al cambiar de sección y tras errores; publicación explícita.
  Selector, confirmación de desvinculación y devolución de foco se comparten con
  planes. El nombre se administra mediante el flujo existente de comunidad.

### Dirigentes

- `community_leader_categories` y `community_leaders`: sección y comunidad
  inmutables, claves compuestas, nombre/cargo, biografía/trayectoria saneadas,
  posición numérica y publicación privada por defecto. Categoría oculta oculta
  sus fichas; se puede mover una ficha a otra categoría o dejarla sin categoría.
  Las categorías con integrantes rechazan borrado hasta moverlos.
- `community_leader_contacts` separa correo/teléfono, redes y enlace a perfil de
  la ficha pública. `is_public=false` impide leer la fila por API aunque la ficha
  sea pública. El enlace de perfil se resuelve por nombre de usuario exacto con
  el cliente de sesión y vuelve a comprobarse con RLS en lectura; un error de
  consulta impide guardar o mostrar un estado ambiguo.
- `community_leader_media` tiene tres espacios tipados: retrato, portada y video.
  Referencia activos existentes de biblioteca por comunidad; la DB rechaza
  documento como foto, foto como video y cambios de identidad del espacio.
  Las audiencias/borradores/archivos retirados conservan su protección. El editor
  puede quitar una referencia cuyo archivo ya no está disponible. Eliminar una
  ficha borra sus contactos/vínculos, conserva los medios y registra el actor.
- CRUD usa capacidad `content`, confirmaciones y versiones optimistas. Cada
  registro nuevo conserva el UUID local en reintentos; un conflicto devuelve un
  error para recargar, sin sobrescribir cambios ni producir duplicados.
- Lista de 30 tarjetas por cursor `(position,id)` con retratos en una consulta
  por lote, sin biografías en las tarjetas. Categorías paginadas; la categoría
  actual se resuelve aparte cuando no está en la primera página. Contacto y
  textos extensos solo se leen en la ficha. `react.cache` deduplica por petición.
  `lib/ordered-page.ts` centraliza el cursor y el recorte de páginas ordenadas
  para planes, adjuntos, medios institucionales y dirigentes.
- `/lideres` y `/lideres/[leaderId]` conectan lista y ficha. Formularios inline,
  selector enriquecido de biografía/trayectoria, publicación de contacto
  independiente y biblioteca tipada para medios. El orden es numérico, con
  desempate estable por ID; no hay arrastre en el directorio. Un editor activo
  bloquea filtros y otras mutaciones locales, no la navegación global del shell.

### Presentación y cuatro videos destacados

- `community_showcases` conserva introducción breve, publicación explícita y versión;
  `community_showcase_videos` referencia hasta cuatro videos existentes de la biblioteca,
  con posición 0–3 y claves compuestas que impiden cruces entre comunidades.
- Una RPC guarda texto, publicación y selección/orden como una sola transacción.
  Bloquea el padre, detecta versiones obsoletas y reconoce reintentos idénticos sin
  duplicar revisiones. Las escrituras directas a ambas tablas están revocadas.
- La función pública es invoker; el escritor privado es definer con search_path vacío,
  usuario verificado y capacidad `content` obligatoria. Este privilegio acotado permite
  impedir escrituras parciales por PostgREST. No acepta medios ajenos, archivados o de otro tipo.
- RLS requiere publicación y audiencia de la comunidad, y vuelve a aplicar la audiencia,
  carpeta y publicación de cada archivo. Destacar nunca vuelve público un archivo privado.
  Retirar de la selección conserva el video y su historial en la biblioteca.
- Lectura en una consulta con joins RLS y caché limitada a la solicitud del usuario.
  La restricción de posiciones únicas limita el resultado a cuatro registros en la base.
  Los editores pueden quitar referencias archivadas sin recibir su UID remoto.
- Cabecera con identidad e introducción a la izquierda y reproductor principal a la derecha
  cuando existen videos; se apila en pantallas estrechas. Tres miniaturas permiten elegir
  otro video. El SDK oficial de Cloudflare (`@cloudflare/stream-react` 1.9.3) se carga
  dinámicamente tras una acción de reproducción; la secuencia es optativa y termina en
  el último video. Se conserva volumen/silencio al pasar al siguiente.
- Editor inline con selección local, sustitución, orden, desvinculación confirmada y
  publicación. Guardado fallido conserva los campos; cancelar devuelve el foco. La
  biblioteca se abre en otra pestaña para subir/reemplazar/editar archivos sin perder el
  borrador de selección. El muestreo anterior de videos de publicaciones se retiró de Inicio.
- QA real en localhost:3000: escritorio y móvil, biblioteca vacía, borrador sin guardar,
  cancelación y foco. La biblioteca observada no tiene videos; la reproducción real,
  el diseño con cuatro medios y el guardado autenticado del conjunto siguen pendientes.

### Retiro de medios y programación

- Las mutaciones verificadas de eliminar/reemplazar programan limpieza mediante
  `after()` una vez confirmado el cambio en DB. Un error al programar o limpiar
  no cambia la respuesta de la escritura ya confirmada; el outbox permanece.
- `claim_community_asset_deletions` reclama con `FOR UPDATE SKIP LOCKED`, una
  concesión UUID y vencimiento de cinco minutos. Una confirmación solo modifica
  la concesión vigente. Fallos se reintentan con backoff de 60 segundos a 24 horas;
  las interrupciones se recuperan al vencer la concesión. No se descartan fallos.
- Los registros completados se conservan como tombstones mínimos. Un trigger con
  bloqueo por identificador remoto impide reinsertar un objeto retirado, incluso
  si una validación remota anterior llega tarde. El worker comprueba además que
  no exista referencia activa; si esa consulta falla, no elimina. Las claves R2
  se restringen al namespace de documentos de Comunidades. Los errores guardados
  son códigos estables, sin respuestas del proveedor, credenciales ni contenido.
- RPCs de reclamar/confirmar exclusivas de `service_role`; el cliente no elige
  destinos de borrado. `POST /api/internal/community-asset-cleanup` exige Bearer
  `COMMUNITY_CLEANUP_SECRET` (servidor, mínimo 32 caracteres), compara en tiempo
  constante y devuelve solo contadores con `private, no-store`.
- Supabase Cron: `community-asset-cleanup`, cada cinco minutos, llama al dispatcher
  privado con credenciales en Vault, no en `cron.job.command`. **Creado inactivo**:
  la ruta nueva aún no está desplegada y no se configuraron esos secretos. El
  despliegue/activación está pendiente, sin solicitudes ni borrados remotos de prueba.

Activación tras desplegar esta versión:

1. Configurar en el servidor `COMMUNITY_CLEANUP_SECRET` con un secreto aleatorio
   de al menos 32 caracteres. En Supabase Vault, guardar el mismo valor como
   `community_cleanup_secret` y la URL HTTPS completa de la ruta como
   `community_cleanup_url` (sin query/hash). No pegar secretos en logs ni commits.
2. Verificar POST sin secreto → 401 y con el secreto → contadores/200; con la cola
   vacía no realiza llamadas de borrado. Revisar la ruta desplegada, no un preview
   protegido por autenticación adicional que impida acceder al scheduler.
3. Activar el job desde Supabase Cron o, como operador de base de datos:
   `select cron.alter_job(jobid, active := true) from cron.job where jobname = 'community-asset-cleanup';`
4. Monitorizar `community_asset_deletions` pendientes, `attempts`, `last_error` y
   edad del más antiguo; también respuestas HTTP de `pg_net`, porque un despacho
   SQL correcto no demuestra éxito HTTP. El job puede desactivarse sin perder cola.

No se limpiaron cargas abandonadas que nunca llegaron a finalizar. Ese ciclo
requiere registrar expiración/reintentos de firma antes de borrar temporales, para
no competir con un PUT aún autorizado. No reutilizar ni purgar tombstones al azar.

### Caché y consistencia

1. Servidor: `react.cache()` deduplica consultas dentro de la petición, con
   argumentos primitivos. El cliente es siempre el de sesión. No hay caché global
   de resultados con RLS, permisos, borradores o historial.
2. Escrituras: `revalidatePath('/feed/comunidades/[slug]', 'layout')` invalida el
   árbol del perfil; la interfaz refresca tras un resultado exitoso. Finalizar
   uploads usa la excepción de lote documentada arriba para preservar la cola.
3. Cliente: las páginas adicionales se acumulan solo en estado local del editor,
   deduplicadas por ID. Cada respuesta RSC lleva una clave de snapshot serializada
   que remonta el editor y descarta páginas antiguas al refrescar, incluso cambios
   fuera de los primeros 30 registros. La selección vive en `?eje=`, validada por
   RLS. No se persisten permisos ni resultados privados en caché compartida.
4. Cloudflare: mantener CDN para medios inmutables. Las respuestas de sesión y
   URLs firmadas R2 deberán llevar `private, no-store`. No activar Cache Everything
   para perfiles autenticados ni consultas que mezclen contenido público/privado.
5. Caché compartida de contenido público (futura, si las métricas la justifican):
   DTO exclusivamente público, autorización comprobada antes de cada entrega,
   claves versionadas e invalidación al ocultar/publicar. No exponer borradores
   durante una ventana de TTL ni caché negativa de permisos.

No se añade Workers KV/D1/Hyperdrive: ya existe Postgres vía PostgREST y no se ha
demostrado una carga que requiera duplicar datos o coordinar otro sistema de caché.

## Matriz del PDF y siguiente trabajo

Todos los puntos siguen abiertos hasta tener una prueba funcional de extremo a
extremo; existencia de un componente anterior no equivale a verificación.

| PDF | Requisito completo | Evidencia actual / trabajo pendiente |
| --- | --- | --- |
| 1; aceptación 1 | Perfiles independientes | `communities` existente; validar creación y persistencia desde UI. |
| 2.1–2.2; aceptación 2 | Portada/logo: subir, reemplazar, borrar, recortar, encuadrar y previsualizar | Editor de portada/logo con previsualización, posición, zoom y eliminación confirmada implementado; encuadre/versionado/auditoría probados con RLS. Pendiente carga y guardado real autenticado, limpieza de originales huérfanos y adopción de administradores delegados. |
| 2.3; aceptación 3–4 | Cabecera institucional con cuatro videos, metadatos, orden y reproducción consecutiva optativa | Modelo transaccional, selector/orden, cabecera y reproductor optativo implementados; pendiente QA visual con cuatro medios reales y persistencia autenticada del conjunto. |
| 3.1 | Acerca de: historia, misión, visión, objetivos, valores, fundación, ubicación, contacto y redes | Modelo privado, editor enriquecido, contacto/redes y medios de biblioteca implementados; pendiente persistencia autenticada y reproducción real. |
| 3.2–3.4; aceptación 5–7 | Reglas y dos planes independientes; capítulos/ejes/puntos, borradores, ocultación, drag-and-drop y traslado | SQL, acciones, editor/lectura reutilizable e importación privada implementados. Adjuntos conectados con biblioteca, vistas previas por lote, paginación y desvinculación confirmada; falta verificación autenticada integral. |
| 3.5; aceptación 8 | Dirigentes con ficha, foto, cargo, biografía, trayectoria, portada, video, redes/contacto/perfil; categorías, orden y visibilidad | Modelo y UI de categorías, tarjetas/ficha, textos, orden numérico, medios y contacto optativo implementados. Pendiente QA autenticado y reproducción/portada real. |
| 4.1; aceptación 10 | Chat: historial, replies, fijar, reportes, moderación, bloqueo/suspensión | Chat existente; auditar cobertura y cerrar faltantes. Realtime por filas. |
| 4.2; aceptación 11 | Foro: categorías, temas, replies, edición propia, fijar/cerrar, reportes/moderación | Foro existente; auditar autorización, paginación y acciones faltantes. |
| 4.3; aceptación 14 | Páginas relacionadas: imagen, nombre, descripción y enlace | Ruta `enlaces` existente; verificar persistencia/administración y destinos. |
| 4.4; aceptación 12 | Q&A: categorías, búsqueda, respuesta oficial, FAQ, cerrar y moderar | Modelo privado, RPCs de escritura/moderación, búsqueda y lecturas paginadas implementados y probados. Pendiente interfaz y verificación en navegador. |
| 4.5; aceptación 13 | Eventos: portada, detalles, ubicación/enlace, fechas, organizador, inscripción, estados, lista/calendario, RSVP y compartir | Modelo, CRUD versionado, portada de biblioteca, lista/calendario, asistencia privada y compartir implementados. SQL con rollback y UI vacía/formulario en localhost verificados; pendiente guardar/recargar un evento real y detalle poblado. |
| 5.1; aceptación 9 | Fotos: carga múltiple, álbumes, títulos/descripciones, edición, organización y galería | Backend privado y biblioteca/álbumes con UI conectada; pendiente QA visual de galería y carga real autenticada. |
| 5.2; aceptación 9 | Videos: biblioteca, títulos/descripciones, colecciones, miniaturas y selección de destacados | Backend, UI de biblioteca/colecciones y Stream conectados; pendiente QA visual/reproducción real y enlace a cabecera. |
| 5.3; aceptación 9 | Artículos: enriquecido, portada/resumen, autor/fecha, categorías/tags, adjuntos, borradores y publicación | CRUD existente; esquema actual no tiene estado de borrador. Completar sin exponer borradores. |
| 5.4; aceptación 9 | Documentos PDF/Office/TXT/ZIP: upload, reemplazo, carpetas, metadata, preview/descarga y visibilidad | Backend R2, UI y consumidor de retiro implementados; cron creado inactivo. Pendiente despliegue/activación, cargas abandonadas y prueba autenticada con archivo real. |
| 6; aceptación 15 y 17 | Roles y permisos verificados en servidor; visitantes y miembros | Nuevos permisos institucionales probados en SQL; falta panel, delegación y adopción en todos los módulos existentes. |
| 7; aceptación 5 | Colores, pestañas ordenables/ocultables, títulos por organización y secciones destacadas | Configuración de título, posición y visibilidad de planes conectada; colores por organización e inicio pendientes. |
| 8 | CRUD, separación, validación/optimización/procesamiento, paginación/búsqueda, historial, confirmaciones y borradores | Planes parcialmente implementados; completar medios, documentos, búsquedas y adopción transversal. |
| 9; aceptación 16 | Escritorio/tablet/móvil; menú lateral desplegable y pestañas desplazables | Menú móvil plegable, pestañas desplazables y planes adaptables implementados. Componentes probados en vista aislada a 390/768/1440; falta flujo autenticado. |
| aceptación 18 | Persistencia tras recarga | Probado en SQL; pendiente UI real. |

Orden de continuación: QA de galerías y adjuntos con medios reales →
QA de cabecera con cuatro videos reales → QA de guardado real de portada/logo → QA de eventos,
Q&A y páginas relacionadas → completar chat/foro/artículos → pruebas integrales.
No habilitar entradas incompletas sin la indicación Próximamente.

## Verificación de esta fase

- Proyecto Supabase verificado por MCP: `hwppwxavvamnljfcanje` (`yebaam`).
- Veintiséis migraciones aplicadas mediante `apply_migration`, conservadas en el repo.
- `supabase/tests/communities/authorization.sql`: ejecutado con éxito en la base
  real; fixtures transaccionales y `ROLLBACK`, sin comunidades de prueba persistidas.
  Cubre anónimo/propietario/editor/moderador/admin/no propietario, revocación por
  bloqueo, borradores, publicación, ocultación del padre, aislamiento, conflictos,
  historial y reordenamiento/traslado.
- `supabase/tests/communities/rules-import.sql`: importación ordenada/idempotente,
  rechazo del no autorizado, archivo original privado y ausencia de filtración
  del JSON legado tras ocultar la sección; ejecutado con éxito y `ROLLBACK`.
- `supabase/tests/communities/library.sql`: probado con `ROLLBACK`: permisos por
  rol, defaults privados, carpetas ocultas, aislamiento, autor de finalización,
  idempotencia, recibos de carga, reemplazos/versiones, adjuntos y retiro de objetos.
  Sin fixtures persistentes ni escrituras de prueba a Cloudflare.
- 141 pruebas de acciones, lecturas, permisos de página, navegación, orden y
  formularios pasan; typecheck pasa. Los dos casos de formulario verifican
  conservación de campos tras error y estabilidad del ID al reintentar. Otros dos
  casos cubren borradores abiertos frente a mutaciones/navegación ajenas.
- Uploads: pruebas de MIME/tamaño, reintento con ID estable, compatibilidad de CV,
  metadatos Images, propietario/estado remoto, recibo y HEAD, rutas 401/403/404,
  TTL de firmas, no-store e identidad idempotente de adjuntos.
- Biblioteca UI: reintento sin re-upload, UID de Stream retenido tras timeout,
  finalización documental con ID de ledger, validación de archivo, conservación
  de metadata/formulario/carpeta no cargada en primera página, borrado confirmado
  y ausencia de controles administrativos para lectores.
- Limpieza: `supabase/tests/communities/cleanup.sql` pasó en DB real con rollback:
  RPCs privadas, concesión exclusiva, reclaim tras vencimiento, rechazo de ack
  obsoleto, backoff, tombstone persistente y rechazo de reinserción/finalización
  tardía. También se volvió a ejecutar `library.sql`; cola final vacía y job
  confirmado inactivo. Sin pruebas de concurrencia entre dos conexiones reales.
  Pruebas Vitest cubren destino/proveedor, referencias activas, fallos, ack perdido,
  namespace R2, autenticación, scheduling posrespuesta y 404 idempotente.
- Adjuntos: RPC invoker limitada a 30 puntos, cuatro filas por punto para mostrar
  tres y un cursor; una lectura por lote después de recortar la página. Caché de
  solicitud, sin caché compartida de borradores. La UI reutiliza el renderizador
  de biblioteca y conserva audiencia/publicación/carpeta; quitar el vínculo no
  elimina el archivo. Selector por tipo/búsqueda, reintento con ID estable,
  confirmación y devolución del foco. El bloqueo de edición se libera también
  cuando una acción desmonta su editor antes de terminar la transición.
- `supabase/tests/communities/attachments.sql`: ejecutado con rollback. Verifica
  anónimo/miembro/propietario, límites, borradores, carpetas ocultas, archivados,
  aislamiento, ocultación de sección y proyección explícita de columnas.
  Advisor de seguridad sin avisos para la nueva RPC de vistas previas.
- QA visual de adjuntos documentales con componentes reales y fixtures: escritorio
  1440, móvil 390 (selector/error, ancho sin overflow), tablet 768 (confirmación)
  y lector oscuro 768; cancelar devuelve el foco al control de origen.
  Capturas `community-attachments-{desktop,picker-desktop,mobile-error,tablet-confirm,reader-dark}.png`.
  No acredita autenticación, descargas remotas ni variantes de fotos/videos.
  Reviewer fresco: **ship** para estos estados documentales; contrato local
  actualizado en `components/plans/DESIGN.md`.
- `supabase/tests/communities/about.sql`: ejecutado con rollback; borradores,
  permisos de contenido independientes, versiones, sección oculta, comunidad
  privada, miembros activos/expulsados, aislamiento, límites, historial y medios.
  El advisor de seguridad no reportó hallazgos para las nuevas tablas About.
- Acerca de: cinco capturas de componentes reales con fixtures explícitos,
  `community-about-{desktop,mobile-editor-error,tablet-reader-dark,mobile-empty,desktop-media-error}.png`.
  Escritorio 1440, móvil 390 y tablet 768; lector oscuro, vacío, error de guardado
  con campos preservados y selector limitado a fotos/videos con reintento.
  Reviewer fresco: **ship** para estos estados. Contrato local en
  `components/about/DESIGN.md`. No acredita persistencia autenticada ni Stream real.
  La prueba de foco espera el efecto posterior a habilitar de nuevo el botón.
- Dirigentes: `supabase/tests/communities/leaders.sql` pasó con rollback y sin
  fixtures persistentes. Cubre borradores, ocultación de categoría/sección,
  comunidad privada, miembros activos/expulsados, editor sin permiso de planes,
  contacto independiente, activos privados, tipos de medios, identidad,
  aislamiento, versiones, límites, eliminación con historial y archivos intactos.
  Advisor de seguridad sin avisos de las tablas del directorio.
- Dirigentes UI: siete capturas de componentes reales con fixtures explícitos,
  `community-leaders-{desktop,mobile-editor-error,tablet-dark-reader,mobile-contact-error,mobile-empty,desktop-category-error,desktop-media-error}.png`.
  Verificados 1440/390/768 px, TipTap real, cambio de texto sin perder campos,
  fallo de contacto/categoría/medios con reintento, foco de retorno y lector sin
  controles administrativos. Reviewer fresco: **ship**, sin cambios materiales.
  Contrato local en `components/leaders/DESIGN.md`; no acredita autenticación,
  escritura remota, carga real, imagen de portada ni reproducción de Stream.
- ESLint de archivos nuevos pasa. Supabase marca solo dos avisos informativos
  [RLS sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
  en los nuevos ledger/outbox: es intencional, son server-only, con RLS y sin grants
  a `anon`/`authenticated`; se verificaron los privilegios en la base real.
- Suite global: 414 pasan y 3 fallan en tests existentes no modificados (Ciudades
  espera 8 registros y hay 9; login espera redirect sin el parámetro `redirect`).
- Lint global: 262 errores y 338 avisos en código existente/skills. No se alteran
  archivos ajenos para hacer pasar el gate. `pnpm build`: pasa (Next.js 16.2.3).
- Browser QA de los componentes reales en preview local con fixtures etiquetados,
  sin escrituras remotas: escritorio, tablet y móvil; desplegables, controles de
  orden, lector sin edición y guardado fallido con todos los campos conservados.
  En aquella revisión la aplicación redirigía a login y faltaba
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. La sesión posterior en localhost:3000 sí está
  autenticada; ninguna de estas revisiones acredita persistencia de extremo a extremo.
- Revisión Impeccable: composición acorde al sistema existente; el único hallazgo
  material (borrador perdido al mutar otro punto) fue corregido y puntuado como
  resuelto (`ship` para esa corrección). Capturas en `.impeccable/review/` locales.
  El modo oscuro conserva variantes del sistema, pero no se verificó visualmente.
- Biblioteca documental: seis capturas válidas de componentes reales con fixtures
  explícitos (`community-library-{desktop,mobile,tablet,mobile-error,dark-reader,empty}.png`),
  a 1440/390/768 px. Sin overflow horizontal en móvil; edición y carpetas conservan
  datos tras error. Estado lector sin edición, tema oscuro y vacío revisados.
  Reviewer fresco: **ship**, exclusivamente para estos estados de documentos.
  No acredita las variantes de fotos/videos, cargas/descargas remotas ni flujo
  autenticado. Contrato local en `components/library/DESIGN.md`.

Referencias técnicas consultadas: [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security),
[changelog de Supabase](https://supabase.com/changelog),
[caché de Cloudflare](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/).
Normativa del repositorio: Macro Reglamento arts. 2 y 30; Manual de Convivencia art. 14.
Limpieza: [Next.js after](https://nextjs.org/docs/app/api-reference/functions/after),
[Postgres SKIP LOCKED](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE),
[Supabase Cron](https://supabase.com/docs/guides/cron/quickstart) y
[pg_net](https://supabase.com/docs/guides/database/extensions/pg_net).

### Revisión de marca y navegación en localhost:3000

- Acciones institucionales en verde `primary-800`, selección dorada `secondary-100`, superficies `neutral`; variante compartida `Button color="brand"`.
- Revisión autenticada real en Comunidad MVP test: sección Líderes sin configurar, sin publicar ni modificar contenido.
- Sidebar global comprobado hasta Perfil profesional en escritorio y móvil (390px CSS); en móvil scrollTop 265 y último enlace dentro del viewport (734.7 / 750px).
- Sidebar local limitado a la altura disponible en escritorio con scroll independiente: a 1440×450px, 411px de contenido en 354px de área; Gestionar comunidad accesible tras desplazar 56px. En móvil conserva su disclosure.
- Las capturas históricas con fixtures no prueban persistencia autenticada; esta revisión real tampoco ejecutó uploads ni publicó líderes.
- Validación tras la corrección de paleta: 117 tests de comunidades pasan; TypeScript y lint de archivos cambiados pasan; build de producción pasa.

### Verificación de presentación audiovisual

- `supabase/tests/communities/showcase.sql` pasa en la base real con rollback: máximo cuatro,
  duplicados, aislamiento, tipos, auditoría, reordenamiento atómico, reintento, conflictos,
  anónimo/miembro/editor/expulsado/revocado, comunidad privada y conservación de archivos.
  No quedaron fixtures. No se probó concurrencia entre dos conexiones independientes.
- Ambas tablas tienen RLS y solo SELECT para clientes; únicamente usuarios autenticados
  pueden ejecutar la RPC, que verifica el permiso de contenido.
- 130 tests de comunidades pasan. Tests de UI cubren selección local con el selector real,
  error con borrador conservado, reordenar/quitar, foco, carga diferida del player, opt-in
  y fin de secuencia usando un doble del SDK. No equivalen a reproducción en Cloudflare.
- TypeScript, lint de archivos cambiados y build de producción pasan tras la
  corrección del foco. Detector de UI sin hallazgos.
- API consultada: [Cloudflare Stream React](https://github.com/cloudflare/stream-react),
  [Player API](https://developers.cloudflare.com/stream/viewing-videos/using-the-stream-player/using-the-player-api/)
  y [funciones de Supabase](https://supabase.com/docs/guides/database/functions).

- Revisión real en `localhost:3000`, a 1440 y 390 px CSS: editor compacto,
  borrador local cancelado sin guardar y ausencia de desbordamiento horizontal.
  Cancelar el selector con teclado devuelve el foco visible a «Elegir video».
  El revisor calificó esa corrección como resuelta (`ship`), con alcance limitado
  al foco; apariencia del reproductor con contenido real y reproducción pendientes.
- Sidebar móvil: navegación de 952 px dentro de 736 px; scroll de 0 a 215,625 px,
  con acceso a la última opción. Sidebar de escritorio con scroll independiente
  (952 px de contenido en 445 px disponibles).


### Portada y logo: encuadre reversible

- PDF §2.1–2.2: el botón de cámara abre un editor con imagen existente o archivo
  local, posición horizontal/vertical, zoom, restablecer, vista previa y eliminación
  confirmada. Seleccionar no sube ni guarda; cancelar devuelve el foco al botón.
  Eliminar retira la referencia del perfil, no destruye el objeto original.
- `cover_framing` y `profile_framing` guardan `{x,y,zoom}` validados en Postgres.
  `header_image_version` lo genera un trigger, incluso para cambios desde el flujo
  anterior. El guardado compara versión; un reintento idéntico no crea otra revisión.
  Otro trigger registra actor y antes/después exclusivamente de campos de imagen.
- El original permanece en Cloudflare Images. `FramedImage` comparte el mismo
  modelo de posición/escala entre preview y cabecera; la portada usa 3:1 en ancho
  y 16:9 bajo `sm`. El logo usa marco circular. No hay copias raster recortadas.
- Acción con sesión verificada, filtro explícito de propietario y RLS existente;
  una imagen nueva requiere procedencia `uploadedBy` del usuario, estado listo y
  ausencia de firma privada. No usa service role. La autorización todavía conserva
  el propietario del flujo anterior; delegar imágenes a administradores permanece
  dentro de la adopción transversal de roles (§6).
- `uploadService.uploadImage` se llama al guardar. Su ID se retiene ante error de
  persistencia para evitar repetir la subida. Los blobs locales se liberan al
  reemplazar/cerrar. Una subida abandonada después de fallar el guardado todavía
  necesita el barrido de huérfanos previsto para el módulo; no se elimina a ciegas
  un objeto que podría estar compartido.
- Lectura acotada a una comunidad, columnas explícitas y `react.cache` por petición.
  Revalidación del layout y listado después de guardar; no caché compartida de IDs
  privados. Adaptador separado para no ampliar el mapper legado de comunidades.
- `supabase/tests/communities/header-images.sql` pasó con rollback: restricciones,
  actualización atómica, versión antigua, no-op, versión no falsificable,
  aislamiento privado, propietario/no propietario/anónimo, eliminación independiente
  del otro slot y actor de auditoría. No quedaron datos de prueba ni objetos nuevos.
- 141 pruebas de comunidades pasan, incluyendo errores, ownership de subida,
  estado privado/listo, preview local, cancelación/foco, confirmación, reintento
  sin repetir upload y recuperación de errores. Se corrigió una espera de prueba
  de paginación de adjuntos: el error puede aparecer antes de que acabe la transición.
- Browser real `localhost:3000` a 1440×1000 y 390×800 CSS: portada existente, logo,
  rangos con teclado, vista móvil/escritorio, cancelación, foco de confirmación y
  ausencia de overflow horizontal. No se guardaron cambios de prueba. La prueba
  auténtica de upload/persistencia/recarga sigue pendiente.
- Detector sin hallazgos; advisor de seguridad sin avisos de las nuevas funciones.
  El aviso de hidratación observado contiene atributos `bis_skin_checked` y
  `bis_register` inyectados por una extensión del navegador, no por estos componentes.
- Revisor independiente: **ship** para las capturas y controles comprobados, sin
  hallazgos materiales; no certifica upload/persistencia remotos ni el PDF completo.
  Contrato local en `components/header-images/DESIGN.md`.
- TypeScript, lint de archivos modificados y build de producción pasan tras la
  corrección del foco. Suite global: 426 pasan, 3 fallos previos (dos de Ciudades,
  uno de login). Lint global conserva 262 errores y 338 avisos preexistentes.


### Eventos

- PDF §4.5: lista y calendario mensual, detalle, creación/edición, cancelación y
  archivo confirmado. Título, descripción, inicio/finalización, lugar físico o
  enlace virtual, organizador, inscripción y portada de biblioteca. Texto plano
  con saltos de línea y enlaces HTTP(S) filtrados al renderizar.
- `community_events` nace como borrador y con RSVP desactivado. RLS permite
  administrar al propietario o administrador delegado activo (`settings`);
  lectores necesitan publicación y acceso a la comunidad. Portadas exigen imagen
  de la misma comunidad; el join conserva RLS y omite archivos archivados.
  Archivar una portada no bloquea cancelar o archivar su evento.
- Trigger conserva identidad/comunidad, genera versión/fechas y registra actor
  y antes/después. Acciones verifican sesión/capacidad y comparan versión; un
  reintento idéntico devuelve éxito sin repetir escritura. No hay borrado físico
  desde clientes ni notificaciones externas introducidas por este módulo.
- `community_event_attendance` solo expone la confirmación propia. La RPC deriva
  usuario de `auth.uid()`, bloquea el evento y serializa con cancelar/deshabilitar/
  archivar. Repetir confirmación no duplica filas; retirar se permite en eventos
  cancelados/finalizados todavía accesibles. No hay listas públicas de asistentes.
- Lecturas con columnas explícitas, caché solo por petición, 30 registros por
  cursor `(starts_at,id)` y solapamiento mensual. Calendario muestra un aviso
  mientras faltan páginas; filtrar por día considera eventos de varios días y
  final exclusivo. Estados se actualizan cada minuto desde el snapshot servidor.
  Editor y calendario declaran Bogotá (UTC−5); selector mensual 2000–2099.
- Formulario conserva campos/ID tras error; portada se selecciona sin publicar
  archivos y su selector no anida formularios. Cancelar/eliminar exige confirmación;
  foco de regreso espera a que termine la transición y se habilite el control.
  «Cargar más» conserva resultados ante fallo de transporte y permite reintentar.
- `supabase/tests/communities/events.sql` ejecutado en la base real con rollback:
  publicación, roles, aislamiento, rango temporal, portada, asistencia idempotente,
  usuario no falsificable, cancelación/cierre, expulsión, revocación y auditoría.
  Sin fixtures persistidos. No se probó concurrencia con dos conexiones independientes.
  Advisor de seguridad sin avisos de las tablas de Eventos.
- 159 tests de comunidades pasan (18 nuevos de Eventos); TypeScript y lint del
  código cambiado pasan. Suite global: 444 pasan y los 3 fallos previos de
  Ciudades/login permanecen. Lint global: 262 errores y 338 avisos preexistentes.
- Browser autenticado real en `localhost:3000`: lista vacía, calendario y formulario
  a 1440/390 px CSS. Móvil sin overflow horizontal (390/390); sidebar llega a la
  última opción con scroll independiente (215 de 216 px en móvil). No se guardaron
  datos de prueba. Capturas `community-events-{desktop,create-desktop,mobile,
  calendar-mobile,sidebar-mobile}.png` en `.impeccable/review/`.
- Detector sin hallazgos. Revisor fresco **ship** para las cinco capturas y código
  revisado; no acredita detalle poblado, guardado/recarga autenticados ni tema
  oscuro. Esas pruebas siguen pendientes; el PDF completo continúa abierto.
- Build de producción pasa (Next.js 16.2.3). Contrato visual local en
  `components/events/DESIGN.md`; todos los archivos de código cambiados ≤250 líneas.


### Preguntas y respuestas: backend conectado

- PDF §4.4: `community_question_categories`, `community_questions` y
  `community_question_answers` aplicadas en Supabase con RLS. Las tres migraciones
  locales conservan las versiones devueltas por el historial remoto:
  `20261008220448`, `20261008220450` y `20261008220452`.
- Pregunta privada por defecto, visible al autor y a representantes/moderadores
  institucionales; el autor publica explícitamente, sin aprobación editorial previa.
  Usuarios registrados pueden preguntar en comunidades a las que tienen acceso;
  expulsados y visitantes sin sesión no escriben. Límite de 30 preguntas/hora por
  autor, serializado con bloqueo transaccional e índice por autor.
- Propietario, administrador o editor delegado activo (`content`) puede responder
  oficialmente y administrar categorías. No se confía en roles legados de membresía.
  Solo el autor edita el texto de su pregunta; solo el representante autor, con
  permiso vigente, edita su respuesta. Nadie puede falsificar autor o insignia
  oficial mediante escrituras directas: clientes tienen SELECT, sin INSERT/UPDATE/DELETE.
- Respuestas y categorías nacen sin publicar. Ocultar una categoría oculta sus
  preguntas a lectores públicos; no elimina contenido. Para archivarla deben
  trasladarse o archivarse las preguntas que contiene. La clasificación es una
  operación independiente del texto para no atribuir cambios de terceros al autor.
- Moderadores activos pueden cerrar/reabrir, ocultar con motivo, restaurar y archivar.
  Ocultar/archivar requieren confirmación; restaurar elimina el motivo visible pero
  conserva el registro previo en auditoría. El autor puede retirar su pregunta,
  pero no deshacer una decisión de moderación. FAQ exige pregunta publicada y una
  respuesta oficial visible; retirar la última respuesta visible elimina la marca.
- Bloqueos bidireccionales de `friendships` se aplican en SQL a preguntas y respuestas.
  El contenido bloqueado no reaparece mediante su hilo padre. Las capacidades de
  gestión conservan acceso para moderación; no se expone el grafo de relaciones.
- Las RPCs privadas SECURITY DEFINER comprueban identidad, comunidad, permiso y
  versión bajo bloqueo. Wrappers públicos SECURITY INVOKER solo para authenticated;
  anónimo no puede ejecutarlos. Orden de bloqueo pregunta→respuesta para serializar
  guardados y cierres; IDs estables y reintento idéntico sin nueva escritura/auditoría.
- Acciones en `actions/questions`, validación Zod, errores tipados y revalidación
  del layout institucional. Los resultados RPC también se validan. Sin service role
  en rutas de usuario, consultas inline en páginas, notificaciones ni nuevos medios.
- Lecturas request-cache de 30 registros con cursor compuesto; preguntas más
  recientes primero, respuestas cronológicas y categorías por posición/ID. Búsqueda
  con vector GIN español y websearch. Nombres consultados por lote con RLS de perfiles;
  nombre privado/no disponible se representa como null, sin fallback privilegiado.
  «Mis preguntas» deriva autor de getUser; la cola de moderación exige capacidad.
- `supabase/tests/communities/questions.sql` pasó en la base real con rollback,
  antes y después de aplicar las migraciones: privacidad, búsqueda, roles, bloqueo,
  publicación, FAQ, cierre, moderación, aislamiento, autoría, revocación, categorías,
  conflictos, idempotencia, límite por hora y auditoría. Sin fixtures persistidos.
  No se probó concurrencia entre dos conexiones independientes.
- 173 tests de Comunidades pasan (14 nuevos de acciones/lecturas), TypeScript y
  lint del código cambiado pasan. Advisor de seguridad sin hallazgos de estas tablas
  o funciones. Interfaz, navegación y prueba de persistencia desde navegador
  pendientes: este backend no equivale a completar la sección del PDF.
- Referencias consultadas: [búsqueda textual](https://supabase.com/docs/guides/database/full-text-search)
  y [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
  Manual de Convivencia art. 14: moderación comunitaria; privacidad y Safe Harbor
  se conservan mediante opt-in de publicación y retirada posterior, sin premoderación.
- Build de producción pasa. Suite global: 458 pruebas pasan y permanecen los
  3 fallos previos de Ciudades/login. Lint global conserva 262 errores y 338 avisos
  anteriores. Privilegios comprobados en vivo: anon/authenticated sin escritura
  directa sobre las tres tablas; SQL nuevo sin credenciales en la revisión realizada.
