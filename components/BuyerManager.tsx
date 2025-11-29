
import React, { useState, useRef } from 'react';
import type { Buyer } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, UploadIcon, ExclamationTriangleIcon } from './Icons';
import SignaturePad from './SignaturePad';
import { removeWhiteBackground } from '../utils/imageProcessing';

interface BuyerManagerProps {
  buyers: Buyer[];
  onSave: (buyer: Buyer) => void;
  onDelete: (id: string) => void;
}

const inputStyles = "block w-full text-base bg-background rounded-lg border-input shadow-sm focus:border-primary focus:ring-primary transition-colors duration-200 px-4 py-3 ring-1 ring-inset focus:ring-2 focus:ring-inset";

const BuyerManager: React.FC<BuyerManagerProps> = ({ buyers, onSave, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Partial<Buyer> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openModal = (buyer: Partial<Buyer> | null = null) => {
    setEditingBuyer(buyer || { name: '', contactPerson: '', address: '', phone: '', email: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingBuyer(null);
    setIsModalOpen(false);
  };

  const handleSave = () => {
    if (!editingBuyer || !editingBuyer.name || !editingBuyer.address) {
        alert("El nombre y la dirección son obligatorios.");
        return;
    }

    const buyerToSave = { 
        ...editingBuyer, 
        id: editingBuyer.id || new Date().toISOString() 
    } as Buyer;

    onSave(buyerToSave);
    closeModal();
  };
  
  const confirmDelete = () => {
    if (deleteId) {
        onDelete(deleteId);
        setDeleteId(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setDeleteId(id);
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
              if (event.target?.result) {
                  try {
                      const processedImage = await removeWhiteBackground(event.target.result as string);
                      setEditingBuyer(prev => ({ ...prev, signature: processedImage }));
                  } catch (error) {
                      console.error("Error converting image", error);
                      setEditingBuyer(prev => ({ ...prev, signature: event.target?.result as string }));
                  }
              }
          };
          reader.readAsDataURL(file);
      }
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
                                    <h3 className="text-base font-semibold leading-6 text-foreground" id="modal-title">Eliminar Comprador</h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-muted-foreground">¿Estás seguro de que deseas eliminar este comprador? Esta acción no se puede deshacer.</p>
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

      {isModalOpen && editingBuyer && (
        <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"></div>
          <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-card text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border">
                <div className="bg-card px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-semibold leading-6 text-foreground">{editingBuyer?.id ? 'Editar' : 'Agregar'} Comprador</h3>
                  <div className="mt-4 space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Nombre Comprador</label>
                            <input type="text" value={editingBuyer.name || ''} onChange={e => setEditingBuyer({ ...editingBuyer, name: e.target.value })} className={inputStyles} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Persona de Contacto</label>
                            <input type="text" value={editingBuyer.contactPerson || ''} onChange={e => setEditingBuyer({ ...editingBuyer, contactPerson: e.target.value })} className={inputStyles} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Dirección</label>
                            <input type="text" value={editingBuyer.address || ''} onChange={e => setEditingBuyer({ ...editingBuyer, address: e.target.value })} className={inputStyles} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Teléfono</label>
                            <input type="text" value={editingBuyer.phone || ''} onChange={e => setEditingBuyer({ ...editingBuyer, phone: e.target.value })} className={inputStyles} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Email</label>
                            <input type="email" value={editingBuyer.email || ''} onChange={e => setEditingBuyer({ ...editingBuyer, email: e.target.value })} className={inputStyles} />
                        </div>
                        <div className="sm:col-span-2 border-t pt-4 mt-2">
                            <label className="text-sm font-bold text-foreground mb-2 block">Firma Digital</label>
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-4 items-start">
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-2 font-medium">Opción A: Subir Imagen (Recomendado)</p>
                                        <button 
                                            type="button" 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-sm font-medium transition-colors w-full justify-center border border-primary/20"
                                        >
                                            <UploadIcon className="w-4 h-4" /> Seleccionar JPG/PNG
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept="image/jpeg, image/png" 
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                    <div className="w-1/3 flex flex-col items-center justify-center border rounded-md bg-white p-2 h-24 relative">
                                        {editingBuyer.signature ? (
                                            <>
                                                <img src={editingBuyer.signature} alt="Firma" className="max-h-full max-w-full object-contain" />
                                                <button 
                                                    onClick={() => setEditingBuyer({ ...editingBuyer, signature: undefined })}
                                                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 shadow-sm"
                                                >
                                                    <TrashIcon className="w-3 h-3" />
                                                </button>
                                            </>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Sin firma</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2 font-medium">Opción B: Dibujar en pantalla</p>
                                    <SignaturePad 
                                        initialValue={editingBuyer.signature} 
                                        onChange={(sig) => {
                                            if (sig) setEditingBuyer({ ...editingBuyer, signature: sig });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
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
        </div>
      )}

      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Compradores</h3>
          <p className="text-sm text-muted-foreground">Gestiona la información de los compradores.</p>
        </div>
        <button onClick={() => openModal()} className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
          <PlusIcon className="w-5 h-5" /> Agregar Comprador
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Nombre</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Contacto</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Email / Teléfono</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {buyers.map(buyer => (
              <tr 
                key={buyer.id} 
                onClick={() => openModal(buyer)} 
                className="hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-2 text-sm font-medium text-foreground">{buyer.name}</td>
                <td className="px-4 py-2 text-sm text-muted-foreground">{buyer.contactPerson}</td>
                <td className="px-4 py-2 text-sm text-muted-foreground">{buyer.email || buyer.phone}</td>
                <td className="px-4 py-2 text-right space-x-1">
                   <button 
                        onClick={(e) => { e.stopPropagation(); openModal(buyer); }} 
                        className="p-1 text-muted-foreground hover:text-primary rounded hover:bg-accent"
                        title="Editar"
                   >
                        <PencilIcon />
                   </button>
                   <button 
                        onClick={(e) => handleDeleteClick(e, buyer.id)} 
                        className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10"
                        title="Eliminar"
                   >
                        <TrashIcon />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
         {buyers.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">No hay compradores guardados.</p>}
      </div>
    </div>
  );
};

export default BuyerManager;
