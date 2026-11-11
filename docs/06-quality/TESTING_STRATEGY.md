# Estrategia de pruebas

Pruebas seleccionadas por conducta y riesgo, con datos ficticios. Los criterios están en [FUNCTIONAL_REQUIREMENTS](../01-functional/FUNCTIONAL_REQUIREMENTS.md); [TEST_MATRIX](TEST_MATRIX.md) define los casos previstos, no resultados ejecutados.

## Domain y Presentation

Máquinas de estado de hold/lock/cancel, intención, aclaración, propuesta, corrección y borrado. ViewModels con tiempo virtual/dispatchers deterministas, respuestas tardías, errores y cambios de cuenta. Verificar que no exista éxito anticipado ni guardado de preguntas como hechos.

## Backend y recuperación

Probar evidencia, fechas relativas, paráfrasis, ambigüedades, deseo frente a hecho y ausencia de información. Usar un corpus sintético representativo de las preguntas del propietario. Medir calidad de recuperación y fidelidad a fuentes antes de elegir índice/modelos; no conformarse con un ejemplo literal que funcione.

La primera evaluación es [M0](../09-planning/IMPLEMENTATION_PLAN.md#m0--prueba-temprana-de-memoria), previa a K0: prototipo por texto con relatos persistidos, consultas desde sesiones nuevas y conjunto reservado de validación. Separar interpretación/guardado, recuperación y respuesta; aplicar los umbrales y bloqueos críticos del plan. Registrar todas las ejecuciones, coste/latencia y fallos; no usar únicamente el modelo evaluado como juez ni ajustar con los casos reservados sin renovar la validación. Repetir las comprobaciones afectadas al cambiar modelos o integrar los adaptadores reales en K2/K3/K4.

Contratos de repositorio contra adapters Android/iOS. Emulator Suite para autorización, versiones, atomicidad, idempotencia y limpieza. Dobles de OpenAI por defecto; separar de pruebas live, que requieren credencial y uso real autorizados. Emulator no prueba atestación de App Check ni retención real de OpenAI.

## UI y dispositivo

Semántica accesible estable, no selectores por copy mutable. Mantener, deslizar, bloquear, terminar, cancelar, escribir, teclado, interrupción, permiso denegado, lectura/parada de respuesta y reconexión. TalkBack/VoiceOver, fuente ampliada y tamaño pequeño.

Ampliar pruebas solo por invariantes compartidas, cambio transversal o fallo que lo justifique. No ejecutar suites ajenas para cambios aislados. No desinstalar ni limpiar datos de un móvil personal por rutina; usar emulador/instalación aislada y preservar firmas/sesiones.
