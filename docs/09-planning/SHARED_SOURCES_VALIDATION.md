# Fuentes compartidas · evidencia por entrega

**Revisión posterior en rama:** el propietario sustituye esta biblioteca por un chat único y **Fuentes** solo con URL/gestión; archivos exclusivamente desde Compartir. [Nueva evidencia y pendientes de activación](UNIFIED_SOURCES_VALIDATION.md). Los resultados productivos de este documento pertenecen a la versión anterior y no acreditan el rediseño instalado.

## Comprobación final en Honor desbloqueado · 18 de noviembre de 2026

**1/1 caso nativo superado**, 5,409 s, registro local reference-production-honor-unlocked.log. Con la pantalla desbloqueada se ejecuta la prueba opt-in ProductionReferenceImportTest: ACTION_SEND con PDF generado, aviso de guardado confirmado en Firestore productivo, apertura por el ID exacto recibido, lectura del texto ficticio «Lira usa un cuaderno violeta.» y localizador **Página 1**. Se elimina únicamente el binario temporal del proveedor de fixtures; el texto documental ficticio queda disponible para la prueba manual del propietario.

No se pulsa Preguntar ni se invoca query/IA. **Cero llamadas OpenAI y cero gasto API**. No se leen o modifican recuerdos/documentos personales. El bloqueo del teléfono y las esperas de los intentos previos no se cuentan como aprobados. Este resultado cierra el pendiente de recepción/lectura/cita señalado debajo; las respuestas reales del modelo siguen reservadas a la prueba manual del propietario para respetar la prohibición de gasto del agente.

## Activación productiva · 18 de noviembre de 2026

Autorización del propietario: activar lo pendiente e instalar en Honor, manteniendo cero gasto API en las pruebas. referenceSources desplegado en kioku-9454f/europe-west1, estado ACTIVE, Node 22, runtime de Kioku y máximo una instancia. Configuración sources.document aplicada de forma acotada, sin sustituir otros índices o modificar recuerdos. El primer build remoto rechazó el lock por picomatch ausente; se normaliza con npm 10.9.9 y se comprueba npm ci --omit=dev --ignore-scripts --dry-run en carpeta aislada antes del despliegue aceptado. Versiones declaradas sin cambios.

Tras el build faltaba el permiso de transporte del callable. La revisión automática rechazó habilitarlo, incluso después de verificar que memoryV2 ya lo usa. Se solicita y obtiene autorización expresa del propietario para roles/run.invoker a allUsers exclusivamente en referenceSources. No se cambia App Check, el control de app/Google/propietario o las reglas Firestore. Petición anónima real: 401 UNAUTHENTICATED. Metadatos de despliegue/permiso verificados sin leer recuerdos o credenciales privadas.

Honor FNE-NX9: actualización in situ de Kioku habitual, sin desinstalar, restablecer datos o modificar firma. Se abre solo Documentos. Prueba nativa opt-in con PDF generado, recepción ACTION_SEND, extracción/guardado y lectura de cita; no pulsa Preguntar ni usa el endpoint query. La primera recepción no terminó antes del plazo; después se confirma el aviso de guardado real. La apertura automatizada posterior se corrige para esperar al catálogo, y el bloqueo automático del teléfono interrumpe la comprobación restante. La prueba posterior mantiene la pantalla encendida únicamente durante su actividad, sin modificar ajustes de bloqueo. Resultado final se registra al terminar, sin presentar los intentos interrumpidos como correctos.

No se prueba una respuesta real de IA por la prohibición de gasto del agente. El propietario podrá hacerlo manualmente desde Documentos. Consulta conjunta del chat con recuerdos, Drive privado, OCR, sincronización e iOS siguen pendientes. La evidencia local y la preparación del día anterior que siguen conservan su alcance histórico.


### Cierre de comprobaciones de activación

