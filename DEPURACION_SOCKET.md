# Depuración de socket.io y listeners en RentFlow

## Contexto
- Se detectó que los eventos socket.io para unidades (units) dejaban de recibirse en el frontend después de la primera vez, especialmente tras implementar toasts globales.
- Antes de los toasts, la actualización en tiempo real funcionaba correctamente.

## Diagnóstico
- El problema surgió porque los listeners de socket se registraban tanto en el store Zustand (`useAppStore.ts`) como en el componente de layout (`Layout.tsx`) para mostrar toasts.
- El cleanup de listeners en `Layout.tsx` usaba `socket.off('evento')`, eliminando **todos** los listeners de ese evento, incluyendo los del store.
- Esto provocaba que, tras desmontar/remontar el layout, los listeners del store dejaran de funcionar y no se recibieran más eventos en tiempo real.

## Solución aplicada
- Se modificó el cleanup de listeners en `Layout.tsx` para que solo elimine los handlers que el propio Layout registró, usando funciones nombradas y pasando esas referencias a `socket.on` y `socket.off`.
- Ahora, el store y el layout pueden tener listeners independientes sin interferir entre sí.

## Estado actual
- Tras el cambio, se debe refrescar ambos navegadores y probar crear, editar y eliminar unidades para verificar que los logs y la UI se actualicen correctamente en tiempo real.
- Si el problema persiste, se recomienda:
  1. Verificar el estado del socket (`window.__rentflow_socket.connected`)
  2. Verificar los listeners activos (`window.__rentflow_socket.listeners('unit:deleted')`)
  3. Usar `onAny` para ver si llegan eventos socket
  4. Confirmar que ambos navegadores están en la misma organización
  5. Revisar la consola de errores

---

*Última actualización: [fecha de hoy]* 