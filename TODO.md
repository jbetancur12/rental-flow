# TODO: Validar módulo de Contabilidad (Backend y Frontend)

## 1. Backend
- [x] Verificar que el modelo AccountingEntry existe y está migrado en la base de datos
- [x] Validar que las rutas /accounting y /accounting/report funcionan correctamente
  - [x] GET /accounting (listar asientos)
  - [x] POST /accounting (crear asiento)
  - [x] PUT /accounting/:id (editar asiento)
  - [x] DELETE /accounting/:id (eliminar asiento)
  - [x] GET /accounting/report (reporte de totales y balance)
- [x] Probar que los endpoints devuelven los datos esperados y gestionan errores correctamente
- [ ] Validar que los asientos contables automáticos (pagos, mantenimiento) se crean correctamente

## 2. Frontend
- [x] Agregar métodos en src/config/api.ts para consumir la API de contabilidad
  - [x] getAccountingEntries (GET /accounting)
  - [x] createAccountingEntry (POST /accounting)
  - [x] updateAccountingEntry (PUT /accounting/:id)
  - [x] deleteAccountingEntry (DELETE /accounting/:id)
  - [x] getAccountingReport (GET /accounting/report)
- [x] Crear página o sección de Contabilidad
  - [x] Mostrar lista de asientos contables
  - [x] Permitir crear, editar y eliminar asientos contables
  - [x] Mostrar reportes de balance e ingresos/gastos
- [x] Agregar enlace a la sección de contabilidad en el menú principal
- [ ] Validar que la UI muestra correctamente los datos y gestiona errores

## 3. Pruebas de integración
- [ ] Probar el flujo completo: crear, editar, eliminar asientos desde el frontend y ver reflejados los cambios en la base de datos
- [ ] Validar que los reportes de contabilidad muestran los datos correctos
- [ ] Probar con diferentes roles de usuario (admin, super admin, etc.)

---

**Notas:**
- Si algún endpoint o funcionalidad no existe, agregarla como subtarea.
- Documentar cualquier error encontrado durante la validación. 