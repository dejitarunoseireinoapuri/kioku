# ADR-001 · Estrategia multiplataforma

- Estado: aceptada; implementación pendiente.
- Fecha: 2026-11-11.
- Motivo: el propietario pide seguir la arquitectura de Wonderdrop y soportar Android e iOS.

## Decisión

Kotlin Multiplatform y Compose Multiplatform para lógica, presentación y UI compartidas; hosts Android y Xcode delgados. Base de compatibilidad heredada: Android 10/API 29 e iOS 16. Koin y navegación compartida tipada con Navigation 3. Verificar compatibilidad real y fijar versiones en catálogo, wrappers y lockfiles al crear la base técnica.

La plantilla Expo/React Native existente fue exploratoria y queda retirada. No migrar código funcional inexistente ni mantener dos stacks de producción. No borrar sus archivos locales por rutina.

## Alternativa y consecuencias

Continuar Expo simplificaría el arranque actual, pero no cumpliría la nueva indicación de arquitectura. KMP permite compartir reglas y estilo B; iOS requiere validación real en macOS/Xcode, no sustituible por compilar Android o revisar Kotlin desde Windows. Mínimos y target SDK no equivalen a políticas de publicación; estas se revisarán si se decide distribuir.
