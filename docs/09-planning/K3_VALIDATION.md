# K3 · Consultar por escrito

Rama: `codex/k3-text-query`, desde `28fdc78` de `main`. **Implementada y activada en producción; consulta y fuente confirmadas por el propietario en Android.** El indicador compacto posterior y el build iOS requieren comprobación en los móviles. Publicar K2 en `main` no cambia esos límites.

## Alcance y referencias

Preguntar por texto, recuperar por significado/palabras, responder con fuentes actuales, aclarar ambigüedades y reconocer ausencia. No guarda preguntas como recuerdos. K4 (ofertas, corrección/olvido) y K5 (voz) quedan fuera.

Consultados alcance/reglas, requisitos/flujos/casos, arquitectura/estado, datos/API, seguridad/retención, convenciones, calidad, plan y definición de terminado. Inspeccionadas en Stitch las vistas 05 · Preguntar y escuchar y 07 · Texto original; sin editar Stitch, manteniendo B y las preferencias posteriores del propietario. Decisiones en [ADR-010](../02-architecture/ADR/ADR-010-text-query.md).

## Criterios previos a evaluación real

- Mantener `gpt-6.1-sol` con razonamiento `medium`, respuesta/verificación M0 y embeddings 512; no ajustar modelo ni prompts entre los casos de esta evaluación.
- Ejecutar una ronda de integración con 12 relatos ficticios nuevos y 16 preguntas fijadas previamente: los cinco ejemplos de producto, paráfrasis, planes/hechos, dos Pablos, ausencia y citas con instrucciones maliciosas. No usar recuerdos de producción. El núcleo conserva además su evaluación M0 v4; esta ronda comprueba los nuevos adaptadores, no es una repetición de sus tres rondas.
- Al menos 90 % en recuperación de las fuentes esperadas y en respuestas fieles, por total y categoría aplicable. Cero respuestas personales sin evidencia, conversiones de plan a hecho, fuga entre cuentas o uso de fuentes retiradas. Revisar respuestas contra los relatos por separado del verificador del circuito; las comprobaciones automáticas de palabras no bastan.
- Registrar identificadores de caso/fuentes, resultado, tiempos y coste estimado, sin claves, preguntas privadas ni recuerdos reales. Reservas y contador M0 continúan, no se reinician; límite vigente 20 USD acumulados. Detener si no cabe la prueba.
- Objetivo de consulta p95 de 10 s en esta integración aislada; informar aparte del criterio funcional. No extrapolar a red móvil, Google/App Check, gran volumen o iOS.
- Antes de datos reales: emuladores positivos/negativos, revalidación de versiones, recibos sin preguntas/respuestas y pruebas móviles de navegación, aclaración, fuentes, cancelación/recreación y cierre de sesión. Activación de función/índice/preparación en Firebase requiere autorización específica; permisos mínimos y HTTPS con Google/App Check.

## Estado de comprobaciones

La primera ejecución quedó interrumpida tras ocho preguntas: siete coincidieron automáticamente y una abstención temporal falló pese a recuperar la fuente correcta. La siguiente pregunta reveló una incompatibilidad del adaptador K3, que rechazaba las fuentes válidas de una aclaración M0; se corrige conservando las citas autorizadas también al aclarar o explicar insuficiencia, sin cambiar modelo/prompts. [Intento parcial conservado](k3-live-smoke-2026-11-13-attempt1.json). No se presenta como aceptación.

Los 12 relatos/16 consultas iniciales pasan a regresión tras esa corrección. Antes de otra aceptación independiente se fija `tooling/k3-reserve.mjs`: ocho relatos y 16 preguntas nuevos, mismas categorías/umbrales, con llamada a otra persona, fechas/contextos distintos, dos Emis y cita maliciosa distinta. No se ajustarán prompts o recuperación entre sus casos. Ejecución explícita mediante `-LiveQueryReserve`, mismo contador/límite de presupuesto.

| Comprobación | Resultado observado |
| --- | --- |
| Backend build, formato y unidades | TypeScript strict y 14 pruebas unitarias correctos |
| Emuladores Auth/Functions/Firestore | 36/36 correctas; 12 nuevas de consulta y ampliaciones de entrada/reglas, incluidos rechazo de otro propietario, cambio/borrado durante inferencia, recibos sin preguntas/respuestas, concesión obsoleta y conflicto de ID con captura |
| `mobileCheck` | 33 host tests correctos (siete nuevos), formato, arquitectura, Detekt y Lint sin errores |
| Android APK y tests | Compilados; 22/22 pruebas instrumentadas API 36 al 100 %. Las tres de consulta se repitieron tras ajustar citas/reinicio; fuente actual, espera, aclaración, recreación y cierre de sesión |
| Índice | Especificación comprobada por Firebase CLI; activación remota posterior `READY`, detallada abajo |
| iOS | Puente Query/Source y dependencias preparados; sin compilar/ejecutar el nuevo build en Mac |

