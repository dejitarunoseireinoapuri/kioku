# Probar documentos ficticios en el Honor

## Versión productiva preparada

**Todavía no está instalada en Honor ni desplegada en el servidor.** APK normal: `androidApp/build/outputs/apk/debug/androidApp-debug.apk`; identificador habitual registrado, conexión productiva de Kioku y sin emuladores. Antes de instalar hay que activar `referenceSources` y su configuración de índices. Actualizar sin desinstalar ni borrar datos. Las preguntas reales gastarán API; pruebas del agente: cero API.

Una vez activada e instalada:

1. Crear PDF con texto ficticio: «Lira usa un cuaderno violeta. Nara visita el planetario el sábado». Compartir → **Kioku** desde Archivos. Desde Drive: **Enviar una copia** en PDF/DOCX o proveedor del selector; un enlace privado no basta.
2. Esperar **Texto guardado en Kioku**. En **Documentos**, abrirlo y preguntar «¿Qué cuaderno usa Lira?». Debe responder y citar página/línea/párrafo real. **Ver texto extraído** muestra lo leído; no se conserva el PDF original.
3. TXT/Markdown/DOCX: Compartir o **Documentos → Abrir archivos**. Hasta 6 MiB por archivo, cinco archivos y 25 MiB por lote; sin PDF escaneado/cifrado.
4. Web: compartir enlace HTTPS público o **Enlace web público → Importar web**. Solo guarda texto y procedencia, sin vídeo, sesión o sincronización. **Abrir web original** abre la página externa actual; puede haber cambiado desde la lectura.
5. **Eliminar fuente → Cancelar** conserva datos; **Sí, eliminar** retira el texto de Kioku. Preguntar después no debe usarlo. El original externo permanece intacto.
6. Con mala cobertura, la pregunta queda escrita. Pulsar **Preguntar** al recuperar conexión; recupera la misma operación antes de permitir otra consulta. **Dejar de esperar** cancela la espera local; **Actualizar lista** comprueba qué confirmó el servidor.

Se pregunta en **Documentos**, sobre un archivo o **Todas las fuentes**. El chat habitual sigue consultando recuerdos; búsqueda conjunta pendiente. Las siguientes instrucciones son del piloto histórico, no requisitos de producción.


**Guía del piloto intermedio:** el propietario ha pedido después instalar la integración productiva con Firestore real y respuestas por API. Este recorrido local se conserva para reproducción de pruebas; no es la entrega final solicitada. Las pruebas del agente siguen sin llamadas API y usan solo fixtures.

El piloto se instala como **Kioku · pruebas**, separado de Kioku y de sus recuerdos. Solo usa una cuenta ficticia y un servidor local del PC. No incorpora cliente de IA, interpretación de recuerdos, embeddings o respuestas generadas. El servidor guarda texto extraído, nunca los archivos originales. No hay sincronización.

## Recorrido de prueba

1. Mantener el PC encendido, el servidor local en marcha y el Honor conectado. Abrir **Kioku · pruebas**. La cabecera indica «Solo casos ficticios · sin IA · servidor local».
2. Tocar **Cargar ejemplos ficticios**. Se entregan cuatro archivos generados, TXT/Markdown/PDF/DOCX, mediante el recorrido de recepción Android. Esperar a «Texto confirmado por el servidor local» y a la lista de fuentes. No son recuerdos de la cuenta habitual.
3. Abrir **Manual ficticio.docx**, escribir **cuaderno violeta** y tocar **Buscar fragmentos**. Se muestran coincidencias literales y el párrafo del documento. La búsqueda es textual: no promete entender cualquier pregunta natural o sinónimo.
4. Abrir **Viaje ficticio.pdf**. El PDF de prueba está en inglés: buscar **violet notebook** debe mostrar la cita de la página 2. **Ver texto extraído** permite revisar las páginas leídas; no abre ni reconstruye el PDF original.
5. Volver a **Todas las fuentes** y tocar **Importar web de ejemplo** con `https://kioku.example.test/guia`. Esta URL reservada se resuelve con una página ficticia incorporada al servidor, sin salir a internet. Abrir **Guía web ficticia** y buscar **fichas azules** para ver el texto y su sección.
6. Abrir una fuente y tocar **Eliminar fuente**. **Cancelar** conserva sus datos. Solo **Sí, eliminar** envía el borrado; después desaparece de la lista y no puede volver a aportar citas. Los demás documentos siguen disponibles, aunque contengan términos parecidos. Recompartir un ejemplo expresamente puede crear una fuente nueva después del borrado.
7. Para un archivo propio de prueba, usar **Abrir archivos ficticios**, o Compartir → **Kioku · pruebas** desde Archivos/otra app. Usar únicamente texto inventado. Admite TXT UTF-8, Markdown, PDF con texto y DOCX; hasta cinco archivos, 10 MiB por archivo y 25 MiB por lote. No incluye OCR, documentos cifrados, imágenes o vídeo.
8. Drive por archivo: crear antes un documento ficticio y usar **Enviar una copia**, seleccionando PDF/DOCX cuando corresponda, y **Kioku · pruebas**. Un enlace privado de Drive todavía no concede lectura; la app indica cómo compartir la copia. El acceso real a Drive no se da por validado por estos fixtures.

