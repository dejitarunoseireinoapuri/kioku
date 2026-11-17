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

## Corrección de acceso a Gestionar tras guardar · 17 de noviembre

El propietario detectó el aviso incorrecto «El borrado de recuerdos todavía no está conectado». La ruta de borrado estaba integrada, pero `saved` no comunicaba el avance de revisión propio de v2. Al revalidar antes de navegar, el móvil interpretaba ese guardado como un cambio externo, retiraba las referencias RAM y terminaba en un aviso antiguo de ejemplo.

La confirmación de guardado y su recuperación incluyen ahora la revisión del commit original; los recibos anteriores se completan desde el registro canónico, sin atribuirles cambios posteriores. La app acepta ese avance propio y conserva las referencias y el historial. Los saltos con cambios intermedios y las revalidaciones externas siguen invalidando el contenido anterior. El aviso residual indica que el recuerdo no está disponible para gestionarlo. No se cambian el diálogo de confirmación ni el alcance de olvido.

Validación de la corrección: **116/116** host tests Android, **40/40** unitarios backend, **16/16** emuladores v2; compilación, formato, arquitectura, Detekt y Android Lint correctos. Incluye guardados sucesivos, recuperación, revisión original de recibos anteriores, rechazo de revisiones inválidas y retirada de referencias ante cambios externos. **1/1** prueba física `SavedMemoryManagementTest` en Honor: guardar, abrir Gestionar, cancelar sin ejecutar y confirmar una sola eliminación. Cuenta y repositorios de esta prueba son ficticios y no acceden a Firebase/OpenAI. APK actualizado conservando instalación y firma. No se repite el vaciado de la cuenta ni se leen/modifican recuerdos reales.

Fuentes consultadas para la corrección: convenciones, política de calidad, guía de desarrollo, contrato API y evidencia R3; pantalla Gestionar de Stitch consultada sin editarla. **0 llamadas de prueba a OpenAI**. La prueba física no acredita inferencia real ni iOS.

Corrección publicada únicamente en `memoryV2`, dentro de la autorización de despliegue vigente. Estado remoto comprobado **ACTIVE**, actualización `2026-11-17T08:27:26Z` e identidad de ejecución esperada. No se modifican las otras nueve funciones, credenciales ni configuración de memoria.

## Gestión individual desde consultas · 17 de noviembre

El propietario detectó que al consultar un dato aparecían también otros contados en el mismo relato. La respuesta devuelve ahora una referencia de gestión por unidad citada; detalles y fuente muestran solo esa unidad. Si una respuesta utiliza varias, cada una conserva su gestión independiente. Los grupos de captura siguen accesibles desde el guardado. La corrección/retirada reemplaza también las referencias individuales y el contexto conversacional resuelve su alcance exacto. Sin migración ni nuevas copias de recuerdos. Las respuestas que ya estaban en RAM conservan sus referencias anteriores: para ver el nuevo alcance hay que repetir la consulta.

Publicado únicamente `memoryV2`, con autorización de despliegue vigente. Estado remoto **ACTIVE** comprobado, actualización `2026-11-17T08:44:03Z` e identidad esperada. Las otras funciones mantienen su versión; no se ejecuta vaciado, lectura de contenido ni migración de producción.

Pruebas ficticias sin OpenAI: **18/18** emuladores v2, **40/40** unitarias backend, compilación TypeScript y formato correctos. Incluyen dos datos del mismo relato, consulta de uno solo, corrección y olvido conservando el vecino, rechazo de selección ajena, referencia retirada/generación distinta y contexto «ese dato» limitado a la unidad citada. No hay cambios de código móvil o diseño, ni necesidad de reinstalar APK; no se repiten pruebas nativas ni se acredita inferencia real. Fuentes consultadas: convenciones, calidad, referencia visual, contrato API, modelo de datos, seguridad y ADR-013. **0 llamadas de prueba a OpenAI**, sin leer ni modificar recuerdos reales.

## Carga continua al abrir Gestionar · 17 de noviembre

