

import React, { useState, useMemo, useEffect } from 'react';
import type { Contract, LicensePayment, Buyer } from '../types';
import { PlusIcon, TrashIcon, ExclamationTriangleIcon, CheckCircleIcon } from './Icons';
import LiquidationSummaryView from './CreditNoteView';
import type { CompanyInfo } from '../utils/companyData';

interface LicenseSettlementDashboardProps {
  contracts: Contract[];
  payments: LicensePayment[];
  setPayments: React.Dispatch<React.SetStateAction<LicensePayment[]>>;
  buyers: Buyer[];
  setContracts: React.Dispatch<React.SetStateAction<Contract[]>>;
  initialContractId?: string | null;
  dizanoLogo: string | null;
  probenLogo: string | null;
  dizanoInfo: CompanyInfo;
  probenInfo: CompanyInfo;
}

const TAX_RATE = 0.025; // 2.5%
// Standard defaults to check against, but we use what's in the contract now.
const FITO_COST_DEFAULT = 45.45; 

const LicenseSettlementDashboard: React.FC<LicenseSettlementDashboardProps> = ({ contracts, payments, setPayments, buyers, setContracts, initialContractId, dizanoLogo, probenLogo, dizanoInfo, probenInfo }) => {
    const [selectedContractId, setSelectedContractId] = useState<string | null>(initialContractId || null);
    const [newPaymentAmount, setNewPaymentAmount] = useState<number | ''>('');
    const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [newPaymentConcept, setNewPaymentConcept] = useState('');
    const [isSummaryViewOpen, setIsSummaryViewOpen] = useState(false);

    useEffect(() => {
        if(initialContractId) {
            setSelectedContractId(initialContractId);
        } else if (!selectedContractId && contracts.length > 0) {
            setSelectedContractId(contracts[0].id);
        } else if (selectedContractId && !contracts.find(c => c.id === selectedContractId)) {
            setSelectedContractId(contracts[0]?.id || null);
        }
    }, [contracts, selectedContractId, initialContractId]);

    const selectedContract = useMemo(() => contracts.find(c => c.id === selectedContractId), [contracts, selectedContractId]);
    const buyer = useMemo(() => buyers.find(b => b.name === selectedContract?.buyer), [buyers, selectedContract]);
    
    const contractPayments = useMemo(() => (Array.isArray(payments) ? payments : []).filter(p => p.contractId === selectedContractId), [payments, selectedContractId]);

    const calculations = useMemo(() => {
        if (!selectedContract) return null;
        const partidas = Array.isArray(selectedContract.partidas) ? selectedContract.partidas : [];
        
        // Corrected Total Value Calculation: Sum of (Peso KG / 46 * Final Price)
        const totalValue = partidas.filter(p => p).reduce((sum, p) => {
             const qqs = Number(p.pesoKg || 0) / 46;
             return sum + (qqs * Number(p.finalPrice || 0));
        }, 0);
        
        // Fallback logic for backward compatibility if liquidationCosts is empty
        // But ideally we should show what's in the contract or 0
        let totalDeductions = 0;
        let taxes = 0;
        let licenseFee = 0;
        let fitoCost = 0;

        if (selectedContract.liquidationCosts && selectedContract.liquidationCosts.length > 0) {
            totalDeductions = selectedContract.liquidationCosts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            
            // Try to extract standard values for display (approximate matching)
            taxes = selectedContract.liquidationCosts.find(c => c.concept.toLowerCase().includes('impuesto'))?.amount || 0;
            licenseFee = selectedContract.liquidationCosts.find(c => c.concept.toLowerCase().includes('honorario') || c.concept.toLowerCase().includes('licencia'))?.amount || 0;
            fitoCost = selectedContract.liquidationCosts.find(c => c.concept.toLowerCase().includes('fito'))?.amount || 0;
        } else {
            // Fallback Calculation just for display in Dashboard if not initialized
            const totalQuintales = partidas.reduce((sum, p) => sum + (Number(p.pesoKg || 0) / 46), 0);
            taxes = totalValue * TAX_RATE;
            licenseFee = totalQuintales * 1.00;
            fitoCost = FITO_COST_DEFAULT;
            totalDeductions = taxes + licenseFee + fitoCost;
        }
        
        const totalPaid = contractPayments.reduce((sum, p) => sum + p.amount, 0);
        
        const balance = totalValue - totalDeductions - totalPaid;
        const overpayment = balance < 0 ? Math.abs(balance) : 0;
        const extraTaxes = overpayment * TAX_RATE;

        return { totalValue, taxes, licenseFee, fitoCost, totalPaid, balance, overpayment, extraTaxes, totalDeductions };
    }, [selectedContract, contractPayments]);

    const handleAddPayment = () => {
        if (!newPaymentAmount || !selectedContractId) return;
        const newPayment: LicensePayment = {
            id: new Date().toISOString(),
            contractId: selectedContractId,
            date: newPaymentDate,
            amount: Number(newPaymentAmount),
            concept: newPaymentConcept,
        };
        setPayments(prev => [...prev, newPayment]);
        setNewPaymentAmount('');
        setNewPaymentConcept('');
    };

    const handleDeletePayment = (paymentId: string) => {
        setPayments(prev => prev.filter(p => p.id !== paymentId));
    };
    
    const onSummaryClosed = () => {
        if (selectedContractId && !selectedContract?.notaAbonoGenerated) {
            setContracts(prev => prev.map(c => c.id === selectedContractId ? { ...c, notaAbonoGenerated: true } : c));
        }
        setIsSummaryViewOpen(false);
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    if (isSummaryViewOpen && selectedContract && buyer && calculations) {
        return <LiquidationSummaryView 
            contract={selectedContract} 
            buyer={buyer} 
            calculations={calculations}
            payments={contractPayments}
            logo={selectedContract.company === 'dizano' ? dizanoLogo : probenLogo}
            companyInfo={selectedContract.company === 'dizano' ? dizanoInfo : probenInfo}
            onClose={onSummaryClosed} 
        />
    }

    return (
        <div className="bg-background text-foreground min-h-full">
            <h1 className="text-3xl font-bold mb-6">Liquidación de Divisas (Alquiler de Licencia)</h1>
            {contracts.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 xl:col-span-3">
                        <h2 className="text-lg font-semibold mb-3 px-2">Contratos Activos</h2>
                        <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-2">
                             {contracts.map(contract => (
                                <div key={contract.id} onClick={() => setSelectedContractId(contract.id)} className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedContractId === contract.id ? 'bg-primary text-primary-foreground shadow-md' : 'bg-card hover:bg-accent'}`}>
                                    <p className="font-semibold truncate">{contract.contractNumber}</p>
                                    <p className={`text-sm truncate ${selectedContractId === contract.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{contract.buyer}</p>
                                </div>
                             ))}
                         </div>
                    </div>
                     <div className="lg:col-span-8 xl:col-span-9">
                        {selectedContract && calculations ? (
                            <div className="space-y-8">
                                <div className="bg-card rounded-lg border p-6">
                                    <h2 className="text-xl font-bold">Contrato: {selectedContract.contractNumber}</h2>
                                    <p className="text-muted-foreground">{selectedContract.buyer}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-card p-4 rounded-lg border"><p className="text-sm text-muted-foreground">Valor Total Contrato</p><p className="text-2xl font-bold">{formatCurrency(calculations.totalValue)}</p></div>
                                    <div className="bg-card p-4 rounded-lg border"><p className="text-sm text-muted-foreground">Total Pagado</p><p className="text-2xl font-bold text-green-500">{formatCurrency(calculations.totalPaid)}</p></div>
                                    <div className={`bg-card p-4 rounded-lg border ${calculations.balance <= 0 ? 'border-green-500' : 'border-amber-500'}`}><p className="text-sm text-muted-foreground">Saldo Pendiente</p><p className={`text-2xl font-bold ${calculations.balance <= 0 ? 'text-green-500' : 'text-amber-500'}`}>{formatCurrency(calculations.balance)}</p></div>
                                </div>
                                
                                <div className="bg-muted/30 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-sm mb-2">Deducciones (Resumen)</h4>
                                    {selectedContract.liquidationCosts && selectedContract.liquidationCosts.length > 0 ? (
                                        <div className="space-y-1 text-sm">
                                            {selectedContract.liquidationCosts.map(cost => (
                                                <div key={cost.id} className="flex justify-between">
                                                    <span className="text-muted-foreground">{cost.concept}</span>
                                                    <span className="font-medium text-red-500">{formatCurrency(cost.amount)}</span>
                                                </div>
                                            ))}
                                            <div className="border-t pt-1 mt-1 flex justify-between font-bold">
                                                <span>Total</span>
                                                <span className="text-red-600">{formatCurrency(calculations.totalDeductions)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div><p className="text-muted-foreground">Impuestos (Est. 2.5%)</p><p className="font-medium text-red-500">{formatCurrency(calculations.taxes)}</p></div>
                                            <div><p className="text-muted-foreground">Licencia (Est.)</p><p className="font-medium text-red-500">{formatCurrency(calculations.licenseFee)}</p></div>
                                            <div><p className="text-muted-foreground">Fito (Est.)</p><p className="font-medium text-red-500">{formatCurrency(calculations.fitoCost)}</p></div>
                                        </div>
                                    )}
                                </div>
                                
                                {calculations.overpayment > 0 && (
                                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-4">
                                        <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500 flex-shrink-0 mt-1"/>
                                        <div>
                                            <h4 className="font-bold text-yellow-600 dark:text-yellow-400">Alerta de Sobrepago</h4>
                                            <p className="text-sm">Se ha pagado un excedente de <span className="font-bold">{formatCurrency(calculations.overpayment)}</span>. Debes hacer un ajuste de cobro de impuestos por el 2.5% de este excedente.</p>
                                            <p className="mt-2 text-lg font-bold">Ajuste de Impuestos a Cobrar: <span className="text-red-500">{formatCurrency(calculations.extraTaxes)}</span></p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="bg-card p-4 rounded-lg border">
                                        <h3 className="font-semibold mb-3 border-b pb-2">Registro de Pagos (Ingreso de Divisas)</h3>
                                        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                                            {contractPayments.map(p => (
                                                <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{formatCurrency(p.amount)} <span className="text-muted-foreground text-xs font-normal">el {p.date}</span></span>
                                                        {p.concept && <span className="text-xs text-muted-foreground">{p.concept}</span>}
                                                    </div>
                                                    <button onClick={() => handleDeletePayment(p.id)} className="p-1 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-full"><TrashIcon className="w-4 h-4"/></button>
                                                </div>
                                            ))}
                                            {contractPayments.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No hay pagos registrados.</p>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 border-t pt-3">
                                            <div className="col-span-2"><input type="text" value={newPaymentConcept} onChange={e => setNewPaymentConcept(e.target.value)} className="bg-background border border-input rounded-md px-3 py-2 w-full" placeholder="Concepto (Opcional)"/></div>
                                            <div><input type="number" value={newPaymentAmount} onChange={e => setNewPaymentAmount(Number(e.target.value))} className="bg-background border border-input rounded-md px-3 py-2 w-full" placeholder="Monto 0.00"/></div>
                                            <div className="flex gap-2">
                                                <input type="date" value={newPaymentDate} onChange={e => setNewPaymentDate(e.target.value)} className="bg-background border border-input rounded-md px-3 py-2 w-full"/>
                                                <button onClick={handleAddPayment} className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90"><PlusIcon className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-card p-4 rounded-lg border flex flex-col justify-center items-center text-center">
                                        <h3 className="font-semibold mb-3">Resumen de Liquidación</h3>
                                        {selectedContract.notaAbonoGenerated ? (
                                             <div className="text-green-600"><CheckCircleIcon className="w-12 h-12 mx-auto mb-2"/> <p className="font-bold">Resumen generado.</p><button onClick={() => setIsSummaryViewOpen(true)} className="mt-2 text-sm font-semibold text-primary hover:underline">Ver de nuevo</button></div>
                                        ) : calculations.balance <= 0 ? (
                                            <>
                                                <p className="text-sm text-muted-foreground mb-4">El contrato ha sido liquidado. Ya puedes generar el resumen final.</p>
                                                <button onClick={() => setIsSummaryViewOpen(true)} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700">Generar Resumen</button>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-sm text-muted-foreground px-4 mb-4">Puedes generar un resumen parcial del estado de cuenta.</p>
                                                <button onClick={() => setIsSummaryViewOpen(true)} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90">Ver Resumen</button>
                                            </>
                                        )}
                                    </div>
                                </div>

                            </div>
                        ) : <p>Selecciona un contrato para ver sus detalles.</p>}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                    <h3 className="text-sm font-semibold text-foreground">No hay contratos de Alquiler de Licencia</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Activa esta opción en un contrato para empezar.</p>
                </div>
            )}
        </div>
    );
};

export default LicenseSettlementDashboard;
