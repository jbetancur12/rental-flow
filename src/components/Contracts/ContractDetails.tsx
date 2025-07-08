
import { Contract, Property, Tenant } from '../../types';
import { X, FileText, Download, Edit, Calendar, DollarSign, User, Home } from 'lucide-react';
import { generateContractPDF } from '../../utils/reportGenerator';
import { formatInTimeZone } from 'date-fns-tz';
import { subDays } from 'date-fns';

interface ContractDetailsProps {
  contract: Contract;
  property?: Property;
  tenant?: Tenant;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function ContractDetails({ contract, property, tenant, isOpen, onClose, onEdit }: ContractDetailsProps) {
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-emerald-100 text-emerald-800',
      EXPIRED: 'bg-red-100 text-red-800',
      TERMINATED: 'bg-slate-100 text-slate-800'
    };
    return colors[status as keyof typeof colors] || colors.DRAFT;
  };

  // FIX: Download funcionando
  const handleDownload = () => {
    if (property && tenant) {
      generateContractPDF(contract, property, tenant);
    } else {
      alert('Property or tenant information is missing');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Contrato #{contract.id.slice(-6).toUpperCase()}
              </h2>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(contract.status)}`}>
                {contract.status === 'DRAFT' && 'Borrador'}
                {contract.status === 'ACTIVE' && 'Activo'}
                {contract.status === 'EXPIRED' && 'Expirado'}
                {contract.status === 'TERMINATED' && 'Terminado'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </button>
            <button
              onClick={onEdit}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Contrato
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
          {/* Contract Overview */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Resumen del Contrato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Período del Contrato</p>
                  <p className="font-medium text-slate-900">
                    {formatInTimeZone(contract.startDate, 'UTC', 'MMM d, yyyy')} - {formatInTimeZone(subDays(new Date(contract.endDate),1), 'UTC', 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Renta Mensual</p>
                  <p className="font-medium text-slate-900">${contract.monthlyRent.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Depósito de Seguridad</p>
                  <p className="font-medium text-slate-900">${contract.securityDeposit.toLocaleString()}</p>
                </div>
              </div>
              {contract.signedDate && (
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-slate-400 mr-3" />
                  <div>
                    <p className="text-sm text-slate-500">Fecha de Firma</p>
                    <p className="font-medium text-slate-900">{formatInTimeZone(contract.signedDate, 'UTC', 'MMM d, yyyy')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Property Information */}
          {property && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Información de la Propiedad</h3>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-start">
                  <Home className="w-5 h-5 text-slate-400 mr-3 mt-1" />
                  <div>
                    <h4 className="font-medium text-slate-900">{property.name}</h4>
                    <p className="text-slate-600">{property.address}</p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-slate-500">
                      <span>{property.size} m²</span>
                      <span>{property.rooms} hab</span>
                      <span>{property.bathrooms} baños</span>
                      <span className="capitalize">
                        {property.type === 'APARTMENT' && 'Apartamento'}
                        {property.type === 'HOUSE' && 'Casa'}
                        {property.type === 'COMMERCIAL' && 'Comercial'}
                        {property.type === 'BUILDING' && 'Edificio'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tenant Information */}
          {tenant && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Información del Inquilino</h3>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-start">
                  <User className="w-5 h-5 text-slate-400 mr-3 mt-1" />
                  <div>
                    <h4 className="font-medium text-slate-900">{tenant.firstName} {tenant.lastName}</h4>
                    <p className="text-slate-600">{tenant.email}</p>
                    <p className="text-slate-600">{tenant.phone}</p>
                    <div className="mt-2 text-sm text-slate-500">
                      <p>{tenant.employment.employer} - {tenant.employment.position}</p>
                      <p>Ingreso Anual: ${tenant.employment.income.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contract Terms */}
          {contract.terms.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Términos y Condiciones</h3>
              <div className="space-y-3">
                {contract.terms.map((term, index) => (
                  <div key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-slate-700">{term}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contract Dates */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Fechas Importantes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Fecha de Inicio</p>
                <p className="text-lg font-semibold text-blue-900">{formatInTimeZone(contract.startDate, 'UTC', 'MMM d, yyyy')}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-orange-600 font-medium">Fecha de Finalización</p>
                <p className="text-lg font-semibold text-orange-900">{formatInTimeZone(subDays(new Date(contract.endDate),1), 'UTC', 'MMM d, yyyy')}</p>
              </div>
              {contract.signedDate && (
                <div className="bg-emerald-50 rounded-lg p-4">
                  <p className="text-sm text-emerald-600 font-medium">Fecha de Firma</p>
                  <p className="text-lg font-semibold text-emerald-900">{formatInTimeZone(contract.signedDate, 'UTC', 'MMM d, yyyy')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Resumen Financiero</h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Renta Mensual</p>
                  <p className="text-xl font-bold text-slate-900">${contract.monthlyRent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Depósito de Seguridad</p>
                  <p className="text-xl font-bold text-slate-900">${contract.securityDeposit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Valor Total del Contrato</p>
                  <p className="text-xl font-bold text-slate-900">
                    ${(contract.monthlyRent * Math.round((new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}