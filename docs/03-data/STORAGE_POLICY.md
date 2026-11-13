# Persistencia y ciclo de vida

## Memoria

Firestore conserva texto y referencias/contexto mínimos por cuenta. No hay base de negocio local ni lectura de memoria offline. Preferencias no sensibles de dispositivo y sesión nativa pueden persistir; no guardar claves permanentes en preferencias, backups o una colección legible.

## Audio y entradas pendientes

Captura temporal explícita, excluida de copias/galería. Transcribir y limpiar; cancelar limpia sin crear recuerdos. El transporte puede requerir un objeto temporal con acceso limitado por cuenta, operación y caducidad, nunca una URL pública permanente. La política concreta de timeout/límite/limpieza debe probarse antes de uso real.

Una entrada ya iniciada que pierde red es un error recuperable, no autorización para una cola offline o para prometer guardado. La conservación temporal necesaria para reintentar queda limitada al contexto definido de esa operación.

## Corrección y borrado

Corrección: cambiar canónico y revisión; retirar de búsqueda derivados obsoletos. Borrado: bloquear recuperación, retirar el texto objetivo de sus fuentes/fragmentos, limpiar derivados y contexto que puedan reconstruirlo. Preservar asuntos ajenos al alcance.

Un tombstone no incluye el contenido borrado. El éxito comunicado debe corresponder al estado confirmado; no describir como eliminación física global lo que sea una revocación seguida de limpieza. Reejecutar un job viejo o un recibo no resucita el dato.

## Recuperación

La misma identidad recupera la memoria guardada en otro móvil. No equivale a restaurar un estado anterior ni a recuperar un borrado. Una futura política de restauración deberá respetar las revocaciones.

Decisión del propietario al iniciar K2: conservar fuentes/recuerdos hasta que se borren y **no activar backups históricos/PITR adicionales**. No caducan al cerrar la app, reinstalarla o cambiar de móvil. Esto conserva el estado actual; no permite volver a un día anterior tras un borrado accidental. Antes de datos reales se comprueba la configuración remota, sin modificar una política previa no revisada silenciosamente.

K2 delimita los datos operativos: pendientes/fallos con contexto, 24 h desde la última actividad admitida; recibos terminales, siete días, sin copias del texto; contadores numéricos de uso, 30 días. El cliente/servidor rechaza pendientes caducados aunque TTL aún no los haya retirado. El borrado físico por TTL es asíncrono; debe estar activado y comprobado. Fuentes/recuerdos no tienen campo de caducidad. Los datos en RAM de la sesión no se guardan en preferencias/backups móviles. K3 mantendrá las preguntas únicamente como contexto de sesión de Kioku; la retención del proveedor es una frontera distinta.

## Consultas K3

Pregunta, aclaraciones y respuesta permanecen solo en RAM de la sesión y de la petición; nunca en la memoria canónica, preferencias o copias móviles. Un recibo de consulta con datos mínimos sin texto caduca a las 24 h mediante el TTL ya previsto para operaciones. Perder la respuesta no permite reconstruirla desde un recibo: repetir requiere acción explícita del propietario. La preparación aditiva de índices no añade versiones históricas ni backups; el original permanece en su fuente actual. Límites y evidencia en [K3_VALIDATION](../09-planning/K3_VALIDATION.md).

## Credencial K1

La sesión nativa queda a cargo de Firebase Auth; un marcador local no secreto distingue autenticación aceptada/cancelada. No se persiste una clave OpenAI en el móvil. La propuesta administrativa usa Secret Manager con versiones inmutables y una referencia privada vigente. Un candidato rechazado antes de validar no se sube. Un conflicto confirmado puede descartar su candidato nuevo; un commit incierto conserva la versión hasta resolverlo mediante metadatos, para no destruir una credencial activa. Versiones anteriores/huérfanas requieren revisión y retirada explícita; no hay limpieza automática desplegada. Nada de ello representa historial de recuerdos ni permite recuperar contenido olvidado.
