# K5 · Voz local · 17 de noviembre de 2026

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
