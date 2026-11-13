# Arquitectura

Decisión adaptada de Wonderdrop por petición del propietario. [ADR-001](ADR/ADR-001-platform-strategy.md) y [ADR-002](ADR/ADR-002-clean-architecture.md) sustituyen la dirección Expo inicial.

```mermaid
flowchart LR
  Android[Android host] --> Shared[Compose compartido]
  Apple[iOS host] --> Shared
  Shared --> VM[Presentation / StateFlow]
  VM --> Domain[Domain / casos de uso e interfaces]
  Data[Data / mapeadores y repositorios] --> Domain
  Native[Adaptadores nativos de cuenta y audio] --> Data
  Data --> API[Funciones autenticadas]
  API --> DB[Firestore / memoria y versiones]
  API --> Secret[Gestor privado de claves]
  API --> AI[OpenAI / operaciones acotadas]
```

## Responsabilidades

- **UI:** renderizado e intenciones, gestos, accesibilidad y enlaces de navegación. No decide autorización, guardado, borrado ni persistencia.
- **Presentation:** ViewModels con estado inmutable; orquestan casos de uso y descartan respuestas de sesiones/operaciones obsoletas. No importan Firebase.
- **Domain:** modelos, reglas semánticas, errores y fronteras puras. Casos significativos: enviar intervención, resolver aclaración, consultar, aceptar propuesta, corregir y olvidar.
- **Data:** implementa repositorios, traduce DTO y errores, coordina transportes. Ningún snapshot o excepción nativa cruza al dominio.
- **Plataforma:** SDK oficiales Android/Apple para cuenta, micrófono, audio temporal, reproducción de respuesta y almacenamiento protegido de sesión/configuración no secreta. El host inyecta implementaciones de contratos compartidos; `shared` no depende del host.
- **Backend TypeScript:** autoriza por cuenta, protege clave y límites, interpreta con IA como entrada no confiable, persiste e indexa coherentemente. Mutaciones protegidas pasan por backend; ningún cliente escribe memoria canónica directamente.

Koin para DI, Navigation 3 tipada para rutas, coroutines estructuradas y Flow/StateFlow. K0 añade `shared`, `androidApp` e `iosApp`, catálogo/wrapper/lockfiles y una vista previa con fixtures; compilación y recorridos Android comprobados. Versiones y límites en [ADR-006](ADR/ADR-006-k0-toolchain.md). K1 añade adaptadores de cuenta nativos, estado seguro de configuración y frontera administrativa de credenciales; [ADR-008](ADR/ADR-008-k1-native-access-and-credentials.md). iOS sigue sin compilar/probar en Mac; acceso/atestación reales y estado remoto constan en la [evidencia actual](../09-planning/K1_INTEGRATION_VALIDATION.md).

El almacenamiento es online y asociado a identidad; no existe una base local de recuerdos ni una cola offline. El audio transitorio no equivale a archivo permanente. Véanse [dependencias](DEPENDENCY_RULES.md), [estado](STATE_MANAGEMENT.md), [datos](../03-data/DATA_MODEL.md) y [API](../04-api/API_CONTRACT.md).

K2 reutiliza el núcleo M0 compilado desde sus fuentes y añade captura transaccional, aclaraciones y recuperación de recibo en servidor; [ADR-009](ADR/ADR-009-text-capture.md). Domain incorpora comandos/resultados de captura y repositorio portable. Data valida el protocolo y suspende sobre un puente nativo Functions cancelable; UI/ViewModel mantienen estado, intención y generación. El repositorio de la instancia actual se pasa explícitamente al ViewModel por parámetros Koin, igual que la cuenta, para no retener una dependencia de otra composición. [Evidencia local, despliegue y aceptación móvil pendiente](../09-planning/K2_VALIDATION.md).
