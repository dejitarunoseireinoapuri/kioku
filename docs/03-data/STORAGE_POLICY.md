# Persistencia y ciclo de vida

## Memoria

Firestore conserva texto y referencias/contexto mínimos por cuenta. No hay base de negocio local ni lectura de memoria offline. Preferencias no sensibles de dispositivo y sesión nativa pueden persistir; no guardar claves permanentes en preferencias, backups o una colección legible.

## Audio y entradas pendientes

Captura temporal explícita, excluida de copias/galería. Transcribir y limpiar; cancelar limpia sin crear recuerdos. El transporte puede requerir un objeto temporal con acceso limitado por cuenta, operación y caducidad, nunca una URL pública permanente. La política concreta de timeout/límite/limpieza debe probarse antes de uso real.

Una entrada ya iniciada que pierde red es un error recuperable, no autorización para una cola offline o para prometer guardado. La conservación temporal necesaria para reintentar queda limitada al contexto definido de esa operación.

## Corrección y borrado

Corrección: cambiar canónico y revisión; retirar de búsqueda derivados obsoletos. Borrado: bloquear recuperación, retirar el texto objetivo de sus fuentes/fragmentos, limpiar derivados y contexto que puedan reconstruirlo. Preservar asuntos ajenos al alcance.

Un tombstone no incluye el contenido borrado. El éxito comunicado debe corresponder al estado confirmado; no describir como eliminación física global lo que sea una revocación seguida de limpieza. Reejecutar un job viejo o un recibo no resucita el dato.

## Recuperación

La misma identidad recupera la memoria guardada en otro móvil. No equivale a restaurar un estado anterior ni a recuperar un borrado. Backups/PITR y retenciones exactas quedan pendientes de configuración y deben respetar las revocaciones al restaurar.