- referenceSources ACTIVE; identidad/Node 22/región/máximo una instancia comprobados. Transporte autorizado y petición anónima rechazada con 401. Exclusión de índice documental aplicada sin sustituir otros índices.
- Lock npm 10.9.9 normalizado y clean-install de producción comprobado en carpeta aislada. Backend: 60/60 y Prettier correctos. No cambian versiones declaradas o el perfil Sol alto.
- mobileCheck, APK normal e instrumentado correctos; 151 host tests, arquitectura, Detekt, formato y Lint. La prueba opt-in de producción no forma parte de la suite offline ni llama a query/IA.
- Honor actualizado correctamente conservando firma/cuenta/datos. La recepción real del PDF generado obtiene el aviso de guardado. La lectura/cita automatizada se interrumpió al bloquearse el Honor; la ejecución final desbloqueada, documentada arriba, sí supera el caso completo. El comprobador espera el catálogo y liga la cita al ID exacto devuelto al subir, para distinguir nombres duplicados. Mantiene pantalla encendida solo en su actividad de prueba, sin cambiar ajustes.
- Samsung no modificado. Cero llamadas OpenAI y cero gasto API en estas pruebas. Sin recuerdos o documentos personales utilizados. Las preguntas reales del propietario usarán la API y quedan sin evaluar por el agente.

Registros locales: reference-production-activation-verified.log, reference-production-server-verification.json, reference-production-field-activation.json, reference-production-final-mobile-check.log y los intentos instrumentados diferenciados. Checker documental: 88 documentos/16 ADR y enlaces/mapa/identificadores correctos. El archivo local ajeno gradle-daemon-jvm.properties se conserva sin incluir en el cambio.

## Preparación productiva posterior, sin instalar en Honor

Kioku habitual prepara **Documentos**, Compartir y selector con su misma cuenta Google/App Check. El callable `referenceSources` admite catálogo, admisión/subida, estado/cancelación, lectura, olvido, consulta y web. Extraer no usa IA. Preguntar usa el proveedor protegido existente, Sol alto, respuesta y revisión independiente; con más de doce fragmentos añade expansión de búsqueda. Los emuladores no construyen ese proveedor: los tests inyectan dobles. No se persisten preguntas/respuestas; las citas se derivan en servidor. La época documental se comprueba antes de reservar IA, después de responder y en el cierre transaccional. Reautorizar tras extraer impide publicar después de revocar la sesión.

Web preparada: HTTPS público compartido explícitamente; valida todas las IP DNS, fija el socket conservando TLS del hostname, revalida cada salto y limita a tres redirecciones, 25 segundos, 6 MiB y HTML/TXT/PDF. Sin scripts, cookies o descarga de vínculos encontrados en texto/IA. Guarda URL solicitada/final y fecha junto al texto, sin binario. Pruebas con red/HTML ficticios, sin acreditar sitios reales.

Producción: **6 MiB por archivo**, cinco por lote y 25 MiB totales. Parser/piloto: 10 MiB internos. Hasta 200 páginas PDF, 200 000 caracteres, 128 fragmentos y 100 fuentes. Sin OCR/cifrados. **Preguntar del chat aún no mezcla documentos y recuerdos**; las preguntas documentales se hacen en Documentos. Los dobles no prueban comprensión real.

Estado remoto: código/artefactos preparados; **sin despliegue del callable/índices ni instalación de esta revisión**. Sin claves nuevas, recuerdos personales o llamadas a OpenAI. Después de la orden de dejar el Honor bloqueado no se instala ni ejecuta nada en él. Activación, instalación conservando datos, cuenta/atestación, Drive real y respuesta real del proveedor quedan pendientes. La instrumentación del Honor descrita debajo pertenece al piloto anterior.

### Comprobaciones de la revisión preparada

