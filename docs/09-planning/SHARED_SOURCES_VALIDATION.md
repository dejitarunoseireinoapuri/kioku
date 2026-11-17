# Fuentes compartidas · primera implementación local

Fecha: 2026-11-17. Rama `codex/shared-sources`, creada desde `5fe1f7a` de voz. Petición del propietario: empezar implementación en rama nueva, solo casos ficticios, cero API, conservar únicamente texto extraído y aplazar sincronización. Autoriza expresamente usar el Honor para pruebas. No se han desplegado recursos, llamado a IA, leído recuerdos/archivos personales o accedido a Drive real. Coste API de esta entrega: **0 USD**.

## Comportamiento implementado

- Extracción determinista UTF-8/Markdown, PDF con texto y páginas reales, DOCX con párrafos, HTML sin ejecutar scripts. No hay OCR, audio, vídeo o respuestas habladas. Fragmentos literales con cobertura y localizadores; no se convierten en recuerdos personales.
- Worker recibe formato/bytes, sin credenciales de entorno, proveedor IA o descarga de URL. Límite de entrada 10 MiB, 200 páginas PDF, 200 000 caracteres, 128 fragmentos de hasta 2000 caracteres. Plazo 30 s, heap antiguo 256 MiB y stack 4 MiB; no equivale a aislar todo el proceso o medir RSS/CPU total. Salida del parser drenada, errores seguros sin texto bruto.
- DOCX: límites de entradas/tamaño/descompresión, rechazo de macros/rutas sospechosas/entidades XML. Cuerpo principal únicamente; partes omitidas e imágenes se señalan como cobertura parcial. PDF sin texto se rechaza; páginas vacías junto a texto señalan parcialidad. HTML excluye categorías de navegación/scripts/ocultos explícitos, con profundidad acotada; no es un navegador ni acredita fidelidad de estilos o páginas dinámicas.
- Almacén Firestore privado por cuenta/generación: autoriza propietario habilitado en admisión, confirmación, lectura, catálogo, cancelación y olvido. Hasta 100 fuentes más pendientes. ID de petición y fingerprint detectan replay/conflicto; huella de formato/bytes deduplica. Concesión caduca a los 15 minutos. Finalizar/cancelar/expirar vacía título/huella de la operación. Bytes solo en RAM: conserva texto extraído y metadatos mínimos.
- Olvidar exige IDs/revisión exactos; elimina texto y deduplicación, conserva revocación sin contenido y aumenta época. Reintentar la operación anterior no restaura la fuente. Compartir expresamente otra vez crea IDs nuevos. Un worker anterior a un cambio de catálogo falla conservadoramente si ya no puede publicar sobre su época; aún no hay sustitución manual atómica de versiones.
- Búsqueda textual determinista: hasta 12 citas literales por fuente/revisión/localizador. Fuentes parciales excluidas de búsqueda general salvo alcance explícito. No es recuperación semántica ni generación de respuesta; todavía no se conecta a Preguntar.
- Android: lectura de `ACTION_SEND`/`ACTION_SEND_MULTIPLE` y ClipData, deduplicación de URI, máximo cinco archivos; exige concesión temporal y `content://`. Lectura en RAM con límites efectivos de 10 MiB/archivo y 25 MiB/lote, handles de uso único, descriptor/cancelación/plazo de 15 s. Sin permiso persistente, archivo del propietario copiado a disco o cola offline. Metadatos/tamaño declarado no sustituyen el conteo real de bytes. Se prueban lectura y fallos, no todos los proveedores que podrían ignorar cancelación del sistema.
- Enlaces Android se distinguen de archivos y texto ordinario. Drive/docs.google.com orientan a «Enviar una copia»; no se reutiliza el login Google para acceder a documentos. Validador backend de admisión HTTPS rechaza destinos privados/locales, credenciales, parámetros sensibles y redes sociales. **No hay fetcher, resolución DNS o conexión HTTP implementados**.
- Domain/ViewModel KMP no contienen URI, Firebase o parsers. Estado por elemento, cancelación y aislamiento por generación/cuenta; resultados tardíos descartados. Pantalla mediante componentes Matrix existentes con lectura/resultado parcial/permisos/cierre. El contrato `Stored` requiere confirmación del repositorio, sin guardado optimista.

