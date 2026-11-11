# ADR-004 · Clave propia y audio transitorio

- Estado: aceptada para diseño; transporte, límites y retención verificable pendientes.
- Fecha: 2026-11-11.

## Decisión

El usuario introduce su clave OpenAI mediante configuración privada y puede reemplazarla. Las llamadas duraderas de IA salen de servidor; un almacén de secretos de servidor conserva la clave. Firestore guarda únicamente una referencia opaca y estado seguro. No se introduce la clave en el binario, código, historial, fuente de un recuerdo, logs o respuestas posteriores de configuración.

El móvil captura únicamente por acción explícita. El audio existe transitoriamente para transcribir la intervención y se elimina después o al cancelar; se conserva como memoria el texto. La lectura de una respuesta usa reproducción temporal, distinta de escuchar una fuente archivada.

## Consecuencias y alternativas

Una clave permanente guardada solo en el móvil sería más simple para un prototipo, pero no sigue la frontera de servidor adoptada ni facilita la misma configuración en ambas plataformas. No se elige.

No afirmar que el audio nunca sale del teléfono o que los proveedores no retienen datos: sus políticas y configuración se verificarán antes de conectar servicios reales. No fijar límites de duración/tamaño sin probar el transporte. Ningún gasto real ni creación de clave forma parte de esta entrega documental.
