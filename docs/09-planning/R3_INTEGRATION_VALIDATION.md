# R3 · Integración del núcleo nuevo en la app

## Autorización vigente · 17 de noviembre de 2026

El propietario pide integrar el núcleo validado en R2 en la app real. Suspende toda prueba de API de pago por falta de saldo. Autoriza expresamente empezar vacío y **borrar los recuerdos actuales**, en vez de migrarlos o archivarlos. Conservar cuenta, credencial de servidor, firma e instalación. Honor conectado y elegido como dispositivo; los demás dispositivos quedan fuera del alcance.

La decisión permite avanzar en integración aunque R2 siga abierta por latencia y nueva reserva independiente. No convierte esos pendientes en aprobados. Las pruebas de esta entrega usan emuladores y proveedores dobles con datos ficticios. Captura, consulta y corrección reales seguirán necesitando saldo OpenAI.

## Implementación y límites de activación

- Reutilizar el núcleo y los adaptadores de interpretación/respuesta actuales, con Sol alto. No duplicar sus reglas en el móvil.
- Almacenar unidades, fragmentos, ocurrencias, relaciones y proyecciones en documentos separados del servidor. Transacciones, admisión duradera, versiones y generación; solo diferencias de documentos, nunca un snapshot monolítico.
- Protocolo móvil v2 y frontera autenticada/atestada. Las rutas v1 rechazan operaciones después de la activación y también al confirmar trabajo antiguo.
- Gestionar identidades estables. Captura/corrección claras se confirman automáticamente. Olvido con confirmación local explícita y alcance verificado, sin IA para la eliminación de identidades ya resueltas.
- Preparaciones y aclaraciones temporales revocables. Una mutación invalida evidencia y trabajo anteriores; los datos retirados no sobreviven en pendientes, índices o respuestas persistidas.
- Activación vacía tras comprobar la integración: mantenimiento, retirada completa de recuerdos v1 y representaciones asociadas sin leer/imprimir contenidos, y apertura de v2. Sin copia archivada del contenido borrado. Mantener autenticación, configuración privada y contadores de uso.
- Preparar e instalar la actualización firmada en Honor sin desinstalar ni reiniciar sus datos como atajo. El borrado de recuerdos es la operación de servidor expresamente solicitada, separada de los datos de instalación.

## Estado

**Activado e instalado en Honor el 17 de noviembre de 2026.** El propietario autorizó explícitamente desplegar el núcleo v2 y las protecciones en `kioku-9454f` después de que la revisión automática exigiera confirmar ese cambio del servidor. Las diez funciones afectadas quedaron ACTIVE con la identidad de ejecución esperada.

Arranque vacío completado bajo mantenimiento: eliminados **19 relatos, 27 recuerdos, 86 operaciones y 51 revocaciones antiguas**. Comprobación posterior por recuentos: cero documentos en las colecciones anteriores y en todas las colecciones v2; generación v2 activa y revisión 0. No se leyeron/copiaron textos para esta operación. Se conservaron cuenta, credencial y uso.

TTL de `memoryV2Operations` y `memoryV2Plans` comprobado ACTIVE; exclusiones de índices de texto comprobadas. APK actualizado con `install -r` en el Honor FNE_NX9, conservando firma e instalación. El otro teléfono conectado no se modificó.

Comprobación física `ActivatedMemoryV2Test`: **1/1**, sesión existente y conexión al servidor v2 con revisión 0, sin llamar a IA. Es evidencia de autenticación/atestación y transporte de metadatos del nuevo endpoint; no de inferencia real. iOS requiere Mac/Xcode y sigue pendiente.

## Validación ejecutada sin OpenAI

- TypeScript del núcleo y backend: compilación y formato correctos. Suite raíz: **238/238** pruebas; backend unitario: **40/40**.
- Emuladores Auth/Functions/Firestore: **131/131** en la suite completa. Tras el último ajuste del encaminamiento, repetición acotada v2: **15/15**. Incluye persistencia real emulada por documentos, corrección de repeticiones con identidad estable, olvido completo y vecino conservado, aclaraciones con intervenciones fechadas, planes vinculados, replay sin inferencia, revocación de propietario/generación/evidencia, protocolo autenticado, rutas antiguas bloqueadas y activación administrativa ficticia. Las reglas prueban denegación directa también para las colecciones v2.
- Android: **111/111** host tests; `mobileCheck` correcto (formato, arquitectura, Detekt y Lint). APK de app y APK de instrumentación compilados; comprobación física de metadatos **1/1** indicada arriba.
- Comprobador documental correcto: enlaces, mapa y 13 ADR. Fuentes funcionales y de privacidad revisadas para el nuevo contrato. No hay cambio visual ni modificación de Stitch.
- **0 llamadas de prueba a OpenAI**, sin cargar la clave local ni alterar presupuestos anteriores. La verificación física consultó únicamente revisión/generación, sin captura, consulta de recuerdos ni corrección.

## Límites conocidos

R2 sigue abierta por latencia y reserva independiente de la última versión. Esta entrega no prueba inferencia real con el adaptador de servidor ni iOS. La app requiere saldo para interpretar, consultar o corregir; no se añade un modo que simule respuestas como si fueran reales.

Catálogo inicial: 256 unidades y 4096 documentos canónicos; comprobación adicional de capacidad futura de olvido incluyendo grupos y pendientes. Recuperación de hasta 32 candidatos con expansión léxica. Dependencias ambiguas, grupos compartidos cuyo retiro se pide solo por relato y selecciones que abarcan varios grupos necesitan concreción; no se borran parcialmente ni se amplían por iniciativa del servidor. Los límites no equivalen a soportar 10 000 unidades en producción.

Limpieza TTL eventual para operaciones/planes; las comprobaciones de caducidad son inmediatas aunque el servicio tarde en eliminar físicamente sus documentos. Conservación de admisiones y revocaciones sin texto para bloquear replays después de la limpieza.

Fuentes consultadas: AGENTS, CODING_CONVENTIONS, CODE_QUALITY, DEVELOPMENT_GUIDE, MEMORY_CORE_REBUILD_PLAN (R3–R6), MEMORY_CORE_V2, DATA_MODEL, API_CONTRACT, SECURITY, PRIVACY, evidencia R2 y contratos/código de backend y móvil existentes.