El receptor Android del producto está declarado **deshabilitado** y su entrada falla con un mensaje veraz de indisponibilidad. No existe aún un repositorio remoto real conectado. La pantalla probada usa estados ficticios en la actividad debug no exportada, no un backend simulado activado para el propietario. No se modifican callables exportados, reglas desplegadas o recorrido de recuerdos/voz actual.

## Pruebas ejecutadas

| Comprobación | Resultado y alcance |
| --- | --- |
| TypeScript strict y formato backend | Compilación y Prettier configurados correctos |
| Suite backend Node | 52/52, incluidos nueve casos nuevos de documentos |
| Suite normal emuladores | 145/145, incluidos ocho casos nuevos de almacenamiento documental; sin opciones Live |
| KMP host | 144/144, incluidos siete casos nuevos de ViewModel |
| `mobileCheck` | Formato, capas, Detekt, host y Android Lint correctos, sin deshabilitar comprobaciones |
| APK debug + APK instrumentado | Compilados correctamente |
| Honor FNE-NX9 | 10/10: siete del receptor/lector y tres de pantalla, 67,052 s en el dispositivo |
| Dependencias de ejecución | Auditoría npm: cero vulnerabilidades conocidas; no acredita toda la herramienta de desarrollo |
| Documentación | Checker real: 87 documentos, 16 ADR; enlaces/mapa/identificadores y `git diff --check` correctos |

Corpus backend generado en código: PDF de dos páginas con oráculo literal, DOCX con Unicode, TXT/MD, HTML con contenido excluido, entradas malformadas/vacías/expandidas y límites. Pruebas de extracción aislada, cancelación previa, base64, procedencia, cobertura parcial y admisión de URL/IP. El PDF de dos páginas ejecutado no se confunde con el itinerario de tres páginas previsto en el plan.

Emuladores: cuenta ficticia exclusiva bajo el proyecto demo con guardas loopback. Casos positivos/negativos de cuenta, generación y propietario deshabilitado; solo texto persistido; replay/deduplicación; cancelación y publicación tardía; vencimiento libera cupo; olvido impide lectura/replay/recuperación y preserva otra fuente; callback antiguo no revive; nuevo compartir explícito recibe IDs nuevos. No usa identidades/configuración productivas.

Honor: proveedor **debug no exportado** genera notas ficticias y un fichero que supera 10 MiB aunque anuncia tamaño cero. Comprueba permisos, Markdown, doble lectura del handle, concesión ausente, `file://`, sexto adjunto incluso repetido, separación de enlaces y componente de producto deshabilitado. Pantalla: lectura sin éxito anticipado, cierre, resultado parcial y fallo de permiso conservados en lote, indisponibilidad veraz. Se actualizan APK mediante instalación conservando datos; no hay desinstalación/reset. Un primer lanzamiento de instrumentación usó un sufijo de paquete incorrecto y falló antes de ejecutar pruebas; corregido a `.dev.test`, con el resultado 10/10 anterior. No se atribuye ese fallo a la app.

No se ejecutan pruebas actuales Samsung por elección del propietario de usar Honor. No se compila iOS en Windows. Sin pruebas de Drive real, Share desde otra app emisora, arranque frío/caliente integrado, selector, red real, muerte de proceso, accesibilidad/escala/paisaje o interpretación IA. Las diez pruebas nativas no acreditan esos recorridos.

## Reproducción sin API

Desde la raíz del checkout:

```powershell
node tooling/backend.mjs format:check
node tooling/backend.mjs build
node tooling/backend.mjs test
node tooling/backend.mjs audit --omit=dev
pwsh -NoProfile -File tooling/backend-emulators.ps1
pwsh -NoProfile -File tooling/mobile.ps1 mobileCheck :androidApp:assembleDebug :androidApp:assembleDebugAndroidTest
pwsh -NoProfile -File tooling/check-docs.ps1
git diff --check
```

