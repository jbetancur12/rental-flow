import { useState } from 'react';
import { Property } from '../../types';
import { useApp } from '../../context/useApp';
import { X, FileText, Calendar, DollarSign, User, AlertTriangle } from 'lucide-react';
import { formatDateInOrgTimezone } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';

interface QuickRentModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickRentModal({ property, isOpen, onClose }: QuickRentModalProps) {
  const { contracts, tenants, updateProperty, updateContract, updateTenant, createPayment, organization } = useApp();
  const toast = useToast();
  const [selectedContract, setSelectedContract] = useState('');

  // Filtrar contratos disponibles (DRAFT y asignados a esta propiedad)
  const availableContracts = contracts.filter(c =>
    c.status === 'DRAFT' &&
    c.propertyId === property.id
  );

const handleQuickRent = async () => {
    if (!selectedContract) {
        alert('Please select a contract');
        return;
    }

    const contract = availableContracts.find(c => c.id === selectedContract);
    if (!contract) return;

    try {
        const paymentsToCreate = [];
        const today = new Date();
        const contractStartDate = new Date(contract.startDate);
        const contractEndDate = new Date(contract.endDate);

        if (contract.securityDeposit > 0) {
            paymentsToCreate.push({
                contractId: contract.id,
                tenantId: contract.tenantId,
                amount: contract.securityDeposit,
                type: 'DEPOSIT' as const,
                dueDate: new Date(contractStartDate),
                status: 'PENDING' as const,
            });
        }

        const periodIterator = new Date(contractStartDate);

        while (periodIterator <= today && periodIterator < contractEndDate) {
            
            const periodStart = new Date(periodIterator);
            const periodEnd = new Date(periodIterator);
            
            // LÓGICA CORREGIDA PARA EL FIN DEL PERÍODO
            periodEnd.setMonth(periodEnd.getMonth() + 1);
            periodEnd.setDate(periodEnd.getDate() - 1); // Restamos un día

            paymentsToCreate.push({
                contractId: contract.id,
                tenantId: contract.tenantId,
                amount: contract.monthlyRent,
                type: 'RENT' as const,
                dueDate: periodStart,
                status: 'PENDING' as const,
                periodStart: periodStart,
                periodEnd: periodEnd,
            });

            periodIterator.setMonth(periodIterator.getMonth() + 1);
        }
        
        if (paymentsToCreate.length > 0) {
            for (const paymentData of paymentsToCreate) {
                await createPayment(paymentData);
            }
        }
        
        const contractUpdatePayload = {
            status: 'ACTIVE' as const,
            propertyId: property.id,
            signedDate: contract.signedDate || new Date(),
        };

        await updateProperty(property.id, { status: 'RENTED' });
        await updateContract(contract.id, contractUpdatePayload);
        const tenant = tenants.find(t => t.id === contract.tenantId);
        if (tenant && tenant.status !== 'ACTIVE') {
            await updateTenant(tenant.id, { status: 'ACTIVE' });
        }

        toast.success('Propiedad rentada', 'La propiedad fue rentada y el contrato asignado correctamente.');
        onClose();

    } catch (error: any) {
        console.error('Error assigning contract to property:', error);
        let msg = error?.error || error?.message || 'No se pudo asignar el contrato.';
        if (error?.details && Array.isArray(error.details)) {
          msg = error.details.map((d: any) => `${d.field ? d.field + ': ' : ''}${d.message}`).join(' | ');
        }
        toast.error('Error al rentar propiedad', msg);
    }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Asignar Contrato: {property.name}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Property Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 mb-2">Detalles de la Propiedad</h4>
            <div className="text-sm text-slate-600 space-y-1">
              <p><strong>Nombre:</strong> {property.name}</p>
              <p><strong>Dirección:</strong> {property.address}</p>
              <p><strong>Tipo:</strong> {property.type}</p>
              <p><strong>Renta sugerida:</strong> ${property.rent.toLocaleString()}/mes</p>
            </div>
          </div>

          {/* Contract Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Selecciona un contrato disponible
            </label>
            {availableContracts.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600">No se encontraron contratos disponibles</p>
                <p className="text-sm text-slate-500 mt-1">Crea un contrato activo antes de asignarlo a la propiedad</p>
              </div>
            ) : (
              <select
                value={selectedContract}
                onChange={(e) => setSelectedContract(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona un contrato...</option>
                {availableContracts.map((contract) => {
                  const tenant = tenants.find(t => t.id === contract.tenantId);
                  return (
                    <option key={contract.id} value={contract.id}>
                      Contrato #{contract.id.slice(-6).toUpperCase()} - {tenant?.firstName} {tenant?.lastName} - ${contract.monthlyRent.toLocaleString()}/mes
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Contract Details */}
          {selectedContract && (() => {
            const contract = availableContracts.find(c => c.id === selectedContract);
            const tenant = tenants.find(t => t.id === contract?.tenantId);

            if (!contract || !tenant) return null;
            return (
              <div className="space-y-4">
                {/* Contract Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Detalles del Contrato
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div>
                      <p className="flex items-center mb-2">
                        <User className="w-4 h-4 mr-2" />
                        <strong>Inquilino:</strong> {tenant.firstName} {tenant.lastName}
                      </p>
                      <p className="flex items-center mb-2">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <strong>Renta mensual:</strong> ${contract.monthlyRent.toLocaleString()}
                      </p>
                      <p className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <strong>Depósito de seguridad:</strong> ${contract.securityDeposit.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="flex items-center mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        <strong>Fecha de inicio:</strong> {formatDateInOrgTimezone(contract.startDate, organization?.settings.timezone)}
                      </p>
                      <p className="flex items-center mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        <strong>Fecha de finalización:</strong> {formatDateInOrgTimezone(contract.endDate, organization?.settings.timezone)}
                      </p>
                      <p className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        <strong>Duración:</strong> {Math.round((new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))} meses
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tenant Info */}
                <div className="bg-emerald-50 rounded-lg p-4">
                  <h4 className="font-medium text-emerald-900 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Información del Inquilino
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-emerald-800">
                    <div>
                      <p><strong>Email:</strong> {tenant.email}</p>
                      <p><strong>Teléfono:</strong> {tenant.phone}</p>
                    </div>
                    <div>
                      <p><strong>Empleo:</strong> {tenant.employment && typeof tenant.employment === 'object'
                        ? `${tenant.employment.employer || ''}${tenant.employment.position ? ' - ' + tenant.employment.position : ''}${tenant.employment.income ? ' - $' + tenant.employment.income.toLocaleString() + '/año' : ''}`
                        : tenant.employment || ''
                      }</p>
                      <p><strong>Estado:</strong> {tenant.status}</p>
                    </div>
                  </div>
                </div>

                {/* Contract Terms */}
                {contract.terms.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-3">Contract Terms</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {contract.terms.map((term, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1 h-1 bg-slate-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {term}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Assignment Summary */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mt-4">
                  <h4 className="font-medium text-yellow-900 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Resumen de Asignación
                  </h4>
                  <div className="text-sm text-yellow-800">
                    <p>Esta acción realizará:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Asignar contrato #{contract.id.slice(-6).toUpperCase()} a {property.name}</li>
                      <li>Cambiar estado de la propiedad a "Alquilada"</li>
                      <li>Cambiar estado del inquilino a "Activo" (si no lo está)</li>
                      <li>Crear el primer pago de renta si es necesario</li>
                    </ul>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleQuickRent}
            disabled={!selectedContract || availableContracts.length === 0}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Asignar Contrato
          </button>
        </div>
      </div>
    </div>
  );
}