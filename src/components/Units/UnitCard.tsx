import React from 'react';
import { Unit, Property } from '../../types';
import { Building2, Home, Store, Edit, Eye, Trash2, MapPin, Plus } from 'lucide-react';

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
      case 'building':
        return <Building2 className="w-6 h-6 text-blue-600" />;
      case 'house':
        return <Home className="w-6 h-6 text-emerald-600" />;
      case 'commercial':
        return <Store className="w-6 h-6 text-orange-600" />;
      default:
        return <Building2 className="w-6 h-6 text-slate-600" />;
    }
  };

  const getUnitTypeColor = () => {
    switch (unit.type) {
      case 'building':
        return 'bg-blue-100 text-blue-800';
      case 'house':
        return 'bg-emerald-100 text-emerald-800';
      case 'commercial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const availableProperties = properties.filter(p => p.status === 'AVAILABLE').length;
  const rentedProperties = properties.filter(p => p.status === 'RENTED').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mr-3">
              {getUnitIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{unit.name}</h3>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getUnitTypeColor()}`}>
                {unit.type.charAt(0).toUpperCase() + unit.type.slice(1)}
              </span>
            </div>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => onView(unit)}
              className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(unit)}
              className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(unit.id)}
              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center text-slate-600 mb-3">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="text-sm">{unit.address}</span>
        </div>

        {unit.description && (
          <p className="text-sm text-slate-600 mb-3">{unit.description}</p>
        )}
      </div>

      {/* Unit Type Specific Info */}
      <div className="p-6">
        {unit.type === 'building' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Total Floors:</span>
                <p className="font-medium text-slate-900">{unit.totalFloors || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500">Properties:</span>
                <p className="font-medium text-slate-900">{properties.length}</p>
              </div>
              <div>
                <span className="text-slate-500">Available:</span>
                <p className="font-medium text-emerald-600">{availableProperties}</p>
              </div>
              <div>
                <span className="text-slate-500">Rented:</span>
                <p className="font-medium text-blue-600">{rentedProperties}</p>
              </div>
            </div>

            {/* Properties List */}
            {properties.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-900">Properties</h4>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {properties.slice(0, 3).map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs"
                    >
                      <div>
                        <span className="font-medium">{property.unitNumber || property.name}</span>
                        <span className="text-slate-500 ml-2">Floor {property.floor}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          property.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                          property.status === 'RENTED' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {property.status}
                        </span>
                        <span className="text-slate-600">${property.rent}</span>
                      </div>
                    </div>
                  ))}
                  {properties.length > 3 && (
                    <p className="text-xs text-slate-500 text-center">
                      +{properties.length - 3} more properties
                    </p>
                  )}
                </div>
              </div>
            )}

            {properties.length === 0 && (
              <div className="text-center py-4 border-2 border-dashed border-slate-300 rounded-lg">
                <p className="text-sm text-slate-500">No properties added yet</p>
                <p className="text-xs text-slate-400">Add properties in the Properties section</p>
              </div>
            )}
          </div>
        )}

        {unit.type === 'house' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Floors:</span>
                <p className="font-medium text-slate-900">{unit.floors || 1}</p>
              </div>
              <div>
                <span className="text-slate-500">Manager:</span>
                <p className="font-medium text-slate-900">{unit.manager || 'Unassigned'}</p>
              </div>
            </div>
            
            {/* House Property */}
            {properties.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{properties[0].name}</p>
                    <p className="text-sm text-slate-600">{properties[0].size} sq ft • ${properties[0].rent}/month</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    properties[0].status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                    properties[0].status === 'RENTED' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {properties[0].status}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {unit.type === 'commercial' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Size:</span>
                <p className="font-medium text-slate-900">{unit.size ? `${unit.size} sq ft` : 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500">Manager:</span>
                <p className="font-medium text-slate-900">{unit.manager || 'Unassigned'}</p>
              </div>
            </div>
            
            {/* Commercial Property */}
            {properties.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{properties[0].name}</p>
                    <p className="text-sm text-slate-600">{properties[0].size} sq ft • ${properties[0].rent}/month</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    properties[0].status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                    properties[0].status === 'RENTED' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {properties[0].status}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Amenities */}
        {unit.amenities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-medium text-slate-900 mb-2">Amenities</h4>
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
                  +{unit.amenities.length - 3} more
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
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}