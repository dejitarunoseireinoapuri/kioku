# Esquema y migraciones

No hay datos de producción ni migración desde Wonderdrop. Nunca importar sus documentos, usuarios, IDs, reglas específicas o fixtures de negocio. La plantilla Expo no contiene una base de recuerdos que deba migrarse.

Cada agregado y DTO externo declara versión. Los lectores rechazan datos malformados de forma controlada, sin completar hechos por defecto. La migración de búsqueda conserva vínculos source/revision/owner y no recupera tombstones.

Antes de una migración: documentar origen/destino, compatibilidad con clientes, alcance, permisos, idempotencia, comprobaciones, rollback o reparación hacia delante y datos ficticios de prueba. Revisar también la semántica de corrección/borrado y restauración.

Cambios aditivos compatibles primero; cambios destructivos o sobre datos reales requieren autorización explícita. Un script debe exigir entorno objetivo y rechazar uno desconocido. No convertir un fallo de configuración en una conexión a producción.
