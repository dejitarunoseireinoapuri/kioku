# Validación, entrega y publicación

No hay una app distribuida ni un pipeline implementado. La publicación en tiendas no se ha decidido. Desarrollar, instalar una prueba privada, compartir un binario y publicar una app son acciones separadas.

## Antes de una entrega funcional

Validar localmente el commit exacto con herramientas fijadas. Pruebas pertinentes compartidas/Android/backend y evidencia iOS real en Mac. Versionar contratos y datos; verificar configuración de entorno y limpieza de audio. No sustituir evidencia por informes heredados o snapshots.

## Antes de usar datos reales o desplegar

Identidad permitida, reglas negativas, credenciales privadas, límites/costes, App Check, permisos de ejecución mínimos y migraciones revisados. El propietario autoriza el entorno y alcance del despliegue. Nada de pasar silenciosamente del emulador a una cuenta real.

## Si se distribuye

Resolver firma y recuperación de claves, IDs, requisitos de plataforma, privacidad y datos declarados, licencias y cuenta del operador. Backend compatible primero, cliente después; estrategia de reparación/rollback que no resucite contenido olvidado.

No se crean Actions ni checks de runner remoto por defecto. No añadir servicios de crash/analítica como efecto secundario de un release. La evidencia y cualquier excepción pendiente quedan en el informe de la fase y en [KNOWN_LIMITATIONS](../09-planning/KNOWN_LIMITATIONS.md).
