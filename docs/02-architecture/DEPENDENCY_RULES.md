# Dependencias permitidas

| Desde | Puede depender de | No puede depender de |
| --- | --- | --- |
| Compose UI | Modelos Presentation, diseño, rutas | Firebase, repositorios, DTO, secretos |
| ViewModel | Casos/modelos/errores Domain, coroutines | SDK Firebase, micrófono nativo, Firestore |
| Domain | Kotlin portable y abstracciones coroutines justificadas | Compose, Koin, Firebase, HTTP, filesystem, SDK OpenAI |
| Contrato Repository | Tipos Domain | Snapshot/DTO/objeto nativo |
| Data | Domain, transportes y mapeadores | Pantallas, decisiones visuales |
| Adaptador nativo | Contratos compartidos y SDK oficiales | Reglas de negocio de UI |
| Host Android/iOS | shared y SDK plataforma | Admin SDK o clave permanente incorporada |
| Backend | Contratos TypeScript, servicios, SDK servidor | Presentation móvil o identidad enviada sin verificar |

Koin se utiliza en composición, no como service locator dentro de Domain. Evitar casos de uso y repositorios pasarela que solo renombren llamadas sin establecer una frontera real.

La base técnica deberá añadir comprobaciones de importaciones/arquitectura, Detekt y revisión de dependencias. Las políticas de esta entrega no se describen como tareas Gradle ya conectadas. Una nueva dirección de dependencias requiere ADR previo.
