# Pantallas y estados

El [contrato de Stitch](STITCH_SOURCE.md) gobierna la consulta visual. Estos estados no son ocho destinos de navegación.

| Estado visual | Contenido y acciones | Regla |
| --- | --- | --- |
| 01 · Preparado | Kioku, Ajustes discreto, campo de texto y botones Explicar/Preguntar. | Micrófono inactivo hasta mantener pulsado. Tap elige intención escrita; hold inicia esa intención de voz. |
| 02 · Bloqueado | Candado, indicación de manos libres, contador/onda de captura, Cancelar y Terminar. | No termina por silencio ni al retirar el dedo. No hay otro paso Guardar. |
| 03 · Aclarar | Relato pendiente, pregunta y respuesta contextual por voz/texto. | No mostrar guardado; no exigir confirmar un resumen. |
| 04 · Guardado | Confirmación posterior al commit y acceso al relato. | Sin botón de aprobación; listo para otro turno. |
| 05 · Consultar | Pregunta, respuesta, lectura/parada de voz y fuente textual. | Controles son de respuesta sintetizada, no de grabación original. |
| 06 · Oferta | Afirmación nueva y Sí, recuérdalo / No, gracias. | Pendiente hasta aceptación; la intención sigue siendo Preguntar. |
| 07 · Fuente y control | Texto original, corrección distinguida y acción contextual de olvidar. | No sobrescribir visualmente el relato histórico como si fuera el dato actual. Volver retorna al origen. |
| 08 · Sin red | Necesitas conexión, reintento y entradas indisponibles. | No ofrece cola offline. |

El propietario aprueba el acceso inicial con Kioku, explicación y «Continuar con Google», usando sus directrices oficiales de marca. Las ocho maquetas no representan ese acceso. Ajustes muestra cuenta, estado de IA, «Comprobar configuración» y «Cerrar sesión». Comprobar no pierde el borrador; cerrar sesión o cambiar identidad retira conversación/fuente anteriores. La implementación actual prepara alta/sustitución de clave desde el PC hacia el servidor, sin formulario móvil; ese alcance de UC-002 sigue explícito en ADR-008 antes de cerrar K1.

Usar recursos de texto, tokens y semántica accesible. Nunca mostrar identificadores internos, excepciones del proveedor, saldos inventados o garantías de verificación. La tipografía ampliada y el teclado pueden exigir desplazamiento; no ocultar controles bajo insets.

Ajuste solicitado por el propietario el 13 de noviembre: el contenido inicial empieza tras el margen normal, sin un hueco superior reservado ni el espaciador fijo de la maqueta. La etiqueta elegida para el botón es **Explicar**, sustituyendo la propuesta «Contar»; el nombre funcional de la intención continúa siendo «Contar un recuerdo». Las etiquetas de ambos botones se mantienen en una línea; si no caben juntas por ancho o tamaño de letra, los botones se apilan sin reducir la fuente ni cortar el texto.
