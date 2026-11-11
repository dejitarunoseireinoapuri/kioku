# Guía de desarrollo

## Situación inicial

Solo esta base documental y políticas están preparadas. Aún no existen `gradlew`, catálogo KMP, proyectos Xcode/Android o paquete Functions canónicos. No presentar los comandos de Wonderdrop como ejecutables en Kioku ni instalar versiones sin revisar compatibilidad.

Trabajar desde la raíz seleccionada como workspace; nunca fijar una ruta personal absoluta. Windows sirve para el trabajo Android/backend; las validaciones iOS de compilación, firma y dispositivo requieren una máquina macOS/Xcode adecuada.

## Validación disponible ahora

Desde la raíz, con PowerShell:

```powershell
pwsh -NoProfile -File tooling/check-docs.ps1
```

Comprueba enlaces locales, mapa de fuentes, índice ADR y marcadores de secreto/rutas personales en la documentación gobernada. No demuestra corrección semántica, seguridad real o compilación de una app.

## Base técnica posterior

La fase K0 fijará JDK, Gradle, Kotlin, Compose, Koin, Navigation y SDK nativos compatibles; Node/TypeScript/Firebase tendrán sus propios lockfiles. Wonderdrop sirve como referencia, no como descarga de binarios/wrappers sin verificar. JDK 21 y Node 22 son el punto de partida de referencia, sujetos a compatibilidad del conjunto elegido.

Se añadirán comandos reales de formato, Detekt, Lint, arquitectura, commonTest, Android y emuladores. Cada comando documentado distinguirá implementado de previsto. No crear scripts de éxito vacío.

## Trabajo por caso de uso

Trazar FR/BR → UC → contrato/datos → comportamiento → prueba. Para operaciones protegidas, diseñar y probar backend/reglas antes de confiar en un cliente. Usar proveedores fake para pruebas aisladas. La credencial y su tratamiento se deciden antes de tocar código que llame a OpenAI; no se necesita una clave para preparar esta documentación.

Registrar evidencia acotada, sin contenido privado. No desinstalar ni borrar datos de dispositivos personales por rutina. Mantener sesión y firma de instalaciones de prueba compatibles.
