# K5 · Voz local · 17 de noviembre de 2026

## Integración en main y restauración anterior a Fuentes · 18 de noviembre de 2026

El propietario precisa que quiere **todo lo anterior a Fuentes**, incluida voz y la carga inicial durante la comprobación de memoria. Se avanza `main` desde `bc092ab` hasta `2064e5f` por fast-forward: cuatro commits originales (`d7b510e`, `0632bb5`, `a1b4b1f`, `2064e5f`), sin reescribir historia o incorporar el plan/implementación documental posteriores. El código Android/shared/backend coincide exactamente con ese punto. `codex/shared-sources` permanece guardada y subida en `1d8ca1b`, con la incidencia de fragmentación web y los pendientes de escala documentados en esa rama.

Incluye: memoria v2 por texto y sus correcciones previas; dictado local por toque, X/Stop, parciales y borrador editable antes de enviar; entrada con logo/estado que continúa desde Entrando hasta **Comprobando cambios en tu memoria...**; opción Katakana cayendo; retirada de filas de ayuda vacías y separación normal; área segura inferior con margen adicional. La app no incorpora Fuentes, citas documentales, importación URL o filtros de Compartir.

APK habitual e instrumentado compilados y actualizados in situ en Honor FNE-NX9, conservando firma/cuenta/datos. `mobileCheck` correcto: formato, arquitectura, Detekt, Android Lint y **137/137 host tests**, sin errores/fallos. **15/15 casos físicos correctos en 46,449 s**: EntryLoadingTest (2), AppearanceUiTest (1), ConversationSpacingTest (1), GestureSafeAreaTest (1), VoiceUiTest (9) y LocalVoiceDeviceTest (1). El último sintetiza PCM ficticio con voz instalada offline y comprueba parciales antes de Stop y ambos segmentos después, sin grabar conversación real ni enviar al backend. El resto usa cuentas/repositorios ficticios. Logs ignorados: `local-data/pre-sources-restore-mobile.log` y `pre-sources-restore-honor.log`.

**Cero API**, ningún recuerdo o documento personal leído/modificado y ningún vaciado/migración. Samsung no se modifica en esta restauración. Las respuestas de memoria con proveedor real no se repiten en esta comprobación; no se cierran por ello los pendientes R2/iOS ni se acredita reconocimiento acústico con ruido.

El servidor productivo conserva sus revisiones ya desplegadas: esta operación no lo revierte ni elimina el servicio/texto documental. La app restaurada omite el opt-in `includeReferences`, y el servidor compatible mantiene el circuito personal para ese cliente; no consulta el catálogo documental. Se instala la app anterior a Fuentes sin modificar secretos, permisos, Firestore o datos existentes.

PackageManager del Honor confirma cero actividades de Kioku para ACTION_SEND tanto de PDF como de text/plain. Se deja abierto MainActivity para el uso normal, sin introducir o enviar mensajes.

Documentación consultada: convenciones/calidad, evidencia K5 y R3, limitaciones, ADR-015 y STITCH_SOURCE. Se reinspecciona por MCP la pantalla de voz K5 `626d38e8dc564645b4e6b00a77a27d33` y su HTML, sin editar Stitch ni rediseñar: se restaura la adaptación por toque previamente aceptada.

## Revisión posterior · dictado en el editor

El propietario sustituye mantener/bloquear por un toque para empezar, iconos X/Stop durante dictado y transcripción provisional en el campo. Stop deja borrador editable; no se interpreta ni envía hasta pulsar el envío normal. Escribir oculta el micrófono; borrar todo lo restaura. [ADR-015](../02-architecture/ADR/ADR-015-dictation-draft.md). Las evidencias siguientes de gestos de ADR-014 son históricas y no validan por sí solas esta revisión.

Controles locales: `mobileCheck` y APK de app/tests correctos, 137 host tests sin fallos. Los once casos de estado se adaptan al nuevo contrato, manteniendo protección ante permisos, límites, resultado anticipado y callbacks tardíos. La batería UI comprueba texto provisional, X/Stop en lugar de micrófono/envío, edición del final sin petición y envío manual en el modo seleccionado; escritura/vaciado, accesibilidad, cancelación, interrupción, navegación y segundo plano. Solo repositorios/identidades ficticios, cero API y datos reales intactos.

Se refuerza `LocalVoiceDeviceTest` para exigir texto provisional antes de Stop en el motor real de ambos teléfonos. No se simulan parciales para atribuirlos al reconocedor. Samsung: 1/1 en 17,565 s, parcial recibido antes de Stop y ambas frases conservadas. Honor: 11/11 en 60,774 s (ocho recorridos UI nuevos, dos de editor/teclado y el reconocedor reforzado). No hay envío al parar en las pruebas de UI; solo el envío manual posterior llega al repositorio ficticio.

Ambos recibieron el APK con la nueva interacción. El Samsung se desconectó después de su prueba nativa y volvió a conectarse; entonces se actualizó también al APK definitivo (incluido el aviso de error acotado a cuatro líneas). Datos e instalaciones conservados. iOS y la automatización táctil Samsung siguen pendientes; no se reejecuta el puente ya conocido como incompatible.

