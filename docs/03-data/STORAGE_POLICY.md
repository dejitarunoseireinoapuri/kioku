# Persistencia y ciclo de vida

Propuesta pendiente del 16 de noviembre: [núcleo v2](../02-architecture/MEMORY_CORE_V2.md) conserva evidencia literal segmentada y metadatos de procedencia sin archivo completo paralelo ni historial de valores corregidos. El [plan R4–R5](../09-planning/MEMORY_CORE_REBUILD_PLAN.md) especifica staging temporal, limpieza y límites de reversión sin backups históricos; requiere autorización antes de datos reales. No hay cambio de retención ni migración activa por documentarlo.

## Memoria

Firestore conserva texto y referencias/contexto mínimos por cuenta. No hay base de negocio local ni lectura de memoria offline. Preferencias no sensibles de dispositivo y sesión nativa pueden persistir; no guardar claves permanentes en preferencias, backups o una colección legible.

## Audio y entradas pendientes

Captura temporal explícita, excluida de copias/galería. Transcribir y limpiar; cancelar limpia sin crear recuerdos. El transporte puede requerir un objeto temporal con acceso limitado por cuenta, operación y caducidad, nunca una URL pública permanente. La política concreta de timeout/límite/limpieza debe probarse antes de uso real.

Una entrada ya iniciada que pierde red es un error recuperable, no autorización para una cola offline o para prometer guardado. La conservación temporal necesaria para reintentar queda limitada al contexto definido de esa operación.

## Corrección y borrado

Corrección: cambiar canónico y revisión; retirar de búsqueda derivados obsoletos. Borrado: bloquear recuperación, retirar el texto objetivo de sus fuentes/fragmentos, limpiar derivados y contexto que puedan reconstruirlo. Preservar asuntos ajenos al alcance.

Un tombstone no incluye el contenido borrado. El éxito comunicado debe corresponder al estado confirmado; no describir como eliminación física global lo que sea una revocación seguida de limpieza. Reejecutar un job viejo o un recibo no resucita el dato.

Primera frontera K4, solo local: retirada de fuente completa con todos sus fragmentos y proyecciones en el mismo commit, sin contenido en la revocación duradera. Los recibos/textos pendientes vinculados se reemplazan y caducan en 24 h; el recibo mínimo de retirada, siete días. La marca `revocations/{sourceUuid}` no tiene TTL, para que caducar el recibo no permita resucitar una captura. No habilita todavía borrado selectivo/corrección o limpieza del chat entre dispositivos; no se debe exponer a una petición de fragmento como si autorizara eliminar todo el relato. [ADR-011](../02-architecture/ADR/ADR-011-memory-control.md).

Continuación K4 activada con autorización y comprobada en Honor: retirada selectiva/corrección mediante reemplazo atómico con nuevos IDs, preservación del resto del texto y revocación del origen. La fuente corregida no conserva el dato sustituido; los demás asuntos mantienen su fecha y una corrección tiene recepción propia. El recibo de control confirmado caduca a los siete días, sin orden/corrección y con vencimiento lógico. La revisión mínima de memoria y revocaciones no caducan ni contienen texto. La app actualizada limpia chat/contexto/fuentes después del éxito, los oculta al pasar a segundo plano y revalida antes de volver a mostrarlos. No garantiza limpieza instantánea de otro dispositivo que siga en primer plano o de un cliente antiguo. No activa backups ni persistencia local de recuerdos. Recorridos conversacionales e iOS pendientes según [evidencia K4](../09-planning/K4_VALIDATION.md).

Por petición posterior del propietario, el objetivo del popup y del aviso «He olvidado «recuerdo»» solo vive en RAM de presentación. Cancelar no crea operación de borrado; confirmar conserva los mismos IDs/versiones para sus reintentos. El aviso no forma parte de recibos, mensajes de chat o contexto enviado al proveedor y se limpia al escribir otra entrada, cambiar intención o invalidar/salir del ámbito/cuenta.

## Olvido de copias K4 activo