Con APK debug e instrumentado actualizados conservando datos en el dispositivo elegido, ejecutar las clases `ReferenceReceiverTest,ReferenceImportUiTest` con AndroidJUnitRunner del paquete `io.github.dejitarunoseireinoapuri.kioku.dev.test`. El fixture no abre MainActivity ni repositorios de recuerdos. No añadir opciones Live a los emuladores, cargar claves o navegar por cuentas reales.

## Dependencias fijadas

| Paquete | Versión | Licencia | Uso |
| --- | --- | --- | --- |
| pdfjs-dist | 6.5.438 | Apache-2.0 | Texto de PDF, API de bytes, sin visor/script de documento |
| fflate | 0.8.3 | MIT | ZIP interno acotado de DOCX y fixtures |
| fast-xml-parser | 5.12.1 | MIT | XML validado de DOCX, salida cruzada como unknown |
| parse5 | 8.1.1 | MIT | Árbol HTML sin ejecutar página |
| ipaddr.js | 2.5.0 | MIT | Clasificación de IP para futura admisión web |

Versiones/motores/licencias verificadas mediante registro npm y fuentes oficiales antes de fijarlas en lockfile. PDF.js exige Node >=22.13 o >=24; encaja con el runtime Node 22.23.5 verificado y herramientas Node 24 del proyecto. No se añaden paquetes de IA. Fuentes: [API PDF.js](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html), [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser), [fflate](https://github.com/101arrowz/fflate), [parse5](https://github.com/inikulin/parse5), [ipaddr.js](https://github.com/whitequark/ipaddr.js).

## Pendientes concretos antes de activar

1. Transporte autenticado/atestación y repositorio móvil real: admisión antes de transferencia, lectura de estado y respuesta perdida, cancelación de resultado incierto. Composición Koin/navegación y selector; aislamiento de recepción mientras hay conversación/gestión activa; pruebas emisor/arranque/cuenta/proceso.
2. Límites globales de concurrencia/cola del worker, medición de RSS/CPU y aislamiento operacional. El prototipo limita cada worker, no el consumo agregado de un servidor expuesto.
3. Cerrar retención operacional de operaciones/recibos, barrido programado y limpieza por generación/cuenta. Actualmente `expire` se ejecuta al admitir y en pruebas: plazo lógico no es purga automática. Exclusiones de índices Firestore del texto/chunks, índices requeridos y permisos reales antes de despliegue; no se han modificado reglas remotas.
4. Fetcher web con DNS fijado y revalidación por salto, límites temporales/compresión, tests de rebinding/redirección. Guardar procedencia URL/fecha de lectura; el prototipo solo almacena título/fecha/formato y localizadores del contenido entregado.
5. Drive por copia desde un emisor/proveedor real con documento ficticio explícitamente elegido; enlaces privados/OAuth/exportación siguen separados. **Sin sincronización** en esta entrega.
6. Consultas y gestión integradas con fuentes/recuerdos tipados, revalidación final de época/versiones tras respuesta, citas navegables, diálogo de olvido y sustitución manual atómica. No activar fuentes de emulador como si estuvieran consultables por IA. Evaluación semántica con API solo bajo autorización futura.
7. Share Extension/selector iOS y compilación/pruebas Mac/iPhone. Validación visual/accesibilidad completa y casos de formatos pendientes de la matriz del plan.

I0 tiene contratos internos/decisiones/cotas iniciales; I1–I3 cuentan con una base parcial comprobada, no cierre integrado. I4 solo distingue copia/enlace en fixtures. I5 solo admite URL y extrae HTML proporcionado. I6 solo recupera citas textuales y retira fuentes en el almacén. I7 pendiente. No se cierra ninguna fase por extrapolar estos resultados.

Documentación consultada: plan de fuentes, alcance, requisitos, arquitectura/ADR-016, datos/API, seguridad/privacidad/retención, convenciones/calidad, guía de desarrollo y referencia Stitch. La implementación resuelve las decisiones de conservar solo texto y aplazar sincronización; no cambia presupuestos, modelos históricos o recursos activos.
