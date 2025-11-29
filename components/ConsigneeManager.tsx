
import React, { useState } from 'react';
import type { Consignee } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon } from './Icons';

interface ConsigneeManagerProps {
  consignees: Consignee[];
  setConsignees: React.Dispatch<React.SetStateAction<Consignee[]>>;
}

const inputStyles = "block w-full text-base bg-background rounded-lg border-input shadow-sm focus:border-primary focus:ring-primary transition-colors duration-200 px-4 py-3 ring-1 ring-inset focus:ring-2 focus:ring-inset";
const textareaStyles = `${inputStyles} min-h-[110px]`;

const ConsigneeManager: React.FC<ConsigneeManagerProps> = ({ consignees, setConsignees }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Consignee> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openModal = (item: Partial<Consignee> | null = null) => {
    setEditingItem(item || { name: '', address: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleSave = () => {
    if (!editingItem || !editingItem.name || !editingItem.address) {
        alert("El nombre y la dirección son obligatorios.");
        return;
    }

    setConsignees(prev => {
        if (editingItem.id) {
            return prev.map(c => c.id === editingItem.id ? editingItem as Consignee : c);
        } else {
            return [...prev, { ...editingItem, id: new Date().toISOString() } as Consignee];
        }
    });
    closeModal();
  };
  
  const confirmDelete = () => {
    if (deleteId) {
        setConsignees(prev => prev.filter(c => c.id !== deleteId));
        setDeleteId(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setDeleteId(id);
  };

  return (
    <div className="bg-card p-4 rounded-lg border">
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="relative z-[100]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"></div>
            <div className="fixed inset-0 z-[100] w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <div className="relative transform overflow-hidden rounded-lg bg-card text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border">
                        <div className="bg-card px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 sm:mx-0 sm:h-10 sm:w-10">
                                    <ExclamationTriangleIcon className="h-6 w-6 text-destructive" />
                                </div>
                                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                    <h3 className="text-base font-semibold leading-6 text-foreground" id="modal-title">Eliminar Consignatario</h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-muted-foreground">¿Estás seguro de que deseas eliminar este consignatario? Esta acción no se puede deshacer.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-muted px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                            <button type="button" onClick={confirmDelete} className="inline-flex w-full justify-center rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground shadow-sm hover:bg-destructive/90 sm:ml-3 sm:w-auto">Eliminar</button>
                            <button type="button" onClick={() => setDeleteId(null)} className="mt-3 inline-flex w-full justify-center rounded-md bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent sm:mt-0 sm:w-auto">Cancelar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {isModalOpen && editingItem && (
        <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm"></div>
          <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative transform overflow-hidden rounded-lg bg-card text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border">
                <div className="bg-card px-6 pt-5 pb-4">
                  <h3 className="text-lg font-semibold leading-6 text-foreground">{editingItem?.id ? 'Editar' : 'Agregar'} Consignatario</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Nombre</label>
                        <input type="text" value={editingItem.name || ''} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} className={inputStyles} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Dirección</label>
                        <textarea value={editingItem.address || ''} onChange={e => setEditingItem({ ...editingItem, address: e.target.value })} className={textareaStyles} />
                    </div>
                  </div>
                </div>
                <div className="bg-muted px-6 py-3 flex flex-row-reverse">
                  <button onClick={handleSave} type="button" className="inline-flex justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 ml-3">Guardar</button>
                  <button onClick={closeModal} type="button" className="inline-flex justify-center rounded-md bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent">Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Consignatarios</h3>
          <p className="text-sm text-muted-foreground">Gestiona la información de los consignatarios.</p>
        </div>
        <button onClick={() => openModal()} className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
          <PlusIcon className="w-5 h-5" /> Agregar
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Nombre</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Dirección</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {consignees.map(item => (
              <tr 
                key={item.id} 
                onClick={() => openModal(item)}
                className="hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-2 text-sm font-medium text-foreground align-top">{item.name}</td>
                <td className="px-4 py-2 text-sm text-muted-foreground whitespace-pre-wrap align-top">{item.address}</td>
                <td className="px-4 py-2 text-right space-x-1 align-top">
                   <button 
                        onClick={(e) => { e.stopPropagation(); openModal(item); }} 
                        className="p-1 text-muted-foreground hover:text-primary rounded hover:bg-accent"
                   >
                        <PencilIcon />
                   </button>
                   <button 
                        onClick={(e) => handleDeleteClick(e, item.id)} 
                        className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10"
                   >
                        <TrashIcon />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
         {consignees.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">No hay consignatarios guardados.</p>}
      </div>
    </div>
  );
};

export default ConsigneeManager;
