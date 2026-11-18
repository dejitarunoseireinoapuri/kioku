# Chat único y Fuentes · validación local

Revisión del 18 de noviembre de 2026 en `codex/shared-sources`, solicitada después de probar la biblioteca documental. [ADR-017](../02-architecture/ADR/ADR-017-unified-source-chat.md) recoge la decisión. **Desplegada e instalada en Honor con nueva autorización expresa del propietario**, sustituyendo el recorrido Documentos de la [activación anterior](SHARED_SOURCES_VALIDATION.md).

## Activación productiva e instalación · 18 de noviembre de 2026

Código activado: `6e804db`. Solo se actualizan `memoryV2` y `referenceSources` en `kioku-9454f/europe-west1`. Revisiones verificadas por metadatos: `memoryv2-00005-viz` y `referencesources-00002-fin`, ambas ACTIVE, Node 22, identidad runtime existente y máximo una instancia. Mismo hash de fuente desplegada `bcb2107c4e54968652fe422e4cabe3c3fd95d078`. No se cambian reglas, índices, IAM, secretos, modelo ni datos personales. Peticiones anónimas a ambos servicios: **401 UNAUTHENTICATED**.

APK habitual actualizado en Honor FNE-NX9 mediante instalación in situ, conservando firma, cuenta y datos. No es el piloto local: mantiene conexión a Firestore y API productivos para el uso manual. Samsung no modificado. Se actualiza también el comprobador opt-in y se ejecuta únicamente `ProductionReferenceImportTest` con `synthetic-no-ai`.

**1/1 prueba real del Honor correcta, 15,305 s:** PDF generado por el proveedor de fixtures → ACTION_SEND a MainActivity/chat → confirmación de guardado → Fuentes → selección por el ID exacto confirmado → lectura de texto ficticio y **Página 1**. Se retira solo el binario temporal del fixture; su texto queda disponible en Fuentes para la prueba manual. No se ejecuta query, ruta de preguntas ni inferencia. **Cero llamadas OpenAI y cero gasto API**. Las respuestas reales del modelo quedan sin validar y las probará el propietario desde el chat.

Predeploy TypeScript/Prettier y `mobileCheck`/APK normal/instrumentado correctos. No se repiten las suites locales ya superadas sin cambios de implementación. Registros ignorados: `local-data/unified-release-deploy.log`, `unified-release-before.json`, `unified-release-after.json`, `unified-release-mobile.log` y `unified-release-honor-pdf.log`. El cliente gcloud no tenía cuenta activa; se usa la sesión administrativa Firebase existente en RAM para comprobar únicamente metadatos, sin login nuevo, exportar tokens o acceder a secretos.

Documentación consultada: convenciones/calidad, esta evidencia, ADR-017, evidencia documental anterior, entornos y configuración remota, contrato/almacenamiento y seguridad/privacidad. Las comprobaciones visuales de Stitch descritas abajo pertenecen a la implementación anterior; en esta activación no se rediseña la UI.

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

En la validación local inicial no se instaló esta revisión en Honor/Samsung ni se ejecutó el smoke productivo. Se usó un AVD aislado en modo read-only, sin cuentas del propietario. La activación posterior del Honor se documenta arriba por separado. Ninguna de estas pruebas acredita acceso a Drive real, rendimiento con el proveedor o respuesta semántica real.

Comandos de backend: `node tooling/backend.mjs build`, `test`, `format:check` y `pwsh -NoProfile -File tooling/backend-emulators.ps1`, sin opciones Live. Cubren consultas mixtas, ausencia de recuerdos personales, índices de evidencia inválidos, revisión rechazada, replays, compatibilidad sin opt-in y retirada mientras se responde.

Móvil: `pwsh -NoProfile -File tooling/mobile.ps1 mobileCheck :androidApp:assembleDebug :androidApp:assembleDebugAndroidTest`. Pruebas nativas dirigidas en un emulador Android aislado: `UnifiedSourcesUiTest`, `ReferenceImportUiTest` y `ReferenceReceiverTest`. Son pantallas/repositorios/proveedores ficticios; no ejecutan el smoke productivo ni demuestran Google/App Check reales.

Referencia visual: se consultan por MCP las pantallas Preguntar y Gestionar del proyecto Matrix A de Stitch, sin modificarlo. No existe una pantalla Fuentes aprobada independiente: se adaptan controles existentes, negro/verde, lluvia y superficies de lectura actuales. La referencia no acredita una inspección visual de teléfonos con esta revisión.

## Cómo probar en el Honor actualizado

1. Desde Drive o un gestor de archivos, abrir el menú del PDF y elegir **Compartir → Kioku**. Debe entregarse el archivo; un enlace privado de Drive no da permiso para descargarlo.
2. Esperar **Texto guardado en Kioku** o revisar el aviso de cobertura parcial/error. El contenido debe aparecer en Fuentes. Los PDF escaneados sin texto necesitan OCR, todavía no incluido.
3. En el chat habitual, preguntar qué dice ese documento o relacionarlo con un recuerdo. La respuesta debe atribuir cada afirmación y permitir abrir la cita del documento. Estas consultas de usuario sí usarán la API configurada en producción.
4. En **Fuentes**, pegar una URL pública HTTPS para importar una web legible, o revisar/eliminar una fuente con confirmación. No hay botón para abrir archivos ni otro campo de preguntas.

Pendientes: comprobación de preguntas y uso real por el propietario, calidad semántica con proveedor real bajo presupuesto autorizado e iOS/macOS. Vídeos/redes sociales, OCR, Drive privado y sincronización quedan fuera de este alcance. Los límites de cuenta/archivo/parser/red del servicio anterior se mantienen.
