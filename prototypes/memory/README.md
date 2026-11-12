# Prototipo de memoria · M0

Herramienta local por texto para comprobar interpretación, persistencia, recuperación y respuesta antes de construir la app. Solo datos ficticios. No es un backend desplegado ni una implementación móvil/offline de Kioku. El criterio de avance está en [M0](../../docs/09-planning/IMPLEMENTATION_PLAN.md#m0--prueba-temprana-de-memoria).

Primera evaluación ejecutada: [informe y decisión](evidence/2026-11-11.md). **M0 no está validada**: hay errores semánticos confirmados y la puntuación automática tiene limitaciones. K0 no ha empezado.

Segunda iteración: [correcciones y evidencia](evidence/2026-11-12.md). Fechas parciales, procedencia, contexto de identidad y verificación de respuestas incorporados; validación v2 todavía no declarada superada.

## Preparar y comprobar

Desde la raíz, con Node 24.12 o posterior de la serie 24:

```powershell
node tooling/m0.mjs install
node tooling/m0.mjs check
node tooling/m0.mjs test
node tooling/m0.mjs format:check
pwsh -NoProfile -File tooling/check-docs.ps1
```

La herramienta instala npm 11.6.2 verificando su SHA-512 si falta el npm local, sin ejecutar scripts de dependencias. Versiones exactas y `package-lock.json` fijan Zod, TypeScript, tipos Node y Prettier. Node ejecuta TypeScript; `check` realiza la comprobación estricta de tipos que Node no hace al ejecutarlo.

## Clave y consumo

Configurar mediante el flujo seguro de OpenAI Platform y el destino local confirmado, `.env.local`. Ese archivo y `private/` están excluidos de Git. No pegar claves en chats, argumentos, fixtures ni documentación. Elegir el proyecto de la organización que recibe los créditos; M0 no verifica saldo ni garantiza cobertura de una promoción. El flujo de alta móvil/gestor de secretos de K1 sigue pendiente.

Las llamadas reales exigen `--live`. Endpoint TLS fijo de OpenAI, sin herramientas, redirecciones ni reintentos automáticos, con `store: false` en Responses. No equivale a garantizar retención cero en el proveedor.

Configuración v2: `gpt-5.4-mini-2026-03-17`, razonamiento `low` para extracción/respuesta y también `low` para verificar; hasta 2400 tokens de salida principal y 1000 de verificación. Embeddings `text-embedding-3-small` de 512 dimensiones; seis candidatos, ranking 85 % semántico/15 % palabras. Hasta 8000 caracteres por relato, 2000 por consulta/aclaración y ocho recuerdos por intervención. Fuentes seleccionadas: hasta 16000 caracteres, entrada de modelo acotada a 48000. Timeout: 45 segundos por llamada; objetivo p95: 15 segundos por operación, separado de corrección.

**Máximo acumulado estimado: 2 USD** entre conversación y evaluaciones. `local-data/m0/budget.json` conserva uso y reservas entre procesos. Se reserva un máximo conservador antes de llamar; error/timeout mantiene la reserva porque pudo haberse cobrado. No borrar el contador para sortear el límite. Las tarifas estándar verificadas estiman consumo: factura/créditos se consultan en Platform. El contador local no garantiza un límite exacto de factura.

## Conversación de prueba

```powershell
node tooling/m0.mjs m0 --live
```

Comandos: `/contar texto`, `/preguntar texto`, `/aclarar texto`, `/olvidar ID`, `/salir`. La terminal muestra respuestas y referencias; los diagnósticos no registran contenido. Datos ficticios v2 en `local-data/m0/interactive-v2`; snapshots v1 preservados y rechazados sin alterarlos.

Olvidar exige un ID explícito y retira la fuente completa y sus recuerdos/vectores. No resuelve objetivos por lenguaje natural ni elimina un solo tema de una fuente mixta: corresponde a K4. IDs repetidos se rechazan; no es el protocolo remoto de idempotencia de K2. Un bloqueo admite un solo proceso escritor, sin concurrencia distribuida.

## Evaluar

```powershell
node tooling/m0.mjs m0:eval --live --partition tuning
node tooling/m0.mjs m0:eval --live --partition regression
node tooling/m0.mjs m0:eval --live --partition regression-v2
```

Preparación: ocho intervenciones/16 consultas. Regresión: los 32 relatos/64 consultas originales, en una ronda. `regression-v2`: los 32 relatos/64 consultas n01–n32, usados en la segunda evaluación y después para corregir el núcleo. Ya no son reserva independiente. `validation` se rechaza antes de consumir API hasta renovar corpus/rúbrica y retirar expresamente ese bloqueo; la siguiente aceptación sigue necesitando tres rondas completas. Las expectativas nunca se pasan al núcleo ni al proveedor. Las consultas usan una instancia nueva y recargan de disco; reciben únicamente las fuentes seleccionadas, no todo el historial.

El manifiesto fija huella de código/corpus, configuración, presupuesto, latencia objetivo, commit y cambios locales. Informes privados/checkpoints en `local-data/m0/evaluation/`. Una interrupción deja `complete: false` y no cuenta como ronda superada. Registrar todos los intentos; no ajustar con validación sin renovar los casos reservados.

El puntuador comprueba términos, tipos/fechas, fuentes y estados. Puede rechazar una paráfrasis válida o aceptar una frase con términos correctos pero sin respaldo. Los resultados son provisionales y **no cierran M0 automáticamente**: revisión independiente de todas las extracciones/respuestas contra sus fuentes, registro de errores semánticos/falsos positivos y aplicación del criterio del plan en las tres rondas. Una puntuación automática perfecta no permite empezar K0.

## Límites

Pruebas locales con dobles verifican el código, no el modelo. No valida Firebase, cuentas, atestación, seguridad remota, voz, dispositivos, gran escala ni limpieza distribuida. El almacén sintético local no se expone por HTTP ni se reutiliza para recuerdos personales. K2/K3/K4 repetirán las evaluaciones contra adaptadores reales.

Fuentes: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [embeddings](https://developers.openai.com/api/docs/guides/embeddings), [modelo](https://developers.openai.com/api/docs/models/gpt-5.4-mini), [tarifa de embeddings](https://developers.openai.com/api/docs/models/text-embedding-3-small) y [TypeScript en Node](https://nodejs.org/docs/latest-v24.x/api/typescript.html).

El calendario auxiliar de M0 calcula la semana pasada de lunes a domingo, ambos inclusive, desde la fecha local del timestamp de consulta con su offset. Cada fuente conserva su día local según la zona de captura. No deduce la zona actual del dispositivo: K3 deberá transportar ese contexto explícitamente.
