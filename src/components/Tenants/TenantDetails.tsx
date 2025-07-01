
import { Tenant } from '../../types';
import { X, User, Mail, Phone, Building, DollarSign, Calendar, Star } from 'lucide-react';

interface TenantDetailsProps {
  tenant: Tenant;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function TenantDetails({ tenant, isOpen, onClose, onEdit }: TenantDetailsProps) {
  if (!isOpen) return null;

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return 'text-emerald-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      ACTIVE: 'bg-emerald-100 text-emerald-800',
      FORMER: 'bg-slate-100 text-slate-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.PENDING;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {tenant.firstName} {tenant.lastName}
              </h2>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(tenant.status)}`}>
                {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Tenant
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
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium text-slate-900">{tenant.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium text-slate-900">{tenant.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Employment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center">
                <Building className="w-5 h-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Employer</p>
                  <p className="font-medium text-slate-900">{tenant.employment.employer}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Position</p>
                <p className="font-medium text-slate-900">{tenant.employment.position}</p>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Annual Income</p>
                  <p className="font-medium text-slate-900">${tenant.employment.income.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-500">Name</p>
                <p className="font-medium text-slate-900">{tenant.emergencyContact.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Phone</p>
                <p className="font-medium text-slate-900">{tenant.emergencyContact.phone}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Relationship</p>
                <p className="font-medium text-slate-900">{tenant.emergencyContact.relationship}</p>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Application Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-slate-400 mr-3" />
                <div>
                  <p className="text-sm text-slate-500">Application Date</p>
                  <p className="font-medium text-slate-900">{new Date(tenant.applicationDate).toLocaleDateString()}</p>
                </div>
              </div>
              {tenant.creditScore && (
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-slate-400 mr-3" />
                  <div>
                    <p className="text-sm text-slate-500">Credit Score</p>
                    <p className={`font-medium ${getCreditScoreColor(tenant.creditScore)}`}>
                      {tenant.creditScore}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* References */}
          {tenant.references.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">References</h3>
              <div className="space-y-4">
                {tenant.references.map((reference, index) => (
                  <div key={reference.id} className="bg-slate-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Name</p>
                        <p className="font-medium text-slate-900">{reference.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Relationship</p>
                        <p className="font-medium text-slate-900">{reference.relationship}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Phone</p>
                        <p className="font-medium text-slate-900">{reference.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Email</p>
                        <p className="font-medium text-slate-900">{reference.email}</p>
                      </div>
                    </div>
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