| Comprobación | Resultado |
| --- | --- |
| Backend TypeScript y formato | Correctos; 60/60 pruebas Node |
| Auth/Functions/Firestore aislados | 153/153; permisos, subida real al parser, replay, borrado, revocación durante respuesta y procedencia web con transporte ficticio |
| KMP host | 151/151; incluye invalidación de respuesta natural/citas al cambiar pregunta o catálogo |
| Android | mobileCheck: arquitectura, formato, Detekt, host y Lint debug; APK normal, instrumentado y piloto generados |
| Dispositivos de esta revisión | No ejecutados; no se ha instalado en Honor/Samsung |
| Documentación | Checker: 88 documentos, 16 ADR, enlaces/mapa/identificadores correctos |
| Coste OpenAI de estas pruebas | 0; sin claves nuevas ni opciones Live |

Registros locales: reference-production-unit.log, reference-production-emulators-verified.log y reference-production-mobile-accepted-final.log dentro de local-data. APK normal: androidApp/build/outputs/apk/debug/androidApp-debug.apk. Son compilaciones y tests locales, no aceptación remota, calidad real de Sol ni validación visual de esta revisión. Los fallos iniciales de cierre asíncrono/fixture/dependencias se corrigieron antes de estos resultados; no se redujeron checks.

Documentos consultados y actualizados: convenciones/calidad, plan/evidencia/guía documental, ADR-016, contrato API/modelo de datos, seguridad/privacidad, requisitos, limitaciones y fuente visual. Se conservan intactos los recuerdos reales y el archivo local gradle-daemon-jvm.properties ajeno a este cambio.

El propietario exige detenerse y suspender si queda solo 1 % semanal. Se consulta el indicador de Codex sin canjear reinicios. Al terminar se guarda el trabajo y se preparan dos intentos acotados de suspensión, evitando otra suspensión tras reanudar al día siguiente.


**Petición vigente posterior:** el propietario aclara que la entrega instalada en Honor debe usar el backend/Firestore productivos y consultar la API para responder. Cero gasto API se aplica a las pruebas del agente, no al uso manual de la app. El piloto descrito debajo es evidencia intermedia y no satisface por sí solo esa entrega. Integración productiva en curso; no se considera desplegada o validada todavía.

## Continuación · piloto Android conectado · 2026-11-17

Petición posterior: conectar lo pendiente para probarlo en la app, cero API, solo casos ficticios y Honor; entregar instrucciones de prueba. Se instala **Kioku · pruebas**, ID separado terminado en `.references`, y se deja el servidor local en marcha para el recorrido del [manual del Honor](SHARED_SOURCES_PILOT.md). La app habitual, sus recuerdos, firma e instalación se preservan. No hay despliegue o activación productiva, ni claves/cliente de IA. **0 USD de API en esta continuación**.

Conectados: selector nativo, recepción SEND/SEND_MULTIPLE en frío/caliente, cuatro assets generados TXT/MD/PDF/DOCX, lectura/transferencia en RAM, Auth/Firestore Emulator en otro proyecto demo, admisión/lease/huella antes del upload, recuperación de confirmación, lista, texto vigente, selección de fuente, citas textuales y eliminación con diálogo. La URL web única resuelve HTML ficticio en el servidor, sin salir a internet. Las búsquedas no generan respuestas ni acreditan comprensión semántica. No sincroniza ni conserva originales; los binarios empaquetados/caché del proveedor son corpus de pruebas, no un archivo de importaciones.

| Validación de esta continuación | Resultado |
| --- | --- |
| TypeScript y Prettier backend | Correctos |
| Backend Node | 52/52 |
| Emuladores normales | 147/147, incluidos dos casos nuevos de subida/recuperación y sus rechazos por cuenta/generación/lease/caducidad |
| Piloto HTTP aislado | 7/7 con Auth/Firestore demo; sin Functions, claves u opciones Live |
| Host KMP | 150/150, incluidos seis casos nuevos de estado/confirmación/red/callbacks/revocación/reintentos |
| Android | Formato, arquitectura, Detekt, Lint debug y referencePilot, APK piloto e instrumentado correctos |
| Honor FNE-NX9 | 17/17: una recepción real en frío, cuatro de recorrido UI/aislamiento, dos de transporte nativo y los diez casos de receptor/pantalla de la base inicial |
| Documentación | Checker real y diff sin errores; 88 documentos, 16 ADR |

