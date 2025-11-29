import React, { useState, useEffect, useMemo } from 'react';
import type { Shipment, Partida, Contract } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface AddShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shipmentData: { destination: string; partidaIds: string[] }) => void;
  contract: Contract | null;
  shipments: Shipment[];
}

const inputStyles = "block w-full text-base bg-background rounded-lg border-input shadow-sm focus:border-primary focus:ring-primary transition-colors duration-200 px-4 py-3 ring-1 ring-inset focus:ring-2 focus:ring-inset";

const AddShipmentModal: React.FC<AddShipmentModalProps> = ({ isOpen, onClose, onSave, contract, shipments }) => {
  const [destination, setDestination] = useState('');
  const [selectedPartidaIds, setSelectedPartidaIds] = useState<Record<string, boolean>>({});

  const availablePartidas = useMemo(() => {
    if (!contract) return [];
    const assignedPartidaIds = shipments
      .filter(s => s.contractId === contract.id)
      .flatMap(s => s.partidaIds);
    return (contract.partidas || []).filter(p => !assignedPartidaIds.includes(p.id));
  }, [contract, shipments]);

  useEffect(() => {
    if (!isOpen) {
      setDestination('');
      setSelectedPartidaIds({});
    }
  }, [isOpen]);

  if (!isOpen || !contract) return null;

  const handleSave = () => {
    const partidaIds = Object.keys(selectedPartidaIds).filter(id => selectedPartidaIds[id]);
    if (!destination.trim()) {
      alert("Por favor, ingrese un destino.");
      return;
    }
    if (partidaIds.length === 0) {
      alert("Por favor, seleccione al menos una partida.");
      return;
    }
    onSave({ destination, partidaIds });
    onClose();
  };
  
  const handlePartidaSelect = (partidaId: string) => {
    setSelectedPartidaIds(prev => ({
        ...prev,
        [partidaId]: !prev[partidaId]
    }));
  };
  
  return (
    <div className="relative z-50">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm"></div>
      <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-2xl rounded-lg bg-card border shadow-xl">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-foreground">Agregar Embarque a Contrato {contract.contractNumber}</h3>
              <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Destino</label>
                  <input type="text" name="destination" value={destination} onChange={e => setDestination(e.target.value)} className={inputStyles} placeholder="Ej: Los Ángeles, CA" />
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-foreground mb-2">Partidas Disponibles</h4>
                  <div className="space-y-2">
                    {availablePartidas.length > 0 ? availablePartidas.map(partida => (
                      <div key={partida.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                        <input
                          type="checkbox"
                          id={`partida-${partida.id}`}
                          checked={!!selectedPartidaIds[partida.id]}
                          onChange={() => handlePartidaSelect(partida.id)}
                          className="h-5 w-5 rounded border-input text-primary focus:ring-primary"
                        />
                        <label htmlFor={`partida-${partida.id}`} className="flex-grow grid grid-cols-3 gap-x-4 text-sm cursor-pointer items-center">
                          <span className="font-bold text-red-500">{partida.partidaNo}</span>
                          <span className="font-bold text-amber-500">{partida.packageType}</span>
                          <span className="text-muted-foreground">{partida.quintales} Quintales</span>
                        </label>
                      </div>
                    )) : <p className="text-sm text-muted-foreground text-center py-4">Todas las partidas de este contrato ya han sido asignadas a un embarque.</p>}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-muted px-6 py-3 flex flex-row-reverse gap-3">
              <button onClick={handleSave} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">Guardar Embarque</button>
              <button onClick={onClose} className="rounded-md bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddShipmentModal;