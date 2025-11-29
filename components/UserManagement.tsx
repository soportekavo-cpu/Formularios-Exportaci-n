
import React, { useState } from 'react';
import type { User, Role } from '../types';
import { PlusIcon, PencilIcon, TrashIcon } from './Icons';

interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  roles: Role[];
}

const inputStyles = "block w-full rounded-md border-0 py-2 px-3 bg-background text-foreground ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6";

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, roles }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  const openModal = (user: Partial<User> | null = null) => {
    setEditingUser(user || { name: '', email: '', roleId: roles[0]?.id || '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleSave = () => {
    if (!editingUser || !editingUser.name || !editingUser.email || !editingUser.roleId) return;

    if (editingUser.id) {
      setUsers(users.map(u => u.id === editingUser.id ? editingUser as User : u));
    } else {
      setUsers([...users, { ...editingUser, id: new Date().toISOString() } as User]);
    }
    closeModal();
  };
  
  const handleDelete = (id: string) => {
      const adminRole = roles.find(r => r.name === 'Admin' || r.id === 'admin');
      const adminCount = users.filter(u => u.roleId === adminRole?.id).length;
      const userToDelete = users.find(u => u.id === id);
      
      if (userToDelete?.roleId === adminRole?.id && adminCount <= 1) {
          alert("No se puede eliminar al último administrador.");
          return;
      }
      if(confirm('¿Eliminar usuario?')) {
          setUsers(users.filter(u => u.id !== id));
      }
  }

  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || 'Desconocido';

  return (
    <div className="bg-card p-4 rounded-lg border">
      <div className="relative z-50">
      {isModalOpen && editingUser && (
        <>
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"></div>
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-card text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border">
                <div className="bg-card px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-semibold leading-6 text-foreground">{editingUser?.id ? 'Editar' : 'Agregar'} Usuario</h3>
                <div className="mt-4 space-y-4">
                    <div><label className="text-sm font-medium text-muted-foreground">Nombre</label><input type="text" value={editingUser.name || ''} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} className={inputStyles} /></div>
                    <div><label className="text-sm font-medium text-muted-foreground">Email</label><input type="email" value={editingUser.email || ''} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} className={inputStyles} /></div>
                    <div>
                    <label className="text-sm font-medium text-muted-foreground">Rol</label>
                    <select value={editingUser.roleId || ''} onChange={e => setEditingUser({ ...editingUser, roleId: e.target.value })} className={inputStyles}>
                        <option value="" disabled>Selecciona un rol</option>
                        {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </select>
                    </div>
                </div>
                </div>
                <div className="bg-muted px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button onClick={handleSave} type="button" className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 sm:ml-3 sm:w-auto">Guardar</button>
                <button onClick={closeModal} type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent sm:mt-0 sm:w-auto">Cancelar</button>
                </div>
            </div>
            </div>
        </div>
        </>
      )}
      </div>

      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Usuarios</h3>
          <p className="text-sm text-muted-foreground">Gestiona quién puede acceder a la aplicación.</p>
        </div>
        <button onClick={() => openModal()} className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
          <PlusIcon className="w-5 h-5" /> Agregar Usuario
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Nombre</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Rol</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-4 py-2 text-sm font-medium text-foreground">{user.name}</td>
                <td className="px-4 py-2 text-sm text-muted-foreground">{user.email}</td>
                <td className="px-4 py-2 text-sm text-muted-foreground"><span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">{getRoleName(user.roleId)}</span></td>
                <td className="px-4 py-2 text-right space-x-1">
                   <button onClick={() => openModal(user)} className="p-1 text-muted-foreground hover:text-primary"><PencilIcon /></button>
                   <button onClick={() => handleDelete(user.id)} className="p-1 text-muted-foreground hover:text-destructive"><TrashIcon /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
