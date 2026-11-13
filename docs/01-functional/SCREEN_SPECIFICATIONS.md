# Pantallas y estados

El [contrato de Stitch](STITCH_SOURCE.md) gobierna la consulta visual. Estos estados no son ocho destinos de navegación.

| Estado visual | Contenido y acciones | Regla |
| --- | --- | --- |
| 00 · Acceso | Marca 憶 en coral, kioku, explicación breve y «Continuar con Google» con la marca oficial del proveedor. | Un solo inicio de acceso pendiente; no solicitar micrófono ni clave API. La elección de cuenta usa la interfaz nativa de Google. |
| 00b · Entrando | Marca 憶, kioku y «Entrando...»; los tres puntos aparecen de forma progresiva y cíclica, reservando siempre su ancho para mantener «Entrando» fijo. | Cubre el acceso pendiente y la preparación de la pantalla inicial. No anticipa autorización, no muestra recuerdos ni impone una duración mínima. Reduce Motion mantiene símbolo y tres puntos estáticos; el anuncio accesible no cambia con la animación. |
| 01 · Preparado | Kioku, acceso textual `[ Ajustes ]` sin marco en reposo y coral mientras se pulsa, rótulos «Que no se pierda» / «Tira del hilo», campo de texto y botones Explicar/Preguntar. | Ajustes abre directamente con objetivo táctil de al menos 48 dp de alto y nombre accesible «Ajustes». Micrófono inactivo hasta mantener pulsado. Tap elige intención escrita; hold inicia esa intención de voz. |
| 02 · Bloqueado | Candado, indicación de manos libres, contador/onda de captura, Cancelar y Terminar. | No termina por silencio ni al retirar el dedo. No hay otro paso Guardar. |
| 03 · Aclarar | Relato pendiente, pregunta y respuesta contextual por voz/texto. | No mostrar guardado; no exigir confirmar un resumen. |
| 04 · Guardado | Confirmación posterior al commit y acceso al relato. | Sin botón de aprobación; listo para otro turno. |
| 05 · Consultar | Pregunta, respuesta, lectura/parada de voz y fuente textual. | Controles son de respuesta sintetizada, no de grabación original. |
| 06 · Oferta | Afirmación nueva y Sí, recuérdalo / No, gracias. | Pendiente hasta aceptación; la intención sigue siendo Preguntar. |
| 07 · Fuente y control | Texto original, corrección distinguida y acción contextual de olvidar. | No sobrescribir visualmente el relato histórico como si fuera el dato actual. Volver retorna al origen. |
| 08 · Sin red | Necesitas conexión, reintento y entradas indisponibles. | No ofrece cola offline. |

El propietario elige el logo 憶 y solicita en Stitch el rediseño del acceso y una pantalla de carga mientras entra con Google. Se añaden 00/00b a las ocho maquetas del recorrido de memoria, sin sustituirlas. [Marca y acceso](BRAND_PROPOSAL.md) documenta los diseños y su estado de integración. La carga también representa la restauración de sesión y la consulta de configuración previas a la autorización; se retira al recibir el resultado real, sin espera artificial. Cancelar Google devuelve el acceso disponible. Un fallo termina la carga y conserva la presentación de errores/reintento/cierre de sesión correspondiente al estado existente; no deja un bucle de espera ni habilita la pantalla inicial sin autorización.

Ajustes muestra secciones «TU CUENTA» e «INTELIGENCIA», identidad y estado en negrita, proveedor Google, «Actualizar estado» y «Cerrar sesión». Actualizar consulta la misma configuración remota y no pierde el borrador; no es una prueba de inferencia OpenAI. Durante la consulta muestra «Actualizando...» y evita doble envío. Cerrar sesión o cambiar identidad retira conversación/fuente anteriores. La gestión de clave sigue en el PC/servidor; si falta, se indica añadirla desde el ordenador, sin formulario móvil, según UC-002 y ADR-008.

JetBrains Mono es la fuente de la app, incluidos nombre, títulos, texto y contador; Google mantiene su tipografía oficial. Se comparten las esquinas de 6 dp entre Google y Explicar/Preguntar. Por petición del propietario se eliminan los rótulos globales de vista previa/datos ficticios y el sufijo de instalación. Los recorridos continúan agrupados explícitamente como ejemplos y los intentos de guardar/grabar/borrar todavía no conectados no simulan éxito.

Usar recursos de texto, tokens y semántica accesible. Nunca mostrar identificadores internos, excepciones del proveedor, saldos inventados o garantías de verificación. La tipografía ampliada y el teclado pueden exigir desplazamiento; no ocultar controles bajo insets.

Respuesta táctil común, por petición posterior del propietario: no hay onda, halo, relleno superpuesto ni cambio de fondo al pulsar botones. Las acciones muestran su texto/icono en coral mientras se mantienen pulsadas y recuperan el color de reposo al soltar o cancelar. El foco de teclado usa ese mismo cambio de contenido, sin marco ni fondo adicional. Explicar/Preguntar conservan sus colores persistentes según la intención seleccionada y tampoco añaden onda. Se incluyen Ajustes, acciones de configuración/sesión, navegación, envío, fuentes y ejemplos. El botón Google mantiene fondo blanco, G original y tipografía del proveedor, cambiando solo la etiqueta durante la pulsación.

Ajuste solicitado por el propietario el 13 de noviembre: el contenido inicial empieza tras el margen normal, sin un hueco superior reservado ni el espaciador fijo de la maqueta. La etiqueta elegida para el botón es **Explicar**, sustituyendo la propuesta «Contar»; el nombre funcional de la intención continúa siendo «Contar un recuerdo». Las etiquetas de ambos botones se mantienen en una línea; si no caben juntas por ancho o tamaño de letra, los botones se apilan sin reducir la fuente ni cortar el texto.
