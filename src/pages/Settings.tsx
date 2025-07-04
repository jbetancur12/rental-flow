import { useEffect, useState } from 'react';
import { Header } from '../components/Layout/Header';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  User,
  Bell,
  Shield,
  Database,

  Building2,
  Save,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  CreditCard,
  Users,
  Crown,
  X
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { OrganizationSettings } from '../types/auth';
import { PlanSelector } from '../components/Subscription/PlanSelector';
import { plans } from '../components/Auth/RegisterForm';

export function Settings() {

  const { state: authState, updateUserProfile, changePassword } = useAuth();
  const { updateOrganization } = useApp();
  const { state, dispatch } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    profile: {
      firstName: authState.user?.firstName || '',
      lastName: authState.user?.lastName || '',
      email: authState.user?.email || '',
      phone: '+1 (555) 123-4567',
      role: authState.user?.role || 'admin'
    },
    organization: {
      name: authState.organization?.name || '',
      email: authState.organization?.email || '',
      phone: authState.organization?.phone || '',
      address: authState.organization?.address || '',
      currency: authState.organization?.settings.currency || 'USD',
      timezone: authState.organization?.settings.timezone || 'America/Mexico_City',
      dateFormat: authState.organization?.settings.dateFormat || 'DD/MM/YYYY',
      language: authState.organization?.settings.language || 'es'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      paymentReminders: true,
      maintenanceAlerts: true,
      contractExpirations: true,
      overduePayments: true,
      newApplications: true
    },
    security: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      twoFactorAuth: false,
      sessionTimeout: 30
    }
  });

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlanInModal, setSelectedPlanInModal] = useState(authState.subscription?.planId || '');
  
  

  const activeTab = searchParams.get('tab') || 'profile';

   const handleOpenUpgradeModal = () => {
    setSelectedPlanInModal(authState.subscription?.planId || ''); // Resetea la selección al plan actual
    setIsUpgradeModalOpen(true);
  };

   const handleProceedToCheckout = () => {
    // Aquí iría la lógica para llamar al backend e iniciar el proceso de pago con Stripe
    // Por ahora, mostramos una alerta.
    alert(`Iniciando actualización al plan: ${selectedPlanInModal}`);
    setIsUpgradeModalOpen(false);
  };

  const handleSaveProfile = async () => {
    if (authState.user) {
      const updatedUser = {
        ...authState.user,
        firstName: settings.profile.firstName,
        lastName: settings.profile.lastName,
        email: settings.profile.email
      };
      await updateUserProfile(authState.user.id, updatedUser);
    }

  };

  const handleSaveOrganization = async () => {
    if (authState.organization) {
      const updatedOrganization = {
        ...authState.organization,
        name: settings.organization.name,
        email: settings.organization.email,
        phone: settings.organization.phone,
        address: settings.organization.address,
        settings: {
          ...authState.organization.settings,
          currency: settings.organization.currency,
          timezone: settings.organization.timezone,
          dateFormat: settings.organization.dateFormat,
          language: settings.organization.language
        }
      };
      await updateOrganization(updatedOrganization.id, updatedOrganization);
    }
  };

  const handleSaveNotifications = () => {
    alert('Preferencias de notificación guardadas!');
  };

  const handleChangePassword = async () => {
    if (!settings.security.currentPassword || !settings.security.newPassword) {
      alert('Por favor complete todos los campos de contraseña');
      return;
    }
    if (settings.security.newPassword !== settings.security.confirmPassword) {
      alert('Las nuevas contraseñas no coinciden');
      return;
    }
    if (settings.security.newPassword.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres');
      return;
    }


    await changePassword({
      userId: authState.user?.id || '',
      currentPassword: settings.security.currentPassword,
      newPassword: settings.security.newPassword,
      confirmPassword: settings.security.confirmPassword
    });

    setSettings({
      ...settings,
      security: {
        ...settings.security,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    });
  };

  const handleExportData = () => {
    const data = {
      properties: state.properties,
      tenants: state.tenants,
      contracts: state.contracts,
      payments: state.payments,
      maintenanceRequests: state.maintenanceRequests,
      organization: authState.organization,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rentflow-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Datos exportados exitosamente!');
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (confirm('Esto reemplazará todos los datos actuales. ¿Está seguro?')) {
              dispatch({ type: 'LOAD_INITIAL_DATA', payload: data });
              alert('Datos importados exitosamente!');
            }
          } catch (error) {
            alert(error instanceof Error ? error.message : 'Error al importar los datos. Asegúrese de que el archivo sea un JSON válido.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleDeleteAllData = () => {
    if (confirm('Esto eliminará permanentemente TODOS los datos. Esta acción no se puede deshacer. ¿Está seguro?')) {
      if (confirm('¿Está ABSOLUTAMENTE seguro? Esto eliminará todas las propiedades, inquilinos, contratos y pagos.')) {
        dispatch({ type: 'CLEAR_DATA' });
        alert('Todos los datos han sido eliminados.');
      }
    }
  };

  const handleTabClick = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

      useEffect(() => {
        if (authState.user && authState.organization) {
            const orgSettings = authState.organization.settings as OrganizationSettings;
            setSettings(prev => ({
                ...prev,
                profile: {
                    firstName: authState?.user?.firstName || '',
                    lastName: authState?.user?.lastName || '',
                    email: authState?.user?.email || '',
                    phone: '+1 (555) 123-4567', // Este debería venir de la BD
                    role: authState.user?.role || 'USER'
                },
                organization: {
                    name: authState.organization?.name || '',
                    email: authState.organization?.email || '',
                    phone: authState.organization?.phone || '',
                    address: authState.organization?.address || '',
                    currency: orgSettings.currency || 'USD',
                    timezone: orgSettings.timezone || 'America/Mexico_City',
                    dateFormat: orgSettings.dateFormat || 'DD/MM/YYYY',
                    language: orgSettings.language || 'es'
                }
            }));
        }
    }, [authState.user, authState.organization]);

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'organization', label: 'Organización', icon: Building2 },
    { id: 'subscription', label: 'Suscripción', icon: CreditCard },
    { id: 'team', label: 'Equipo', icon: Users },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'data', label: 'Datos', icon: Database }
  ];

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Configuración" />

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200 mb-8">
            <nav className="flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Información Personal</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={settings.profile.firstName}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, firstName: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={settings.profile.lastName}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, lastName: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, email: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={settings.profile.phone}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, phone: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Rol
                    </label>
                    <select
                      value={settings.profile.role}
                      disabled
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                    >
                      <option value="admin">Administrador</option>
                      <option value="manager">Gerente</option>
                      <option value="user">Usuario</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Contacta al administrador para cambiar tu rol</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Organization Tab */}
          {activeTab === 'organization' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Información de la Organización</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nombre de la Organización
                    </label>
                    <input
                      type="text"
                      value={settings.organization.name}
                      onChange={(e) => setSettings({
                        ...settings,
                        organization: { ...settings.organization, name: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email de Contacto
                    </label>
                    <input
                      type="email"
                      value={settings.organization.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        organization: { ...settings.organization, email: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={settings.organization.phone}
                      onChange={(e) => setSettings({
                        ...settings,
                        organization: { ...settings.organization, phone: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={settings.organization.address}
                      onChange={(e) => setSettings({
                        ...settings,
                        organization: { ...settings.organization, address: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Moneda
                    </label>
                    <select
                      value={settings.organization.currency}
                      onChange={(e) => setSettings({
                        ...settings,
                        organization: { ...settings.organization, currency: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD - Dólar Estadounidense</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="MXN">MXN - Peso Mexicano</option>
                      <option value="CAD">CAD - Dólar Canadiense</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Zona Horaria
                    </label>
                    <select
                      value={settings.organization.timezone}
                      onChange={(e) => setSettings({
                        ...settings,
                        organization: { ...settings.organization, timezone: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="America/Mexico_City">Hora de México</option>
                      <option value="America/New_York">Hora del Este</option>
                      <option value="America/Chicago">Hora Central</option>
                      <option value="America/Denver">Hora de Montaña</option>
                      <option value="America/Los_Angeles">Hora del Pacífico</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveOrganization}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && authState.subscription && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">Plan de Suscripción</h3>
                  <div className="flex items-center">
                    <Crown className="w-5 h-5 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-slate-600">
                      {authState.subscription.status === 'TRIALING' ? 'Prueba Gratuita' : 'Plan Activo'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-500">Plan Actual</label>
                      <p className="text-lg font-semibold text-slate-900">
                        {authState.subscription.planId === 'plan-basic' ? 'Básico' :
                          authState.subscription.planId === 'plan-professional' ? 'Profesional' : 'Empresarial'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-slate-500">Estado</label>
                      <p className={`text-lg font-semibold ${authState.subscription.status === 'ACTIVE' ? 'text-emerald-600' :
                          authState.subscription.status === 'TRIALING' ? 'text-blue-600' : 'text-red-600'
                        }`}>
                        {authState.subscription.status === 'ACTIVE' ? 'Activo' :
                          authState.subscription.status === 'TRIALING' ? 'Prueba' : 'Vencido'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-slate-500">Próxima Facturación</label>
                      <p className="text-lg font-semibold text-slate-900">
                        {authState.subscription.currentPeriodEnd.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-500">Límites del Plan</label>
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between text-sm">
                          <span>Propiedades:</span>
                          <span>{state.properties.length} / {authState.organization?.settings.limits.maxProperties}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Inquilinos:</span>
                          <span>{state.tenants.length} / {authState.organization?.settings.limits.maxTenants}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Usuarios:</span>
                          <span>1 / {authState.organization?.settings.limits.maxUsers}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex space-x-4">
                  <button onClick={handleOpenUpgradeModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Actualizar Plan
                  </button>
                  <button className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50">
                    Ver Historial de Facturación
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">Miembros del Equipo</h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Invitar Usuario
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {authState.user?.firstName} {authState.user?.lastName}
                        </p>
                        <p className="text-sm text-slate-500">{authState.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        Administrador
                      </span>
                      <span className="text-sm text-slate-500">Tú</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">
                    Tu plan actual permite hasta {authState.organization?.settings.limits.maxUsers} usuarios.
                    <a href="#" className="text-blue-600 hover:text-blue-800 ml-1">Actualiza tu plan</a> para agregar más miembros al equipo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Preferencias de Notificación</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">Notificaciones por Email</h4>
                      <p className="text-sm text-slate-600">Recibir notificaciones por correo electrónico</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailNotifications}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, emailNotifications: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">Recordatorios de Pago</h4>
                      <p className="text-sm text-slate-600">Notificar sobre próximos pagos de alquiler</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.paymentReminders}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, paymentReminders: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">Alertas de Mantenimiento</h4>
                      <p className="text-sm text-slate-600">Notificar sobre nuevas solicitudes de mantenimiento</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.maintenanceAlerts}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, maintenanceAlerts: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveNotifications}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Preferencias
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Cambiar Contraseña</h3>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Contraseña Actual
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={settings.security.currentPassword}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: { ...settings.security, currentPassword: e.target.value }
                        })}
                        className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nueva Contraseña
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={settings.security.newPassword}
                      onChange={(e) => setSettings({
                        ...settings,
                        security: { ...settings.security, newPassword: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={settings.security.confirmPassword}
                      onChange={(e) => setSettings({
                        ...settings,
                        security: { ...settings.security, confirmPassword: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleChangePassword}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Cambiar Contraseña
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Gestión de Datos</h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Exportar e Importar Datos</h4>
                    <div className="flex space-x-4">
                      <button
                        onClick={handleExportData}
                        className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar Datos
                      </button>

                      <button
                        onClick={handleImportData}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Importar Datos
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">
                      Exporta todos tus datos en formato JSON o importa datos desde un archivo de respaldo.
                    </p>
                  </div>

                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-medium text-slate-900 mb-3 text-red-600">Zona de Peligro</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h5 className="font-medium text-red-800 mb-2">Eliminar Todos los Datos</h5>
                      <p className="text-sm text-red-700 mb-4">
                        Esta acción eliminará permanentemente todos los datos de tu organización. Esta acción no se puede deshacer.
                      </p>
                      <button
                        onClick={handleDeleteAllData}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar Todos los Datos
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

       {isUpgradeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Actualiza tu Plan</h2>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8">
              <PlanSelector 
                plans={plans}
                selectedPlan={selectedPlanInModal}
                onSelectPlan={setSelectedPlanInModal}
              />

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleProceedToCheckout}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Continuar al Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}