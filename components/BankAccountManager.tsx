import React, { useState, useEffect } from 'react';
import type { BankAccount } from '../types';
import { PlusIcon, PencilIcon, TrashIcon } from './Icons';

interface BankAccountManagerProps {
  isOpen: boolean;
  onClose: () => void;
  bankAccounts: BankAccount[];
  setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
}

const inputStyles = "block w-full text-base text-gray-900 bg-gray-50 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 hover:bg-white focus:bg-white transition-colors duration-200 px-4 py-3";
const textareaStyles = `${inputStyles} min-h-[80px]`;

const emptyAccount: Omit<BankAccount, 'id'> = {
  bankName: '',
  swift: '',
  beneficiary: '',
  accountNumber: '',
  iban: '',
  notes: '',
};

const BankAccountManager: React.FC<BankAccountManagerProps> = ({ isOpen, onClose, bankAccounts, setBankAccounts }) => {
  const [editingAccount, setEditingAccount] = useState<Partial<BankAccount> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEditingAccount(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!editingAccount || !editingAccount.bankName) return;
    
    if (editingAccount.id) {
      // Update existing
      setBankAccounts(prev => prev.map(acc => acc.id === editingAccount!.id ? editingAccount as BankAccount : acc));
    } else {
      // Add new
      const newAccount: BankAccount = { ...emptyAccount, ...editingAccount, id: new Date().toISOString() };
      setBankAccounts(prev => [...prev, newAccount]);
    }
    setEditingAccount(null);
  };

  const handleDelete = (id: string) => {
    setBankAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
  };
  
  const handleAddNew = () => {
    setEditingAccount(emptyAccount);
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditingAccount(prev => ({ ...prev, [name]: value }));
  }

  if (!isOpen) return null;

  return (
    <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
            <div className="bg-white p-6">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xl font-semibold leading-6 text-gray-900" id="modal-title">Administrar Cuentas Bancarias</h3>
                 <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                    <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="mt-5 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-4">
                    {bankAccounts.map(account => (
                        <div key={account.id} className="p-3 bg-gray-50 rounded-lg border flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-gray-800">{account.bankName}</p>
                                <p className="text-sm text-gray-500">{account.accountNumber} / IBAN: {account.iban}</p>
                            </div>
                            <div className="flex items-center gap-x-2 flex-shrink-0">
                                <button onClick={() => handleEdit(account)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"><PencilIcon /></button>
                                <button onClick={() => handleDelete(account.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"><TrashIcon /></button>
                            </div>
                        </div>
                    ))}
                     {bankAccounts.length === 0 && <p className="text-center text-gray-500 py-4">No hay cuentas guardadas.</p>}
                </div>

                {editingAccount ? (
                    <div className="mt-6 pt-6 border-t">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">{editingAccount.id ? 'Editar' : 'Agregar'} Cuenta</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="bankName">Nombre del Banco</label>
                                <input type="text" id="bankName" name="bankName" value={editingAccount.bankName || ''} onChange={handleChange} className={inputStyles} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="swift">SWIFT</label>
                                <input type="text" id="swift" name="swift" value={editingAccount.swift || ''} onChange={handleChange} className={inputStyles} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="beneficiary">Beneficiario Final</label>
                                <input type="text" id="beneficiary" name="beneficiary" value={editingAccount.beneficiary || ''} onChange={handleChange} className={inputStyles} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="accountNumber">Nº de Cuenta</label>
                                <input type="text" id="accountNumber" name="accountNumber" value={editingAccount.accountNumber || ''} onChange={handleChange} className={inputStyles} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="iban">IBAN</label>
                                <input type="text" id="iban" name="iban" value={editingAccount.iban || ''} onChange={handleChange} className={inputStyles} />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">Notes</label>
                                <textarea id="notes" name="notes" value={editingAccount.notes || ''} onChange={handleChange} className={textareaStyles} />
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end gap-3">
                            <button type="button" onClick={() => setEditingAccount(null)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancelar</button>
                            <button type="button" onClick={handleSave} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">Guardar</button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 flex justify-end">
                        <button onClick={handleAddNew} className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                           <PlusIcon className="w-5 h-5"/> Agregar Nueva Cuenta
                        </button>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankAccountManager;