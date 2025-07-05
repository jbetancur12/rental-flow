import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

// Reemplaza esta URL con la que te generé arriba
const imageUrl = '/404-robot.png';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center p-6">
      <div className="max-w-md w-full">
        
        {/* Imagen */}
        <div className="mb-8">
          <img 
            src={imageUrl} 
            alt="Robot buscando una llave perdida" 
            className="w-full h-auto rounded-2xl shadow-xl"
          />
        </div>

        {/* Contenido de Texto */}
        <p className="text-xl font-medium text-slate-700 mb-2">
          Página no encontrada
        </p>
        <p className="text-slate-500 mb-8">
          Parece que la página que buscas se ha mudado o nunca existió.
        </p>

        {/* Botón para Volver */}
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 ease-in-out transform hover:-translate-y-1"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}