Los dos casos de transporte leen los cuatro formatos mediante ContentResolver real y suben al parser real local; comprueban página 2 del PDF y la web de fixture. La instrumentación fría entrega ACTION_SEND al Activity por la API Android; el recorrido UI entrega el lote por Intent, verifica que conserva la instancia, pregunta y consulta su página, cancela/confirma borrado y consulta el HTML. No es otra app emisora o Drive real: el proveedor de archivos es el APK de fixtures con permisos temporales. No se exploran archivos/cuentas personales.

Las seis pruebas host conservan pregunta tras Connection y reintento explícito, descartan resultado tardío no cooperativo al editar/cancelar, exigen confirmación antes de borrar y mantienen la fuente visible hasta el servidor, retiran citas de revisiones revocadas y preservan resultados/IDs en un lote mixto. La búsqueda oculta teclado y resultados de importación ajenos a la fuente seleccionada; al cambiar de alcance vuelve al inicio de la vista. Dejar de esperar cierra HTTP/lectura y descarta callbacks locales, pero no promete deshacer un commit ya confirmado.

Fallos conservados durante el trabajo: primera instrumentación con conexión inalámbrica obsoleta, respuesta vacía y error de ciclo de vida; después 3/4 UI con fallo al cerrar tras nuevo envío, y una ejecución abortada al investigar singleTask. Se renueva únicamente la depuración del Honor con autorización aceptada en el dispositivo, sin reset/desinstalación; no se manipula Samsung. El adaptador evita proxy/redirecciones, cierra conexiones al cancelar y convierte cuerpo vacío/JSON de respuesta incompleto en Connection. El fallo de ciclo de vida se corrige consumiendo el nuevo envío como evento sin `setIntent`: esa sustitución cambiaba acción/tipo y ActivityScenario dejaba de observarlo. [Código primario de ActivityScenario](https://github.com/android/android-test/blob/main/core/java/androidx/test/core/app/ActivityScenario.java) comprueba esa identidad en sus callbacks. Se conserva singleTop y no se debilita el cierre de pruebas. La nueva prueba en frío y la comprobación de instancia cubren el recorrido final.

El formateador alcanzó el límite de longitud de proceso de Windows: usa rutas relativas manteniendo la lista completa. Kotlin integrado de AGP exige registrar fuentes Kotlin, no Java; se corrige la configuración de la variante según [Android](https://developer.android.com/build/migrate-to-built-in-kotlin). Lint exige gestión pública de ViewModelStore y configuración de red explícita; corregidos sin baselines o suppressions.

**Pendiente para producto:** atestación/transporte remoto desplegado y navegación con memoria habitual, consulta mixta/IA, descarga web real con controles DNS, procedencia URL completa, Drive privado/exportación real, sustitución manual de versiones, retención/barrido operacional, iOS y pruebas completas de accesibilidad/proveedores/proceso. El piloto no los da por cerrados. La compilación iOS sigue requiriendo Mac/Xcode. El PC y el túnel del Honor son necesarios; al reiniciar emuladores se pierde el corpus importado. El manual indica cómo recuperar la conexión sin reescribir preguntas.

Referencias consultadas/actualizadas: plan, requisitos/alcance, arquitectura/ADR-016, datos/API, seguridad/privacidad/retención, calidad/convenciones, guía de desarrollo y Matrix/Stitch. No se editan pantallas remotas. El resto del informe conserva la entrega inicial con sus denominadores y límites históricos.

## Entrega inicial histórica · 01bb4ff

Fecha: 2026-11-17. Rama `codex/shared-sources`, creada desde `5fe1f7a` de voz. Petición del propietario: empezar implementación en rama nueva, solo casos ficticios, cero API, conservar únicamente texto extraído y aplazar sincronización. Autoriza expresamente usar el Honor para pruebas. No se han desplegado recursos, llamado a IA, leído recuerdos/archivos personales o accedido a Drive real. Coste API de esta entrega: **0 USD**.

## Comportamiento implementado

- Extracción determinista UTF-8/Markdown, PDF con texto y páginas reales, DOCX con párrafos, HTML sin ejecutar scripts. No hay OCR, audio, vídeo o respuestas habladas. Fragmentos literales con cobertura y localizadores; no se convierten en recuerdos personales.
- Worker recibe formato/bytes, sin credenciales de entorno, proveedor IA o descarga de URL. Límite de entrada 10 MiB, 200 páginas PDF, 200 000 caracteres, 128 fragmentos de hasta 2000 caracteres. Plazo 30 s, heap antiguo 256 MiB y stack 4 MiB; no equivale a aislar todo el proceso o medir RSS/CPU total. Salida del parser drenada, errores seguros sin texto bruto.
- DOCX: límites de entradas/tamaño/descompresión, rechazo de macros/rutas sospechosas/entidades XML. Cuerpo principal únicamente; partes omitidas e imágenes se señalan como cobertura parcial. PDF sin texto se rechaza; páginas vacías junto a texto señalan parcialidad. HTML excluye categorías de navegación/scripts/ocultos explícitos, con profundidad acotada; no es un navegador ni acredita fidelidad de estilos o páginas dinámicas.
- Almacén Firestore privado por cuenta/generación: autoriza propietario habilitado en admisión, confirmación, lectura, catálogo, cancelación y olvido. Hasta 100 fuentes más pendientes. ID de petición y fingerprint detectan replay/conflicto; huella de formato/bytes deduplica. Concesión caduca a los 15 minutos. Finalizar/cancelar/expirar vacía título/huella de la operación. Bytes solo en RAM: conserva texto extraído y metadatos mínimos.
- Olvidar exige IDs/revisión exactos; elimina texto y deduplicación, conserva revocación sin contenido y aumenta época. Reintentar la operación anterior no restaura la fuente. Compartir expresamente otra vez crea IDs nuevos. Un worker anterior a un cambio de catálogo falla conservadoramente si ya no puede publicar sobre su época; aún no hay sustitución manual atómica de versiones.
- Búsqueda textual determinista: hasta 12 citas literales por fuente/revisión/localizador. Fuentes parciales excluidas de búsqueda general salvo alcance explícito. No es recuperación semántica ni generación de respuesta; todavía no se conecta a Preguntar.
- Android: lectura de `ACTION_SEND`/`ACTION_SEND_MULTIPLE` y ClipData, deduplicación de URI, máximo cinco archivos; exige concesión temporal y `content://`. Lectura en RAM con límites efectivos de 10 MiB/archivo y 25 MiB/lote, handles de uso único, descriptor/cancelación/plazo de 15 s. Sin permiso persistente, archivo del propietario copiado a disco o cola offline. Metadatos/tamaño declarado no sustituyen el conteo real de bytes. Se prueban lectura y fallos, no todos los proveedores que podrían ignorar cancelación del sistema.
- Enlaces Android se distinguen de archivos y texto ordinario. Drive/docs.google.com orientan a «Enviar una copia»; no se reutiliza el login Google para acceder a documentos. Validador backend de admisión HTTPS rechaza destinos privados/locales, credenciales, parámetros sensibles y redes sociales. **No hay fetcher, resolución DNS o conexión HTTP implementados**.
- Domain/ViewModel KMP no contienen URI, Firebase o parsers. Estado por elemento, cancelación y aislamiento por generación/cuenta; resultados tardíos descartados. Pantalla mediante componentes Matrix existentes con lectura/resultado parcial/permisos/cierre. El contrato `Stored` requiere confirmación del repositorio, sin guardado optimista.

El receptor Android del producto está declarado **deshabilitado** y su entrada falla con un mensaje veraz de indisponibilidad. No existe aún un repositorio remoto real conectado. La pantalla probada usa estados ficticios en la actividad debug no exportada, no un backend simulado activado para el propietario. No se modifican callables exportados, reglas desplegadas o recorrido de recuerdos/voz actual.

## Pruebas ejecutadas

| Comprobación | Resultado y alcance |
| --- | --- |
| TypeScript strict y formato backend | Compilación y Prettier configurados correctos |
| Suite backend Node | 52/52, incluidos nueve casos nuevos de documentos |
| Suite normal emuladores | 145/145, incluidos ocho casos nuevos de almacenamiento documental; sin opciones Live |
| KMP host | 144/144, incluidos siete casos nuevos de ViewModel |
| `mobileCheck` | Formato, capas, Detekt, host y Android Lint correctos, sin deshabilitar comprobaciones |
| APK debug + APK instrumentado | Compilados correctamente |
| Honor FNE-NX9 | 10/10: siete del receptor/lector y tres de pantalla, 67,052 s en el dispositivo |
| Dependencias de ejecución | Auditoría npm: cero vulnerabilidades conocidas; no acredita toda la herramienta de desarrollo |
| Documentación | Checker real: 87 documentos, 16 ADR; enlaces/mapa/identificadores y `git diff --check` correctos |

Corpus backend generado en código: PDF de dos páginas con oráculo literal, DOCX con Unicode, TXT/MD, HTML con contenido excluido, entradas malformadas/vacías/expandidas y límites. Pruebas de extracción aislada, cancelación previa, base64, procedencia, cobertura parcial y admisión de URL/IP. El PDF de dos páginas ejecutado no se confunde con el itinerario de tres páginas previsto en el plan.

Emuladores: cuenta ficticia exclusiva bajo el proyecto demo con guardas loopback. Casos positivos/negativos de cuenta, generación y propietario deshabilitado; solo texto persistido; replay/deduplicación; cancelación y publicación tardía; vencimiento libera cupo; olvido impide lectura/replay/recuperación y preserva otra fuente; callback antiguo no revive; nuevo compartir explícito recibe IDs nuevos. No usa identidades/configuración productivas.

Honor: proveedor **debug no exportado** genera notas ficticias y un fichero que supera 10 MiB aunque anuncia tamaño cero. Comprueba permisos, Markdown, doble lectura del handle, concesión ausente, `file://`, sexto adjunto incluso repetido, separación de enlaces y componente de producto deshabilitado. Pantalla: lectura sin éxito anticipado, cierre, resultado parcial y fallo de permiso conservados en lote, indisponibilidad veraz. Se actualizan APK mediante instalación conservando datos; no hay desinstalación/reset. Un primer lanzamiento de instrumentación usó un sufijo de paquete incorrecto y falló antes de ejecutar pruebas; corregido a `.dev.test`, con el resultado 10/10 anterior. No se atribuye ese fallo a la app.

No se ejecutan pruebas actuales Samsung por elección del propietario de usar Honor. No se compila iOS en Windows. Sin pruebas de Drive real, Share desde otra app emisora, arranque frío/caliente integrado, selector, red real, muerte de proceso, accesibilidad/escala/paisaje o interpretación IA. Las diez pruebas nativas no acreditan esos recorridos.

## Reproducción sin API

Desde la raíz del checkout:

```powershell
node tooling/backend.mjs format:check
node tooling/backend.mjs build
node tooling/backend.mjs test
node tooling/backend.mjs audit --omit=dev
pwsh -NoProfile -File tooling/backend-emulators.ps1
pwsh -NoProfile -File tooling/mobile.ps1 mobileCheck :androidApp:assembleDebug :androidApp:assembleDebugAndroidTest
pwsh -NoProfile -File tooling/check-docs.ps1
git diff --check
```

Con APK debug e instrumentado actualizados conservando datos en el dispositivo elegido, ejecutar las clases `ReferenceReceiverTest,ReferenceImportUiTest` con AndroidJUnitRunner del paquete `io.github.dejitarunoseireinoapuri.kioku.dev.test`. El fixture no abre MainActivity ni repositorios de recuerdos. No añadir opciones Live a los emuladores, cargar claves o navegar por cuentas reales.

## Dependencias fijadas

| Paquete | Versión | Licencia | Uso |
| --- | --- | --- | --- |
| pdfjs-dist | 6.5.438 | Apache-2.0 | Texto de PDF, API de bytes, sin visor/script de documento |
| fflate | 0.8.3 | MIT | ZIP interno acotado de DOCX y fixtures |
| fast-xml-parser | 5.12.1 | MIT | XML validado de DOCX, salida cruzada como unknown |
| parse5 | 8.1.1 | MIT | Árbol HTML sin ejecutar página |
| ipaddr.js | 2.5.0 | MIT | Clasificación de IP para futura admisión web |

Versiones/motores/licencias verificadas mediante registro npm y fuentes oficiales antes de fijarlas en lockfile. PDF.js exige Node >=22.13 o >=24; encaja con el runtime Node 22.23.5 verificado y herramientas Node 24 del proyecto. No se añaden paquetes de IA. Fuentes: [API PDF.js](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html), [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser), [fflate](https://github.com/101arrowz/fflate), [parse5](https://github.com/inikulin/parse5), [ipaddr.js](https://github.com/whitequark/ipaddr.js).

## Pendientes concretos antes de activar

1. Transporte autenticado/atestación y repositorio móvil real: admisión antes de transferencia, lectura de estado y respuesta perdida, cancelación de resultado incierto. Composición Koin/navegación y selector; aislamiento de recepción mientras hay conversación/gestión activa; pruebas emisor/arranque/cuenta/proceso.
2. Límites globales de concurrencia/cola del worker, medición de RSS/CPU y aislamiento operacional. El prototipo limita cada worker, no el consumo agregado de un servidor expuesto.
3. Cerrar retención operacional de operaciones/recibos, barrido programado y limpieza por generación/cuenta. Actualmente `expire` se ejecuta al admitir y en pruebas: plazo lógico no es purga automática. Exclusiones de índices Firestore del texto/chunks, índices requeridos y permisos reales antes de despliegue; no se han modificado reglas remotas.
4. Fetcher web con DNS fijado y revalidación por salto, límites temporales/compresión, tests de rebinding/redirección. Guardar procedencia URL/fecha de lectura; el prototipo solo almacena título/fecha/formato y localizadores del contenido entregado.
5. Drive por copia desde un emisor/proveedor real con documento ficticio explícitamente elegido; enlaces privados/OAuth/exportación siguen separados. **Sin sincronización** en esta entrega.
6. Consultas y gestión integradas con fuentes/recuerdos tipados, revalidación final de época/versiones tras respuesta, citas navegables, diálogo de olvido y sustitución manual atómica. No activar fuentes de emulador como si estuvieran consultables por IA. Evaluación semántica con API solo bajo autorización futura.
7. Share Extension/selector iOS y compilación/pruebas Mac/iPhone. Validación visual/accesibilidad completa y casos de formatos pendientes de la matriz del plan.

I0 tiene contratos internos/decisiones/cotas iniciales; I1–I3 cuentan con una base parcial comprobada, no cierre integrado. I4 solo distingue copia/enlace en fixtures. I5 solo admite URL y extrae HTML proporcionado. I6 solo recupera citas textuales y retira fuentes en el almacén. I7 pendiente. No se cierra ninguna fase por extrapolar estos resultados.

Documentación consultada: plan de fuentes, alcance, requisitos, arquitectura/ADR-016, datos/API, seguridad/privacidad/retención, convenciones/calidad, guía de desarrollo y referencia Stitch. La implementación resuelve las decisiones de conservar solo texto y aplazar sincronización; no cambia presupuestos, modelos históricos o recursos activos.