El APK descomprimido y los archivos versionados se comprobaron en memoria contra el valor exacto de la clave OpenAI existente: no encontrada en ninguno. No se imprimió ni se copió a otro destino. Los identificadores públicos de Firebase no son esa clave.

## IA real y revisión de fuentes

[Regresión](k3-live-smoke-2026-11-13-attempt2.json): 12 relatos y 16 consultas; 16/16 respuestas fieles, todas las categorías superan 90 %, recuperación completa en las 12 consultas con fuente esperada y cero fallos críticos detectados. p95 5,716 s, mediana 4,418 s; coste estimado 0,376749 USD. La abstención temporal inicial no tuvo una corrección específica del modelo; el resultado correcto posterior no borra ese fallo ni garantiza que no vuelva a ocurrir.

[Reserva nueva](k3-live-smoke-2026-11-13-reserve1.json), fijada antes de ejecutarla: ocho relatos nuevos y 16 preguntas; 16/16 respuestas fieles, umbral por categoría superado, recuperación completa en las 12 consultas con fuente esperada y cero fallos críticos detectados. p95 6,088 s, mediana 4,356 s; coste estimado 0,334299 USD. Se distinguieron planes de acciones realizadas, personas con mismo nombre, ausencia y citas maliciosas. Ningún cambio de modelo, prompts o ranking entre sus casos.

El agente de desarrollo comparó cada respuesta con los relatos ficticios, fuera del circuito de generación/verificación; no es auditoría humana independiente. Las comprobaciones automáticas de palabras se conservaron y coincidieron con la revisión. Los artefactos publicados contienen IDs de caso/fuentes, resultados y métricas; los diagnósticos detallados de estas fuentes ficticias quedaron en archivos locales ignorados. No se usaron ni exportaron recuerdos reales para evaluar. Los datos demo y el bloqueo de ejecución se limpiaron al terminar.

Los tres intentos consumieron aproximadamente **0,988236 USD estimados**, incluidos capturas y embeddings diagnósticos. El contador acumulado previo se conservó: 17,869579 USD gastados estimados y 0,136855 reservados, con límite 20 USD. No representa saldo disponible de la cuenta ni cobertura promocional. Los próximos resultados se guardan en archivos con sufijo temporal para no sobrescribir esta evidencia.

## Activación remota y aceptación móvil pendiente

La inspección previa mostró `queryMemory` no desplegada e índice vectorial no creado. Simulación de preparación: tres recuerdos revisados, tres necesitaban proyección; cero escrituras en esa simulación. No se imprimió texto o UID del propietario. Se conserva único proyecto `kioku-9454f`, Bélgica, secreto/identidad de K2 y políticas de retención existentes.

El propietario confirmó expresamente en el chat el despliegue de `queryMemory`, actualización de `submitTurn`/`resolveClarification`, índice y preparación de los tres recuerdos; entrada pública HTTPS `roles/run.invoker` para `allUsers` **solo** en `queryMemory`, con Google/App Check/cuenta permitida exigidos por código. No se ampliaron permisos del secreto ni se crearon claves.

Implementación publicada en `codex/k3-text-query`, commit `c65dd0a`. El propietario respondió afirmativamente por el canal que indicó, pero la revisión automática rechazó el despliegue: no acepta la respuesta de correo como autorización verificable para producción/invocador público y exige confirmación en el chat. El proceso de despliegue no llegó a iniciarse; no se aplicó ninguno de esos cambios remotos ni se intentó una vía alternativa. Se solicitó la misma confirmación en el chat y se comunicó el bloqueo por correo. El permiso previo sobre cuatro servicios K2 no se extrapola a la nueva función.

Tras la confirmación verificable del chat, la revisión permitió el mismo despliegue; el bloqueo anterior quedó resuelto. Firebase confirmó creación de `queryMemory` y actualización de los dos escritores en `europe-west1`. Índice vectorial `READY`, función `ACTIVE` e identidad de ejecución prevista. Petición HTTPS sin credenciales rechazada con **401**; no hizo falta aplicar otra concesión manual del invocador.

