# Chat único y Fuentes · validación local

Revisión del 18 de noviembre de 2026 en `codex/shared-sources`, solicitada después de probar la biblioteca documental. [ADR-017](../02-architecture/ADR/ADR-017-unified-source-chat.md) recoge la decisión. Esta revisión aún no está desplegada ni instalada en Honor: la [activación anterior](SHARED_SOURCES_VALIDATION.md) conserva la pantalla Documentos hasta actualizar servidor y app.

## Comportamiento implementado

- Archivos exclusivamente mediante Compartir → Kioku. MainActivity reutiliza la conversación; no abre selector ni otro chat. Fuentes es una actividad privada de gestión, con URL como único campo de importación.
- Avisos de importación separados del historial RAM: éxito solo confirmado, cobertura parcial explícita y errores de archivo con reintento de la misma operación. El aviso de éxito desaparece a los cinco segundos y deja de ocupar espacio.
- Preguntar opta por recuerdos y documentos conjuntamente. Las referencias de gestión personal y las citas de documentos tienen contratos separados. No se guardan los documentos como hechos autobiográficos.
- Citas con título/localizador/literal/procedencia; al pulsarlas se comprueba la versión actual antes de mostrar la cita. La fuente retirada falla cerrada. Borrarla requiere el diálogo explícito existente.
- Revisión de ambas épocas durante consulta y commit final. Olvidar una fuente aumenta el sello global de contexto sin modificar unidades personales. Los clientes antiguos conservan su respuesta sin citas documentales.

## Validación y alcance

Solo cuentas/documentos ficticios, dobles de proveedor y emuladores locales. Cero llamadas OpenAI, ninguna clave nueva, ningún recuerdo o archivo personal utilizado.

Resultados ejecutados:

| Frontera | Resultado |
| --- | --- |
| Backend Node | 63/63 |
| Auth/Functions/Firestore Emulator | 157/157 |
| KMP host | 153/153, cero errores/fallos |
| Android API 36 aislado | 26 casos distintos correctos: pasada de 25 y pasada final de 9 de navegación, con 8 repetidos y un caso nuevo de conservación del feed |
| Calidad/compilación | TypeScript, Prettier, `mobileCheck` (arquitectura, formato, Detekt, Android Lint), APK debug e instrumentación correctos |
| Documentación | Comprobador real de enlaces/mapa/identificadores y revisión semántica; `git diff --check` correcto |

La primera pasada de UI detectó el valor de ejemplo del campo URL, que ocultaba su placeholder: se corrige dejando el campo vacío. La prueba antigua del manifest todavía esperaba un receptor desactivado y se actualiza para exigir recepción por MainActivity reutilizable y gestión privada; no se retira la protección de acceso. Las pasadas posteriores son las contabilizadas arriba. Las pruebas de citas comprueban lectura actual y rechazo de revocación; las de avisos comprueban conexión/reintento y cobertura parcial.

No se instala esta revisión en Honor/Samsung ni se ejecuta el smoke productivo. Se usa un AVD aislado en modo read-only, sin cuentas del propietario. Las pruebas no acreditan acceso a Drive real, atestación, rendimiento con el proveedor o respuesta semántica real.

Comandos de backend: `node tooling/backend.mjs build`, `test`, `format:check` y `pwsh -NoProfile -File tooling/backend-emulators.ps1`, sin opciones Live. Cubren consultas mixtas, ausencia de recuerdos personales, índices de evidencia inválidos, revisión rechazada, replays, compatibilidad sin opt-in y retirada mientras se responde.

Móvil: `pwsh -NoProfile -File tooling/mobile.ps1 mobileCheck :androidApp:assembleDebug :androidApp:assembleDebugAndroidTest`. Pruebas nativas dirigidas en un emulador Android aislado: `UnifiedSourcesUiTest`, `ReferenceImportUiTest` y `ReferenceReceiverTest`. Son pantallas/repositorios/proveedores ficticios; no ejecutan el smoke productivo ni demuestran Google/App Check reales.

Referencia visual: se consultan por MCP las pantallas Preguntar y Gestionar del proyecto Matrix A de Stitch, sin modificarlo. No existe una pantalla Fuentes aprobada independiente: se adaptan controles existentes, negro/verde, lluvia y superficies de lectura actuales. La referencia no acredita una inspección visual de teléfonos con esta revisión.

## Cómo probar cuando se active esta revisión

1. Desde Drive o un gestor de archivos, abrir el menú del PDF y elegir **Compartir → Kioku**. Debe entregarse el archivo; un enlace privado de Drive no da permiso para descargarlo.
2. Esperar **Texto guardado en Kioku** o revisar el aviso de cobertura parcial/error. El contenido debe aparecer en Fuentes. Los PDF escaneados sin texto necesitan OCR, todavía no incluido.
3. En el chat habitual, preguntar qué dice ese documento o relacionarlo con un recuerdo. La respuesta debe atribuir cada afirmación y permitir abrir la cita del documento. Estas consultas de usuario sí usarán la API configurada en producción.
4. En **Fuentes**, pegar una URL pública HTTPS para importar una web legible, o revisar/eliminar una fuente con confirmación. No hay botón para abrir archivos ni otro campo de preguntas.

Pendientes: activación de este cambio en servidor/app, comprobación de uso real por el propietario, calidad semántica con proveedor real bajo presupuesto autorizado e iOS/macOS. Vídeos/redes sociales, OCR, Drive privado y sincronización quedan fuera de este alcance. Los límites de cuenta/archivo/parser/red del servicio anterior se mantienen.
