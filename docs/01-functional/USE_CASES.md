# Casos de uso

Todos requieren internet; salvo el inicio de acceso, también identidad autorizada. Véanse [requisitos](FUNCTIONAL_REQUIREMENTS.md) y [contrato](../04-api/API_CONTRACT.md).

| Caso | Entrada y recorrido | Resultado y alternativas |
| --- | --- | --- |
| **UC-001 · Acceder y recuperar** | Resolver sesión Google, verificar cuenta permitida y cargar su estado. | Misma memoria en otra instalación. Denegación o cambio de cuenta limpia el estado privado anterior. Acceso personal según ADR-007; evidencia por plataforma en K1. |
| **UC-002 · Configurar IA** | El propietario introduce o sustituye la clave desde su PC mediante la herramienta administrativa privada; valida y almacena el secreto en servidor. | El móvil consulta estado y revisión, no la clave. Una clave rechazada conserva la configuración anterior válida. El propietario acepta por ahora este recorrido personal sin formulario móvil, según ADR-008. |
| **UC-003 · Contar** | Elegir Contar; escribir/enviar o mantener/soltar, opcionalmente bloquear/terminar. Interpretar y separar asuntos. | Guardado automático confirmado por servidor. Cancelar descarta. Duda pasa a UC-004; error conserva contexto de reintento sin declarar éxito ni crear cola offline. |
| **UC-004 · Aclarar** | Mostrar y, si procede, leer una pregunta posterior al turno. Recibir respuesta ligada a la operación pendiente. | Incorporar la aclaración y continuar; no crear un recuerdo independiente por accidente. Si sigue faltando contexto, preguntar solo lo necesario. |
| **UC-005 · Preguntar** | Formular consulta; recuperar candidatos propios vigentes; responder con evidencia y procedencia. | Texto y voz según canal; abrir fuente. Si no consta, decirlo. Las preguntas no se añaden como hechos. |
| **UC-006 · Aceptar un dato nuevo** | Dentro de una consulta aparece una afirmación nueva; presentar oferta. | Sí guarda una vez; No no guarda. No exige cambiar a Contar. La oferta caducada o de otra cuenta no se ejecuta. |
| **UC-007 · Corregir** | Orden explícita, objetivo resuelto y versión esperada. | Actualizar memoria e índices y confirmar después. Si la referencia es ambigua, aclarar; si hubo cambio real en el tiempo, conservar su contexto. |
| **UC-008 · Olvidar** | Orden o acción contextual con alcance inequívoco. | Revocar recuperabilidad y limpiar fuentes/derivados; confirmar resultado real. Si hay varios objetivos, preguntar antes de actuar. |

Ningún caso permite que el modelo de IA asigne por sí mismo otra cuenta, use una clave ajena o convierta texto recuperado en una orden de modificación.