Preparación real autorizada: **tres recuerdos revisados y tres actualizados**, cero pendientes. La comparación en memoria antes/después del contenido canónico de los recuerdos y sus fuentes coincidió; solo se añadieron campos derivados. Consulta vectorial nativa real comprobada y marcador privado de búsqueda listo. Esta comprobación administrativa no suplanta una consulta desde el móvil ni prueba su atestación. No realizó llamadas OpenAI ni imprimió texto/UID o hashes del contenido real. [Evidencia remota sin datos personales](k3-production-activation-2026-11-13.json).

Inspección posterior: región Bélgica, PITR desactivado, cero backups programados, TTL de operaciones/uso activos y acceso al mismo secreto conservado. Recuerdos/fuentes no caducan. El APK `kioku-k3-consulta.apk` coincide con la compilación verificada y se entrega como actualización; no se instaló automáticamente en móviles personales.

El propietario confirma después de la activación que la consulta devuelve el dato esperado y permite abrir el texto original en Android. Esta aceptación real no utiliza ni exporta sus recuerdos como fixtures. No equivale a comprobar personalmente todos los casos de aclaración/ausencia ni acredita iOS.

Pendiente: comprobar el loading nuevo en Android y compilar/comprobar el build actual en iOS, incluyendo consulta y fuente. Aclaración y ausencia están cubiertas por fixtures y evaluación real sintética; faltan sus comprobaciones manuales en los dispositivos. No se declara cerrada K3 ni se inicia K4.

## Primera entrega de loading común · sustituida después por indicador compacto

El componente del acceso se comparte con captura/aclaración, recuperación de guardado, consulta, fuente remota y actualización de configuración. Muestra un texto contextual y conserva símbolo, tipografía y animación de tres puntos con espacio reservado. El texto largo puede saltar de línea sin desplazarlo al animar puntos. No se espera artificialmente ni se muestra una carga por abrir contenido disponible. La navegación/conversación permanece compuesta debajo de una capa opaca, sin interacción ni semántica accesible del contenido tapado; se oculta el teclado. Un error también retira la capa. No se modifica autorización, API, modelo ni persistencia.

Validación de esta entrega: APK y APK de pruebas compilados; `mobileCheck` correcto, con 33 host tests, formato, arquitectura, Detekt y Android Lint. **25/25 pruebas instrumentadas en API 36 correctas**, incluyendo tres nuevas: actualización asíncrona que conserva navegación/borrador y oculta acciones, salida del loading tras una consulta fallida seguida de otra pregunta, y mensaje largo en ventana 320 × 480 dp con texto al 200 %. Captura, consulta y fuente comprueban el loading; las pruebas de recreación mantienen borrador/operación/fuente sin reenvío. Los helpers de desplazamiento se adaptaron para no intentar desplazar una carga ya visible; conservan sus aserciones de visibilidad y resultados. Después se repitieron **2/2** pruebas de configuración/texto grande tras ajustar únicamente sus capturas al tema real.

Inspeccionadas las capturas sintéticas normal y de letra grande: misma marca y paleta, mensaje completo dentro de la ventana. Las pruebas no sustituyen una revisión completa TalkBack/VoiceOver ni un build iOS. El código de UI es compartido Android/iOS; la compilación y ejecución Apple siguen pendientes de Mac/Xcode.

Nuevo APK local `androidApp/build/outputs/apk/debug/kioku-k3-loading.apk`, SHA-256 `385832269A83BC6FD608CD3F72550178DF5782EBF1C91148C6F469CD8EA4BCD0`. Se entrega para actualizar conservando la instalación; solo se utilizó el emulador, no se instalaron cambios en móviles personales. Este ajuste no realiza llamadas OpenAI ni despliega funciones. Se mantiene la rama K3; no se publica en `main` por este cambio.

## Indicador compacto · entrega vigente

El propietario rechaza después la carga de contenido a pantalla completa y pide un punto intermedio con el antiguo texto suelto. Se sustituye la capa opaca por una franja inferior integrada: superficie elevada, borde discreto, kanji 憶 de 32 dp con pulso y texto contextual de 14 sp con puntos animados estables. La conversación, fuente o Ajustes siguen compuestos, visibles, legibles y navegables; la franja reserva espacio y no tapa contenido ni atrapa el foco. No duplica el mensaje en el cuerpo. El acceso inicial mantiene su pantalla completa hasta resolver autorización.

