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

## Rectificación de splash real, aclaraciones libres y prefijo · 17 de noviembre

La captura indicada por el propietario mostró que el recurso anterior seguía enorme y recortado en el splash real del Honor, aunque pasara el renderizado aislado. Se reemplaza el contenedor por un vector directo con viewport 288 y símbolo de 64 unidades centrado; tamaño intrínseco 192 dp para evitar rasterizado grande advertido por Lint. Se retira el recurso anterior sin uso y se adapta el generador de marca para reproducir el splash sin alterar el icono del lanzador.

`ActualSplashTest` abre MainActivity y captura el splash real del sistema. La primera toma no sincronizada no capturó un fotograma útil al endurecer la validación; se conecta entonces al evento nativo de salida, reteniendo su vista solo durante la prueba, sin pausas ni modificación del arranque de producción. Se comprueba el PNG decodificado y la ocupación de color para descartar fotogramas vacíos/de transición; medidas compactas, proporción del símbolo y ausencia de recorte. **1/1** final correcto e imagen real inspeccionada. La prueba aislada de recurso también pasa; ninguna de esas pruebas por sí sola sustituye la inspección del arranque real.

Petición simultánea del propietario: una aclaración pendiente ya no impide seleccionar Explicar/Preguntar. Las sesiones de cada intención conservan la pregunta pendiente y sus contextos independientes; captura y consulta simples permiten salir y volver sin perder sus identidades. Se conserva el bloqueo de trabajo real en curso y de confirmación explícita de olvido. El «>» comparte margen superior con el cuerpo para alinearse con su primera línea, sin centrarlo contra todo un mensaje multilínea. Captura ficticia de mensajes inspeccionada.

`mobileCheck`, formato, arquitectura, Detekt, Lint y ambos APK correctos; **120/120** host tests. En la ejecución física conjunta: **12/12** casos ConversationFlow y **1/1** SplashIcon correctos; la toma inicial ActualSplash no obtuvo fotograma y se corrigió con la sincronización indicada, pasando después **1/1**. No se presenta como una repetición conjunta de 14/14. La prueba de cambio de modo confirma que se puede explicar un dato y volver a resolver la pregunta anterior sin mezclar textos. APK actualizado en Honor sin restablecer ni desinstalar; otros dispositivos intactos.

Consultados convenciones, calidad, flujos, requisitos y referencia Entrando ya inspeccionada en Stitch. Sin cambios de backend ni API OpenAI, sin edición de Stitch ni acceso al contenido de recuerdos reales. La prueba real de arranque solo inicia la app y su transporte de metadatos; no envía turnos ni consultas de memoria. Documentación comprobada; iOS no se compila desde Windows.

## Recuperación tras cobertura insuficiente · 17 de noviembre

No se ha recuperado el error original del metro: la sesión del Samsung ya había caducado. Se reproduce con transporte ficticio un fallo compatible: tras perder una respuesta, el reintento recibía el recibo terminal sin texto y no iniciaba otra lectura. El cliente distingue ahora conexión y tiempo agotado mediante tipos/códigos, conserva el mensaje en RAM y ofrece «Reintentar». Una preparación terminal sin decisión o una consulta de solo lectura terminal renueva únicamente su identidad correspondiente, una vez por ejecución. Los estados en curso conservan identidad; los intentos de escritura mantienen sus IDs y siguen sin confirmar hasta obtener evidencia. No hay cola offline, reintentos periódicos ni conservación después del cierre/caducidad de sesión.

Validación sin OpenAI: **126/126** host tests, formato, `mobileCheck`, arquitectura, Detekt, Lint y compilación de ambos APK correctos. Los casos nuevos cubren respuesta perdida en preparación/consulta, renovación acotada, conservación del nuevo intento después de otra pérdida, procesamiento sin renovación, cancelación por tiempo e identidad de escrituras inciertas. En Samsung: **3/3** pruebas nativas de clasificación de errores y recuperación mediante el ViewModel real con transporte ficticio. Las pruebas de botones en ese dispositivo no pudieron ejecutarse por incompatibilidad de Espresso con `InputManager.getInstance`; no se consideran aprobadas. En Honor: **10/10** pruebas UI de recuperación y navegación, incluyendo pulsar «Reintentar» y obtener la respuesta ficticia sin escribir otra vez. El montaje inicial de la prueba nativa usaba un método interno no compatible; se sustituyó por el proveedor público antes de la ejecución final.

