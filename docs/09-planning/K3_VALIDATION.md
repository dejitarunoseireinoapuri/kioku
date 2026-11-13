# K3 · Consultar por escrito

Rama: `codex/k3-text-query`, desde `28fdc78` de `main`. **En implementación local; no activada en producción.** K2 Android aceptada por el propietario; nuevo build iOS aún sin validar. Publicar K2 en `main` no cambia esos límites.

## Alcance y referencias

Preguntar por texto, recuperar por significado/palabras, responder con fuentes actuales, aclarar ambigüedades y reconocer ausencia. No guarda preguntas como recuerdos. K4 (ofertas, corrección/olvido) y K5 (voz) quedan fuera.

Consultados alcance/reglas, requisitos/flujos/casos, arquitectura/estado, datos/API, seguridad/retención, convenciones, calidad, plan y definición de terminado. Inspeccionadas en Stitch las vistas 05 · Preguntar y escuchar y 07 · Texto original; sin editar Stitch, manteniendo B y las preferencias posteriores del propietario. Decisiones en [ADR-010](../02-architecture/ADR/ADR-010-text-query.md).

## Criterios previos a evaluación real

- Mantener `gpt-6.1-sol` con razonamiento `medium`, respuesta/verificación M0 y embeddings 512; no ajustar modelo ni prompts entre los casos de esta evaluación.
- Ejecutar una ronda de integración con 12 relatos ficticios nuevos y 16 preguntas fijadas previamente: los cinco ejemplos de producto, paráfrasis, planes/hechos, dos Pablos, ausencia y citas con instrucciones maliciosas. No usar recuerdos de producción. El núcleo conserva además su evaluación M0 v4; esta ronda comprueba los nuevos adaptadores, no es una repetición de sus tres rondas.
- Al menos 90 % en recuperación de las fuentes esperadas y en respuestas fieles, por total y categoría aplicable. Cero respuestas personales sin evidencia, conversiones de plan a hecho, fuga entre cuentas o uso de fuentes retiradas. Revisar respuestas contra los relatos por separado del verificador del circuito; las comprobaciones automáticas de palabras no bastan.
- Registrar identificadores de caso/fuentes, resultado, tiempos y coste estimado, sin claves, preguntas privadas ni recuerdos reales. Reservas y contador M0 continúan, no se reinician; límite vigente 20 USD acumulados. Detener si no cabe la prueba.
- Objetivo de consulta p95 de 10 s en esta integración aislada; informar aparte del criterio funcional. No extrapolar a red móvil, Google/App Check, gran volumen o iOS.
- Antes de datos reales: emuladores positivos/negativos, revalidación de versiones, recibos sin preguntas/respuestas y pruebas móviles de navegación, aclaración, fuentes, cancelación/recreación y cierre de sesión. Activación de función/índice/preparación en Firebase requiere autorización específica; permisos mínimos y HTTPS con Google/App Check.

## Estado de comprobaciones

La primera ejecución quedó interrumpida tras ocho preguntas: siete coincidieron automáticamente y una abstención temporal falló pese a recuperar la fuente correcta. La siguiente pregunta reveló una incompatibilidad del adaptador K3, que rechazaba las fuentes válidas de una aclaración M0; se corrige conservando las citas autorizadas también al aclarar o explicar insuficiencia, sin cambiar modelo/prompts. [Intento parcial conservado](k3-live-smoke-2026-11-13-attempt1.json). No se presenta como aceptación.

Los 12 relatos/16 consultas iniciales pasan a regresión tras esa corrección. Antes de otra aceptación independiente se fija `tooling/k3-reserve.mjs`: ocho relatos y 16 preguntas nuevos, mismas categorías/umbrales, con llamada a otra persona, fechas/contextos distintos, dos Emis y cita maliciosa distinta. No se ajustarán prompts o recuperación entre sus casos. Ejecución explícita mediante `-LiveQueryReserve`, mismo contador/límite de presupuesto.

| Comprobación | Resultado observado |
| --- | --- |
| Backend build, formato y unidades | TypeScript strict y 14 pruebas unitarias correctos |
| Emuladores Auth/Functions/Firestore | 36/36 correctas; 12 nuevas de consulta y ampliaciones de entrada/reglas, incluidos rechazo de otro propietario, cambio/borrado durante inferencia, recibos sin preguntas/respuestas, concesión obsoleta y conflicto de ID con captura |
| `mobileCheck` | 33 host tests correctos (siete nuevos), formato, arquitectura, Detekt y Lint sin errores |
| Android APK y tests | Compilados; 22/22 pruebas instrumentadas API 36 al 100 %. Las tres de consulta se repitieron tras ajustar citas/reinicio; fuente actual, espera, aclaración, recreación y cierre de sesión |
| Índice | Especificación comprobada localmente por Firebase CLI; índice remoto todavía no creado |
| iOS | Puente Query/Source y dependencias preparados; sin compilar/ejecutar el nuevo build en Mac |