La pregunta o el texto en curso permanecen visibles; el envío y la selección de intención conservan sus bloqueos durante la operación. Los ejemplos se desactivan mientras hay trabajo para no reemplazar un turno pendiente. Volver desde una fuente no repite la pregunta; cerrar sesión durante una actualización cancela/invalida su resultado. Un fallo retira el indicador y deja disponible la recuperación existente. No se altera servidor, autorización, modelo, API o persistencia; cero llamadas OpenAI nuevas para este cambio.

Validación: APK y pruebas Android compilados; `mobileCheck` correcto, **33 host tests sin errores**, formato, arquitectura, Detekt y Lint correctos. **27/27 pruebas de interfaz API 36 correctas**, con captura/consulta/fuente, aclaración, error, recreación sin reenvío, conservación de borradores, fuente pendiente con vuelta atrás y cierre de sesión durante actualización. Después de abreviar el texto a «Actualizando estado...» para evitar una línea de puntos aislados con letra grande, se repitieron **10/10** pruebas de acceso/configuración. El componente de mensaje largo se comprueba en 320 × 480 dp con letra al 200 % y una altura inferior a la mitad de esa ventana; esto no acredita todos los flujos de la app con ese tamaño de letra.

Revisión visual de fixtures: [consulta](../assets/branding/kioku-compact-query-android.png), [Ajustes](../assets/branding/kioku-compact-settings-android.png) y [componente con letra grande](../assets/branding/kioku-compact-loading-large-android.png). Se retiraron avisos duplicados y el bloqueo global invisible; se ajustó la alineación del texto y se acortó el estado de Ajustes tras comprobar el salto de línea. Jerarquía y contraste mantienen los tokens existentes, sin añadir colores, bibliotecas, acciones ni porcentaje ficticio. La comprobación semántica automática no equivale a una revisión completa TalkBack/VoiceOver. No se otorga una puntuación global de accesibilidad o compatibilidad iOS sin esas pruebas nativas.

APK vigente: `androidApp/build/outputs/apk/debug/kioku-k3-compacto.apk`; SHA-256 `AF364A6E1C5B8440CCDFB0D24A6D298A3988ABAA9AEE9267C8347569ACA92E20`. Instalar como actualización. No se modificaron móviles personales, claves ni recursos remotos. Código de interfaz compartido Android/iOS; build/ejecución Apple pendientes de Mac/Xcode. Se mantiene `codex/k3-text-query`; esta entrega no cierra K3 ni modifica `main`.

## Fecha explícita del texto original · actualización posterior

El propietario pide ver cuándo contó el recuerdo. La fuente muestra «Lo contaste el dd/MM/aaaa» dentro del recuadro del original, con peso seminegrita. Se conserva el instante ISO `receivedAt` completo en `MemorySource` desde guardado y lectura; la presentación usa la zona horaria actual del dispositivo para evitar desplazar el día cerca de medianoche. No es la fecha del acontecimiento relatado. No se modifica contrato remoto, persistencia, memoria, modelo o claves; sin llamadas OpenAI nuevas.

