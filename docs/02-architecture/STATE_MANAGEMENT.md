# Estado, concurrencia y ciclo de vida

Estado inmutable y observable mediante `StateFlow`; `MutableStateFlow` privado. Intenciones tipadas y estados excluyentes sellados, evitando combinaciones de booleanos como grabando+guardado+cancelado.

- Captura: `Idle`, `Holding`, `Locked`, `Processing`, `AwaitingClarification`, `Saved`, `Failed`, `Cancelled`.
- Consulta: `Ready`, `Retrieving`, `SpeakingAnswer`, `Answered`, `AwaitingClarification`, `InsufficientEvidence`, `Failed`.
- Sesión: identidad resuelta separada de cuenta/configuración autorizadas.
- Cada operación lleva identificador y generación de sesión; una respuesta tardía de otra cuenta, turno cancelado o memoria borrada no actualiza UI.

Coroutines estructuradas; cancelación propagada; listeners desechados con su scope. Los efectos de navegación/anuncio no transportan hechos duraderos. Una rotación no debe reenviar la misma mutación ni duplicar una petición de pago.

Una operación de servidor mantiene el contexto que la inició. El propietario sustituye la carga completa durante el uso por una franja inferior compacta de marca para captura/aclaración, recuperación, consulta, fuente y configuración. Reserva su propio espacio sin superponer ni desmontar navegación/ViewModels; el contenido conserva lectura, desplazamiento, semántica y navegación. El estado de cada operación deshabilita envíos/intenciones incompatibles y Ajustes no permite cargar ejemplos mientras hay trabajo pendiente. Cerrar sesión cancela/invalida el trabajo de la cuenta. Volver desde una fuente pendiente conserva la respuesta y permite terminar esa lectura sin reenviarla; una consulta nueva sigue invalidando el resultado anterior mediante las generaciones existentes. No fuerza foco a la franja ni oculta el contenido a tecnologías de asistencia. Un resultado real, también error, termina el indicador sin temporizadores ni operaciones duplicadas. El acceso inicial sigue a pantalla completa hasta resolver autorización. No ocultar controles esenciales para detener audio ni mostrar esta espera durante una grabación. Se adopta de Wonderdrop preservar la pantalla y no navegar por un éxito supuesto; su overlay de regalos no se copia literalmente.

Cerrar sesión o cambiar identidad limpia contenido privado, cachés de recuperación y reproducción. Al volver a primer plano, revalidar sesión y datos de servidor sin pisar texto aún no enviado. No restaurar memoria desde caché local como si fuera una lectura autorizada nueva.

Las políticas exactas de segundo plano y audio interrumpido figuran como pendientes; no implementar escucha oculta ni servicio de micrófono en segundo plano sin decisión.

K1 implementa `Loading`, `SignedOut`, `Authorized` y `Blocked`: primero identidad nativa, después autorización/configuración de servidor. El puente nativo elimina listeners y cancela operaciones al desecharse; eventos duplicados no reinician la sesión. Root y conversación tienen almacenes de ViewModels propios para no reutilizar otra instancia/cuenta. Comprobar configuración conserva el árbol autorizado/borrador hasta recibir resultado; una denegación cierra ese contenido. Las pruebas de estados y UI cubren respuestas tardías, cierre y nueva sesión.

Corrección K2 de recreación: los almacenes usan `rememberViewModelStoreOwner` de Lifecycle 2.11, ya fijado en el catálogo. Sobreviven a cambios de configuración del host y se limpian al abandonar definitivamente su ámbito; conversación continúa ligada a ID y generación de sesión. Android conserva sus repositorios con el mismo ciclo de vida nativo y vuelve a vincular el adaptador de acceso a la Activity actual mediante referencia débil, sin retener la Activity destruida. Girar no cancela ni reenvía una captura; se conservan borrador, aclaración, respuesta parcial, confirmación y navegación a la fuente. Cerrar sesión sigue limpiando el contenido privado. Se sigue la [API oficial de ámbitos de ViewModel](https://developer.android.com/topic/libraries/architecture/viewmodel/viewmodel-apis).

Las pruebas de recreación/orientación Android están en la [evidencia K2](../09-planning/K2_VALIDATION.md). Esto conserva estado en memoria durante la recreación nativa; no persiste texto en disco ni añade cola offline. La recuperación de una intervención tras muerte del proceso o cierre completo continúa pendiente, igual que la validación de este build en iOS.
