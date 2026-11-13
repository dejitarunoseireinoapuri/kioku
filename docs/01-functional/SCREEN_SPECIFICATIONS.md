# Pantallas y estados

El [contrato de Stitch](STITCH_SOURCE.md) gobierna la consulta visual. Estos estados no son ocho destinos de navegación.

| Estado visual | Contenido y acciones | Regla |
| --- | --- | --- |
| 00 · Acceso | Marca 憶 en coral, kioku, explicación breve y «Continuar con Google» con la marca oficial del proveedor. | Un solo inicio de acceso pendiente; no solicitar micrófono ni clave API. La elección de cuenta usa la interfaz nativa de Google. |
| 00b · Entrando | Marca 憶, kioku y «Entrando en Kioku…», con progreso indeterminado. | Cubre el acceso pendiente y la preparación de la pantalla inicial. No anticipa autorización, no muestra recuerdos ni impone una duración mínima. Reduce Motion mantiene el símbolo estático. |
| 01 · Preparado | Kioku, Ajustes discreto, campo de texto y botones Explicar/Preguntar. | Micrófono inactivo hasta mantener pulsado. Tap elige intención escrita; hold inicia esa intención de voz. |
| 02 · Bloqueado | Candado, indicación de manos libres, contador/onda de captura, Cancelar y Terminar. | No termina por silencio ni al retirar el dedo. No hay otro paso Guardar. |
| 03 · Aclarar | Relato pendiente, pregunta y respuesta contextual por voz/texto. | No mostrar guardado; no exigir confirmar un resumen. |
| 04 · Guardado | Confirmación posterior al commit y acceso al relato. | Sin botón de aprobación; listo para otro turno. |
| 05 · Consultar | Pregunta, respuesta, lectura/parada de voz y fuente textual. | Controles son de respuesta sintetizada, no de grabación original. |
| 06 · Oferta | Afirmación nueva y Sí, recuérdalo / No, gracias. | Pendiente hasta aceptación; la intención sigue siendo Preguntar. |
| 07 · Fuente y control | Texto original, corrección distinguida y acción contextual de olvidar. | No sobrescribir visualmente el relato histórico como si fuera el dato actual. Volver retorna al origen. |
| 08 · Sin red | Necesitas conexión, reintento y entradas indisponibles. | No ofrece cola offline. |

El propietario elige el logo 憶 y solicita en Stitch el rediseño del acceso y una pantalla de carga mientras entra con Google. Se añaden 00/00b a las ocho maquetas del recorrido de memoria, sin sustituirlas. [Marca y acceso](BRAND_PROPOSAL.md) documenta los diseños y su estado de integración. La carga también representa la restauración de sesión y la consulta de configuración previas a la autorización; se retira al recibir el resultado real, sin espera artificial. Cancelar Google devuelve el acceso disponible. Un fallo termina la carga y conserva la presentación de errores/reintento/cierre de sesión correspondiente al estado existente; no deja un bucle de espera ni habilita la pantalla inicial sin autorización.

Ajustes muestra cuenta, estado de IA, «Comprobar configuración» y «Cerrar sesión». Comprobar no pierde el borrador; cerrar sesión o cambiar identidad retira conversación/fuente anteriores. El propietario acepta por ahora alta/sustitución de clave desde el PC hacia el servidor, sin formulario móvil; es el recorrido vigente de UC-002 según ADR-008.

Usar recursos de texto, tokens y semántica accesible. Nunca mostrar identificadores internos, excepciones del proveedor, saldos inventados o garantías de verificación. La tipografía ampliada y el teclado pueden exigir desplazamiento; no ocultar controles bajo insets.

Ajuste solicitado por el propietario el 13 de noviembre: el contenido inicial empieza tras el margen normal, sin un hueco superior reservado ni el espaciador fijo de la maqueta. La etiqueta elegida para el botón es **Explicar**, sustituyendo la propuesta «Contar»; el nombre funcional de la intención continúa siendo «Contar un recuerdo». Las etiquetas de ambos botones se mantienen en una línea; si no caben juntas por ancho o tamaño de letra, los botones se apilan sin reducir la fuente ni cortar el texto.