Se consultaron convenciones/calidad, modelo de datos, contrato API, especificaciones y referencia 07 de Stitch con su imagen; no se modificó Stitch. Android usa `java.time` y Apple prepara Foundation/[NSDateFormatter](https://developer.apple.com/documentation/foundation/dateformatter/timezone?language=objc) con la zona del dispositivo; sin bibliotecas adicionales. La compilación/ejecución iOS y las pruebas de su adaptador siguen pendientes de Mac/Xcode.

Validación: APK, APK de pruebas y `mobileCheck` correctos; **35 host tests correctos**, incluidos cambio de día por zona, desplazamiento de verano y rechazo de fecha/zona inválidas. Las comprobaciones de transporte verifican que guardado y lectura conservan el instante completo. **8/8 pruebas instrumentadas Android** de captura/consulta correctas, incluidas fecha visible en los dos accesos al original, espera, navegación y aclaración. No se repitieron recorridos no afectados ni evaluaciones pagadas. [Captura con fuente ficticia](../assets/branding/kioku-source-date-android.png) inspeccionada; no acredita datos reales ni accesibilidad completa.

APK de esta actualización: `androidApp/build/outputs/apk/debug/kioku-k3-fecha.apk`, SHA-256 `16BAABAFBA4CDE5593BDE9439FF6CA1EC580D10E2D337AD2AB9D50BB2F65163B`. Se mantiene la rama K3 y la aceptación iOS pendiente.

## Seguimientos en Preguntar · contexto breve de sesión

Incidencia del propietario: después de preguntar por ayer, «¿y hoy?» llegaba aislado. `QuerySession` solo conservaba la pregunta cuando estaba aclarando una ambigüedad; una respuesta normal o de ausencia perdía su antecedente en la petición siguiente. Se conserva ahora hasta **cuatro preguntas previas completadas**, incluidas las de ausencia. La actual y las anteriores se distinguen en una cadena JSON dentro del campo `text` existente. La UI muestra solo la pregunta actual; las respuestas previas no se envían como prueba. La búsqueda, autorización, calendario de servidor, verificación y fuentes vigentes siguen siendo los de K3/M0. No se modifica el backend ni se despliega nada, no se añaden claves, modelo, prompts o llamadas de reescritura.

El contexto está solo en RAM de Preguntar, sobrevive a recreación y se limpia al reiniciar consulta, cambiar de intención, cerrar sesión o descartar el ámbito. Los reintentos conservan ID y contexto; una repetición explícita con ID nuevo conserva exactamente el contexto de aquella operación. Respuestas tardías invalidadas no lo actualizan. Se mantienen los **2000 caracteres totales**: si no cabe el conjunto, se muestra el límite sin truncar preguntas ni hacer una petición. No es conversación ilimitada, historia entre dispositivos o persistencia tras cerrar el proceso. Referencias que dependan de una lista anterior del asistente no se resuelven transportando esa respuesta como un hecho.

Validación local: compilación Android, formato, arquitectura, Detekt, Lint y **40 host tests correctos**. **9/9 pruebas Android afectadas** de consulta/captura, incluida ausencia seguida de otra pregunta, recreación sin reenvío, aclaración, fuentes y limpieza al cerrar sesión. Las **6/6 de consulta** se repitieron además tras ajustar la guarda de generación. Los controles locales de pregunta vacía, número y tamaño de contexto se verificaron después mediante host tests, antes de enviar al adaptador nativo. El test ampliado de nueva sesión se corrigió para seleccionar explícitamente Preguntar, ya que el acceso inicial vuelve a Explicar; se mantuvieron las comprobaciones de limpieza. No se cambió el comportamiento inicial para acomodar el test.

Antes de llamar al proveedor se fijaron [siete relatos y doce casos sintéticos](../../tooling/k3-context-fixtures.mjs). [Resultado completo](k3-context-2026-11-13-1794606475859.json): **12/12 respuestas fieles** al comparar sus fuentes fuera del verificador del circuito, coincidentes con las comprobaciones automáticas. Incluye cambio de día, segundo seguimiento, cambio de tema/persona, pregunta nueva completa, dato solo mencionado en una pregunta, historia maliciosa, ausencia y plan futuro sin afirmarlo realizado. El control inicial tiene una negación de visionado explícita guardada; la transición exacta desde `notFound` se cubre además en host/UI. Como no se transporta la respuesta anterior, su formulación no pasa a ser evidencia.

La evaluación utiliza el pipeline M0 y fuentes ficticias en RAM, no la cuenta de producción ni atestación móvil/Firebase real. El agente revisó las doce respuestas contra esos relatos; no es auditoría humana independiente ni garantía universal, ni prueba de gran volumen. Siete capturas y doce consultas: **0,249254 USD estimados**, p95 de consulta **6,714 s**, mediana **4,481 s**, Sol medio sin cambios. El contador se conserva: **18,118833 USD estimados gastados y 0,136855 reservados**, límite 20 USD; no es saldo de la cuenta ni crédito promocional restante. El arranque del nuevo runner se corrigió antes de su primera llamada de proveedor; los diagnósticos vacíos sin gasto permanecen locales, fuera de la evidencia de evaluación.

Reproducción autorizada: `node tooling/k3-context-live.mjs --live`, usando la clave local ya configurada y el mismo contador/límite; guarda resultados nuevos con sufijo temporal y no sobrescribe esta evidencia. No imprime preguntas, respuestas ni claves; los detalles exclusivamente ficticios para revisión quedan en `.setup/` ignorado. `node --check` y formato de ambos scripts correctos. Modelo/prompts históricos M0 no se modifican ni se presentan como reevaluados.

APK: `androidApp/build/outputs/apk/debug/kioku-k3-contexto.apk`, SHA-256 `7B124B133EE1176C2732BA5BB1B40C7463FC273D57F44A03EDC0F850B79EAC94`. Código compartido para Android/iOS; compilación/aceptación Apple y confirmación del seguimiento real del propietario pendientes. Consultados reglas de negocio, convenciones/calidad, ADR-010, estado, privacidad y API/modelo de datos, actualizados para reflejar los límites de contexto. K3 permanece abierta.
