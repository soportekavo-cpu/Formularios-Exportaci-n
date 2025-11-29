


import React, { useState, useEffect, useRef } from 'react';
import type { Certificate, PackageItem, AdjustmentItem, Buyer } from '../types';
import { ArrowLeftIcon, PlusIcon, TrashIcon, DocumentDuplicateIcon } from './Icons';

interface InvoiceFormProps {
  initialData: Partial<Certificate>;
  onSubmit: (data: Certificate) => void;
  onCancel: () => void;
  buyers: Buyer[];
  setBuyers: React.Dispatch<React.SetStateAction<Buyer[]>>;
}

const inputStyles = "block w-full text-base bg-background rounded-lg border-input shadow-sm focus:border-primary focus:ring-primary transition-colors duration-200 px-4 py-3 ring-1 ring-inset focus:ring-2 focus:ring-inset";
const textareaStyles = `${inputStyles} min-h-[110px]`;
const readOnlyInputStyles = `${inputStyles} bg-muted cursor-not-allowed`;

const InvoiceForm: React.FC<InvoiceFormProps> = ({ initialData, onSubmit, onCancel, buyers, setBuyers }) => {
  const [formData, setFormData] = useState<Partial<Certificate>>(initialData);
  const lastIdRef = useRef(initialData.id);
  const [invoiceType, setInvoiceType] = useState<'export' | 'general'>(initialData.invoiceType || 'export');
  
  useEffect(() => {
    if (initialData.id !== lastIdRef.current) {
        setFormData(initialData);
        setInvoiceType(initialData.invoiceType || 'export');
        lastIdRef.current = initialData.id;
    }
  }, [initialData]);

  useEffect(() => {
    const subtotal = formData.packages?.reduce((sum, pkg) => sum + (Number(pkg.quantity) || 0) * (Number(pkg.unitValue) || 0), 0) || 0;
    const totalAdjustments = formData.adjustments?.reduce((sum, adj) => sum + (Number(adj.amount) || 0), 0) || 0;
    const totalAdvances = formData.advances?.reduce((sum, adv) => sum + (Number(adv.amount) || 0), 0) || 0;
    const total = subtotal - totalAdjustments - totalAdvances;
    setFormData(prev => ({ ...prev, totalAmount: total }));
  }, [formData.packages, formData.adjustments, formData.advances]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCustomerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const name = e.target.value;
      const selectedBuyer = buyers.find(c => c.name.toLowerCase() === name.toLowerCase());
      if(selectedBuyer) {
        setFormData(prev => ({...prev, customerName: name, consignee: selectedBuyer.address}));
      } else {
        setFormData(prev => ({...prev, customerName: name}));
      }
  }

  const handleCustomerBlur = () => {
    const { customerName, consignee } = formData;
    if (customerName && consignee) {
        const newBuyer: Omit<Buyer, 'id'> = { name: customerName, address: consignee };
        const buyerExists = buyers.some(c => c.name.toLowerCase() === newBuyer.name.toLowerCase());
        
        if (!buyerExists) {
            setBuyers(prev => [...prev, {...newBuyer, id: new Date().toISOString()}]);
        } else {
            setBuyers(prev => prev.map(c => c.name.toLowerCase() === newBuyer.name.toLowerCase() ? { ...c, address: newBuyer.address } : c));
        }
    }
  };


  const handlePackageChange = (id: string, field: keyof PackageItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages?.map(pkg => pkg.id === id ? { ...pkg, [field]: value } : pkg),
    }));
  };

  const addPackage = () => {
    const newPackage: PackageItem = { id: new Date().toISOString(), type: 'qqs.', quantity: '', unitWeight: '', marks: '', description: '', partidaNo: '', unitValue: '' };
    setFormData(prev => ({ ...prev, packages: [...(prev.packages || []), newPackage] }));
  };
  
  const removePackage = (id: string) => {
      setFormData(prev => ({...prev, packages: prev.packages?.filter(pkg => pkg.id !== id) }));
  };
  
  const duplicatePackage = (id: string) => {
    const originalPackage = formData.packages?.find(p => p.id === id);
    if (originalPackage) {
        const newPackage = { ...originalPackage, id: new Date().toISOString() + Math.random(), partidaNo: '' };
        const index = formData.packages?.findIndex(p => p.id === id) ?? -1;
        if(index > -1 && formData.packages) {
            const newPackages = [...formData.packages];
            newPackages.splice(index + 1, 0, newPackage);
            setFormData(prev => ({...prev, packages: newPackages}));
        }
    }
  };
  
  const handleAdjustmentChange = (id: string, field: keyof AdjustmentItem, value: string | number, type: 'adjustments' | 'advances') => {
      setFormData(prev => {
          const updatedItems = prev[type]?.map(adj => adj.id === id ? { ...adj, [field]: value } : adj);
          return { ...prev, [type]: updatedItems };
      });
  };
  
  const addAdjustment = (type: 'adjustments' | 'advances') => {
      const newAdj: AdjustmentItem = { id: new Date().toISOString(), description: '', amount: '' };
      setFormData(prev => ({
          ...prev,
          [type]: [...(prev[type] || []), newAdj]
      }));
  };

  const removeAdjustment = (id: string, type: 'adjustments' | 'advances') => {
      setFormData(prev => ({
          ...prev,
          [type]: prev[type]?.filter(adj => adj.id !== id)
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Include the invoice type in the submission
    onSubmit({ ...formData, invoiceType } as Certificate);
  };

  const formatNumber = (num?: number | '') => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(num) || 0);
  
  const isEditing = !!initialData.id;
  
  const subtotal = formData.packages?.reduce((sum, pkg) => sum + (Number(pkg.quantity) || 0) * (Number(pkg.unitValue) || 0), 0) || 0;
  const totalAdjustments = formData.adjustments?.reduce((sum, adj) => sum + (Number(adj.amount) || 0), 0) || 0;
  const totalAdvances = formData.advances?.reduce((sum, adv) => sum + (Number(adv.amount) || 0), 0) || 0;

  return (
    <div>
       <div className="mb-8"><button onClick={onCancel} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeftIcon className="w-5 h-5" />Volver a la lista</button></div>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-foreground">{isEditing ? 'Editar' : 'Crear'} Invoice</h1>
            <div className="flex bg-muted p-1 rounded-lg">
                <button
                    type="button"
                    onClick={() => setInvoiceType('export')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        invoiceType === 'export' 
                        ? 'bg-white dark:bg-background text-primary shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Exportación (INV)
                </button>
                <button
                    type="button"
                    onClick={() => setInvoiceType('general')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        invoiceType === 'general' 
                        ? 'bg-white dark:bg-background text-primary shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Varios (VAR)
                </button>
            </div>
        </div>
        <p className="text-base text-muted-foreground mb-10">
            {invoiceType === 'export' 
                ? 'Factura comercial formal para exportación.' 
                : 'Factura para muestras, servicios u otros conceptos.'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-10">
            <div className="bg-card p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-card-foreground border-b pb-4 mb-6">Información General</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <label htmlFor="customerName" className="block text-sm font-medium text-card-foreground mb-2">Bill To (Nombre Cliente)</label>
                        <input type="text" id="customerName" list="customer-list" name="customerName" value={formData.customerName || ''} onChange={handleCustomerSelect} onBlur={handleCustomerBlur} className={inputStyles} autoComplete="off" required/>
                        <datalist id="customer-list">{buyers.map(c => <option key={c.id} value={c.name} />)}</datalist>
                    </div>
                     <div>
                        <label htmlFor="consignee" className="block text-sm font-medium text-card-foreground mb-2">Dirección del Cliente</label>
                        <textarea id="consignee" name="consignee" value={formData.consignee || ''} onChange={handleChange} onBlur={handleCustomerBlur} required className={textareaStyles}></textarea>
                    </div>
                     <div>
                        <label htmlFor="certificateDate" className="block text-sm font-medium text-card-foreground mb-2">Date</label>
                        <input type="date" id="certificateDate" name="certificateDate" value={formData.certificateDate || ''} onChange={handleChange} required className={inputStyles} />
                    </div>
                    <div><label htmlFor="contractNo" className="block text-sm font-medium text-card-foreground mb-2">Contract No.</label><input type="text" id="contractNo" name="contractNo" value={formData.contractNo || ''} onChange={handleChange} className={inputStyles} /></div>
                    <div><label htmlFor="shippedVia" className="block text-sm font-medium text-card-foreground mb-2">Shipped Via.</label><input type="text" id="shippedVia" name="shippedVia" value={formData.shippedVia || ''} onChange={handleChange} className={inputStyles} /></div>
                    <div><label htmlFor="billOfLadingNo" className="block text-sm font-medium text-card-foreground mb-2">BILL OF LADING</label><input type="text" id="billOfLadingNo" name="billOfLadingNo" value={formData.billOfLadingNo || ''} onChange={handleChange} className={inputStyles} /></div>
                    <div><label htmlFor="terms" className="block text-sm font-medium text-card-foreground mb-2">Terms</label><input type="text" id="terms" name="terms" value={formData.terms || ''} onChange={handleChange} className={inputStyles} /></div>
                    <div className="md:col-span-2">
                        <label htmlFor="observations" className="block text-sm font-medium text-card-foreground mb-2">Observaciones (Opcional)</label>
                        <textarea id="observations" name="observations" value={formData.observations || ''} onChange={handleChange} className={textareaStyles}></textarea>
                    </div>
                </div>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-card-foreground border-b pb-4 mb-6">Items</h2>
                <div className="space-y-4">
                    {formData.packages?.map((pkg) => (
                        <div key={pkg.id} className="p-4 bg-muted/50 rounded-lg border space-y-4">
                            <div className="grid grid-cols-12 gap-x-4 gap-y-4 items-end">
                                <div className="col-span-6 sm:col-span-2"><label className="block text-sm font-medium text-muted-foreground mb-1">Qty</label><input type="number" step="0.01" value={pkg.quantity} onChange={e => handlePackageChange(pkg.id, 'quantity', e.target.value)} className={inputStyles}/></div>
                                <div className="col-span-12 sm:col-span-10 md:col-span-5"><label className="block text-sm font-medium text-muted-foreground mb-1">Description</label><textarea value={pkg.description} onChange={e => handlePackageChange(pkg.id, 'description', e.target.value)} className={inputStyles + ' min-h-[50px] py-2'}/></div>
                                <div className="col-span-12 sm:col-span-4 md:col-span-2"><label className="block text-sm font-medium text-red-500 mb-1">Partida No.</label><input type="text" value={pkg.partidaNo} onChange={e => handlePackageChange(pkg.id, 'partidaNo', e.target.value)} className={inputStyles}/></div>
                                <div className="col-span-6 sm:col-span-4 md:col-span-2"><label className="block text-sm font-medium text-muted-foreground mb-1">Unit Value</label><input type="number" step="0.01" value={pkg.unitValue} onChange={e => handlePackageChange(pkg.id, 'unitValue', e.target.value)} className={inputStyles}/></div>
                                <div className="col-span-6 sm:col-span-4 md:col-span-1 flex items-center justify-end space-x-2">
                                    <button type="button" onClick={() => duplicatePackage(pkg.id)} className="text-primary hover:text-primary/80 p-2 rounded-md hover:bg-accent" title="Duplicar"><DocumentDuplicateIcon/></button>
                                    <button type="button" onClick={() => removePackage(pkg.id)} className="text-destructive hover:text-destructive/80 p-2 rounded-md hover:bg-destructive/10" title="Eliminar"><TrashIcon/></button>
                                </div>
                                <div className="col-span-12"><label className="block text-sm font-medium text-muted-foreground">Amount</label><p className={readOnlyInputStyles + ' text-right font-bold'}>${formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.unitValue) || 0))}</p></div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex justify-end"><button type="button" onClick={addPackage} className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"><PlusIcon className="w-5 h-5" />Agregar Item</button></div>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-card-foreground border-b pb-4 mb-6">Ajustes y Adelantos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <div>
                        <h3 className="font-semibold text-card-foreground mb-2">Ajustes / Deducciones</h3>
                        <div className="space-y-3">
                            {formData.adjustments?.map(adj => (
                                <div key={adj.id} className="flex gap-2">
                                    <input type="text" placeholder="Descripción" value={adj.description} onChange={e => handleAdjustmentChange(adj.id, 'description', e.target.value, 'adjustments')} className={inputStyles + ' flex-grow'}/>
                                    <input type="number" step="0.01" placeholder="Monto (positivo)" value={adj.amount} onChange={e => handleAdjustmentChange(adj.id, 'amount', e.target.value, 'adjustments')} className={inputStyles + ' w-32'}/>
                                    <button type="button" onClick={() => removeAdjustment(adj.id, 'adjustments')} className="text-destructive hover:text-destructive/80 p-2 rounded-md hover:bg-destructive/10"><TrashIcon/></button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => addAdjustment('adjustments')} className="mt-3 text-sm font-semibold text-primary hover:text-primary/80">+ Agregar Ajuste</button>
                    </div>
                     <div>
                        <h3 className="font-semibold text-card-foreground mb-2">Adelantos</h3>
                        <div className="space-y-3">
                            {formData.advances?.map(adv => (
                                <div key={adv.id} className="flex gap-2">
                                    <input type="text" placeholder="Descripción" value={adv.description} onChange={e => handleAdjustmentChange(adv.id, 'description', e.target.value, 'advances')} className={inputStyles + ' flex-grow'}/>
                                    <input type="number" step="0.01" placeholder="Monto (positivo)" value={adv.amount} onChange={e => handleAdjustmentChange(adv.id, 'amount', e.target.value, 'advances')} className={inputStyles + ' w-32'}/>
                                    <button type="button" onClick={() => removeAdjustment(adv.id, 'advances')} className="text-destructive hover:text-destructive/80 p-2 rounded-md hover:bg-destructive/10"><TrashIcon/></button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => addAdjustment('advances')} className="mt-3 text-sm font-semibold text-primary hover:text-primary/80">+ Agregar Adelanto</button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6">
                <div className="w-full max-w-md space-y-3">
                    <div className="flex justify-between items-center"><label className="text-sm font-medium text-muted-foreground">Subtotal</label><p className={`${readOnlyInputStyles} w-48 text-lg text-right`}>${formatNumber(subtotal)}</p></div>
                    {totalAdjustments > 0 && <div className="flex justify-between items-center"><label className="text-sm font-medium text-muted-foreground">Total Ajustes</label><p className={`${readOnlyInputStyles} w-48 text-lg text-right text-red-600`}>-${formatNumber(totalAdjustments)}</p></div>}
                    {totalAdvances > 0 && <div className="flex justify-between items-center"><label className="text-sm font-medium text-muted-foreground">Total Adelantos</label><p className={`${readOnlyInputStyles} w-48 text-lg text-right text-red-600`}>-${formatNumber(totalAdvances)}</p></div>}
                    <div className="flex justify-between items-center"><label className="text-sm font-bold text-foreground">Total</label><p className={`${readOnlyInputStyles} w-48 text-xl font-bold text-right`}>${formatNumber(formData.totalAmount)}</p></div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
                <button type="button" onClick={onCancel} className="rounded-md bg-background px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent">Cancelar</button>
                <button type="submit" className="inline-flex justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">Guardar y Generar PDF</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;