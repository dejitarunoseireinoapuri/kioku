# Mapa documental

Revisión vigente de fuentes: [chat único y Fuentes con URL/gestión](02-architecture/ADR/ADR-017-unified-source-chat.md), archivos solo desde Compartir. [Validación local, activación en Honor y cómo probar](09-planning/UNIFIED_SOURCES_VALIDATION.md). Desplegada e instalada en Honor con prueba de PDF ficticio correcta, sin API; sustituye la activación anterior de Documentos.

Integración solicitada el 17 de noviembre: [núcleo nuevo en la app, inicio vacío y sin pruebas API de pago](09-planning/R3_INTEGRATION_VALIDATION.md). El propietario autoriza borrar los recuerdos actuales al activar la nueva versión; cuenta y acceso se conservan. R2 mantiene sus pendientes históricos.

Estado R2 vigente: [simulación y validación con presupuesto acotado](09-planning/R2_BOUNDED_VALIDATION.md), autorizado inicialmente en 15 USD adicionales y ampliado primero a 20 y después a 25 sin reiniciar el contador. Conserva la [validación previa con Sol alto](09-planning/R2_HIGH_VALIDATION.md), los informes de [asignación/soporte propio](09-planning/R2_ASSIGNMENT_VALIDATION.md) y la [reserva h histórica](09-planning/R2_SCOPE_VALIDATION.md), sin recalificarlos. R2 permanece abierta hasta cumplir sus criterios.

Una fuente por tipo de decisión. Los documentos son el contrato previsto; el estado real se registra en [KNOWN_LIMITATIONS.md](09-planning/KNOWN_LIMITATIONS.md). La evidencia ejecutable se añade al implementar cada fase. Una descripción de pruebas no equivale a una prueba superada.