Olvido de copias K4 activo: inventario, decisiones y transformaciones quedan en RAM y no se guardan como jobs. Todas las fuentes/unidades/índices afectados, pendientes vinculados y revocaciones se cambian juntos; fallo en un relato impide toda la escritura. Los recibos siguen mínimos/siete días y validan las referencias actuales antes de recuperar; ninguna pregunta/orden se incorpora a ellos. No se promete purga de RAM de otro dispositivo en primer plano ni de un cliente antiguo. Límites operativos y activación en [K4_VALIDATION](../09-planning/K4_VALIDATION.md).

## Recuperación

La misma identidad recupera la memoria guardada en otro móvil. No equivale a restaurar un estado anterior ni a recuperar un borrado. Una futura política de restauración deberá respetar las revocaciones.

Decisión del propietario al iniciar K2: conservar fuentes/recuerdos hasta que se borren y **no activar backups históricos/PITR adicionales**. No caducan al cerrar la app, reinstalarla o cambiar de móvil. Esto conserva el estado actual; no permite volver a un día anterior tras un borrado accidental. Antes de datos reales se comprueba la configuración remota, sin modificar una política previa no revisada silenciosamente.

K2 delimita los datos operativos: pendientes/fallos con contexto, 24 h desde la última actividad admitida; recibos terminales, siete días, sin copias del texto; contadores numéricos de uso, 30 días. El cliente/servidor rechaza pendientes caducados aunque TTL aún no los haya retirado. El borrado físico por TTL es asíncrono; debe estar activado y comprobado. Fuentes/recuerdos no tienen campo de caducidad. Los datos en RAM de la sesión no se guardan en preferencias/backups móviles. K3 mantendrá las preguntas únicamente como contexto de sesión de Kioku; la retención del proveedor es una frontera distinta.

## Consultas K3

Continuación conversacional K4 activa: el ticket de interpretación no persiste preguntas, planes ni propuestas; solo digest ligado al ID aleatorio y metadatos con vigencia/TTL cinco minutos. Al vincular un único hijo conserva metadatos siete días para recuperación, sin ampliar la admisión lógica de una oferta no confirmada. Una oferta aceptada puede producir el pendiente temporal de captura existente, con época para impedir su recuperación tras un cambio. No se crea historial de chat, backups ni otra copia del dato retirado. [Contrato](../04-api/API_CONTRACT.md).

Pregunta, aclaraciones y respuesta permanecen solo en RAM de la sesión y de la petición; nunca en la memoria canónica, preferencias o copias móviles. Un recibo de consulta con datos mínimos sin texto caduca a las 24 h mediante el TTL ya previsto para operaciones. Perder la respuesta no permite reconstruirla desde un recibo: repetir requiere acción explícita del propietario. La preparación aditiva de índices no añade versiones históricas ni backups; el original permanece en su fuente actual. Límites y evidencia en [K3_VALIDATION](../09-planning/K3_VALIDATION.md).

## Credencial K1

La sesión nativa queda a cargo de Firebase Auth; un marcador local no secreto distingue autenticación aceptada/cancelada. No se persiste una clave OpenAI en el móvil. La propuesta administrativa usa Secret Manager con versiones inmutables y una referencia privada vigente. Un candidato rechazado antes de validar no se sube. Un conflicto confirmado puede descartar su candidato nuevo; un commit incierto conserva la versión hasta resolverlo mediante metadatos, para no destruir una credencial activa. Versiones anteriores/huérfanas requieren revisión y retirada explícita; no hay limpieza automática desplegada. Nada de ello representa historial de recuerdos ni permite recuperar contenido olvidado.

Recuperación de captura: el cambio de modo conserva únicamente las tarjetas/IDs/comandos de guardados pendientes en RAM, dentro de los 40 mensajes; no añade persistencia móvil ni cola offline. Se eliminan por reinicio, cambio de revisión/cuenta o fin del ámbito. getOperation puede cerrar failed un recibo processing sin concesión válida; no cambia la retención existente, fuentes saved ni la concesión de otro proceso.

Decisión vigente del 15 de noviembre: histórico de diez intercambios por modo solo en RAM de sesión; no se limpia por cambiar Explicar/Preguntar. Se invalida al cambiar la revisión, reiniciar o cerrar ámbito/cuenta. Un cambio confirmado reemplaza el contenido por marcadores de acción sin datos del recuerdo; el texto nombrado del aviso continúa siendo transitorio separado. La presentación de fichas en primera persona se descarta tras responder y no se guarda en Firestore, caché persistente o backups.
