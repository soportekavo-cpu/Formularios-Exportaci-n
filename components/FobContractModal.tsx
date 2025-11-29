
import React, { useState, useEffect } from 'react';
import type { Contract, Buyer, FobContractData } from '../types';
import { getHarvestYear } from '../utils/companyData';

interface FobContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  buyers: Buyer[];
  onSaveData: (data: FobContractData) => void;
  initialData?: FobContractData;
  contracts: Contract[];
}

const inputStyles = "block w-full text-base bg-background rounded-lg border-input shadow-sm focus:border-primary focus:ring-primary transition-colors duration-200 px-4 py-3 ring-1 ring-inset focus:ring-2 focus:ring-inset";

const FobContractModal: React.FC<FobContractModalProps> = ({ isOpen, onClose, contract, buyers, onSaveData, initialData, contracts }) => {
    const [formData, setFormData] = useState<FobContractData>({
        reportNo: '',
        date: new Date().toISOString().split('T')[0],
        buyerId: '',
        quantityText: '',
        weightText: '46.00 Kgs.',
        description: '',
        price: 0,
        shipmentPeriod: '',
        shippingPort: 'Guatemala',
        destinationPort: 'Open World'
    });
    const [validationError, setValidationError] = useState<string | null>(null);

    // Helper to get default data for a NEW report
    const getDefaultData = (): FobContractData => {
        const buyer = buyers.find(b => b.name === contract.buyer);
        const price = contract.partidas?.[0]?.finalPrice || 0;
        
        // Estimate quantity
        const totalBags = (contract.partidas || []).reduce((sum, p) => sum + Number(p.numBultos || 0), 0);
        const packageType = contract.partidas?.[0]?.packageType || 'Bags';

        return {
            reportNo: '',
            date: new Date().toISOString().split('T')[0],
            buyerId: buyer?.id || '',
            quantityText: `${totalBags.toFixed(2)} ${packageType}`,
            weightText: '46.00 Kgs.',
            description: contract.coffeeType ? `ESTRICTAMENTE DURO ${contract.harvestYear || ''} - ${contract.coffeeType}`.toUpperCase() : '',
            price: price,
            shipmentPeriod: `${contract.shipmentMonth || ''}`.toLowerCase(),
            shippingPort: 'Guatemala',
            destinationPort: 'Open World'
        };
    };

    // Initial load
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({ ...initialData });
            } else {
                setFormData(getDefaultData());
            }
            setValidationError(null);
        }
    }, [isOpen, initialData, contract]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'reportNo') setValidationError(null);
    };

    const validateReportNo = (): boolean => {
        if (!formData.reportNo) {
             alert("Por favor, ingrese el número de Informe de Ventas.");
             return false;
        }
        
        const currentHarvest = contract.harvestYear || getHarvestYear(contract.saleDate || '');
        const normalizedReportNo = formData.reportNo.trim();

        for (const c of contracts) {
            const cHarvest = c.harvestYear || getHarvestYear(c.saleDate || '');
            // Only validate against contracts in the same harvest and same company
            if (cHarvest === currentHarvest && c.company === contract.company) {
                 // Check history array
                 const history = c.fobContracts || [];
                 // Also check legacy single record
                 if (c.fobContractData) history.push(c.fobContractData);
                 
                 const duplicate = history.find(r => {
                     // If editing, skip self
                     if (c.id === contract.id && r.id === formData.id) return false;
                     // Skip if ID matches (in case of updating existing doc in same contract)
                     if (c.id === contract.id && r.reportNo === initialData?.reportNo) return false;
                     
                     return (r.reportNo || '').trim() === normalizedReportNo;
                 });

                 if (duplicate) {
                     setValidationError(`El Informe de Ventas No. ${normalizedReportNo} ya existe en la cosecha ${currentHarvest} (Contrato ${c.contractNumber}).`);
                     return false;
                 }
            }
        }
        return true;
    };

    const handleSave = () => {
        const buyer = buyers.find(b => b.id === formData.buyerId);
        if (!buyer) {
            alert("Por favor, seleccione un comprador válido.");
            return;
        }
        if (!validateReportNo()) return;

        onSaveData(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
      <div className="relative z-[70]">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm"></div>
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl rounded-lg bg-card border shadow-xl">
                <div className="p-6">
                    <h3 className="text-xl font-bold mb-4">
                        {initialData ? 'Editar Contrato FOB' : 'Generar Nuevo Contrato FOB'}
                    </h3>
                    
                    <div className="space-y-4 bg-muted/20 p-4 rounded-lg border">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <label className="block text-sm font-medium mb-1">Informe de Ventas (No.)</label>
                                <input type="text" name="reportNo" value={formData.reportNo} onChange={handleChange} className={`${inputStyles} ${validationError ? 'border-destructive ring-1 ring-destructive' : ''}`} placeholder="Ej: 8" />
                                {validationError && <p className="text-xs text-destructive mt-1 absolute bg-white p-1 border rounded shadow-sm z-10">{validationError}</p>}
                            </div>
                            <div><label className="block text-sm font-medium mb-1">Fecha</label><input type="date" name="date" value={formData.date} onChange={handleChange} className={inputStyles} /></div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Comprador (Buyer)</label>
                            <select name="buyerId" value={formData.buyerId} onChange={handleChange} className={inputStyles}>
                                <option value="">Seleccione Comprador</option>
                                {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <p className="text-xs text-muted-foreground mt-1">Se usará la firma guardada en el perfil del comprador.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium mb-1">Cantidad (Texto)</label><input type="text" name="quantityText" value={formData.quantityText} onChange={handleChange} className={inputStyles} /></div>
                            <div><label className="block text-sm font-medium mb-1">Promedio (Averaging)</label><input type="text" name="weightText" value={formData.weightText} onChange={handleChange} className={inputStyles} /></div>
                        </div>
                        
                        <div><label className="block text-sm font-medium mb-1">Descripción</label><textarea name="description" value={formData.description} onChange={handleChange} className={`${inputStyles} min-h-[60px]`} /></div>
                        
                        <div><label className="block text-sm font-medium mb-1">Precio ($)</label><input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className={inputStyles} /></div>
                        
                        <div><label className="block text-sm font-medium mb-1">Periodo de Embarque</label><input type="text" name="shipmentPeriod" value={formData.shipmentPeriod} onChange={handleChange} className={inputStyles} placeholder="oct-25 to dec-25"/></div>
                    </div>
                </div>
                <div className="bg-muted px-6 py-4 flex flex-row-reverse gap-3">
                    <button onClick={handleSave} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">Guardar Datos</button>
                    <button onClick={onClose} className="rounded-md bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent">Cancelar</button>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default FobContractModal;