| Área | Entrada | Propietario del contenido |
| --- | --- | --- |
| Producto | [PRODUCT_SCOPE](00-product/PRODUCT_SCOPE.md) | Alcance y exclusiones |
| Reglas | [BUSINESS_RULES](00-product/BUSINESS_RULES.md) | Invariantes de memoria |
| Vocabulario | [GLOSSARY](00-product/GLOSSARY.md) | Significado de los conceptos |
| Funciones | [FUNCTIONAL_REQUIREMENTS](01-functional/FUNCTIONAL_REQUIREMENTS.md) | Requisitos FR y aceptación AC |
| Recorridos | [USE_CASES](01-functional/USE_CASES.md), [FLOWS](01-functional/FLOWS.md) | Casos UC y transiciones |
| Pantallas | [SCREEN_SPECIFICATIONS](01-functional/SCREEN_SPECIFICATIONS.md), [STITCH_SOURCE](01-functional/STITCH_SOURCE.md), [BRAND_PROPOSAL](01-functional/BRAND_PROPOSAL.md) | Comportamiento visual, referencia y marca en revisión |
| Arquitectura | [ARCHITECTURE](02-architecture/ARCHITECTURE.md), [ADR](02-architecture/ADR/README.md) | Límites y decisiones |
| Revisión del núcleo | [MEMORY_CORE_V2](02-architecture/MEMORY_CORE_V2.md), [ADR-012](02-architecture/ADR/ADR-012-independent-memory-units.md) | Diseño P1–P3 aceptado; prototipo determinista R1, integración pendiente |
| Datos | [DATA_MODEL](03-data/DATA_MODEL.md) | Información canónica y derivada |
| API | [API_CONTRACT](04-api/API_CONTRACT.md) | Operaciones y garantías externas |
| Seguridad | [SECURITY](05-security/SECURITY.md) | Autorización y secretos |
| Calidad | [CODE_QUALITY](06-quality/CODE_QUALITY.md), [TEST_MATRIX](06-quality/TEST_MATRIX.md) | Criterios y evidencia |
| Desarrollo | [DEVELOPMENT_GUIDE](07-development/DEVELOPMENT_GUIDE.md) | Trabajo y comprobación local |
| Gobierno | [DOCUMENTATION_POLICY](07-development/DOCUMENTATION_POLICY.md), [REFERENCE_ADAPTATION](07-development/REFERENCE_ADAPTATION.md) | Mantenimiento y adaptación de Wonderdrop |
| Despliegue | [ENVIRONMENTS](08-deployment/ENVIRONMENTS.md), [K1_REMOTE_SETUP](08-deployment/K1_REMOTE_SETUP.md) | Recursos, configuración privada y operación |
| Plan | [IMPLEMENTATION_PLAN](09-planning/IMPLEMENTATION_PLAN.md) | Secuencia de entrega |
| Cambio del núcleo | [MEMORY_CORE_REBUILD_PLAN](09-planning/MEMORY_CORE_REBUILD_PLAN.md) | R0–R6: decisiones, prueba aislada, integración y migración antes de voz; sin autorización de producción |
| Evidencia del nuevo núcleo | [R1_VALIDATION](09-planning/R1_VALIDATION.md), [prototipo](../prototypes/memory-core/README.md) | Motor aislado y datos ficticios; no acredita interpretación de IA ni producción |
| Evaluación semántica del núcleo | [R2_VALIDATION](09-planning/R2_VALIDATION.md) | Sol medio, corpus ficticio separado, costes, resultados y límites de avance |
| Continuación R2 | [R2_RETENTION_VALIDATION](09-planning/R2_RETENTION_VALIDATION.md) | Conservación de evidencia al editar y evaluación con nuevas historias ficticias |
| Evidencia móvil | [K0_VALIDATION](09-planning/K0_VALIDATION.md) | Compilación/pruebas Android y límites iOS de la base K0 |
| Evidencia de cuenta | [K1_VALIDATION](09-planning/K1_VALIDATION.md), [K1_INTEGRATION_VALIDATION](09-planning/K1_INTEGRATION_VALIDATION.md) | Primera frontera histórica e integración nativa/remota actual |
| Evidencia de captura | [K2_VALIDATION](09-planning/K2_VALIDATION.md) | Guardado textual, aclaraciones y distinción entre pruebas locales y activación real |
| Evidencia de consulta | [K3_VALIDATION](09-planning/K3_VALIDATION.md) | Criterios fijados, búsqueda, evidencia vigente y límites de integración |
| Evidencia de control | [K4_VALIDATION](09-planning/K4_VALIDATION.md) | Retirada interna y límites pendientes del control conversacional |
| Voz local | [ADR-014](02-architecture/ADR/ADR-014-local-voice-input.md), [K5_VALIDATION](09-planning/K5_VALIDATION.md) | Gestos, límites, pruebas ficticias Android e iOS pendiente |
| Dictado y borrador | [ADR-015](02-architecture/ADR/ADR-015-dictation-draft.md) | Toque para empezar, X/Stop, transcripción en el campo y envío manual |
| Fuentes compartidas | [SHARED_SOURCES_PLAN](09-planning/SHARED_SOURCES_PLAN.md), [ADR-016](02-architecture/ADR/ADR-016-shared-reference-sources.md), [evidencia](09-planning/SHARED_SOURCES_VALIDATION.md), [probar en Honor](09-planning/SHARED_SOURCES_PILOT.md) | Piloto histórico y función productiva activada en Honor: archivos/web, Firestore y API; pruebas del agente con cero API |

Las conversaciones previas y los prototipos históricos sirven de evidencia de decisiones, no de segunda especificación vigente.

- [R2: evidencia por posiciones, aclaraciones y búsqueda paginada](09-planning/R2_INDEXED_VALIDATION.md).
- [R2: rechazos y falsas ausencias](09-planning/R2_RELIABILITY_VALIDATION.md).
- [R2: evaluación independiente final](09-planning/R2_FINAL_VALIDATION.md).
- [R2: agrupación y rechazos de interpretación](09-planning/R2_GROUPING_VALIDATION.md).