APK actualizado en Samsung y Honor conservando instalación, firma y datos. No se consultaron recuerdos reales ni se desplegó backend. Las pruebas simulan pérdida de transporte; no acreditan cobertura real del metro ni inferencia del proveedor. El adaptador Swift recibe la misma clasificación, pero no se compila ni ejecuta desde Windows. Se mantiene la limpieza de RAM tras 30 minutos en segundo plano.

Consultados convenciones, calidad, guía de desarrollo, contratos existentes y referencia «Sin conexión» de Stitch mediante MCP, sin editar Stitch; comprobada la distinción de códigos en la documentación oficial de Firebase. Se actualizan flujos, requisitos, contrato, seguridad, ADR-013 y referencia visual. **0 llamadas de prueba a OpenAI**.

## Integración en main autorizada · 17 de noviembre

El propietario pide integrar la rama actual y aclara que no se empiece todavía con voz. Se integra la entrega v2 y sus correcciones conservando el historial, sin implementar K5 ni abrir otra rama. R2 mantiene sus pendientes de latencia y reserva independiente; iOS no recibe una nueva validación. Esta integración no ejecuta despliegues, vaciados ni llamadas a OpenAI.

Comprobación previa: **238/238** pruebas raíz, **43/43** unitarias backend y **137/137** emuladores Auth/Functions/Firestore con fixtures ficticios; TypeScript y formato correctos. `mobileCheck` y ambos APK correctos; Gradle reutiliza las tareas de compilación/análisis y los **126 host tests** ya actualizados, sin atribuirles una nueva ejecución. La instrumentación física conserva la evidencia de las entregas anteriores y no se repite para esta integración sin cambios de código. Documentación, enlaces y diff comprobados. Consultados convenciones, calidad, guía de desarrollo, definición de terminado, flujo Git y planes vigentes.

## Ajustes previos a voz · 17 de noviembre

Creada `codex/k5-voice` desde main por petición posterior del propietario. Solo se corrige interfaz; voz sigue sin implementar. Ajustes incorpora «Letras cayendo», activadas por defecto: desactivarlas retira la capa y su reloj, deja negro y conserva un booleano nativo por dispositivo. Android usa preferencias privadas; Apple UserDefaults y su manifiesto de motivo propio, pendientes de compilación Xcode. No hay sincronización, memoria persistida ni API nueva.

La lista omite recibos guardados que no dibujan contenido, ofertas ya resueltas sin respuesta y estados finales vacíos. Se conservan los mensajes y sus identidades en RAM; solo desaparecen sus filas de presentación y separadores. La prueba retira una aclaración temporal e intercala diez recibos vacíos antes de otra pregunta: verifica la separación normal de 24 dp entre grupos más el margen de lectura del texto. El contenedor común consume una sola unión de área segura/teclado/gestos obligatorios y añade 8 dp inferiores, sin reducir el espacio del sistema a una constante.

Validación final: `mobileCheck`, formato, arquitectura, Detekt, Android Lint y ambos APK correctos; **126/126** host tests. Honor: ejecución conjunta final **10/10** de apariencia, separación y navegación de consultas. Samsung: **1/1** nativa midiendo la geometría real del contenedor frente a navegación/gestos, con pantalla despierta. Una ejecución anterior obtuvo 8/10: el test nuevo esperaba volver a la conversación al recrear, aunque Ajustes se restaura correctamente; se corrige esa expectativa. El otro fallo fue un timeout al esperar la carga de Gestionar, que pasó aislado y en la ejecución conjunta final; se conserva como observación intermitente, sin retries automáticos. La primera medición Samsung no obtuvo geometría con la pantalla en reposo; se crea la vista antes de observarla y se despierta la pantalla, sin cambiar ajustes del sistema.

