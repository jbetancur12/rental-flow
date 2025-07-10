
import { Unit, Property } from '../../types';
import { X, Building2, Home, Store, MapPin, Edit } from 'lucide-react';

interface UnitDetailsProps {
  unit: Unit;
  properties: Property[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function UnitDetails({ unit, properties, isOpen, onClose, onEdit }: UnitDetailsProps) {
  if (!isOpen) return null;

  const getUnitIcon = () => {
    switch (unit.type) {
      case 'BUILDING':
        return <Building2 className="w-8 h-8 text-blue-600" />;
      case 'HOUSE':
        return <Home className="w-8 h-8 text-emerald-600" />;
      case 'COMMERCIAL':
        return <Store className="w-8 h-8 text-orange-600" />;
      default:
        return <Building2 className="w-8 h-8 text-slate-600" />;
    }
  };

  const getUnitTypeColor = () => {
    switch (unit.type) {
      case 'BUILDING':
        return 'bg-blue-100 text-blue-800';
      case 'HOUSE':
        return 'bg-emerald-100 text-emerald-800';
      case 'COMMERCIAL':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const availableProperties = properties.filter(p => p.status === 'AVAILABLE').length;
  const rentedProperties = properties.filter(p => p.status === 'RENTED').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center mr-4">
              {getUnitIcon()}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{unit.name}</h2>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${getUnitTypeColor()} dark:bg-opacity-80`}>
                {unit.type === 'BUILDING' && 'Edificio'}
                {unit.type === 'HOUSE' && 'Casa'}
                {unit.type === 'COMMERCIAL' && 'Comercial'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Unidad
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Dirección</p>
                  <p className="font-medium text-slate-900 dark:text-white">{unit.address}</p>
                </div>
              </div>
              {unit.manager && (
                <div>
                  <p className="text-sm text-slate-500">Encargado</p>
                  <p className="font-medium text-slate-900 dark:text-white">{unit.manager}</p>
                </div>
              )}
            </div>
            {unit.description && (
              <div className="mt-4">
                <p className="text-sm text-slate-500">Descripción</p>
                <p className="text-slate-700 dark:text-white mt-1">{unit.description}</p>
              </div>
            )}
          </div>

          {/* Type-Specific Details */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {unit.type === 'BUILDING' && 'Detalles del Edificio'}
              {unit.type === 'HOUSE' && 'Detalles de la Casa'}
              {unit.type === 'COMMERCIAL' && 'Detalles Comerciales'}
            </h3>
            
            {unit.type === 'BUILDING' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total de Pisos</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{unit.totalFloors || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total de Propiedades</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{properties.length}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Disponibles</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{availableProperties}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Rentadas</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{rentedProperties}</p>
                </div>
              </div>
            )}

            {unit.type === 'HOUSE' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Número de Pisos</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{unit.floors || 1}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tipo de Propiedad</p>
                  <p className="text-lg font-medium text-slate-900 dark:text-white">
                    {unit.floors === 1 ? 'Casa de un piso' : `Casa de ${unit.floors} pisos`}
                  </p>
                </div>
              </div>
            )}

            {unit.type === 'COMMERCIAL' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500">Tamaño</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {unit.size ? `${unit.size.toLocaleString()} m²` : 'N/D'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Tipo</p>
                  <p className="text-lg font-medium text-slate-900">Espacio Comercial Independiente</p>
                </div>
              </div>
            )}
          </div>

          {/* Properties (for all unit types) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {unit.type === 'BUILDING' ? 'Propiedades en el Edificio' : 'Detalles de la Propiedad'}
              </h3>
            </div>

            {properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => (
                  <div key={property.id} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900 dark:text-white">{property.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        property.status === 'AVAILABLE' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300' :
                        property.status === 'RENTED' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300' :
                        property.status === 'RESERVED' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300' :
                        'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                      }`}>
                        {property.status === 'AVAILABLE' && 'Disponible'}
                        {property.status === 'RENTED' && 'Rentada'}
                        {property.status === 'RESERVED' && 'Reservada'}
                        {property.status === 'MAINTENANCE' && 'Mantenimiento'}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                      {property.unitNumber && <p>Unidad: {property.unitNumber} • Piso {property.floor}</p>}
                      <p>Tipo: {property.type === 'APARTMENT' && 'Apartamento'}{property.type === 'HOUSE' && 'Casa'}{property.type === 'COMMERCIAL' && 'Comercial'}{property.type === 'BUILDING' && 'Edificio'}</p>
                      <p>Tamaño: {property.size} m²</p>
                      <p>Habitaciones: {property.rooms} • Baños: {property.bathrooms}</p>
                      <p className="font-medium text-slate-900 dark:text-white">Renta: ${property.rent.toLocaleString()}/mes</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">Aún no se han agregado propiedades</p>
                <p className="text-sm text-slate-500">Agrega propiedades en la sección de Propiedades</p>
              </div>
            )}
          </div>

          {/* Amenities */}
          {unit.amenities.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Amenidades</h3>
              <div className="flex flex-wrap gap-2">
                {unit.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {unit.photos.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Fotos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {unit.photos.map((photo, index) => (
                  <div key={index} className="aspect-square bg-slate-200 rounded-lg overflow-hidden">
                    <img
                      src={photo}
                      alt={`${unit.name} foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}