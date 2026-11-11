# Errores externos

Respuesta normalizada: `code`, `retryable`, `operationId` y datos públicos estrictamente permitidos como campo inválido o revisión actual no sensible. No devolver stack, objeto del proveedor, clave, audio o transcripción completa en errores.

| Código | Significado | Tratamiento |
| --- | --- | --- |
| `UNAUTHENTICATED` | Identidad no válida | Resolver acceso; no reutilizar estado privado ajeno |
| `FORBIDDEN` | Acceso no autorizado | No reintentar ni revelar si existe un recurso ajeno |
| `INVALID_ARGUMENT` | Entrada/alcance no válido | Corregir entrada |
| `CONFLICT` | Versión o requestId no coincide | Recuperar estado autorizado; no sobreescribir |
| `NOT_CONFIGURED` | Cuenta/IA incompleta | Ir a configuración pertinente |
| `RATE_LIMITED` | Admisión temporal limitada | Espera acotada informada, sin bucle de reintentos |
| `CREDIT_UNAVAILABLE` | Proveedor rechaza por saldo disponible | Informar configuración; no recargar automáticamente |
| `TEMPORARILY_UNAVAILABLE` | Fallo transitorio | Reintento idempotente o consultar operación |
| `UNEXPECTED` | Fallo no clasificado | Mensaje seguro con referencia operativa |

`needsClarification` e `insufficientEvidence` son resultados normales. Una respuesta sin evidencia no se presenta como fallo de red ni se completa con conocimiento general del modelo.
