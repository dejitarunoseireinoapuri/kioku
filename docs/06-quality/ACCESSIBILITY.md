# Accesibilidad

- Targets táctiles mínimos: 48 dp Android; respetar convenciones y áreas accesibles de iOS. No confundir icono pequeño con área de pulsación pequeña.
- Contraste de texto normal al menos 4,5:1; grande/controles al menos 3:1. Revisar los colores reales, no asumir que todo coral es legible.
- Etiqueta, rol, estado y foco para Contar/Preguntar, bloqueo, terminar, cancelar, fuente, detener respuesta y reemplazo de clave. No depender solo del color, icono, voz o vibración.
- Tipografía ampliada sin cortar nombres de acciones. Composer visible con teclado e insets; desplazamiento donde haga falta.
- Hold/deslizamiento requiere una alternativa accesible que produzca la misma intención y estados mediante acciones de accesibilidad; no obligar a un gesto fino como único acceso.
- La voz del asistente tiene texto equivalente y control para detenerla. Haptics suplementarios; nada de cambiar el volumen del dispositivo.
- Respetar movimiento reducido y evitar anunciar el contador de captura continuamente.
- No leer en voz alta ni anunciar el contenido de una clave secreta.

Validación manual en Android con TalkBack e iOS con VoiceOver, además de pruebas de semántica. La alternativa exacta al gesto se concretará con los controles nativos antes de implementar voz; una captura de Stitch no la valida.
