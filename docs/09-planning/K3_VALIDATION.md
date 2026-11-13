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
