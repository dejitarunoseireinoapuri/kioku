# ADR-010 · Consulta por texto y evidencia vigente

**Estado:** implementación local K3; evaluación real, activación y aceptación móvil pendientes. Fecha: 2026-11-13. Amplía ADR-005/009.

## Contexto

K2 guarda fuentes y fragmentos con vectores M0 de 512 dimensiones. K3 debe encontrar el recuerdo por significado y contexto sin cargar toda la cuenta en el móvil ni guardar preguntas como hechos. El propietario conserva un único Firebase de producción y ha elegido Sol medium. K4 controlará correcciones, olvido y propuestas; no se adelantan silenciosamente.

## Decisión

- Reutilizar extracción y respuesta/verificación M0 sin cambiar sus prompts ni modelo. Añadir al fragmento proyecciones `searchVector` (vector nativo), `searchTerms` y `searchSchema:1`, derivadas del canónico y con escrituras solo del servidor. No son fuentes independientes.
- Recuperar por UID hasta 40 vecinos de coseno y 24 coincidencias léxicas de hasta 30 términos. Unificar por ID y aplicar el ranking M0 (0,85 semántico + 0,15 léxico), hasta seis candidatos y el presupuesto M0 de 16 000 caracteres de fuentes. No se promete exhaustividad de enumeraciones ni escala ilimitada.
- Índice vectorial de colección, 512 dimensiones. La [API oficial de Firestore](https://firebase.google.com/docs/firestore/vector-search) exige vectores nativos e índice correspondiente. No se añade una base ni proveedor externo.
- Preparación administrativa aditiva para recuerdos K2 existentes: reutiliza sus vectores sin llamadas IA, páginas de 200 y máximo de 100 páginas, precondición de versión por escritura. No modifica texto, fuente, revisión o vector canónico. Desplegar primero el escritor compatible; solo entonces preparar y habilitar `privateConfiguration/search` para evitar omitir recuerdos antiguos. La activación remota requiere autorización específica.
- `queryMemory` exige Google verificado/permitido, UID vinculado y App Check como K2. Revalida identidad después de la IA; una transacción comprueba propietario, concesión, nonce y versiones exactas de todos los fragmentos y fuentes usados. Una actualización/borrado durante la inferencia invalida la respuesta.
- Pregunta de hasta 2000 caracteres y respuesta de hasta 2400. Fecha de referencia del servidor. El cliente no elige UID, modelo, clave ni reloj. No llamar al modelo de respuesta cuando no hay evidencia. Una pregunta no crea fuente ni memoria.
- Concesión compartida con captura (cuatro minutos), máximo de tres intentos explícitos y presupuesto distribuido K2. Recibo de consulta en `operations` con tipo, digest ligado a UID/UUID/entrada, estado y caducidad de 24 h, sin preguntas ni respuestas. Repetición en curso indica procesamiento; repetición completada indica que hace falta una nueva pregunta explícita, sin volver a cobrar automáticamente. No se conserva la respuesta para recuperar el chat.
- Las aclaraciones de consulta conservan en RAM la pregunta y las respuestas explícitas del usuario (máximo dos y 2000 caracteres acumulados). Se envían juntas en la siguiente petición; no se toma una respuesta previa de IA como hecho. No hay historial de preguntas en Firebase, preferencias o backups del móvil.
- El estado pertenece al ViewModel de conversación: sobrevive a recreación y se limpia al cerrar sesión. Cada apertura de una fuente de respuesta usa `getSource` protegido, comprueba su ID y retira el texto anterior mientras carga. Los ejemplos permanecen separados del recorrido real.

## Alternativas y consecuencias

Se rechaza descargar todos los recuerdos o usar solo coincidencia literal. La preparación del índice es necesaria antes de activar; no hay fallback silencioso a un subconjunto de recuerdos. La recuperación sigue acotada y la verificación semántica es falible; K3 requiere evaluación contra fuentes, además de tests de transporte. iOS exige compilación y recorrido en Mac; Windows no los acredita.

El contrato de consulta no autoriza corregir, olvidar ni aceptar hechos nuevos. Esas invariantes y la limpieza completa se implementarán en K4. [Criterios y evidencia K3](../../09-planning/K3_VALIDATION.md).
