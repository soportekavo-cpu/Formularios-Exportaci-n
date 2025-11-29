
import React, { useState } from 'react';
import type { Role, Permission, Resource, PermissionAction } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, CheckCircleIcon } from './Icons';

interface RoleManagerProps {
    roles: Role[];
    onSave: (role: Role) => void;
    onDelete: (id: string) => void;
}

const RESOURCES: { key: Resource; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'contracts', label: 'Contratos' },
    { key: 'shipments', label: 'Embarques' },
    { key: 'liquidaciones', label: 'Liquidaciones' },
    { key: 'admin', label: 'Administración' },
    // Granular Documents
    { key: 'documents_weight', label: 'Cert. Peso' },
    { key: 'documents_quality', label: 'Cert. Calidad' },
    { key: 'documents_packing', label: 'Lista Empaque' },
    { key: 'documents_porte', label: 'Carta Porte' },
    { key: 'documents_invoice', label: 'Invoices' },
    { key: 'documents_payment', label: 'Instr. Pago' },
];

const ACTIONS: { key: PermissionAction; label: string }[] = [
    { key: 'view', label: 'Ver' },
    { key: 'create', label: 'Crear' },
    { key: 'edit', label: 'Editar' },
    { key: 'delete', label: 'Eliminar' },
];

const RoleManager: React.FC<RoleManagerProps> = ({ roles, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);

    const openModal = (role?: Role) => {
        if (role) {
            setEditingRole(JSON.parse(JSON.stringify(role))); // Deep copy
        } else {
            setEditingRole({ name: '', permissions: [] });
        }
        setIsModalOpen(true);
    };

    const handlePermissionToggle = (resource: Resource, action: PermissionAction) => {
        setEditingRole(prev => {
            if (!prev) return null;
            const currentPerms = prev.permissions || [];
            const resourcePermIndex = currentPerms.findIndex(p => p.resource === resource);
            
            let newPerms = [...currentPerms];

            if (resourcePermIndex >= 0) {
                const resourcePerm = { ...newPerms[resourcePermIndex] };
                if (resourcePerm.actions.includes(action)) {
                    resourcePerm.actions = resourcePerm.actions.filter(a => a !== action);
                    if (resourcePerm.actions.length === 0) {
                        newPerms.splice(resourcePermIndex, 1); // Remove if empty
                    } else {
                        newPerms[resourcePermIndex] = resourcePerm;
                    }
                } else {
                    resourcePerm.actions.push(action);
                    newPerms[resourcePermIndex] = resourcePerm;
                }
            } else {
                newPerms.push({ resource, actions: [action] });
            }
            return { ...prev, permissions: newPerms };
        });
    };

    const handleSave = () => {
        if (!editingRole || !editingRole.name) return;
        
        const roleToSave = { 
            ...editingRole, 
            id: editingRole.id || new Date().toISOString() 
        } as Role;

        onSave(roleToSave);
        setIsModalOpen(false);
        setEditingRole(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Estás seguro? Esto podría afectar a usuarios asignados.')) {
            onDelete(id);
        }
    };

    return (
        <div className="bg-card p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="font-semibold text-foreground">Roles y Permisos</h3>
                    <p className="text-sm text-muted-foreground">Define qué pueden hacer los usuarios.</p>
                </div>
                <button onClick={() => openModal()} className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
                    <PlusIcon className="w-5 h-5" /> Nuevo Rol
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {roles.map(role => (
                    <div key={role.id} className="border rounded-lg p-4 bg-card hover:border-primary/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-lg">{role.name}</h4>
                            <div className="flex gap-1">
                                <button onClick={() => openModal(role)} className="p-1 text-muted-foreground hover:text-primary"><PencilIcon className="w-4 h-4" /></button>
                                {role.id !== 'admin' && <button onClick={() => handleDelete(role.id)} className="p-1 text-muted-foreground hover:text-destructive"><TrashIcon className="w-4 h-4" /></button>}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {(role.permissions || []).slice(0, 5).map((p, idx) => (
                                <span key={idx} className="text-[10px] bg-muted px-1.5 py-0.5 rounded border uppercase">{p.resource.replace('documents_', '')}</span>
                            ))}
                            {(role.permissions || []).length > 5 && <span className="text-[10px] text-muted-foreground px-1">+{(role.permissions || []).length - 5} más</span>}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && editingRole && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-4xl rounded-lg border shadow-xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold">{editingRole.id ? 'Editar Rol' : 'Nuevo Rol'}</h3>
                            <div className="w-64">
                                <input type="text" value={editingRole.name || ''} onChange={e => setEditingRole({...editingRole, name: e.target.value})} className="w-full bg-background border rounded-md px-3 py-1.5 text-sm" placeholder="Nombre del Rol (ej: Gestor Logístico)" />
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 pl-2">Módulo / Recurso</th>
                                        {ACTIONS.map(a => <th key={a.key} className="text-center py-2">{a.label}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {RESOURCES.map(res => {
                                        const perm = editingRole.permissions?.find(p => p.resource === res.key);
                                        return (
                                            <tr key={res.key} className="hover:bg-muted/30">
                                                <td className="py-3 font-medium pl-2">{res.label}</td>
                                                {ACTIONS.map(act => (
                                                    <td key={act.key} className="text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={perm?.actions.includes(act.key) || false}
                                                            onChange={() => handlePermissionToggle(res.key, act.key)}
                                                            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md border bg-background hover:bg-accent">Cancelar</button>
                            <button onClick={handleSave} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Guardar Rol</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleManager;
