import React from 'react';

export default function Help() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 bg-white dark:bg-slate-900 rounded-xl shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-blue-700 dark:text-blue-400">Ayuda y Soporte - RentFlow</h1>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Introducción</h2>
        <p className="text-slate-700 dark:text-slate-300">
          Bienvenido a RentFlow, tu plataforma integral para la gestión de propiedades en renta. Aquí encontrarás información útil sobre cómo utilizar el sistema y resolver dudas frecuentes.
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Funcionalidades principales</h2>
        <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 space-y-1">
          <li>Gestión de propiedades, unidades y contratos de arrendamiento.</li>
          <li>Registro y administración de inquilinos.</li>
          <li>Control de pagos, historial y reportes financieros.</li>
          <li>Seguimiento de mantenimiento y solicitudes.</li>
          <li>Panel de analíticas y reportes.</li>
          <li>Configuración de usuarios, roles y permisos.</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Preguntas frecuentes</h2>
        <div className="mb-4">
          <h3 className="font-medium text-slate-900 dark:text-slate-100">¿Cómo registro una nueva propiedad?</h3>
          <p className="text-slate-700 dark:text-slate-300">Ve a la sección "Propiedades" y haz clic en "Agregar Propiedad". Completa el formulario y guarda los cambios.</p>
        </div>
        <div className="mb-4">
          <h3 className="font-medium text-slate-900 dark:text-slate-100">¿Cómo asigno un contrato a un inquilino?</h3>
          <p className="text-slate-700 dark:text-slate-300">En la sección "Contratos", selecciona "Crear Contrato", elige la propiedad y el inquilino, y completa los datos requeridos.</p>
        </div>
        <div className="mb-4">
          <h3 className="font-medium text-slate-900 dark:text-slate-100">¿Dónde puedo ver los pagos realizados?</h3>
          <p className="text-slate-700 dark:text-slate-300">En la sección "Pagos" puedes consultar el historial de pagos, estados y detalles de cada transacción.</p>
        </div>
        <div className="mb-4">
          <h3 className="font-medium text-slate-900 dark:text-slate-100">¿Cómo obtengo reportes financieros?</h3>
          <p className="text-slate-700 dark:text-slate-300">Accede a la sección "Reportes" para descargar o visualizar reportes de ingresos, egresos y KPIs.</p>
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Contacto y Soporte</h2>
        <p className="text-slate-700 dark:text-slate-300 mb-2">Si tienes dudas, sugerencias o necesitas soporte técnico, puedes contactarnos:</p>
        <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300">
          <li>Email: <a href="mailto:soporte@rentflow.com" className="text-blue-600 dark:text-blue-400 underline">soporte@rentflow.com</a></li>
          <li>Teléfono: +52 55 1234 5678</li>
        </ul>
      </section>
    </div>
  );
} 