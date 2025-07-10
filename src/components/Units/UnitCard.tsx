
import { Unit, Property } from '../../types';
import { Building2, Home, Store, Edit, Eye, Trash2, MapPin } from 'lucide-react';

interface UnitCardProps {
  unit: Unit;
  properties: Property[];
  onEdit: (unit: Unit) => void;
  onView: (unit: Unit) => void;
  onDelete: (id: string) => void;
}

export function UnitCard({ 
  unit, 
  properties, 
  onEdit, 
  onView, 
  onDelete
}: UnitCardProps) {
  const getUnitIcon = () => {
    switch (unit.type) {
      case 'BUILDING':
        return <Building2 className="w-6 h-6 text-blue-600" />;
      case 'HOUSE':
        return <Home className="w-6 h-6 text-emerald-600" />;
      case 'COMMERCIAL':
        return <Store className="w-6 h-6 text-orange-600" />;
      default:
        return <Building2 className="w-6 h-6 text-slate-600" />;
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
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center mr-3">
              {getUnitIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{unit.name}</h3>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getUnitTypeColor()} dark:bg-opacity-80`}>
                {unit.type === 'BUILDING' && 'Edificio'}
                {unit.type === 'HOUSE' && 'Casa'}
                {unit.type === 'COMMERCIAL' && 'Comercial'}
              </span>
            </div>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => onView(unit)}
              className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(unit)}
              className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(unit.id)}
              className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center text-slate-600 dark:text-slate-300 mb-3">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="text-sm">{unit.address}</span>
        </div>

        {unit.description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{unit.description}</p>
        )}
      </div>

      {/* Unit Type Specific Info */}
      <div className="p-6">
        {unit.type === 'BUILDING' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Total de Pisos:</span>
                <p className="font-medium text-slate-900 dark:text-white">{unit.totalFloors || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Propiedades:</span>
                <p className="font-medium text-slate-900 dark:text-white">{properties.length}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Disponibles:</span>
                <p className="font-medium text-emerald-600 dark:text-emerald-400">{availableProperties}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Rentadas:</span>
                <p className="font-medium text-blue-600 dark:text-blue-400">{rentedProperties}</p>
              </div>
            </div>

            {/* Properties List */}
            {properties.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-900 dark:text-white">Propiedades</h4>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {properties.slice(0, 3).map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded text-xs"
                    >
                      <div>
                        <span className="font-medium">{property.unitNumber || property.name}</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-2">Piso {property.floor}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          property.status === 'AVAILABLE' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' :
                          property.status === 'RENTED' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                          'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {property.status === 'AVAILABLE' && 'Disponible'}
                          {property.status === 'RENTED' && 'Rentada'}
                          {property.status === 'RESERVED' && 'Reservada'}
                          {property.status === 'MAINTENANCE' && 'Mantenimiento'}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">${property.rent}</span>
                      </div>
                    </div>
                  ))}
                  {properties.length > 3 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                      +{properties.length - 3} más propiedades
                    </p>
                  )}
                </div>
              </div>
            )}

            {properties.length === 0 && (
              <div className="text-center py-4 border-2 border-dashed border-slate-300 rounded-lg">
                <p className="text-sm text-slate-500">Aún no se han agregado propiedades</p>
                <p className="text-xs text-slate-400">Agrega propiedades en la sección de Propiedades</p>
              </div>
            )}
          </div>
        )}

        {unit.type === 'HOUSE' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Pisos:</span>
                <p className="font-medium text-slate-900">{unit.floors || 1}</p>
              </div>
              <div>
                <span className="text-slate-500">Encargado:</span>
                <p className="font-medium text-slate-900">{unit.manager || 'Sin asignar'}</p>
              </div>
            </div>
            
            {/* House Property */}
            {properties.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{properties[0].name}</p>
                    <p className="text-sm text-slate-600">{properties[0].size} m² • ${properties[0].rent}/mes</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    properties[0].status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                    properties[0].status === 'RENTED' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {properties[0].status === 'AVAILABLE' && 'Disponible'}
                    {properties[0].status === 'RENTED' && 'Rentada'}
                    {properties[0].status === 'RESERVED' && 'Reservada'}
                    {properties[0].status === 'MAINTENANCE' && 'Mantenimiento'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {unit.type === 'COMMERCIAL' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Tamaño:</span>
                <p className="font-medium text-slate-900">{unit.size ? `${unit.size} m²` : 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500">Encargado:</span>
                <p className="font-medium text-slate-900">{unit.manager || 'Sin asignar'}</p>
              </div>
            </div>
            
            {/* Commercial Property */}
            {properties.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{properties[0].name}</p>
                    <p className="text-sm text-slate-600">{properties[0].size} m² • ${properties[0].rent}/mes</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    properties[0].status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                    properties[0].status === 'RENTED' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {properties[0].status === 'AVAILABLE' && 'Disponible'}
                    {properties[0].status === 'RENTED' && 'Rentada'}
                    {properties[0].status === 'RESERVED' && 'Reservada'}
                    {properties[0].status === 'MAINTENANCE' && 'Mantenimiento'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Amenities */}
        {unit.amenities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-medium text-slate-900 mb-2">Amenidades</h4>
            <div className="flex flex-wrap gap-1">
              {unit.amenities.slice(0, 3).map((amenity, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full"
                >
                  {amenity}
                </span>
              ))}
              {unit.amenities.length > 3 && (
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                  +{unit.amenities.length - 3} más
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex space-x-2">
          <button
            onClick={() => onView(unit)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Ver Detalles
          </button>
        </div>
      </div>
    </div>
  );
}