# ADR-009 · Captura por texto, procedencia e idempotencia

**Estado:** implementada y desplegada; aceptación del nuevo build en móviles pendiente. Fecha: 2026-11-13. Amplía ADR-003/005/008.

## Contexto

K1 autoriza la cuenta y configura una clave privada. K2 debe convertir el recorrido ficticio de Contar en una captura persistente sin duplicar relatos, confirmar antes del commit ni guardar preguntas como hechos. El propietario acepta conservar recuerdos hasta su borrado y no activar backups históricos/PITR adicionales; recuperar otra instalación usa los mismos datos actuales de Firebase. K3 conectará la consulta y K4 el control conversacional.

## Decisión

- Compilar el núcleo M0 existente en `backend/lib/memory-core` mediante `tsconfig.memory-core.json` e imports internos del paquete; no copiar su lógica a otra implementación. El cambio de tipo del presupuesto permite inyectar el contador distribuido sin usar el almacén de archivos del prototipo en producción.
- Mantener **gpt-6.1-sol, razonamiento medium**, extracción/revisión y embeddings de M0. Las llamadas usan Responses estructuradas y `store: false`; no implica retención cero del proveedor. Referencias: [modelo](https://developers.openai.com/api/docs/models/gpt-6.1-sol), [salida estructurada](https://developers.openai.com/api/docs/guides/structured-outputs).
- Los callables revalidan Google/revocación, App Check, cuenta permitida y UID vinculado. La captura reautoriza después de la inferencia y dentro de la transacción de commit. Nunca acepta un UID, ruta, modelo o secreto elegidos por el cliente.
- La app envía UUID estable por intento lógico y conserva el mismo ID al reintentar. El servidor liga su digest al UID, ID y entrada exacta; reutilizar el ID con otra entrada falla. Una concesión de trabajo de cuatro minutos permite una operación costosa por propietario; nonce y máximo de tres intentos invalidan trabajadores tardíos. No hay reintentos automáticos de la IA.
- Procesar el turno fuera de la transacción, preparar la fuente/fragmentos en memoria y confirmar fuente, hasta ocho recuerdos y recibo en una única transacción. El recibo terminal no duplica texto. La respuesta materializa la fuente desde el canónico autorizado.
- Una aclaración conserva fuente, fecha/zona original y revisión. Un nuevo requestId continúa el pendiente; el anterior dirige la recuperación al siguiente. Ningún pendiente entra en recuerdos/búsqueda. Hasta tres revisiones y 2000 caracteres acumulados de aclaración, sin inventar información al alcanzar el límite.
- Android/Apple usan Functions oficiales mediante un puente cancelable. Domain contiene comandos/resultados e interfaz; Data valida la respuesta. Cancelar callbacks no promete cancelar un commit remoto. El ViewModel bloquea dobles envíos, conserva el ID y permite comprobar un resultado incierto sin reenviar el relato. Se descartan resultados al salir de la generación/sesión.

## Límites y retención

Texto inicial hasta 8000 caracteres; entrada HTTP hasta 40 KB; contexto original más aclaraciones acotados. Tiempo callable 180 s, SDK 185 s y suspensión compartida 195 s: son límites de seguridad, no objetivos de espera. Sigue abierto el objetivo de guardado p95 de 15 s. Una petición puede cobrarse aunque falle su respuesta.

Reservas conservadoras de hasta 1 USD y ocho llamadas por intento; hasta tres intentos explícitos por operación y 10 USD estimados por día UTC, persistidos transaccionalmente sin texto. Las reservas de peticiones inciertas no se liberan a ciegas. Los contadores numéricos caducan a los 30 días. No equivalen al saldo promocional ni a un tope de facturación del proveedor/Firebase.

Pendientes/fallos con contexto: 24 h; recibos terminales: siete días. La app bloquea el acceso a pendientes caducados sin esperar a TTL. `expiresAt` solo afecta a `operations` y `usage`; jamás a fuentes/recuerdos. La eliminación física TTL es asíncrona y necesita activación comprobada antes de datos reales. Texto y vectores se excluyen de índices automáticos innecesarios. El servidor no activa backups históricos ni PITR.

## Alternativas y consecuencias

Se rechazan escrituras directas del móvil, guardar el snapshot completo de M0 en un documento, claves en el binario y operaciones OpenAI dentro de callbacks transaccionales. El diseño mantiene varias materias en una fuente y sus fragmentos, evita una biblioteca obligatoria y prepara K3 sin afirmarla implementada. Recuperación de una operación actual no equivale a historial de chat persistente ni a cola offline.

La app debe seguir indicando que consulta, voz y olvido conversacional todavía no están conectados. K2 no cierra K1/iOS por extrapolación ni valida la experiencia final de K6. [Evidencia K2](../../09-planning/K2_VALIDATION.md) distingue pruebas locales, proveedor real, despliegue y aceptación móvil.