Por petición del propietario, «Gestionar» navega directamente a su destino de carga tras validar la referencia de la sesión. La comprobación remota de acceso/revisión y la lectura actual ocurren dentro de ese destino, con la pantalla existente de logo y estado inferior. `Checking` y `Loading` cambian solo el texto; no se intercala la conversación ni se dibujan encabezado o controles de gestión antes de tener datos. El fallo muestra indisponibilidad/recarga; Atrás del sistema cancela la navegación. Al reanudar se sigue ocultando el contenido hasta revalidar. No modifica protocolo, permisos ni backend.

APK instalado en Honor conservando instalación/firma/datos. `mobileCheck`, formato, arquitectura, Detekt, Lint y compilación de ambos APK correctos; **117 host tests**. Validación física con repositorios ficticios: **18 casos cubiertos** de consulta, carga, gestión y confirmación. La primera ejecución pasó 17/18; la prueba restante esperaba el menú superior visible después de desplazarse al final de una respuesta extensa. Reproducción aislada confirmó esa expectativa incorrecta. Se sustituye por comprobar explícitamente posición final, respuesta visible y existencia del menú; repetición aislada **1/1** correcta. La prueba nueva retiene comprobación y lectura con respuestas diferidas y verifica ausencia de conversación/formulario durante ambas fases; también pasó al repetirla para capturar su aspecto. Captura ficticia de carga inspeccionada en el Honor. No se presentan estos resultados como una segunda ejecución completa de 18/18.

Se consultaron convenciones, calidad, flujos, referencia visual y pantalla de Gestionar en Stitch por MCP; no se editó Stitch. Documentación comprobada. **0 llamadas a OpenAI**, sin acceder a recuerdos reales. Sin despliegue de servidor; iOS comparte el código, pero no se compila ni ejecuta desde Windows.

## Aclaración por el editor habitual sin perder historial · 17 de noviembre

El propietario detectó que «Volver a explicarlo», mostrado junto a una pregunta de aclaración, reiniciaba todo el feed. Se retira ese botón de las aclaraciones de la conversación y la consulta. Se contesta directamente en el editor habitual; también la consulta simple muestra la indicación de aclaración. La continuación ya existente combina pregunta e intervención actual, y las aclaraciones de captura mantienen su identidad específica. Una reformulación explícita tras un límite conserva ahora los mensajes RAM y sus IDs, reiniciando el intento y su contexto. Los reinicios por cierre, caducidad o pérdida de sesión conservan la limpieza anterior.

El historial posterior a un olvido sigue siendo solo lectura: sus referencias revocadas y preguntas antiguas no vuelven al contexto. El cambio no hace que «¿Y ahora?» recupere automáticamente un contexto descartado; permite contestar la pregunta de concreción conservando lo visible. No cambia almacenamiento, backend, evidencia o confirmación del olvido.

Validación: **119/119 host tests**, `mobileCheck`, formato, arquitectura, Detekt, Lint y ambos APK correctos. En Honor, **19/19** pruebas físicas ficticias de conversación y consulta; incluye preguntar → confirmar olvido → «¿Y ahora?» → responder por el editor sin botones de reinicio y comprobar que la pregunta original continúa visible. Pruebas locales adicionales verifican referencias retiradas fuera del contexto y reformulación tras límite sin pérdida de mensajes ni IDs duplicados. APK actualizado conservando instalación, firma y datos; el otro dispositivo no se toca.

Fuentes consultadas: convenciones, calidad, requisitos, flujos, privacidad y referencias Aclaración/Gestionar de Stitch por MCP, sin editar Stitch. Documentación comprobada. **0 llamadas a OpenAI**, sin leer ni modificar recuerdos reales; sin despliegue de servidor. iOS comparte el cambio, pero no se compila ni ejecuta desde Windows.

## Aclaración de intención antes de buscar · 17 de noviembre

El propietario pide evitar buscar recuerdos cuando aún no está claro el tema. `route` admite la operación y valida acceso/generación/revisión por metadatos; después una puerta determinista acotada reconoce continuaciones aisladas sin contexto vigente, como «¿Y ahora?», y solicita tema sin crear proveedor ni cargar el catálogo. El resto reutiliza la interpretación de intención existente con una instrucción v2 específica para aclarar referencias sin antecedente. Las preguntas completas y continuaciones con contexto siguen a consulta. El catálogo solo se carga durante el encaminamiento si hay que resolver corrección/olvido; la consulta de evidencia continúa en `query`. No se altera el prototipo/prompt histórico M0, el perfil API ni los DTO.

