# Estructura prevista

```text
androidApp/                    host Android y adaptadores nativos
iosApp/                        host Xcode/Swift y puentes nativos
shared/src/commonMain/kotlin/
  core/                        errores, contratos, identidad, tiempo
  feature/account/             domain, presentation, data
  feature/capture/             domain, presentation, data
  feature/memory/              domain, presentation, data
  feature/recall/              domain, presentation, data
  feature/settings/            paquetes necesarios, sin duplicación ceremonial
  design/                      tema B, componentes y recursos compartidos
shared/src/androidMain/        actuals y adaptadores del módulo
shared/src/iosMain/            actuals y adaptación de puentes
shared/src/commonTest/         reglas, repositorios fake, ViewModels
firebase/functions/            aplicación backend TypeScript
firebase/rules/                reglas e índices versionados
firebase/environments/         metadatos seguros, sin credenciales
config/                        políticas de calidad
docs/                          contrato y evidencia
```

Es un mapa objetivo: estas carpetas de aplicación aún no están creadas. M0 vive en `prototypes/memory/`: núcleo TypeScript con contratos de dominio, adaptadores locales/OpenAI, CLI y evaluación separados. Es un experimento sintético previo al cliente móvil y a Functions; no otro backend público. Se reutilizarán los componentes adecuados tras validar su viabilidad, sin convertir el almacén local en persistencia móvil. Evitar una arquitectura de micro-módulos vacíos. Separar un módulo Gradle solo por aislamiento comprobable, propiedad o tiempo de compilación.

Cada feature mantiene juntas sus capas cuando las necesita. Los contratos compartidos de plataforma no conocen Compose, Firebase ni clases Swift/Android. Los hosts ensamblan la app; los puentes implementan interfaces compartidas.

`mobile/` es una exploración Expo local retirada, no la ubicación de la app elegida. `.setup/` y `design/` son historial local; la documentación canónica está en `docs/`. No eliminarlos sin necesidad ni incorporarlos al arranque KMP por accidente.