Si falla la conexión, conservar la pregunta y volver a pulsar **Buscar fragmentos**; para archivos usar **Reintentar importación** mientras siga abierta la operación. Se conservan sus IDs para recuperar un guardado incierto sin duplicarlo. **Dejar de esperar** abandona la espera local: no garantiza que el servidor no haya confirmado ya. **Actualizar lista** permite comprobarlo. Tras cerrar el proceso puede ser necesario compartir de nuevo. Si se reinician los emuladores, sus datos de prueba se pierden; no son almacenamiento productivo.

Este piloto solo admite la web ficticia indicada. La descarga de webs arbitrarias, los enlaces privados de Drive, la sincronización y las respuestas con IA permanecen fuera de la activación. No usar documentos o enlaces personales para probarlo.

## Preparación reproducible en el PC

Sin claves ni opciones Live, desde la raíz:

```powershell
node tooling/backend.mjs build
pwsh -NoProfile -File tooling/reference-pilot.ps1
```

El segundo comando mantiene abiertos exclusivamente Auth/Firestore del proyecto `demo-kioku-sources`, puertos 9197/8187, y el servidor 8787 en loopback. No carga Functions o adaptadores IA. Detener ese proceso también detiene los emuladores; no exporta datos. Las guardas rechazan otros proyectos o direcciones. No reutilizar esta autenticación sintética sin atestación como acceso de producción.

En otra terminal, elegir el transporte del Honor en `adb devices -l` y enlazar `adb -t <transporte> reverse tcp:8787 tcp:8787`. Repetir el enlace si cambia la conexión inalámbrica. El cliente tiene destino fijo `127.0.0.1:8787`, sin proxy, redirecciones o host configurable; el HTTP claro solo se admite en ese destino local en esta variante. No abrir puertos del PC a la red.

```powershell
pwsh -NoProfile -File tooling/mobile.ps1 mobileCheck :androidApp:assembleReferencePilot :androidApp:assembleReferencePilotAndroidTest :androidApp:lintReferencePilot -PkiokuReferencePilot=true
```

Instalar conservando datos los APK `androidApp/build/outputs/apk/referencePilot/androidApp-referencePilot.apk` y su instrumentado en `androidApp/build/outputs/apk/androidTest/referencePilot/`. No sustituye ni desinstala Kioku. La variante tiene ID terminado en `.references`, configuración Firebase de producción vacía, MainActivity habitual deshabilitada y permiso de micrófono retirado. La composición propia usa Koin y repositorio de documentos.

El corpus binario generado se incluye únicamente en los assets de esta variante para probar formatos; no es un archivo de originales importados. `ReferencePilotProvider` solo expone sus cuatro fixtures con concesión temporal, sin rutas elegidas por el usuario. Sus copias de caché son también fixtures generados, nunca archivos del propietario.

Validación HTTP aislada: `pwsh -NoProfile -File tooling/reference-pilot.ps1 -Verify`, con el servidor anterior detenido para evitar colisión de puertos. La suite normal de emuladores conserva su otro proyecto demo. Instrumentar únicamente las clases de documentos ficticios en `io.github.dejitarunoseireinoapuri.kioku.references.test`; no lanzar recorridos de cuenta/memoria real. [Evidencia y pendientes](SHARED_SOURCES_VALIDATION.md).

El ajuste de fuentes Kotlin por variante sigue la [documentación de Android para Kotlin integrado](https://developer.android.com/build/migrate-to-built-in-kotlin). El formateador usa rutas relativas para conservar todos los archivos sin exceder el límite de argumentos de Windows.