Pasada UI final Honor: 9/9, 35,838 s, con exportación de capturas ficticias. Incluye el caso adicional de Stop pendiente → X → resultado tardío: no restaura borrador ni envía. APK definitivo instalado conservando datos. Compilación, 137 host tests, formato/capas/Detekt/Lint y comprobador documental correctos (84 documentos, 15 ADR). No hay llamadas API ni despliegues. Se consultaron convenciones/calidad, requisitos/reglas, flujo de voz, privacidad, ADR-014 y referencia Stitch para esta adaptación.

La exportación Compose del segundo estado produjo una imagen incompleta aunque las aserciones de UI pasaban; una repetición dirigida 1/1 (7,77 s) no resolvió esa limitación. No se presenta esa imagen como aceptación visual completa ni se altera la app para ocultarla. Un arnés con callback de fotograma quedó atascado y se detuvo expresamente el proceso ficticio; su salida «Process crashed» es una ejecución abortada, no una pasada. La captura se simplifica a la ventana de la Activity ficticia mediante [PixelCopy](https://developer.android.com/reference/android/view/PixelCopy) en el siguiente callback de animación, sin capturar otras aplicaciones ni añadir esperas arbitrarias. La hipótesis de reciclado del bitmap no resolvió la exportación y se descarta, restaurando el helper previo sin cambios.

Revisión visual final: caso dirigido con PixelCopy 1/1 en 12,4 s. Se conserva la captura Compose completa de [dictado con X/Stop y parcial](../assets/branding/kioku-voice-inline-recording-honor.png) y la captura PixelCopy completa de [borrador editable con envío](../assets/branding/kioku-voice-inline-draft-honor.png). Cabecera, contenido, borde/prefijo del editor e iconos presentes en esas imágenes; micrófono/envío alternan según el estado solicitado. Otras exportaciones omitieron partes estáticas (también la primera ventana PixelCopy): se descartan como evidencia visual completa, sin atribuirles un borrado funcional o una garantía de renderizado continuo. Ambos teléfonos quedan con el APK definitivo; no se afirma auditoría de accesibilidad completa ni compilación iOS.

## Evidencia histórica · mantener/bloquear

## Alcance

Rama `codex/k5-voice`, sobre el núcleo v2 existente. Petición expresa: mantener para hablar, deslizar arriba para bloquear y tocar/Terminar para acabar; Cancelar descarta. Transcripción estrictamente local, respuestas escritas, sin gasto de API y solo fixtures. [Decisión técnica](../02-architecture/ADR/ADR-014-local-voice-input.md).

No se modifican backend, credenciales ni recuerdos reales. Cero llamadas a OpenAI, cero despliegues. Los escenarios de interfaz usan cuenta/repositorio ficticios: terminar entrega texto al doble, nunca al backend productivo. Las pruebas del reconocedor usan dos frases inventadas sobre un personaje, planetario y cuaderno violeta, con cuatro segundos de silencio entre ellas.

## Evidencia Android

Honor FNE-NX9 (API 34) y Samsung SM-S948B (API 37): reconocedor local disponible y español `es-ES` instalado, sin descarga pendiente. Se actualiza la instalación con conservación de datos; no se desinstala ni reinicia la memoria.

- Honor: 12/12 en la pasada conjunta: ocho recorridos de interfaz y cuatro nativos (reconocimiento, cancelación de pipe bloqueado, permiso denegado y capacidad). Duración instrumentada 55,696 s.
- Samsung: 4/4 comprobaciones nativas correctas dentro de una pasada de cinco que tiene un fallo adicional de automatización de interfaz. Reconoce ambas frases, preserva la pausa y entrega exactamente un final tras cerrar explícitamente el audio. Pipe, permiso y capacidad correctos. No se declara esa pasada íntegramente verde.
- Interfaz Honor: mantener/soltar, deslizar/bloquear/soltar/tocar, cancelar con callback tardío, activación accesible con borrador, recuperar parcial sin enviar, salir a ajustes, pasar a segundo plano y permiso sin autoarranque. Gestos reales inyectados contra la UI; puerto de voz y memoria dobles.
- Reconocimiento real: un sintetizador **offline** instalado genera WAV ficticio privado, que se transforma en PCM mono de 16 kHz y se suministra al motor local real. El archivo temporal se elimina. No se reproduce por altavoz ni graba a personas. Alimentar a cadencia de micrófono es parte de la fuente simulada, no una espera para maquillar aserciones.
- Host: 137/137 pruebas en total, incluidas once nuevas de voz: estados, generaciones, liberación rápida, resultado anticipado, permiso, cancelación, final vacío, accesibilidad y límites de longitud. `mobileCheck` ejecuta host, formato, capas, Detekt y Android Lint; APK de app y de pruebas compilables.
- Pasada nativa final Samsung, después de retirar el arnés exploratorio: 4/4, 17,531 s. Se conserva el fallo anterior como límite de la automatización de UI, no se recalifica.
- Regresión Honor de voz, editor, consultas, entrada y flujo: 31/32, 171,334 s. Los ocho casos de voz, ocho de navegación de consulta, dos de carga y doce de flujo pasan; un caso de editor falla al pedir la captura opcional del teclado (`UiAutomation.takeScreenshot()` devuelve null). No se atribuye éxito al tramo posterior de ese caso en esta pasada. Las aserciones de teclado previas al intento de captura sí se ejecutaron.
- Comprobación posterior del editor Honor sin el argumento opcional de exportar capturas: 2/2, 12,931 s, con todas sus aserciones intactas, incluida restauración del modo/borrador al cerrar teclado. El fallo de exportación anterior queda registrado. Captura Compose del fixture de voz bloqueada obtenida y revisada: estado, parcial, Terminar/Cancelar y editor visibles con la estética Matrix.

Compilación final: `BUILD SUCCESSFUL`, 137 host tests sin errores/fallos, formato/capas/Detekt/Android Lint y ambos APK correctos. Comprobador documental: 83 documentos y 14 ADR, enlaces/mapa/identificadores correctos; `git diff --check` limpio. APK final actualizado en Samsung y Honor con instalación conservadora; sin migración de datos. El último ajuste de drenaje del micrófono se compila y revisa estáticamente; no se presenta como probado por la fuente de audio inyectada.

## Fallos encontrados y correcciones

La finalización del gesto cancelaba un resultado síncrono antes de consumirlo: se distingue ahora liberación normal de cancelación. Se corrigió también la prueba accesible para invocar la acción semántica, no confundirla con un toque táctil.

La primera fuente sintética volcaba audio más rápido que un micrófono y solo recuperaba la primera frase. Se normaliza y suministra a cadencia real, verificando ambas partes tras la pausa. Un pipe lleno podía bloquear el cierre: escrituras no bloqueantes acotadas y prueba de cancelación. Una comprobación inicial exigía parciales antes del final aunque el motor puede diferirlos; la aceptación exige contenido final completo y ausencia de finalización anticipada. Los parciales se muestran cuando el motor los facilita.

Se separa la consulta de capacidad de la intención con descriptor vivo. Se rechaza un final o parcial que exceda el espacio del editor: error visible, parte disponible recuperable y ningún envío truncado automático.

La revisión del cierre del micrófono conserva las muestras de una lectura ya iniciada al soltar: se detiene la captura inmediatamente, se drena esa lectura y se cierra el pipe al terminar la tarea. Cancelar cierra ambos extremos e interrumpe la tarea; no espera al reconocedor bloqueado. Este recorrido con micrófono físico sigue pendiente de la prueba acústica descrita abajo.

El puente Espresso de entrada de Samsung falla con `InputManager.getInstance` en su versión Android. Los intentos exploratorios de inyección nativa/accesibilidad tampoco demostraron entrega de acciones al fixture (inicio registrado: cero; espera de estado agotada). Se retira ese arnés exploratorio, sin desactivar o debilitar tests existentes; se conserva el fallo aquí y la cobertura de gestos en Honor. Algunas ejecuciones Honor se abortaron durante el diagnóstico de ADB lento y no cuentan como pasadas. El resultado conjunto completo anterior sí terminó y se leyó hasta `OK (12 tests)`.

## Límites pendientes

No se ha probado aún voz humana captada físicamente por ambos micrófonos, ruido de metro, conversación prolongada, llamadas entrantes reales ni auditoría completa TalkBack/VoiceOver. Las pruebas de permiso no revocan el permiso real del propietario: inyectan un contexto denegado y exigen que no se abra audio. El audio sintético prueba el motor, no la acústica del teléfono. Los gestos físicos de Samsung quedan pendientes por la limitación de automatización descrita.

iOS necesita macOS/Xcode para compilar, firmar y verificar permisos, captura, limpieza y límites reales. El adaptador no convierte esta entrega en iOS validado. Los mínimos Android 10/iOS 16 de la app se mantienen; voz Android requiere API 33 y modelo local español. Un proveedor sin esa capacidad conserva la entrada escrita, sin fallback remoto.

Tras acabar el gesto, el texto utiliza el procesamiento de memoria existente, que sí requiere internet y puede consumir la API al usar la app normalmente. Esa integración se valida aquí mediante dobles: no se ha ejecutado inferencia productiva de extremo a extremo.

## Reproducción

`tooling/mobile.ps1 formatKotlin mobileCheck :androidApp:assembleDebug :androidApp:assembleDebugAndroidTest`; instalar ambos APK de debug sobre la instalación existente. Ejecutar instrumentación seleccionando `VoiceUiTest` en Honor y `LocalVoiceDeviceTest`, `VoicePipeDeviceTest`, `VoicePermissionDeviceTest`, `VoiceCapabilityTest` en ambos. `VoiceUiTest` también permite captura ficticia con argumento `brandScreenshots=true`. No ejecutar suites live ni herramientas de credenciales.

Documentación consultada: convenciones, calidad, alcance, reglas, requisitos, casos/flujos, privacidad, arquitectura, ADR-004, matriz, plan K5 y política Stitch. Referencia bloqueada de voz inspeccionada por MCP, sin modificar Stitch; adaptación al Matrix vigente con estados reales y sin ondas simuladas.