Actualización instalada en Samsung y Honor conservando firma, cuenta y datos. Sin OpenAI, backend ni acceso a recuerdos reales; solo fixtures. Consultados convenciones, calidad, referencia visual y documentación oficial Apple de UserDefaults/manifiestos. Stitch devolvió HTTP 503: no hubo acceso visual nuevo ni edición de sus diseños. Requisitos, referencia visual, privacidad y planificación actualizados. iOS no se compila ni se ejecuta desde Windows.

Captura de Ajustes con fondo negro y cuenta ficticia inspeccionada en Honor; el caso de apariencia se repite **1/1** para generar ese artefacto. El test comprueba negro por píxel, retirada y reaparición de la capa, restauración de Ajustes y lectura de la preferencia desde otra instancia. XML del manifiesto Apple comprobado estáticamente; no sustituye el empaquetado nativo.

## Katakana y carga continua de entrada · 17 de noviembre

En `codex/k5-voice`, el propietario pide renombrar el ajuste a «Katakana cayendo» y mantener la pantalla inicial durante la comprobación de memoria. Se conserva la clave de preferencia, su elección y la animación existente. Cuando la memoria permanece oculta al entrar/reanudar, la conversación usa el mismo componente de logo/estado de acceso: «Entrando...» pasa a «Comprobando cambios en tu memoria...» antes de mostrar editor, historial y Ajustes. No hay espera artificial, nuevas consultas, cambio del splash Android ni alteración de los estados/contratos de memoria. Un resultado fallido termina la carga según la recuperación existente.

Comprobaciones: formato, arquitectura, Detekt, Lint, `mobileCheck`, ambos APK y **126/126** host tests correctos. Honor: **16/16** pruebas físicas ficticias de entrada, apariencia, acceso y navegación de consultas. Las dos nuevas retienen configuración y revisión con respuestas diferidas, verifican ausencia de conversación/controles entre fases, muestran el estado correcto y resuelven tanto éxito como fallo sin carga interminable. Captura ficticia de carga inspeccionada; nombre nuevo y persistencia comprobados por UI. APK actualizado en Samsung y Honor conservando firma y datos; la instrumentación de esta entrega se ejecuta en Honor, sin atribuir nueva validación UI Samsung/iOS.

Consultados convenciones, calidad, flujos y referencias Entrando/Ajustes de A mediante MCP, esta vez accesibles, sin editar Stitch. Flujos, requisitos, referencia visual, privacidad y esta evidencia actualizados; documentación comprobada. Sin API OpenAI, backend, datos reales ni implementación de voz. iOS queda pendiente de compilación/ejecución nativa.

## Límites conocidos

R2 sigue abierta por latencia y reserva independiente de la última versión. Esta entrega no prueba inferencia real con el adaptador de servidor ni iOS. La app requiere saldo para interpretar, consultar o corregir; no se añade un modo que simule respuestas como si fueran reales.

Catálogo inicial: 256 unidades y 4096 documentos canónicos; comprobación adicional de capacidad futura de olvido incluyendo grupos y pendientes. Recuperación de hasta 32 candidatos con expansión léxica. Dependencias ambiguas, grupos compartidos cuyo retiro se pide solo por relato y selecciones que abarcan varios grupos necesitan concreción; no se borran parcialmente ni se amplían por iniciativa del servidor. Los límites no equivalen a soportar 10 000 unidades en producción.

Limpieza TTL eventual para operaciones/planes; las comprobaciones de caducidad son inmediatas aunque el servicio tarde en eliminar físicamente sus documentos. Conservación de admisiones y revocaciones sin texto para bloquear replays después de la limpieza.

Fuentes consultadas: AGENTS, CODING_CONVENTIONS, CODE_QUALITY, DEVELOPMENT_GUIDE, MEMORY_CORE_REBUILD_PLAN (R3–R6), MEMORY_CORE_V2, DATA_MODEL, API_CONTRACT, SECURITY, PRIVACY, evidencia R2 y contratos/código de backend y móvil existentes.
