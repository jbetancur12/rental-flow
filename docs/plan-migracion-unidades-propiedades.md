# Plan de Migración: Intercambio de Conceptos "Unidades" y "Propiedades"

## Objetivo
Corregir el modelo de datos y la lógica de negocio para que:
- **Propiedad** (Property): sea el inmueble principal (edificio, casa, local, etc.)
- **Unidad** (Unit): sea el espacio interno dentro de la propiedad (apartamento, oficina, local interno, etc.)

Actualmente, estos conceptos están invertidos en el sistema.

---

## 1. Preparación y Respaldo
- [ ] **Comunicar** al equipo y usuarios sobre el cambio conceptual.
- [ ] **Hacer backup** completo de la base de datos y del código.
- [ ] Crear rama de migración: `feature/migracion-unidades-propiedades`

---

## 2. Análisis y Mapeo
- [ ] Listar todos los modelos, endpoints, componentes y textos afectados.
- [ ] Mapear relaciones actuales:
  - ¿Qué modelo es padre/hijo?
  - ¿Dónde se usan los nombres en frontend/backend?
- [ ] Identificar scripts de migración necesarios para datos existentes.

---

## 3. Cambios en la Base de Datos (Prisma)
- [ ] Renombrar modelos en `schema.prisma`:
  - `model Unit` → `model Property`
  - `model Property` → `model Unit`
- [ ] Ajustar relaciones (una propiedad tiene muchas unidades).
- [ ] Renombrar campos, foreign keys y referencias.
- [ ] Crear migración Prisma para aplicar los cambios.
- [ ] Escribir script de migración de datos para mover/ajustar registros existentes.

---

## 4. Backend (Node/Express)
- [ ] Renombrar imports, variables, funciones y rutas:
  - `/units` → `/properties`
  - `/properties` → `/units`
- [ ] Actualizar controladores, servicios y validaciones.
- [ ] Ajustar lógica de negocio (creación, edición, asignación, reportes).
- [ ] Actualizar documentación de la API.

---

## 5. Frontend (React)
- [ ] Renombrar componentes, props y hooks:
  - `UnitForm` → `PropertyForm`, etc.
  - `PropertyForm` → `UnitForm`, etc.
- [ ] Actualizar textos, labels y navegación.
- [ ] Ajustar flujos de creación, edición y visualización.
- [ ] Revisar reportes, filtros y tablas.

---

## 6. Pruebas
- [ ] Probar todos los flujos críticos:
  - Crear, editar, eliminar propiedades y unidades.
  - Asignar contratos, pagos, mantenimientos.
  - Reportes y búsquedas.
- [ ] Validar integridad de datos migrados.
- [ ] Pruebas de usuario (UAT) si es posible.

---

## 7. Despliegue y Monitoreo
- [ ] Hacer deploy en entorno de staging primero.
- [ ] Validar funcionamiento y datos en staging.
- [ ] Hacer deploy en producción en horario de bajo tráfico.
- [ ] Monitorear logs y feedback de usuarios.

---

## 8. Mitigación de Riesgos
- Backup antes de cada paso crítico.
- Scripts de rollback listos.
- Comunicación clara con usuarios.
- Pruebas exhaustivas antes de producción.

---

## 9. Checklist de Éxito
- [ ] Todos los modelos y relaciones reflejan la nueva jerarquía.
- [ ] No hay pérdida de datos.
- [ ] El frontend y backend funcionan correctamente.
- [ ] Los usuarios entienden el nuevo flujo.

---

**Notas:**
- Documentar cualquier decisión o ajuste durante la migración.
- Si hay dudas, consultar con el equipo antes de avanzar. 