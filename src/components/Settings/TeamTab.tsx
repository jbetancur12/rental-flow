import { User, X } from 'lucide-react';
import React from 'react';

export function TeamTab({ users, usersLoading, usersError, authState, openEditModal, handleDeleteUser, handleToggleActive, deleteLoading, setIsInviteModalOpen, isInviteModalOpen, inviteForm, setInviteForm, handleInviteUser, inviteLoading, inviteError }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Miembros del Equipo</h3>
          {(authState.user?.role === 'ADMIN' || authState.user?.role === 'SUPER_ADMIN') && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800" onClick={() => setIsInviteModalOpen(true)}>
              Invitar Usuario
            </button>
          )}
        </div>
        <div className="space-y-4">
          {usersLoading ? (
            <div className="text-center text-slate-500 dark:text-slate-400">Cargando usuarios...</div>
          ) : usersError ? (
            <div className="text-center text-red-500 dark:text-red-400">{usersError}</div>
          ) : users.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400">No hay usuarios registrados.</div>
          ) : (
            users.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>{user.isActive ? 'Activo' : 'Inactivo'}</span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                    {user.role === 'SUPER_ADMIN' && 'Super Administrador'}
                    {user.role === 'ADMIN' && 'Administrador'}
                    {user.role === 'MANAGER' && 'Gerente'}
                    {user.role === 'USER' && 'Usuario'}
                  </span>
                  {user.id === authState.user?.id && (<span className="text-sm text-slate-500 dark:text-slate-400">Tú</span>)}
                  {(authState.user?.role === 'ADMIN' || authState.user?.role === 'SUPER_ADMIN') && user.id !== authState.user?.id && (
                    <>
                      <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs underline mr-2" onClick={() => openEditModal(user)}>Editar</button>
                      <button className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs underline mr-2" onClick={() => handleDeleteUser(user.id, user.role)} disabled={deleteLoading}>{deleteLoading ? 'Eliminando...' : 'Eliminar'}</button>
                      <button className={`text-xs underline ${user.isActive ? 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300' : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300'}`} onClick={() => handleToggleActive(user)} disabled={deleteLoading || user.id === authState.user?.id || (user.role === 'ADMIN' && users.filter((u: any) => u.role === 'ADMIN' && u.isActive).length === 1 && user.isActive)}>{user.isActive ? (deleteLoading ? 'Desactivando...' : 'Desactivar') : (deleteLoading ? 'Activando...' : 'Activar')}</button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Tu plan actual permite hasta {authState.organization?.settings.limits.maxUsers} usuarios.
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 ml-1">Actualiza tu plan</a> para agregar más miembros al equipo.
          </p>
        </div>
      </div>
      {/* Modal de invitación */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full mx-4 p-8 relative border border-slate-200 dark:border-slate-700">
            <button className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300" onClick={() => setIsInviteModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Invitar Nuevo Usuario</h2>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                <input type="text" required value={inviteForm.firstName} onChange={e => setInviteForm((f: any) => ({ ...f, firstName: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Apellido</label>
                <input type="text" required value={inviteForm.lastName} onChange={e => setInviteForm((f: any) => ({ ...f, lastName: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
                <input type="email" required value={inviteForm.email} onChange={e => setInviteForm((f: any) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rol</label>
                <select required value={inviteForm.role} onChange={e => setInviteForm((f: any) => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100">
                  <option value="USER">Usuario</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
                <input type="password" required minLength={8} value={inviteForm.password} onChange={e => setInviteForm((f: any) => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100" />
              </div>
              {inviteError && <p className="text-red-600 dark:text-red-400 text-sm">{inviteError}</p>}
              <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800" disabled={inviteLoading}>{inviteLoading ? 'Invitando...' : 'Invitar Usuario'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 