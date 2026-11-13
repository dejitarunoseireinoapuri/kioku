# Estado, concurrencia y ciclo de vida

Estado inmutable y observable mediante `StateFlow`; `MutableStateFlow` privado. Intenciones tipadas y estados excluyentes sellados, evitando combinaciones de booleanos como grabando+guardado+cancelado.

- Captura: `Idle`, `Holding`, `Locked`, `Processing`, `AwaitingClarification`, `Saved`, `Failed`, `Cancelled`.
- Consulta: `Ready`, `Retrieving`, `SpeakingAnswer`, `Answered`, `AwaitingClarification`, `InsufficientEvidence`, `Failed`.
- Sesión: identidad resuelta separada de cuenta/configuración autorizadas.
- Cada operación lleva identificador y generación de sesión; una respuesta tardía de otra cuenta, turno cancelado o memoria borrada no actualiza UI.

Coroutines estructuradas; cancelación propagada; listeners desechados con su scope. Los efectos de navegación/anuncio no transportan hechos duraderos. Una rotación no debe reenviar la misma mutación ni duplicar una petición de pago.

Una operación de servidor muestra procesamiento en el contexto que la inició. Puede bloquear la mutación incompatible; no ocultar controles esenciales para detener audio ni presentar un blur obligatorio durante una grabación. Se adopta de Wonderdrop preservar la pantalla y no navegar por un éxito supuesto; su overlay de regalos no se copia literalmente.

Cerrar sesión o cambiar identidad limpia contenido privado, cachés de recuperación y reproducción. Al volver a primer plano, revalidar sesión y datos de servidor sin pisar texto aún no enviado. No restaurar memoria desde caché local como si fuera una lectura autorizada nueva.

Las políticas exactas de segundo plano y audio interrumpido figuran como pendientes; no implementar escucha oculta ni servicio de micrófono en segundo plano sin decisión.

K1 implementa `Loading`, `SignedOut`, `Authorized` y `Blocked`: primero identidad nativa, después autorización/configuración de servidor. El puente nativo elimina listeners y cancela operaciones al desecharse; eventos duplicados no reinician la sesión. Root y conversación tienen almacenes de ViewModels propios para no reutilizar otra instancia/cuenta. Comprobar configuración conserva el árbol autorizado/borrador hasta recibir resultado; una denegación cierra ese contenido. Las pruebas de estados y UI cubren respuestas tardías, cierre y nueva sesión. Restauración de sesión real/rotación/segundo plano en ambos sistemas sigue pendiente de integración; no se afirma retención de borrador tras recreación nativa.
