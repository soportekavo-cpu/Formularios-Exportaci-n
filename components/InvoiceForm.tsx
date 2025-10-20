import React, { useState, useEffect } from 'react';
import type { Certificate, PackageItem, AdjustmentItem, Customer } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ArrowLeftIcon, PlusIcon, TrashIcon, DocumentDuplicateIcon } from './Icons';

interface InvoiceFormProps {
  initialData: Partial<Certificate>;
  onSubmit: (data: Certificate) => void;
  onCancel: () => void;
}

const inputStyles = "block w-full text-base text-gray-900 bg-gray-50 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 hover:bg-white focus:bg-white transition-colors duration-200 px-4 py-3";
const textareaStyles = `${inputStyles} min-h-[110px]`;
const readOnlyInputStyles = `${inputStyles} bg-gray-200 cursor-not-allowed`;

const InvoiceForm: React.FC<InvoiceFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Certificate>>(initialData);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);
  
  useEffect(() => {
    // FIX: Only set form data when initialData changes to prevent state reset on other re-renders
    setFormData(initialData);
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
      const selectedCustomer = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
      if(selectedCustomer) {
        setFormData(prev => ({...prev, customerName: name, consignee: selectedCustomer.address}));
      } else {
        setFormData(prev => ({...prev, customerName: name}));
      }
  }

  const handleCustomerBlur = () => {
    const { customerName, consignee } = formData;
    if (customerName && consignee) {
        const newCustomer: Customer = { id: new Date().toISOString(), name: customerName, address: consignee };
        const customerExists = customers.some(c => c.name.toLowerCase() === newCustomer.name.toLowerCase());
        
        if (!customerExists) {
            setCustomers(prev => [...prev, newCustomer]);
        } else {
            // Update address if name exists
            setCustomers(prev => prev.map(c => c.name.toLowerCase() === newCustomer.name.toLowerCase() ? { ...c, address: newCustomer.address } : c));
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
    onSubmit(formData as Certificate);
  };

  const formatNumber = (num?: number | '') => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(num) || 0);
  
  const isEditing = !!initialData.id;
  
  const subtotal = formData.packages?.reduce((sum, pkg) => sum + (Number(pkg.quantity) || 0) * (Number(pkg.unitValue) || 0), 0) || 0;
  const totalAdjustments = formData.adjustments?.reduce((sum, adj) => sum + (Number(adj.amount) || 0), 0) || 0;
  const totalAdvances = formData.advances?.reduce((sum, adv) => sum + (Number(adv.amount) || 0), 0) || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-8"><button onClick={onCancel} className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"><ArrowLeftIcon className="w-5 h-5" />Volver a la lista</button></div>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{isEditing ? 'Editar' : 'Crear'} Invoice</h1>
        <p className="text-base text-gray-600 mb-10">Completa los campos para generar la factura.</p>
        
        <form onSubmit={handleSubmit} className="space-y-10">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Información General</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <label htmlFor="customerName" className="block text-sm font-medium text-gray-800 mb-2">Bill To (Nombre Cliente)</label>
                        <input type="text" id="customerName" list="customer-list" name="customerName" value={formData.customerName || ''} onChange={handleCustomerSelect} onBlur={handleCustomerBlur} className={inputStyles} autoComplete="off" required/>
                        <datalist id="customer-list">{customers.map(c => <option key={c.id} value={c.name} />)}</datalist>
                    </div>
                     <div>
                        <label htmlFor="consignee" className="block text-sm font-medium text-gray-800 mb-2">Dirección del Cliente</label>
                        <textarea id="consignee" name="consignee" value={formData.consignee || ''} onChange={handleChange} onBlur={handleCustomerBlur} required className={textareaStyles}></textarea>
                    </div>
                     <div>
                        <label htmlFor="certificateDate" className="block text-sm font-medium text-gray-800 mb-2">Date</label>
                        <input type="date" id="certificateDate" name="certificateDate" value={formData.certificateDate || ''} onChange={handleChange} required className={inputStyles} />
                    </div>
                    <div><label htmlFor="contractNo" className="block text-sm font-medium text-gray-800 mb-2">Contract No.</label><input type="text" id="contractNo" name="contractNo" value={formData.contractNo || ''} onChange={handleChange} className={inputStyles} /></div>
                    <div><label htmlFor="shippedVia" className="block text-sm font-medium text-gray-800 mb-2">Shipped Via.</label><input type="text" id="shippedVia" name="shippedVia" value={formData.shippedVia || ''} onChange={handleChange} className={inputStyles} /></div>
                    <div><label htmlFor="billOfLadingNo" className="block text-sm font-medium text-gray-800 mb-2">BILL OF LADING</label><input type="text" id="billOfLadingNo" name="billOfLadingNo" value={formData.billOfLadingNo || ''} onChange={handleChange} className={inputStyles} /></div>
                    <div><label htmlFor="terms" className="block text-sm font-medium text-gray-800 mb-2">Terms</label><input type="text" id="terms" name="terms" value={formData.terms || ''} onChange={handleChange} className={inputStyles} /></div>
                    <div className="md:col-span-2">
                        <label htmlFor="observations" className="block text-sm font-medium text-gray-800 mb-2">Observaciones (Opcional)</label>
                        <textarea id="observations" name="observations" value={formData.observations || ''} onChange={handleChange} className={textareaStyles}></textarea>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Items</h2>
                <div className="space-y-4">
                    {formData.packages?.map((pkg) => (
                        <div key={pkg.id} className="p-4 bg-slate-50 rounded-lg border space-y-4">
                            <div className="grid grid-cols-12 gap-x-4 gap-y-4 items-end">
                                <div className="col-span-6 sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Qty</label><input type="number" step="0.01" value={pkg.quantity} onChange={e => handlePackageChange(pkg.id, 'quantity', e.target.value)} className={inputStyles}/></div>
                                <div className="col-span-12 sm:col-span-10 md:col-span-5"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={pkg.description} onChange={e => handlePackageChange(pkg.id, 'description', e.target.value)} className={inputStyles + ' min-h-[50px] py-2'}/></div>
                                <div className="col-span-12 sm:col-span-4 md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Partida No.</label><input type="text" value={pkg.partidaNo} onChange={e => handlePackageChange(pkg.id, 'partidaNo', e.target.value)} className={inputStyles}/></div>
                                <div className="col-span-6 sm:col-span-4 md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Unit Value</label><input type="number" step="0.01" value={pkg.unitValue} onChange={e => handlePackageChange(pkg.id, 'unitValue', e.target.value)} className={inputStyles}/></div>
                                <div className="col-span-6 sm:col-span-4 md:col-span-1 flex items-center justify-end space-x-2">
                                    <button type="button" onClick={() => duplicatePackage(pkg.id)} className="text-indigo-600 hover:text-indigo-800 p-2 rounded-md hover:bg-indigo-50" title="Duplicar"><DocumentDuplicateIcon/></button>
                                    <button type="button" onClick={() => removePackage(pkg.id)} className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50" title="Eliminar"><TrashIcon/></button>
                                </div>
                                <div className="col-span-12"><label className="block text-sm font-medium text-gray-700">Amount</label><p className={readOnlyInputStyles + ' text-right font-bold'}>${formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.unitValue) || 0))}</p></div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex justify-end"><button type="button" onClick={addPackage} className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"><PlusIcon className="w-5 h-5" />Agregar Item</button></div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Ajustes y Adelantos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Ajustes / Deducciones</h3>
                        <div className="space-y-3">
                            {formData.adjustments?.map(adj => (
                                <div key={adj.id} className="flex gap-2">
                                    <input type="text" placeholder="Descripción" value={adj.description} onChange={e => handleAdjustmentChange(adj.id, 'description', e.target.value, 'adjustments')} className={inputStyles + ' flex-grow'}/>
                                    <input type="number" step="0.01" placeholder="Monto (positivo)" value={adj.amount} onChange={e => handleAdjustmentChange(adj.id, 'amount', e.target.value, 'adjustments')} className={inputStyles + ' w-32'}/>
                                    <button type="button" onClick={() => removeAdjustment(adj.id, 'adjustments')} className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-100"><TrashIcon/></button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => addAdjustment('adjustments')} className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800">+ Agregar Ajuste</button>
                    </div>
                     <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Adelantos</h3>
                        <div className="space-y-3">
                            {formData.advances?.map(adv => (
                                <div key={adv.id} className="flex gap-2">
                                    <input type="text" placeholder="Descripción" value={adv.description} onChange={e => handleAdjustmentChange(adv.id, 'description', e.target.value, 'advances')} className={inputStyles + ' flex-grow'}/>
                                    <input type="number" step="0.01" placeholder="Monto (positivo)" value={adv.amount} onChange={e => handleAdjustmentChange(adv.id, 'amount', e.target.value, 'advances')} className={inputStyles + ' w-32'}/>
                                    <button type="button" onClick={() => removeAdjustment(adv.id, 'advances')} className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50"><TrashIcon/></button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => addAdjustment('advances')} className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800">+ Agregar Adelanto</button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6">
                <div className="w-full max-w-md space-y-3">
                    <div className="flex justify-between items-center"><label className="text-sm font-medium text-gray-700">Subtotal</label><p className={`${readOnlyInputStyles} w-48 text-lg text-right`}>${formatNumber(subtotal)}</p></div>
                    {totalAdjustments > 0 && <div className="flex justify-between items-center"><label className="text-sm font-medium text-gray-700">Total Ajustes</label><p className={`${readOnlyInputStyles} w-48 text-lg text-right text-red-600`}>-${formatNumber(totalAdjustments)}</p></div>}
                    {totalAdvances > 0 && <div className="flex justify-between items-center"><label className="text-sm font-medium text-gray-700">Total Adelantos</label><p className={`${readOnlyInputStyles} w-48 text-lg text-right text-red-600`}>-${formatNumber(totalAdvances)}</p></div>}
                    <div className="flex justify-between items-center"><label className="text-sm font-bold text-gray-900">Total</label><p className={`${readOnlyInputStyles} w-48 text-xl font-bold text-right`}>${formatNumber(formData.totalAmount)}</p></div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-6"><button type="button" onClick={onCancel} className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancelar</button><button type="submit" className="inline-flex justify-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">Guardar y Generar PDF</button></div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;