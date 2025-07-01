
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
      case 'building':
        return <Building2 className="w-8 h-8 text-blue-600" />;
      case 'house':
        return <Home className="w-8 h-8 text-emerald-600" />;
      case 'commercial':
        return <Store className="w-8 h-8 text-orange-600" />;
      default:
        return <Building2 className="w-8 h-8 text-slate-600" />;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center mr-4">
              {getUnitIcon()}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{unit.name}</h2>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${getUnitTypeColor()}`}>
                {unit.type.charAt(0).toUpperCase() + unit.type.slice(1)}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Unit
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Address</p>
                  <p className="font-medium text-slate-900">{unit.address}</p>
                </div>
              </div>
              {unit.manager && (
                <div>
                  <p className="text-sm text-slate-500">Manager</p>
                  <p className="font-medium text-slate-900">{unit.manager}</p>
                </div>
              )}
            </div>
            {unit.description && (
              <div className="mt-4">
                <p className="text-sm text-slate-500">Description</p>
                <p className="text-slate-700 mt-1">{unit.description}</p>
              </div>
            )}
          </div>

          {/* Type-Specific Details */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {unit.type === 'building' && 'Building Details'}
              {unit.type === 'house' && 'House Details'}
              {unit.type === 'commercial' && 'Commercial Details'}
            </h3>
            
            {unit.type === 'building' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-slate-500">Total Floors</p>
                  <p className="text-2xl font-bold text-slate-900">{unit.totalFloors || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Properties</p>
                  <p className="text-2xl font-bold text-slate-900">{properties.length}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Available</p>
                  <p className="text-2xl font-bold text-emerald-600">{availableProperties}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Rented</p>
                  <p className="text-2xl font-bold text-blue-600">{rentedProperties}</p>
                </div>
              </div>
            )}

            {unit.type === 'house' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500">Number of Floors</p>
                  <p className="text-2xl font-bold text-slate-900">{unit.floors || 1}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Property Type</p>
                  <p className="text-lg font-medium text-slate-900">
                    {unit.floors === 1 ? 'Single Floor House' : `${unit.floors}-Floor House`}
                  </p>
                </div>
              </div>
            )}

            {unit.type === 'commercial' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500">Size</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {unit.size ? `${unit.size.toLocaleString()} sq ft` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Type</p>
                  <p className="text-lg font-medium text-slate-900">Standalone Commercial Space</p>
                </div>
              </div>
            )}
          </div>

          {/* Properties (for all unit types) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {unit.type === 'building' ? 'Properties in Building' : 'Property Details'}
              </h3>
            </div>

            {properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => (
                  <div key={property.id} className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900">{property.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        property.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                        property.status === 'RENTED' ? 'bg-blue-100 text-blue-800' :
                        property.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {property.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      {property.unitNumber && <p>Unit: {property.unitNumber} • Floor {property.floor}</p>}
                      <p>Type: {property.type}</p>
                      <p>Size: {property.size} sq ft</p>
                      <p>Rooms: {property.rooms} • Baths: {property.bathrooms}</p>
                      <p className="font-medium text-slate-900">Rent: ${property.rent.toLocaleString()}/month</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No properties added yet</p>
                <p className="text-sm text-slate-500">Add properties in the Properties section</p>
              </div>
            )}
          </div>

          {/* Amenities */}
          {unit.amenities.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Amenities</h3>
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
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {unit.photos.map((photo, index) => (
                  <div key={index} className="aspect-square bg-slate-200 rounded-lg overflow-hidden">
                    <img
                      src={photo}
                      alt={`${unit.name} photo ${index + 1}`}
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