# ADR-014 · Entrada de voz local y respuestas escritas

- Estado: implementada en `codex/k5-voice`; Android probado con fixtures; iOS pendiente de macOS.
- Fecha: 2026-11-17.

## Contexto y decisión

El propietario elige transcripción en el dispositivo, sin respuestas habladas ni consumo de API para voz. Esta decisión sustituye las partes de transcripción remota y reproducción de ADR-004; conserva su frontera de credenciales y las reglas de memoria.

Mantener el micrófono inicia captura; soltar termina. Deslizar arriba bloquea, soltar mantiene la captura y tocar de nuevo termina. También existen Terminar y Cancelar y una activación accesible que empieza bloqueada. El silencio no envía. Solo la finalización explícita permite entregar el resultado final al circuito textual de Contar/Preguntar; los parciales son presentación RAM. Corregir y olvidar mantienen sus comprobaciones y diálogo de olvido.

`VoiceInput`/`VoiceObserver` son contratos portables. `VoiceViewModel` controla estados inmutables y generaciones; Compose presenta estado e intenciones. Los hosts Android/Apple proporcionan los adaptadores nativos. Salir del destino, pausar o perder el ámbito cancela, sin reinicio automático. Dar permiso tampoco inicia escucha. Un fallo conserva solo la parte textual disponible para recuperarla explícitamente en el editor, sin enviarla.

Android utiliza exclusivamente `createOnDeviceSpeechRecognizer`, comprueba español instalado y entrega PCM de su propio `AudioRecord` mediante un pipe acotado. El reconocimiento segmentado termina al cerrar la fuente; no se usa fin de silencio como fin del turno. Esto requiere Android 13/API 33 para voz, aunque el mínimo de la app sigue siendo API 29 para texto. Sin capacidad/modelo instalado ofrece texto; no descarga ni recurre a nube automáticamente.

Apple usa `SFSpeechRecognizer`, exige `supportsOnDeviceRecognition` y `requiresOnDeviceRecognition=true`, con `AVAudioEngine` y permisos contextuales. El adaptador está escrito pero no compilado ni probado en este equipo Windows. Una finalización nativa anticipada se trata como interrupción, nunca como envío. La API clásica de Apple puede imponer límites menores, incluida su recomendación de tareas de alrededor de un minuto; no se promete conversación bloqueada indefinida ni continuidad iOS validada.

Los límites defensivos son cinco minutos, 12 000 caracteres en el adaptador y 15 segundos para resultado final. Presentación restringe además al espacio disponible del editor: 8000 caracteres para Contar y 2000 para Preguntar/aclarar, descontando el borrador previo. Alcanzar el límite cancela y avisa; nunca envía silenciosamente una versión recortada. No hay archivos de audio de producto: solo buffers/pipe transitorios, cerrados al terminar/cancelar/fallar.

## Alternativas y consecuencias

No se elige transcripción remota, fallback de nube, biblioteca de modelos descargada automáticamente ni síntesis de respuestas. Los SDK del sistema reducen dependencias, pero la disponibilidad e idiomas dependen del teléfono. La app conserva internet obligatorio para operaciones de memoria; transcribir localmente no crea cola offline ni vuelve gratuita la interpretación posterior del texto.

No se añaden endpoints, campos de memoria, claves ni despliegues. Pruebas usan audio sintetizado offline ficticio y repositorios dobles, sin inferencia pagada ni acceso a recuerdos reales. [Evidencia y límites](../../09-planning/K5_VALIDATION.md).

## Referencias oficiales

- [SpeechRecognizer](https://developer.android.com/reference/android/speech/SpeechRecognizer) y [RecognizerIntent](https://developer.android.com/reference/android/speech/RecognizerIntent): capacidad local, fuente de audio y sesión segmentada.
- [Reconocimiento local de Apple](https://developer.apple.com/documentation/speech/sfspeechrecognitionrequest/requiresondevicerecognition) y [SFSpeechRecognizer](https://developer.apple.com/documentation/speech/sfspeechrecognizer): compatibilidad y límites nativos.
