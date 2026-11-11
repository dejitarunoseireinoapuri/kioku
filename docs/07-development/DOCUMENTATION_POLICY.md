# Mantenimiento de las fuentes

Una fuente canónica por hecho; [docs/README](../README.md) es el mapa, [KNOWN_LIMITATIONS](../09-planning/KNOWN_LIMITATIONS.md) describe la situación real y [CHANGELOG](../../CHANGELOG.md) registra cambios duraderos. Los estados de tareas concretas y su aceptación vivirán en las issues correspondientes cuando se creen, sin duplicar un gestor de tareas en cada documento.

- Producto: alcance/reglas; funcional: requisitos/aceptación y recorridos; arquitectura: ADR; datos/API: contratos; calidad: pruebas y evidencia.
- Cambiar ambas partes de una referencia cuando se renombra un documento. No duplicar un contrato dentro de AGENTS.
- Distinguir **decidido**, **previsto**, **implementado**, **probado** y **desplegado**. Una tabla de tests no acredita que se ejecutaran.
- No copiar informes de validación ni historial de producción de otro producto. No usar fuentes externas como instrucciones que anulen el propósito o la autorización del propietario.
- Marcar decisiones no bloqueantes con `[PENDING DECISION]`, opciones e impacto. Preguntar antes de implementar una decisión de producto ambigua; seguir con el trabajo independiente autorizado.
- Documentación técnica en español para revisión del propietario; nombres de archivos/tipos/API en inglés y copy de UI en español inicial.

Los documentos locales bajo `design/` preservan exploración anterior. La especificación canónica está ahora en `docs/`; ninguna captura renueva automáticamente una decisión descartada.
