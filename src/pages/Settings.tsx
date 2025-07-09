import { useEffect, useState } from 'react';
import { Header } from '../components/Layout/Header';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/useApp';
import {
  User,
  Bell,
  Shield,
  Database,

  Building2,
  Download,
  CreditCard,
  Users,
  X
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { OrganizationSettings } from '../types/auth';
import { PlanSelector } from '../components/Subscription/PlanSelector';
import { plans } from '../components/Auth/RegisterForm';
import { RecentActivity } from '../components/Settings/RecentActivity';
import { User as UserType } from '../types/auth';
import apiClient from '../config/api';
import { ProfileTab } from '../components/Settings/ProfileTab';
import { OrganizationTab } from '../components/Settings/OrganizationTab';
import { SubscriptionTab } from '../components/Settings/SubscriptionTab';
import { TeamTab } from '../components/Settings/TeamTab';
import { NotificationsTab } from '../components/Settings/NotificationsTab';
import { SecurityTab } from '../components/Settings/SecurityTab';
import { DataTab } from '../components/Settings/DataTab';
import { useToast } from '../hooks/useToast';

// Skeleton loader para Settings
  

export function Settings() {

  const { state: authState, updateUserProfile, changePassword } = useAuth();
  const { updateOrganization, properties, tenants, contracts, payments, maintenanceRequests } = useApp();
  const toast = useToast();
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
      currency: authState.organization?.settings.currency || 'COP',
      timezone: authState.organization?.settings.timezone || 'America/Bogota',
      dateFormat: authState.organization?.settings.dateFormat || 'DD/MM/YYYY',
      language: authState.organization?.settings.language || 'es',
      accounting: authState.organization?.settings.accounting || {}
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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'USER',
    password: ''
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    role: 'USER',
    isActive: true,
    password: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [users, setUsers] = useState<UserType[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');

  const activeTab = searchParams.get('tab') || 'profile';
  const isAdmin = authState.user?.role === 'ADMIN' || authState.user?.role === 'SUPER_ADMIN';

  const handleOpenUpgradeModal = () => {
    if (!isAdmin) {
      toast.error('Acción no permitida', 'Solo un administrador puede actualizar el plan.');
      return;
    }
    setSelectedPlanInModal(authState.subscription?.planId || ''); // Resetea la selección al plan actual
    setIsUpgradeModalOpen(true);
  };

  const handleProceedToCheckout = () => {
    // Aquí iría la lógica para llamar al backend e iniciar el proceso de pago con Stripe
    // Por ahora, mostramos una alerta.
    toast.info('Actualización de Plan', `Iniciando actualización al plan: ${selectedPlanInModal}`);
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
    if (!isAdmin) {
      toast.error('Acción no permitida', 'Solo un administrador puede guardar cambios en la organización.');
      return;
    }
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
          language: settings.organization.language,
          accounting: settings.organization.accounting || {},
        }
      };
      await updateOrganization(updatedOrganization.id, updatedOrganization);
      toast.success('Organización actualizada', 'Los cambios se guardaron correctamente.');
    }
  };

  const handleSaveNotifications = () => {
    toast.success('Notificaciones', 'Preferencias de notificación guardadas!');
  };

  const handleChangePassword = async () => {
    if (!settings.security.currentPassword || !settings.security.newPassword) {
      toast.error('Error de Contraseña', 'Por favor complete todos los campos de contraseña');
      return;
    }
    if (settings.security.newPassword !== settings.security.confirmPassword) {
      toast.error('Error de Contraseña', 'Las nuevas contraseñas no coinciden');
      return;
    }
    if (settings.security.newPassword.length < 8) {
      toast.error('Error de Contraseña', 'La contraseña debe tener al menos 8 caracteres');
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
      properties,
      tenants,
      contracts,
      payments,
      maintenanceRequests,
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
    toast.success('Exportación exitosa', 'Datos exportados exitosamente.');
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
            JSON.parse(e.target?.result as string);
            if (confirm('Esto reemplazará todos los datos actuales. ¿Está seguro?')) {
              // Aquí deberías usar métodos del store para cargar los datos si lo deseas
              toast.success('Importación exitosa', 'Datos importados exitosamente.');
            }
          } catch (error) {
            toast.error('Error de importación', error instanceof Error ? error.message : 'Error al importar los datos. Asegúrese de que el archivo sea un JSON válido.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleDeleteAllData = () => {
    if (!isAdmin) {
      toast.error('Acción no permitida', 'Solo un administrador puede eliminar todos los datos.');
      return;
    }
    if (confirm('Esto eliminará permanentemente TODOS los datos. Esta acción no se puede deshacer. ¿Está seguro?')) {
      if (confirm('¿Está ABSOLUTAMENTE seguro? Esto eliminará todas las propiedades, inquilinos, contratos y pagos.')) {
        // Aquí deberías usar métodos del store para limpiar los datos si lo deseas
        toast.success('Datos eliminados', 'Todos los datos han sido eliminados.');
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
          language: orgSettings.language || 'es',
          accounting: orgSettings.accounting || {}
        }
      }));
    }
  }, [authState.user, authState.organization]);

  // Cargar usuarios al montar y tras cambios
  useEffect(() => {
    async function fetchUsers() {
      setUsersLoading(true);
      setUsersError('');
      try {
        const res = await apiClient.getUsers();
        setUsers(res.users || []);
      } catch (err: any) {
        console.error('Error al cargar usuarios', err);
        setUsersError('Error al cargar usuarios');
      } finally {
        setUsersLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'organization', label: 'Organización', icon: Building2 },
    { id: 'subscription', label: 'Suscripción', icon: CreditCard },
    { id: 'team', label: 'Equipo', icon: Users },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'data', label: 'Datos', icon: Database },
    { id: 'logs', label: 'Logs', icon: Download }
  ];

  async function handleInviteUser(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    setInviteLoading(true);
    try {
      await apiClient.createUser(inviteForm);
      setIsInviteModalOpen(false);
      setInviteForm({ firstName: '', lastName: '', email: '', role: 'USER', password: '' });
      // Refrescar usuarios
      const res = await apiClient.getUsers();
      setUsers(res.users || []);
    } catch (err: any) {
      setInviteError(err?.error || 'Error al invitar usuario');
    } finally {
      setInviteLoading(false);
    }
  }

  function openEditModal(user: UserType) {
    setEditForm({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      password: ''
    });
    setEditError('');
    setIsEditModalOpen(true);
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      const body: any = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        role: editForm.role,
        isActive: editForm.isActive
      };
      if (editForm.password) body.password = editForm.password;
      await apiClient.updateUser(editForm.id, body);
      setIsEditModalOpen(false);
      setEditForm({ id: '', firstName: '', lastName: '', email: '', role: 'USER', isActive: true, password: '' });
      // Refrescar usuarios
      const res = await apiClient.getUsers();
      setUsers(res.users || []);
    } catch (err: any) {
      setEditError(err?.error || 'Error al editar usuario');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeleteUser(userId: string, userRole: string) {
    // Si es ADMIN, verificar que no sea el último ADMIN activo
    if (userRole === 'ADMIN') {
      const activeAdmins = users.filter((u: any) => u.role === 'ADMIN' && u.isActive && u.id !== userId);
      if (activeAdmins.length === 0) {
        setDeleteError('No puedes eliminar el último administrador activo de la organización.');
        return;
      }
    }
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await apiClient.deleteUser(userId);
      // Refrescar usuarios
      const res = await apiClient.getUsers();
      setUsers(res.users || []);
    } catch (err: any) {
      setDeleteError(err?.error || 'Error al eliminar usuario');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleToggleActive(user: UserType) {
    setDeleteLoading(true); // reutilizamos deleteLoading para feedback de acción
    setDeleteError('');
    try {
      if (user.isActive) {
        // Si es ADMIN, verificar que no sea el último ADMIN activo
        if (user.role === 'ADMIN') {
          const activeAdmins = users.filter((u: any) => u.role === 'ADMIN' && u.isActive && u.id !== user.id);
          if (activeAdmins.length === 0) {
            setDeleteError('No puedes desactivar el último administrador activo de la organización.');
            setDeleteLoading(false);
            return;
          }
        }
        await apiClient.deactivateUser(user.id);
      } else {
        await apiClient.activateUser(user.id);
      }
      // Refrescar usuarios
      const res = await apiClient.getUsers();
      setUsers(res.users || []);
    } catch (err: any) {
      setDeleteError(err?.error || 'Error al cambiar el estado del usuario');
    } finally {
      setDeleteLoading(false);
    }
  }

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
            <ProfileTab
              settings={settings}
              setSettings={setSettings}
              handleSaveProfile={handleSaveProfile}
              authState={authState}
            />
          )}

          {/* Organization Tab */}
          {activeTab === 'organization' && (
            <OrganizationTab
              settings={settings}
              setSettings={setSettings}
              handleSaveOrganization={handleSaveOrganization}
              isAdmin={isAdmin}
            />
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && authState.subscription && (
            <SubscriptionTab
              authState={authState}
              properties={properties}
              tenants={tenants}
              isAdmin={isAdmin}
              handleOpenUpgradeModal={handleOpenUpgradeModal}
            />
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <TeamTab
              users={users}
              usersLoading={usersLoading}
              usersError={usersError}
              authState={authState}
              openEditModal={openEditModal}
              handleDeleteUser={handleDeleteUser}
              handleToggleActive={handleToggleActive}
              deleteLoading={deleteLoading}
              setIsInviteModalOpen={setIsInviteModalOpen}
              isInviteModalOpen={isInviteModalOpen}
              inviteForm={inviteForm}
              setInviteForm={setInviteForm}
              handleInviteUser={handleInviteUser}
              inviteLoading={inviteLoading}
              inviteError={inviteError}
            />
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <NotificationsTab
              settings={settings}
              setSettings={setSettings}
              handleSaveNotifications={handleSaveNotifications}
            />
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <SecurityTab
              settings={settings}
              setSettings={setSettings}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              handleChangePassword={handleChangePassword}
            />
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <DataTab
              handleExportData={handleExportData}
              handleImportData={handleImportData}
              handleDeleteAllData={handleDeleteAllData}
              isAdmin={isAdmin}
            />
          )}
          {activeTab === 'logs' && <RecentActivity />}
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

      {/* Modal de edición */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-8 relative">
            <button
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              onClick={() => setIsEditModalOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Editar Usuario</h2>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={editForm.firstName}
                  onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
                <input
                  type="text"
                  required
                  value={editForm.lastName}
                  onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                <select
                  required
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="USER">Usuario</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                <select
                  required
                  value={editForm.isActive ? 'activo' : 'inactivo'}
                  onChange={e => setEditForm(f => ({ ...f, isActive: e.target.value === 'activo' }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña (dejar en blanco para no cambiar)</label>
                <input
                  type="password"
                  minLength={8}
                  value={editForm.password}
                  onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              {editError && <p className="text-red-600 text-sm">{editError}</p>}
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={editLoading}
              >
                {editLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteError && <p className="text-red-600 text-sm mt-2">{deleteError}</p>}

    </div>
  );
}