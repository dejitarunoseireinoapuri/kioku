# ADR-015 · Dictado por toque y revisión en el editor

- Estado: implementada e integrada en main con la restauración previa a Fuentes; Honor actualizado y validado sin API. Evidencia en [K5](../../09-planning/K5_VALIDATION.md).
- Fecha: 2026-11-17.

## Contexto y decisión

El propietario rechaza el panel de botones y sustituye explícitamente el gesto de mantener/bloquear de ADR-014. Un toque en el micrófono comienza el dictado; ese icono se sustituye por una X y un cuadrado de parada en el editor. Ambos tienen nombre accesible y objetivo mínimo de 48 dp. El icono de enviar desaparece durante todo el dictado y su finalización.

Los parciales aparecen en el propio campo, sin editar ni enviar mientras se escucha. El cuadrado detiene audio, espera el resultado final y lo coloca como borrador editable, con el mismo envío manual de un texto escrito. Parar no ejecuta interpretación, consulta o guardado. La X cancela y descarta, incluidos resultados tardíos. Si se escribe algo se oculta el micrófono; al vaciar todo vuelve a aparecer. Un campo vacío muestra solo micrófono; un campo con texto muestra solo envío. Un espacio cuenta como contenido para esta selección, aunque no habilita enviar.

Se retiran estados/acciones de bloqueo y gestos por mantener; se simplifica `VoiceViewModel`. `VoiceCaptureHost` entrega únicamente `EditDraft`, nunca `Submit`. La presentación provisional permanece separada del borrador. Las generaciones, cancelación al pausar/salir y permisos contextuales se mantienen. Dar permiso no empieza dictado por sí mismo. Errores conservan recuperación explícita del parcial sin enviar.

No cambia el motor local, la frontera `VoiceInput`, el transporte PCM, los límites de seguridad, la ausencia de respuestas habladas ni los requisitos de plataforma de ADR-014. Los SDK proporcionan parciales según su cadencia; se verifica con audio ficticio que llegan antes de Stop en los dispositivos probados, sin simular resultados reales. Una finalización prematura sigue siendo interrupción segura.

## Alternativas y consecuencias

Se descartan mantener para hablar, bloqueo por deslizamiento y envío automático al parar porque ya no corresponden a la interacción solicitada. La revisión del borrador ocurre antes del envío normal; después, un contenido claro mantiene el guardado automático sin confirmación por turno. No cambia ninguna ruta o persistencia del backend, no se gasta API para implementar/probar y no se accede a recuerdos reales.
