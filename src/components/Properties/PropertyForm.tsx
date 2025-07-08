import { useState, useEffect } from 'react';
import { Property } from '../../types';
import { useApp } from '../../context/useApp';
import { X, Upload } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface PropertyFormProps {
  property?: Property;
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function PropertyForm({ property, isOpen, onClose }: PropertyFormProps) {
  const { units, createProperty, updateProperty } = useApp();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'APARTMENT' as Property['type'],
    address: '',
    size: 0,
    rooms: 0,
    bathrooms: 0,
    amenities: [] as string[],
    rent: 0,
    status: 'AVAILABLE' as Property['status'],
    photos: [] as string[],
    unitId: '',
    unitNumber: '',
    floor: 1
  });

  const [newAmenity, setNewAmenity] = useState('');

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name,
        type: property.type,
        address: property.address,
        size: property.size,
        rooms: property.rooms,
        bathrooms: property.bathrooms,
        amenities: [...property.amenities],
        rent: property.rent,
        status: property.status,
        photos: [...property.photos],
        unitId: property.unitId || '',
        unitNumber: property.unitNumber || '',
        floor: property.floor || 1
      });
    } else {
      setFormData({
        name: '',
        type: 'APARTMENT',
        address: '',
        size: 0,
        rooms: 0,
        bathrooms: 0,
        amenities: [],
        rent: 0,
        status: 'AVAILABLE',
        photos: [],
        unitId: '',
        unitNumber: '',
        floor: 1
      });
    }
  }, [property]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Get unit info to set address
      const selectedUnit = units.find((u: any) => u.id === formData.unitId);
      let finalAddress = formData.address;
      if (selectedUnit) {
        if (selectedUnit.type === 'BUILDING' && formData.unitNumber) {
          finalAddress = `${selectedUnit.address}, Unidad ${formData.unitNumber}`;
        } else if (selectedUnit.type === 'HOUSE' || selectedUnit.type === 'COMMERCIAL') {
          finalAddress = selectedUnit.address;
        }
      }
      const propertyData = {
        ...formData,
        address: finalAddress
      };
      if (property) {
        await updateProperty(property.id, propertyData);
        toast.success('Propiedad actualizada', 'La propiedad se actualizó correctamente.');
      } else {
        await createProperty(propertyData);
        toast.success('Propiedad creada', 'La propiedad se agregó correctamente.');
      }
      onClose();
    } catch (error: any) {
      let msg = error?.error || error?.message || 'No se pudo guardar la propiedad.';
      if (error?.details && Array.isArray(error.details)) {
        msg = error.details.map((d: any) => `${d.field ? d.field + ': ' : ''}${d.message}`).join(' | ');
      }
      toast.error('Error al guardar propiedad', msg);
      console.error('Error saving property:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, newAmenity.trim()]
      });
      setNewAmenity('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter(a => a !== amenity)
    });
  };

  const handleUnitChange = (unitId: string) => {
    const selectedUnit = units.find((u: any) => u.id === unitId);
    if (selectedUnit) {
      // Auto-set property type based on unit type
      let propertyType: Property['type'] = 'APARTMENT';
      if (selectedUnit.type === 'HOUSE') {
        propertyType = 'HOUSE';
      } else if (selectedUnit.type === 'COMMERCIAL') {
        propertyType = 'COMMERCIAL';
      }
      
      setFormData({
        ...formData,
        unitId,
        type: propertyType,
        address: selectedUnit.address,
        name: selectedUnit.type === 'BUILDING' ? '' : selectedUnit.name
      });
    } else {
      setFormData({
        ...formData,
        unitId: '',
        address: '',
        name: ''
      });
    }
  };

  if (!isOpen) return null;

  const selectedUnit = units.find((u: any) => u.id === formData.unitId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {property ? 'Editar Propiedad' : 'Agregar Nueva Propiedad'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Unit Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Seleccionar Unidad <span className="text-red-500">*</span>
            </label>
            {units.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  ⚠️ No hay unidades disponibles. Por favor, cree unidades primero en la sección de Unidades.
                </p>
              </div>
            ) : (
              <select
                required
                value={formData.unitId}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="">Elegir una unidad...</option>
                {units.map((unit: any) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} - {unit.type === 'BUILDING' ? 'Edificio' : 
                                   unit.type === 'HOUSE' ? 'Casa' : 'Comercial'} ({unit.address})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Property Details */}
          {selectedUnit && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre de la Propiedad
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={
                      selectedUnit.type === 'BUILDING' 
                        ? 'ej., Apartamento 2A, Suite 200' 
                        : selectedUnit.name
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipo de Propiedad
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Property['type'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={selectedUnit.type !== 'BUILDING' || isSubmitting}
                  >
                    {selectedUnit.type === 'BUILDING' ? (
                      <>
                        <option value="APARTMENT">Apartamento</option>
                        <option value="COMMERCIAL">Comercial</option>
                      </>
                    ) : selectedUnit.type === 'HOUSE' ? (
                      <option value="HOUSE">Casa</option>
                    ) : (
                      <option value="COMMERCIAL">Comercial</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Unit Number and Floor (for BUILDINGs) */}
              {selectedUnit.type === 'BUILDING' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Número de Unidad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.unitNumber}
                      onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ej., 2A, 101, Suite 200"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Piso
                    </label>
                    <select
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSubmitting}
                    >
                      {Array.from({ length: selectedUnit.totalFloors || 10 }, (_, i) => i + 1).map(floor => (
                        <option key={floor} value={floor}>Piso {floor}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tamaño (m²)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Habitaciones
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.rooms}
                    onChange={(e) => setFormData({ ...formData, rooms: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Baños
                  </label>
                  <input
                    type="number"
                    required
                    step="0.5"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Renta Mensual ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.rent}
                    onChange={(e) => setFormData({ ...formData, rent: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Property['status'] })}
                  className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value="AVAILABLE">Disponible</option>
                  <option value="RESERVED">Reservada</option>
                  <option value="RENTED">Alquilada</option>
                  <option value="MAINTENANCE">En Mantenimiento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amenidades
                </label>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    placeholder="Agregar comodidad"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={addAmenity}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(amenity)}
                        className="ml-2 text-slate-400 hover:text-slate-600"
                        disabled={isSubmitting}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fotos
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600">Haz clic para subir fotos o arrastra y suelta</p>
                  <p className="text-sm text-slate-500 mt-1">PNG, JPG hasta 10MB cada una</p>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={!formData.unitId || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                property ? 'Actualizar Propiedad' : 'Crear Propiedad'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}