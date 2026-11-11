# Pantallas y estados

El [contrato de Stitch](STITCH_SOURCE.md) gobierna la consulta visual. Estos estados no son ocho destinos de navegación.

| Estado visual | Contenido y acciones | Regla |
| --- | --- | --- |
| 01 · Preparado | Kioku, Ajustes discreto, campo de texto y acciones Contar un recuerdo/Preguntar. | Micrófono inactivo hasta mantener pulsado. Tap elige intención escrita; hold inicia esa intención de voz. |
| 02 · Bloqueado | Candado, indicación de manos libres, contador/onda de captura, Cancelar y Terminar. | No termina por silencio ni al retirar el dedo. No hay otro paso Guardar. |
| 03 · Aclarar | Relato pendiente, pregunta y respuesta contextual por voz/texto. | No mostrar guardado; no exigir confirmar un resumen. |
| 04 · Guardado | Confirmación posterior al commit y acceso al relato. | Sin botón de aprobación; listo para otro turno. |
| 05 · Consultar | Pregunta, respuesta, lectura/parada de voz y fuente textual. | Controles son de respuesta sintetizada, no de grabación original. |
| 06 · Oferta | Afirmación nueva y Sí, recuérdalo / No, gracias. | Pendiente hasta aceptación; la intención sigue siendo Preguntar. |
| 07 · Fuente y control | Texto original, corrección distinguida y acción contextual de olvidar. | No sobrescribir visualmente el relato histórico como si fuera el dato actual. Volver retorna al origen. |
| 08 · Sin red | Necesitas conexión, reintento y entradas indisponibles. | No ofrece cola offline. |

El acceso inicial a cuenta y clave se especificará con el método de autenticación decidido; las ocho maquetas no lo representan todavía. Ajustes permitirá revisar estado de cuenta/configuración de IA y reemplazar clave sin revelar la existente.

Usar recursos de texto, tokens y semántica accesible. Nunca mostrar identificadores internos, excepciones del proveedor, saldos inventados o garantías de verificación. La tipografía ampliada y el teclado pueden exigir desplazamiento; no ocultar controles bajo insets.