Publicado únicamente `memoryV2` con autorización vigente. Comprobado **ACTIVE**, actualización `2026-11-17T09:19:48Z` e identidad de ejecución esperada. Sin migración, vaciado ni lectura de contenido de producción.

Validación sin OpenAI: **43/43** unitarias backend y **20/20** emuladores v2, TypeScript/formato correctos. Las pruebas colocan un documento canónico ficticio inválido que haría fallar cualquier carga y verifican que las aclaraciones y decisiones de consulta se completan antes de leerlo; comprueban proveedor no creado en el atajo, contexto obsoleto descartado, continuación válida, pregunta amplia, respuesta a aclaración, idempotencia, recibos sin texto, propietario/generación ajenos y revocación durante la operación. Los dobles semánticos prueban el flujo y contrato, no garantizan la clasificación real del modelo en toda frase ambigua. No hay llamadas adicionales de interpretación ni nuevas pruebas pagadas.

Fuentes consultadas: convenciones, calidad, flujos, contrato API, seguridad y ADR-013. Documentación comprobada; **0 llamadas de prueba a OpenAI**, sin leer ni modificar recuerdos reales. Sin cambios móviles, de almacenamiento o de diseño; no requiere reinstalar APK. Las pruebas nativas anteriores no se repiten; no hay nueva evidencia de inferencia real o iOS.

## Tamaño del splash Android · 17 de noviembre

Por petición del propietario se sustituye la reutilización directa de `ic_kioku` en el splash Android 12+ por `ic_splash`, que añade un contenedor centrado con margen. El símbolo conserva su geometría/color y pasa de aproximadamente 128 dp a 64 dp visibles en el lienzo estándar de 288 dp. No se modifica el icono del lanzador, la carga de Compose, el backend ni iOS. Android 10/11 conserva su arranque existente.

Compilación de app y tests, `mobileCheck`, formato, arquitectura, Detekt y Lint correctos; host tests **119** reutilizados por Gradle como actualizados, sin nueva ejecución. **1/1** prueba nativa `SplashIconTest` en Honor: resuelve el drawable desde el tema real, lo renderiza al tamaño de splash y mide por píxeles ancho/alto compactos y centrado. Imagen del recurso renderizado inspeccionada; no se presenta como una captura de la animación de arranque del sistema ni como validación en todos los fabricantes. APK instalado con actualización conservando firma y datos; ningún otro dispositivo modificado.

Consultados convenciones, calidad, referencia «02 Entrando» en Stitch y documentación oficial Android de splash. Documentación comprobada; sin edición de Stitch, sin OpenAI y sin acceso a recuerdos reales.

## Límites conocidos

R2 sigue abierta por latencia y reserva independiente de la última versión. Esta entrega no prueba inferencia real con el adaptador de servidor ni iOS. La app requiere saldo para interpretar, consultar o corregir; no se añade un modo que simule respuestas como si fueran reales.

Catálogo inicial: 256 unidades y 4096 documentos canónicos; comprobación adicional de capacidad futura de olvido incluyendo grupos y pendientes. Recuperación de hasta 32 candidatos con expansión léxica. Dependencias ambiguas, grupos compartidos cuyo retiro se pide solo por relato y selecciones que abarcan varios grupos necesitan concreción; no se borran parcialmente ni se amplían por iniciativa del servidor. Los límites no equivalen a soportar 10 000 unidades en producción.

Limpieza TTL eventual para operaciones/planes; las comprobaciones de caducidad son inmediatas aunque el servicio tarde en eliminar físicamente sus documentos. Conservación de admisiones y revocaciones sin texto para bloquear replays después de la limpieza.

Fuentes consultadas: AGENTS, CODING_CONVENTIONS, CODE_QUALITY, DEVELOPMENT_GUIDE, MEMORY_CORE_REBUILD_PLAN (R3–R6), MEMORY_CORE_V2, DATA_MODEL, API_CONTRACT, SECURITY, PRIVACY, evidencia R2 y contratos/código de backend y móvil existentes.