El APK descomprimido y los archivos versionados se comprobaron en memoria contra el valor exacto de la clave OpenAI existente: no encontrada en ninguno. No se imprimió ni se copió a otro destino. Los identificadores públicos de Firebase no son esa clave.

## IA real y revisión de fuentes

[Regresión](k3-live-smoke-2026-11-13-attempt2.json): 12 relatos y 16 consultas; 16/16 respuestas fieles, todas las categorías superan 90 %, recuperación completa en las 12 consultas con fuente esperada y cero fallos críticos detectados. p95 5,716 s, mediana 4,418 s; coste estimado 0,376749 USD. La abstención temporal inicial no tuvo una corrección específica del modelo; el resultado correcto posterior no borra ese fallo ni garantiza que no vuelva a ocurrir.

[Reserva nueva](k3-live-smoke-2026-11-13-reserve1.json), fijada antes de ejecutarla: ocho relatos nuevos y 16 preguntas; 16/16 respuestas fieles, umbral por categoría superado, recuperación completa en las 12 consultas con fuente esperada y cero fallos críticos detectados. p95 6,088 s, mediana 4,356 s; coste estimado 0,334299 USD. Se distinguieron planes de acciones realizadas, personas con mismo nombre, ausencia y citas maliciosas. Ningún cambio de modelo, prompts o ranking entre sus casos.

El agente de desarrollo comparó cada respuesta con los relatos ficticios, fuera del circuito de generación/verificación; no es auditoría humana independiente. Las comprobaciones automáticas de palabras se conservaron y coincidieron con la revisión. Los artefactos publicados contienen IDs de caso/fuentes, resultados y métricas; los diagnósticos detallados de estas fuentes ficticias quedaron en archivos locales ignorados. No se usaron ni exportaron recuerdos reales para evaluar. Los datos demo y el bloqueo de ejecución se limpiaron al terminar.

Los tres intentos consumieron aproximadamente **0,988236 USD estimados**, incluidos capturas y embeddings diagnósticos. El contador acumulado previo se conservó: 17,869579 USD gastados estimados y 0,136855 reservados, con límite 20 USD. No representa saldo disponible de la cuenta ni cobertura promocional. Los próximos resultados se guardan en archivos con sufijo temporal para no sobrescribir esta evidencia.

## Activación y aceptación pendientes

Inspección remota de solo lectura: `queryMemory` no desplegada e índice vectorial no creado. Simulación de preparación: tres recuerdos revisados, tres necesitan proyección; cero escrituras. No se imprimió texto o UID del propietario. Se conserva único proyecto `kioku-9454f`, Bélgica, secreto/identidad de K2 y políticas de retención existentes.

Antes de activar: autorización específica para desplegar `queryMemory` y actualizar los escritores `submitTurn`/`resolveClarification`, crear el índice y preparar los tres recuerdos actuales; entrada pública HTTPS `roles/run.invoker` para `allUsers` **solo** en `queryMemory`, con Google/App Check/cuenta permitida exigidos por código. No se amplían permisos del secreto ni se crean claves. Tras índice `READY` y escritor actualizado, la preparación aditiva habilita la búsqueda; sin ella falla cerrada.

Implementación publicada en `codex/k3-text-query`, commit `c65dd0a`. El propietario respondió afirmativamente por el canal que indicó, pero la revisión automática rechazó el despliegue: no acepta la respuesta de correo como autorización verificable para producción/invocador público y exige confirmación en el chat. El proceso de despliegue no llegó a iniciarse; no se aplicó ninguno de esos cambios remotos ni se intentó una vía alternativa. Se solicitó la misma confirmación en el chat y se comunicó el bloqueo por correo. El permiso previo sobre cuatro servicios K2 no se extrapola a la nueva función.

Después: comprobar rechazo real sin credenciales y consulta/fuente/clarificación desde Android con Google/App Check reales; compilar y comprobar el nuevo build iOS. El acceso K1 y guardado K2 previos no acreditan consultas K3. No se declara cerrada K3 ni se inicia K4.
