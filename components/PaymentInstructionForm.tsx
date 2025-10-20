import React, { useState, useEffect, useRef } from 'react';
import type { Certificate, BankAccount } from '../types';
import { ArrowLeftIcon, PlusIcon, TrashIcon, GripVerticalIcon } from './Icons';
import BankAccountManager from './BankAccountManager';

interface PaymentInstructionFormProps {
  initialData: Partial<Certificate>;
  onSubmit: (data: Certificate) => void;
  onCancel: () => void;
  bankAccounts: BankAccount[];
  setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
}

const inputStyles = "block w-full text-base text-gray-900 bg-gray-50 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 hover:bg-white focus:bg-white transition-colors duration-200 px-4 py-3";
const readOnlyInputStyles = `${inputStyles} bg-gray-200 cursor-not-allowed`;

const PaymentInstructionForm: React.FC<PaymentInstructionFormProps> = ({ initialData, onSubmit, onCancel, bankAccounts, setBankAccounts }) => {
  const [formData, setFormData] = useState<Partial<Certificate>>(initialData);
  const [newDocument, setNewDocument] = useState('');
  const [isBankManagerOpen, setIsBankManagerOpen] = useState(false);
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    setFormData(initialData);
    if (!initialData.bankAccountId && bankAccounts.length > 0) {
      setFormData(prev => ({...prev, bankAccountId: bankAccounts[0].id}));
    }
  }, [initialData, bankAccounts]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addDocument = () => {
    if (newDocument.trim()) {
      setFormData(prev => ({
        ...prev,
        attachedDocuments: [...(prev.attachedDocuments || []), newDocument.trim()]
      }));
      setNewDocument('');
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachedDocuments: prev.attachedDocuments?.filter((_, i) => i !== index)
    }));
  };
  
  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    setFormData(prev => {
        const docs = [...(prev.attachedDocuments || [])];
        const draggedItemContent = docs.splice(dragItem.current!, 1)[0];
        docs.splice(dragOverItem.current!, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        return { ...prev, attachedDocuments: docs };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as Certificate);
  };
  
  const isEditing = !!initialData.id;
  const formatNumber = (num?: number | '') => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(num) || 0);
  
  return (
    <>
      {isBankManagerOpen && (
        <BankAccountManager
          isOpen={isBankManagerOpen}
          onClose={() => setIsBankManagerOpen(false)}
          bankAccounts={bankAccounts}
          setBankAccounts={setBankAccounts}
        />
      )}
      <div className="p-4 sm:p-6 lg:p-8">
         <div className="mb-8"><button onClick={onCancel} className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"><ArrowLeftIcon className="w-5 h-5" />Volver a la lista</button></div>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{isEditing ? 'Editar' : 'Crear'} Instrucciones de Pago</h1>
          <p className="text-base text-gray-600 mb-10">Confirma los datos para generar el documento.</p>
          
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Información General</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Fecha</label>
                  <input type="date" name="certificateDate" value={formData.certificateDate || ''} onChange={handleChange} required className={inputStyles} />
                </div>
                <div />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800 mb-2">Cliente</label>
                  <input type="text" value={formData.customerName || ''} readOnly className={readOnlyInputStyles} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800 mb-2">Dirección</label>
                  <textarea value={formData.consignee || ''} readOnly className={readOnlyInputStyles + ' min-h-[80px]'}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Contrato</label>
                  <input type="text" name="contractNo" value={formData.contractNo || ''} onChange={handleChange} className={inputStyles} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">ICO(s)</label>
                  <input type="text" name="icoNumbers" value={formData.icoNumbers || ''} onChange={handleChange} className={inputStyles} />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Monto Total</label>
                  <input type="text" value={`US$ ${formatNumber(formData.totalAmount)}`} readOnly className={readOnlyInputStyles} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Documentos Adjuntos</h2>
              <ul className="space-y-2">
                {(formData.attachedDocuments || []).map((doc, index) => (
                  <li 
                    key={index} 
                    draggable
                    onDragStart={() => (dragItem.current = index)}
                    onDragEnter={() => (dragOverItem.current = index)}
                    onDragEnd={handleSort}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex items-center justify-between text-gray-800 bg-gray-50 p-2 rounded-md border border-gray-200 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-x-2">
                       <GripVerticalIcon className="w-5 h-5 text-gray-400" />
                       <span>{doc}</span>
                    </div>
                    <button type="button" onClick={() => removeDocument(index)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"><TrashIcon className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-2">
                <input type="text" value={newDocument} onChange={(e) => setNewDocument(e.target.value)} placeholder="Nuevo documento" className={inputStyles + ' flex-grow'} />
                <button type="button" onClick={addDocument} className="inline-flex items-center gap-x-2 rounded-md bg-indigo-100 px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-200">
                  <PlusIcon className="w-5 h-5" /> Agregar
                </button>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Información Bancaria</h2>
                <button type="button" onClick={() => setIsBankManagerOpen(true)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">Administrar Cuentas</button>
              </div>
              <div>
                <label htmlFor="bankAccountId" className="block text-sm font-medium text-gray-800 mb-2">Cuenta de Beneficiario</label>
                <select id="bankAccountId" name="bankAccountId" value={formData.bankAccountId || ''} onChange={handleChange} className={inputStyles}>
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>{account.bankName} - {account.accountNumber}</option>
                  ))}
                </select>
                {bankAccounts.length === 0 && <p className="mt-2 text-sm text-gray-500">No hay cuentas bancarias. Por favor, agregue una.</p>}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Información del Firmante</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label htmlFor="signerName" className="block text-sm font-medium text-gray-800 mb-2">Nombre del Firmante</label>
                  <input type="text" id="signerName" name="signerName" value={formData.signerName || ''} onChange={handleChange} className={inputStyles} />
                </div>
                <div>
                  <label htmlFor="signerTitle" className="block text-sm font-medium text-gray-800 mb-2">Puesto del Firmante</label>
                  <input type="text" id="signerTitle" name="signerTitle" value={formData.signerTitle || ''} onChange={handleChange} className={inputStyles} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <button type="button" onClick={onCancel} className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancelar</button>
              <button type="submit" className="inline-flex justify-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">Guardar y Generar PDF</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default PaymentInstructionForm;