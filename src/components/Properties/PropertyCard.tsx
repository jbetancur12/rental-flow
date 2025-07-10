
import { Property } from '../../types';
import { useApp } from '../../context/useApp';
import { MapPin, Home, Users, DollarSign, Edit, Trash2, Key, FileText, CreditCard, XCircle, Building } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
  onRent?: (property: Property) => void;
  onViewContract?: (property: Property) => void;
  onRecordPayment?: (property: Property) => void;
  onTerminateContract?: (property: Property) => void;
}

export function PropertyCard({ 
  property, 
  onEdit, 
  onDelete, 
  onRent, 
  onViewContract, 
  onRecordPayment, 
  onTerminateContract 
}: PropertyCardProps) {
  const { contracts, tenants, payments } = useApp();
  
  const statusColors = {
    AVAILABLE: 'bg-emerald-100 text-emerald-800',
    RESERVED: 'bg-yellow-100 text-yellow-800',
    RENTED: 'bg-blue-100 text-blue-800',
    MAINTENANCE: 'bg-red-100 text-red-800'
  };

  // Get current tenant and contract info for RENTED properties
  const activeContract = contracts.find(c => 
    c.propertyId === property.id && c.status === 'ACTIVE'
  );
  const currentTenant = activeContract ? 
    tenants.find(t => t.id === activeContract.tenantId) : null;
  const draftContractsCount = contracts.filter(c =>
    c.propertyId === property.id && c.status === 'DRAFT'
  ).length;
  const overduePayments = payments.filter(p => 
    activeContract && p.contractId === activeContract.id && 
    p.status === 'PENDING' && 
    new Date(p.dueDate) < new Date()
  );
  

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative">
        <img
          src={property.photos[0] || 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'}
          alt={property.name}
          className="w-full h-full object-cover"
        />
        {property.status === 'AVAILABLE' && draftContractsCount > 0 && (
        <div 
          className="absolute top-4 left-4" 
          title={`${draftContractsCount} contrato(s) en borrador`}
        >
          <div className="bg-blue-500 text-white p-2 rounded-full flex items-center shadow-lg">
            <FileText className="w-4 h-4" />
          </div>
        </div>
      )}
        <div className="absolute top-4 right-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[property.status]} dark:bg-opacity-80`}>
            {property.status === 'AVAILABLE' && 'Disponible'}
            {property.status === 'RESERVED' && 'Reservado'}
            {property.status === 'RENTED' && 'Rentado'}
            {property.status === 'MAINTENANCE' && 'Mantenimiento'}
          </span>
        </div>
        
        {/* Overdue Payment Alert */}
        {overduePayments.length > 0 && (
          <div className="absolute top-4 left-4">
            <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <CreditCard className="w-3 h-3 mr-1" />
              {overduePayments.length} Vencido(s)
            </div>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{property.name}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(property)}
              className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(property.id)}
              className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center text-slate-600 dark:text-slate-300 mb-3">
          <Building className="w-4 h-4 mr-1" />
          <span className="text-sm">{property.unitName}</span>
        </div>
        
        <div className="flex items-center text-slate-600 dark:text-slate-300 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">{property.address}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-slate-600 dark:text-slate-300">
            <Home className="w-4 h-4 mr-2" />
            <span className="text-sm">{property.size} m²</span>
          </div>
          <div className="flex items-center text-slate-600 dark:text-slate-300">
            <Users className="w-4 h-4 mr-2" />
            <span className="text-sm">{property.rooms} hab / {property.bathrooms} baños</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-slate-900 dark:text-white">
            <DollarSign className="w-5 h-5 mr-1" />
            <span className="text-xl font-bold">{property.rent.toLocaleString()}</span>
            <span className="text-slate-600 dark:text-slate-300 ml-1">/mes</span>
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-400 capitalize">
            {property.type === 'APARTMENT' && 'Apartamento'}
            {property.type === 'HOUSE' && 'Casa'}
            {property.type === 'COMMERCIAL' && 'Comercial'}
            {property.type === 'BUILDING' && 'Edificio'}
          </span>
        </div>

        {/* Current Tenant Info for Rented Properties */}
        {property.status === 'RENTED' && currentTenant && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  {currentTenant.firstName} {currentTenant.lastName}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">{currentTenant.email}</p>
              </div>
              {overduePayments.length > 0 && (
                <div className="text-red-600 dark:text-red-400 text-xs font-medium">
                  ${overduePayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} vencido(s)
                </div>
              )}
            </div>
          </div>
        )}
        
        {property.amenities.length > 0 && (
          <div className="mb-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex flex-wrap gap-2">
              {property.amenities.slice(0, 3).map((amenity, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs rounded-full"
                >
                  {amenity}
                </span>
              ))}
              {property.amenities.length > 3 && (
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs rounded-full">
                  +{property.amenities.length - 3} más
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons Based on Property Status */}
        <div className="space-y-2">
          {property.status === 'AVAILABLE' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onRent && onRent(property)}
                className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                <Key className="w-4 h-4 mr-2" />
                Rentar Ahora
              </button>
              <button className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-sm">
                <FileText className="w-4 h-4 mr-2" />
                Detalles
              </button>
            </div>
          )}

          {property.status === 'RENTED' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onRecordPayment && onRecordPayment(property)}
                  className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    overduePayments.length > 0 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {overduePayments.length > 0 ? 'Pagar Vencido' : 'Registrar Pago'}
                </button>
                <button
                  onClick={() => onViewContract && onViewContract(property)}
                  className="flex items-center justify-center px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Contrato
                </button>
              </div>
              <button
                onClick={() => onTerminateContract && onTerminateContract(property)}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Terminar Contrato
              </button>
            </div>
          )}

          {property.status === 'MAINTENANCE' && (
            <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
              En Mantenimiento
            </button>
          )}
        </div>

        {property.status === 'AVAILABLE' && draftContractsCount > 0 && (
          <div className="my-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-sm font-medium text-blue-800 flex items-center justify-center">
              <FileText className="w-4 h-4 mr-2" />
              {draftContractsCount} contrato(s) en borrador listo(s) para asignar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}