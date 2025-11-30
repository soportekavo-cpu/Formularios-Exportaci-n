
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Contract, Buyer, Partida, PackagingRecord, ContractCertifications, LicensePayment, Company, ExportWorkflowStep, WorkflowStepStatus, LiquidationDeduction, FobContractData, CertificateType } from '../types';
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon, ClockIcon, CubeIcon, QueueListIcon, BanknotesIcon, ExclamationTriangleIcon, CheckCircleIcon, DocumentDuplicateIcon, TruckIcon, PaperClipIcon, PaperAirplaneIcon, ArrowPathIcon, FileTextIcon, EyeIcon, DocumentPlusIcon, DotsHorizontalIcon } from './Icons';
import LiquidationSummaryView from './CreditNoteView';
import type { CompanyInfo } from '../utils/companyData';
import FobContractModal from './FobContractModal';
import FobContractViewModal from './FobContractViewModal';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface ContractDetailViewProps {
  contract: Contract;
  buyers: Buyer[];
  onBack: () => void;
  onEditContract: (contract: Contract) => void;
  onDeleteContract: (id: string) => void;
  onAddPartida: () => void;
  onEditPartida: (partida: Partida) => void;
  onDeletePartida: (partidaId: string) => void;
  onDuplicatePartida: (partida: Partida) => void;
  onViewPartida: (partida: Partida) => void;
  onUpdateContractDirectly: (contract: Contract) => void;
  onGoToLiquidation?: (contractId: string) => void;
  onGenerateDocumentFromPartida?: (partida: Partida, type: CertificateType) => void; // New prop
  canEdit: boolean;
  licensePayments: LicensePayment[];
  setLicensePayments: React.Dispatch<React.SetStateAction<LicensePayment[]>>;
  logo: string | null;
  companyInfo: CompanyInfo;
}

const TAX_RATE = 0.025; // 2.5%
const FITO_COST = 45.45;

const getPartidaPrefix = (company: Company) => {
    return company === 'dizano' ? '11/988/' : '11/44360/';
};

const ShippingLineBadge = ({ name, booking }: { name?: string, booking?: string }) => {
  if (!booking) return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Pendiente</span>;

  let colorClass = "bg-gray-100 text-gray-700 border-gray-200"; 
  let shortName = "N/A";

  const n = (name || '').toLowerCase();
  if (n.includes('maersk')) { colorClass = "bg-sky-100 text-sky-700 border-sky-200"; shortName = "MAERSK"; }
  else if (n.includes('msc')) { colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200"; shortName = "MSC"; }
  else if (n.includes('seaboard')) { colorClass = "bg-green-100 text-green-700 border-green-200"; shortName = "SEABOARD"; }
  else if (n.includes('hapag')) { colorClass = "bg-orange-100 text-orange-700 border-orange-200"; shortName = "HAPAG"; }
  else if (n.includes('cma')) { colorClass = "bg-blue-100 text-blue-700 border-blue-200"; shortName = "CMA"; }
  else if (n.includes('one')) { colorClass = "bg-pink-100 text-pink-700 border-pink-200"; shortName = "ONE"; }
  else if (n.includes('evergreen')) { colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200"; shortName = "EVERGREEN"; }
  else if (n.includes('zim')) { colorClass = "bg-slate-100 text-slate-700 border-slate-200"; shortName = "ZIM"; }
  else { shortName = (name || 'OTRO').substring(0, 4).toUpperCase(); }

  return (
    <div className="flex flex-col items-start">
        <span className={`text-[9px] font-bold px-1.5 rounded border ${colorClass} mb-0.5`}>{shortName}</span>
        <span className="font-mono text-xs font-medium">{booking}</span>
    </div>
  );
};

// ... PackagingManager (unchanged) ...
const PackagingManager = ({ contract, onUpdate }: { contract: Contract, onUpdate: (c: Contract) => void }) => {
    const prefix = getPartidaPrefix(contract.company);

    const calculateRequirementsForPartida = (partida: Partida): PackagingRecord[] => {
        const reqs: PackagingRecord[] = [];
        const qty = Number(partida.numBultos || 0);
        if (qty === 0) return reqs;

        const rawType = partida.packageType === 'Otro' ? partida.customPackageType : partida.packageType;
        const type = String(rawType || '');

        const createRecord = (name: string, required: number): PackagingRecord => ({
            itemName: name,
            required,
            purchased: 0
        });

        if (type.includes('Sacos de Yute') && type.includes('GrainPro')) {
            reqs.push(createRecord('Sacos de Yute', qty));
            reqs.push(createRecord('Bolsas GrainPro', qty));
        } else if (type.includes('Saco de Yute')) {
            reqs.push(createRecord('Sacos de Yute', qty));
        } else if (type.includes('Big Bag')) {
            reqs.push(createRecord('Big Bag', qty));
            const palletQty = Math.ceil(qty / 2);
            reqs.push(createRecord('Tarimas', palletQty));
        } else if (type.includes('Jumbo')) {
            reqs.push(createRecord('Jumbo', qty));
        }
        return reqs;
    };

    const getPartidaRecords = (partida: Partida): PackagingRecord[] => {
        if (partida.packagingRecords && partida.packagingRecords.length > 0) {
            return [...partida.packagingRecords];
        }
        return calculateRequirementsForPartida(partida);
    };

    const handleUpdateRecord = (partidaId: string, index: number, field: keyof PackagingRecord, value: string | number) => {
        const updatedPartidas = (Array.isArray(contract.partidas) ? contract.partidas : []).map(p => {
            if (p && p.id === partidaId) {
                let records = getPartidaRecords(p);
                records[index] = { ...records[index], [field]: value };
                return { ...p, packagingRecords: records };
            }
            return p;
        });
        onUpdate({ ...contract, partidas: updatedPartidas });
    };

    const handleAddPackagingItem = (partidaId: string) => {
        const updatedPartidas = (Array.isArray(contract.partidas) ? contract.partidas : []).map(p => {
            if (p && p.id === partidaId) {
                let records = getPartidaRecords(p);
                records.push({ itemName: 'Nuevo Material', required: 0, purchased: 0 });
                return { ...p, packagingRecords: records };
            }
            return p;
        });
        onUpdate({ ...contract, partidas: updatedPartidas });
    };

    const handleRemovePackagingItem = (partidaId: string, index: number) => {
         const updatedPartidas = (Array.isArray(contract.partidas) ? contract.partidas : []).map(p => {
            if (p && p.id === partidaId) {
                let records = getPartidaRecords(p);
                records.splice(index, 1);
                return { ...p, packagingRecords: records };
            }
            return p;
        });
        onUpdate({ ...contract, partidas: updatedPartidas });
    };

    const getStatusColor = (required: number, purchased: number) => {
        if (purchased >= required) return 'text-green-700 bg-green-100 border-green-200';
        if (purchased > 0) return 'text-yellow-700 bg-yellow-100 border-yellow-200';
        return 'text-red-700 bg-red-100 border-red-200';
    };

    const getStatusText = (required: number, purchased: number) => {
        if (purchased >= required) return 'Completado';
        if (purchased > 0) return 'Parcial';
        return 'Pendiente';
    };

    return (
        <div className="p-4 space-y-6">
            <h3 className="font-semibold text-lg mb-4">Control de Empaque por Partida</h3>
            {(Array.isArray(contract.partidas) ? contract.partidas : []).filter(p => p).map(partida => {
                const records = getPartidaRecords(partida);

                if (records.length === 0 && Number(partida.numBultos) === 0) return null;

                return (
                    <div key={partida.id} className="border border-border rounded-lg overflow-hidden shadow-sm bg-card">
                        <div className="bg-slate-100 dark:bg-slate-800/50 px-4 py-3 border-b border-border flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-red-600">{prefix}{partida.partidaNo}</span>
                                {partida.transportType === 'Air' && <PaperAirplaneIcon className="w-5 h-5 text-sky-600" />}
                                <span className="text-sm font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/50">
                                    {partida.packageType === 'Otro' ? partida.customPackageType : partida.packageType}
                                </span>
                                <span className="text-sm text-muted-foreground">({partida.numBultos} Bultos)</span>
                             </div>
                             <button 
                                onClick={() => handleAddPackagingItem(partida.id)}
                                className="text-xs flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90"
                             >
                                <PlusIcon className="w-3 h-3"/> Agregar Item
                             </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/30 text-muted-foreground border-b border-border">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium w-1/3">Material</th>
                                        <th className="px-4 py-2 text-center font-medium w-1/6">Requerido</th>
                                        <th className="px-4 py-2 text-center font-medium w-1/6">Comprado</th>
                                        <th className="px-4 py-2 text-center font-medium w-1/6">Pendiente</th>
                                        <th className="px-4 py-2 text-center font-medium w-1/6">Estado</th>
                                        <th className="px-4 py-2 text-center font-medium w-[50px]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {records.map((record, idx) => {
                                        const pending = Math.max(0, record.required - record.purchased);
                                        return (
                                            <tr key={idx} className="hover:bg-muted/20">
                                                <td className="px-4 py-2">
                                                    <input 
                                                        type="text" 
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 font-medium"
                                                        value={record.itemName}
                                                        onChange={(e) => handleUpdateRecord(partida.id, idx, 'itemName', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        className="w-20 text-center border border-input rounded-md py-1 px-2 focus:ring-2 focus:ring-primary text-sm bg-background"
                                                        value={record.required}
                                                        onChange={(e) => handleUpdateRecord(partida.id, idx, 'required', Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        className="w-20 text-center border border-input rounded-md py-1 px-2 focus:ring-2 focus:ring-primary text-sm bg-background"
                                                        value={record.purchased}
                                                        onChange={(e) => handleUpdateRecord(partida.id, idx, 'purchased', Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className={`px-4 py-2 text-center font-bold ${pending > 0 ? 'text-red-500' : 'text-green-500'}`}>{pending}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(record.required, record.purchased)}`}>
                                                        {getStatusText(record.required, record.purchased)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button 
                                                        onClick={() => handleRemovePackagingItem(partida.id, idx)}
                                                        className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10"
                                                        title="Eliminar material"
                                                    >
                                                        <TrashIcon className="w-4 h-4"/>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {records.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-4 text-muted-foreground italic text-xs">
                                                Agrega materiales manualmente.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
            {(Array.isArray(contract.partidas) ? contract.partidas : []).length === 0 && (
                 <p className="text-center text-muted-foreground py-8">No hay partidas para gestionar.</p>
            )}
        </div>
    );
};

// ... LicenseSettlementManager (unchanged) ...
const LicenseSettlementManager = ({ 
    contract, 
    payments, 
    onUpdatePayments, 
    onUpdateContract,
    buyer,
    logo,
    companyInfo
}: { 
    contract: Contract, 
    payments: LicensePayment[], 
    onUpdatePayments: React.Dispatch<React.SetStateAction<LicensePayment[]>>,
    onUpdateContract: (c: Contract) => void,
    buyer?: Buyer,
    logo: string | null,
    companyInfo: CompanyInfo
}) => {
    const [newPaymentAmount, setNewPaymentAmount] = useState<number | ''>('');
    const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [newPaymentConcept, setNewPaymentConcept] = useState('');
    const [isSummaryViewOpen, setIsSummaryViewOpen] = useState(false);

    useEffect(() => {
        if (!contract.liquidationCosts || contract.liquidationCosts.length === 0) {
             handleResetToDefaults();
        }
    }, []); 

    const handleResetToDefaults = () => {
        const partidas = Array.isArray(contract.partidas) ? contract.partidas : [];
        const totalValue = partidas.filter(p => p).reduce((sum, p) => {
             const qqs = Number(p.pesoKg || 0) / 46;
             return sum + (qqs * Number(p.finalPrice || 0));
        }, 0);
        const totalQuintales = partidas.reduce((sum, p) => sum + (Number(p.pesoKg || 0) / 46), 0);

        const defaults: LiquidationDeduction[] = [
            { id: '1', concept: 'Impuestos (2.5% Alquiler Licencia)', amount: Number((totalValue * TAX_RATE).toFixed(2)) },
            { id: '2', concept: 'Honorarios Licencia ($1.00/qq)', amount: Number((totalQuintales * 1.00).toFixed(2)) },
            { id: '3', concept: 'Costo Fitosanitario (Fijo)', amount: FITO_COST }
        ];
        
        onUpdateContract({ ...contract, liquidationCosts: defaults });
    };

    const contractPayments = useMemo(() => (Array.isArray(payments) ? payments : []).filter(p => p.contractId === contract.id), [payments, contract.id]);

    const calculations = useMemo(() => {
        const partidas = Array.isArray(contract.partidas) ? contract.partidas : [];
        
        const totalValue = partidas.filter(p => p).reduce((sum, p) => {
             const qqs = Number(p.pesoKg || 0) / 46;
             return sum + (qqs * Number(p.finalPrice || 0));
        }, 0);
        
        const costs = contract.liquidationCosts || [];
        const totalDeductions = costs.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

        const totalPaid = contractPayments.reduce((sum, p) => sum + p.amount, 0);
        const balance = totalValue - totalDeductions - totalPaid;
        
        const taxes = 0;
        const licenseFee = 0;
        const fitoCost = 0;
        
        const overpayment = balance < 0 ? Math.abs(balance) : 0;
        const extraTaxes = overpayment * TAX_RATE;

        return { totalValue, totalDeductions, totalPaid, balance, overpayment, extraTaxes, taxes, licenseFee, fitoCost };
    }, [contract, contractPayments]);

    const handleAddPayment = () => {
        if (!newPaymentAmount) return;
        const newPayment: LicensePayment = {
            id: new Date().toISOString(),
            contractId: contract.id,
            date: newPaymentDate,
            amount: Number(newPaymentAmount),
            concept: newPaymentConcept,
        };
        onUpdatePayments(prev => [...prev, newPayment]);
        setNewPaymentAmount('');
        setNewPaymentConcept('');
    };

    const handleDeletePayment = (paymentId: string) => {
        onUpdatePayments(prev => prev.filter(p => p.id !== paymentId));
    };
    
    const handleAddCost = () => {
        const newCost: LiquidationDeduction = {
            id: new Date().toISOString(),
            concept: '',
            amount: 0
        };
        const newCosts = [...(contract.liquidationCosts || []), newCost];
        onUpdateContract({ ...contract, liquidationCosts: newCosts });
    };

    const handleUpdateCost = (id: string, field: keyof LiquidationDeduction, value: string | number) => {
        const newCosts = (contract.liquidationCosts || []).map(c => 
            c.id === id ? { ...c, [field]: value } : c
        );
        onUpdateContract({ ...contract, liquidationCosts: newCosts });
    };

    const handleDeleteCost = (id: string) => {
        const newCosts = (contract.liquidationCosts || []).filter(c => c.id !== id);
        onUpdateContract({ ...contract, liquidationCosts: newCosts });
    };
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    if (isSummaryViewOpen && buyer) {
        return (
            <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
                <LiquidationSummaryView 
                    contract={contract} 
                    buyer={buyer} 
                    calculations={calculations}
                    payments={contractPayments}
                    logo={logo}
                    companyInfo={companyInfo}
                    onClose={() => {
                        if (!contract.notaAbonoGenerated) {
                            onUpdateContract({ ...contract, notaAbonoGenerated: true });
                        }
                        setIsSummaryViewOpen(false);
                    }} 
                />
            </div>
        );
    }

    return (
        <div className="p-4 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-card p-4 rounded-lg border shadow-sm"><p className="text-sm text-muted-foreground">Valor Total Contrato</p><p className="text-2xl font-bold">{formatCurrency(calculations.totalValue)}</p></div>
                <div className="bg-card p-4 rounded-lg border shadow-sm"><p className="text-sm text-muted-foreground">Total Pagado</p><p className="text-2xl font-bold text-green-500">{formatCurrency(calculations.totalPaid)}</p></div>
                <div className={`bg-card p-4 rounded-lg border shadow-sm ${calculations.balance <= 0 ? 'border-green-500 bg-green-50/10' : 'border-amber-500'}`}><p className="text-sm text-muted-foreground">Saldo Pendiente</p><p className={`text-2xl font-bold ${calculations.balance <= 0 ? 'text-green-500' : 'text-amber-500'}`}>{formatCurrency(calculations.balance)}</p></div>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h4 className="font-semibold text-sm">Cargos y Deducciones</h4>
                    <button onClick={handleResetToDefaults} className="text-xs flex items-center gap-1 text-blue-600 hover:underline" title="Recalcular impuestos y cobros base"><ArrowPathIcon className="w-3 h-3"/> Restablecer Valores Calculados</button>
                </div>
                
                <div className="space-y-2">
                    {(contract.liquidationCosts || []).map((cost) => (
                        <div key={cost.id} className="flex items-center gap-2">
                            <input 
                                type="text" 
                                className="flex-grow bg-background border border-input rounded px-2 py-1 text-sm" 
                                value={cost.concept} 
                                onChange={(e) => handleUpdateCost(cost.id, 'concept', e.target.value)}
                                placeholder="Concepto del cobro"
                            />
                            <div className="relative w-32">
                                <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">$</span>
                                <input 
                                    type="number" 
                                    className="w-full bg-background border border-input rounded pl-5 pr-2 py-1 text-sm text-right font-mono" 
                                    value={cost.amount} 
                                    onChange={(e) => handleUpdateCost(cost.id, 'amount', Number(e.target.value))}
                                    placeholder="0.00"
                                />
                            </div>
                            <button onClick={() => handleDeleteCost(cost.id)} className="p-1 text-muted-foreground hover:text-destructive"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <button onClick={handleAddCost} className="mt-2 text-sm text-primary font-medium flex items-center gap-1 hover:underline"><PlusIcon className="w-4 h-4"/> Agregar Nuevo Cargo</button>
                </div>
                <div className="mt-4 text-right border-t pt-2">
                    <span className="text-sm text-muted-foreground mr-2">Total Deducciones:</span>
                    <span className="font-bold text-red-500">{formatCurrency(calculations.totalDeductions)}</span>
                </div>
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
                <div className="bg-card p-4 rounded-lg border shadow-sm">
                    <h3 className="font-semibold mb-3 border-b pb-2">Registro de Pagos (Ingreso de Divisas)</h3>
                    <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                        {contractPayments.map(p => (
                            <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm">
                                <div className="flex flex-col">
                                    <span className="font-bold text-foreground">{formatCurrency(p.amount)} <span className="text-muted-foreground text-xs font-normal ml-1">el {p.date}</span></span>
                                    {p.concept && <span className="text-xs text-muted-foreground mt-0.5">{p.concept}</span>}
                                </div>
                                <button onClick={() => handleDeletePayment(p.id)} className="p-1 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-full"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        ))}
                        {contractPayments.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No hay pagos registrados.</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t pt-3">
                        <div className="col-span-2"><input type="text" value={newPaymentConcept} onChange={e => setNewPaymentConcept(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Concepto (Opcional)"/></div>
                        <div><input type="number" value={newPaymentAmount} onChange={e => setNewPaymentAmount(Number(e.target.value))} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Monto 0.00"/></div>
                        <div className="flex gap-2">
                            <input type="date" value={newPaymentDate} onChange={e => setNewPaymentDate(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm"/>
                            <button onClick={handleAddPayment} className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90"><PlusIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                </div>
                <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-col justify-center items-center text-center">
                    <h3 className="font-semibold mb-3">Resumen de Liquidación</h3>
                    {contract.notaAbonoGenerated ? (
                            <div className="text-green-600"><CheckCircleIcon className="w-12 h-12 mx-auto mb-2"/> <p className="font-bold">Resumen Disponible.</p><button onClick={() => setIsSummaryViewOpen(true)} className="mt-2 text-sm font-semibold text-primary hover:underline">Ver Resumen</button></div>
                    ) : calculations.balance <= 0 ? (
                        <>
                            <p className="text-sm text-muted-foreground mb-4">El contrato ha sido liquidado. Ya puedes generar el resumen final.</p>
                            <button onClick={() => setIsSummaryViewOpen(true)} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 shadow-md transition-colors">Generar Resumen</button>
                        </>
                    ) : (
                        <>
                           <p className="text-sm text-muted-foreground px-4 mb-4">Puedes ver un avance del resumen de liquidación.</p>
                           <button onClick={() => setIsSummaryViewOpen(true)} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 shadow-sm transition-colors">Ver Resumen Parcial</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ... CertificationsDisplay, WorkflowBadges (unchanged) ...
const CertificationsDisplay = ({ certifications }: { certifications?: ContractCertifications }) => {
    if (!certifications) return null;
    const activeCerts = Object.entries(certifications)
        .filter(([_, isActive]) => isActive)
        .map(([key]) => key);
    
    if (activeCerts.length === 0) return null;

    const labels: Record<string, string> = {
        rainforest: 'Rainforest Alliance',
        organic: 'Orgánico',
        fairtrade: 'Fairtrade',
        eudr: 'EUDR'
    };

    return (
        <div className="flex flex-wrap gap-2 mt-1">
            {activeCerts.map(key => (
                <span key={key} className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    {labels[key] || key}
                </span>
            ))}
        </div>
    );
};

const WorkflowBadges = ({ partida }: { partida: Partida }) => {
    const badges = [];
    if (partida.permisoEmbarqueNo) badges.push({ label: `Permiso: ${partida.permisoEmbarqueNo}`, color: 'bg-green-100 text-green-800 border-green-200' });
    if (partida.fitosanitarioNo) badges.push({ label: `Fito: ${partida.fitosanitarioNo}`, color: 'bg-teal-100 text-teal-800 border-teal-200' });

    const getShortLabel = (step: string) => {
        if(step.includes('Venta')) return 'Venta';
        if(step.includes('FOB')) return 'FOB';
        if(step.includes('Impuestos')) return 'Imp.';
        if(step.includes('Zarpe')) return 'Zarpe';
        return step;
    }

    (partida.workflow || []).forEach(step => {
        if (step.status === 'completed') {
             badges.push({ label: getShortLabel(step.label), color: 'bg-blue-100 text-blue-800 border-blue-200' });
        }
    });

    if (badges.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-2 mt-2 px-4 pb-2">
            {badges.map((badge, idx) => (
                <span key={idx} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badge.color}`}>
                    {badge.label}
                </span>
            ))}
        </div>
    );
};

// Row Action Menu Component
const PartidaActionMenu = ({ 
    partida, 
    onGenerate 
}: { 
    partida: Partida, 
    onGenerate: (type: CertificateType) => void 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-accent"
                title="Generar Documento"
            >
                <DocumentPlusIcon className="w-4 h-4"/>
            </button>
            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border">
                    <div className="py-1">
                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Generar...</div>
                        {partida.transportType === 'Maritime' && (
                            <button onClick={() => onGenerate('porte')} className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent">Carta de Porte</button>
                        )}
                        <button onClick={() => onGenerate('packing')} className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent">Lista de Empaque</button>
                        <button onClick={() => onGenerate('weight')} className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent">Certificado de Peso</button>
                        <button onClick={() => onGenerate('quality')} className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent">Certificado de Calidad</button>
                        <button onClick={() => onGenerate('invoice')} className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent">Invoice</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Custom Confirmation Modal ---
const DeleteFobModal = ({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) => (
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
                                <h3 className="text-base font-semibold leading-6 text-foreground" id="modal-title">Eliminar Informe FOB</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-muted-foreground">¿Estás seguro de que quieres eliminar este informe? Esta acción no se puede deshacer.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-muted px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <button type="button" onClick={onConfirm} className="inline-flex w-full justify-center rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground shadow-sm hover:bg-destructive/90 sm:ml-3 sm:w-auto">Eliminar</button>
                        <button type="button" onClick={onCancel} className="mt-3 inline-flex w-full justify-center rounded-md bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent sm:mt-0 sm:w-auto">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ... ContractDetailView Main Component ...
const ContractDetailView: React.FC<ContractDetailViewProps> = ({
  contract, buyers, onBack, onEditContract, onDeleteContract, onAddPartida, onEditPartida, onDeletePartida, onDuplicatePartida, onViewPartida, onUpdateContractDirectly, canEdit,
  licensePayments, setLicensePayments, logo, companyInfo, onGenerateDocumentFromPartida
}) => {
  // ... existing state ...
  const [activeTab, setActiveTab] = useState<'partidas' | 'empaque' | 'liquidaciones' | 'documentos'>('partidas');
  const [isFobModalOpen, setIsFobModalOpen] = useState(false);
  const [isFobViewOpen, setIsFobViewOpen] = useState(false);
  const [selectedFobReport, setSelectedFobReport] = useState<FobContractData | null>(null);
  const [fobReportToDelete, setFobReportToDelete] = useState<string | null>(null); // State for delete modal
  const [contracts] = useLocalStorage<Contract[]>('contracts', []); 
  
  const buyer = useMemo(() => buyers.find(b => b.name === contract.buyer), [buyers, contract.buyer]);
  const prefix = getPartidaPrefix(contract.company);

  const totalQuintales = useMemo(() => {
    const partidas = Array.isArray(contract.partidas) ? contract.partidas : [];
    // Calculate using pesoQqs if available, otherwise fallback to KG/46
    const total = partidas.filter(p => p).reduce((sum, p) => {
        const qqs = p.pesoQqs ? Number(p.pesoQqs) : (Number(p.pesoKg || 0) / 46);
        return sum + qqs;
    }, 0);
    return total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [contract.partidas]);
  
  const hasCertifications = useMemo(() => {
      if (!contract.certifications) return false;
      return Object.values(contract.certifications).some(val => val === true);
  }, [contract.certifications]);

  const openPdf = (pdf: Contract['contractPdf']) => {
    if (pdf) {
      if (pdf.url) {
          // Handle Firebase Storage URL
          window.open(pdf.url, '_blank');
      } else if (pdf.data) {
          // Handle Legacy Base64
          const byteCharacters = atob(pdf.data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: pdf.type });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
      } else {
          alert("El archivo no se puede abrir.");
      }
    }
  };

  // ... Fob Handlers ...
  const handleCreateFobReport = () => { setSelectedFobReport(null); setIsFobModalOpen(true); };
  const handleEditFobReport = (report: FobContractData) => { setSelectedFobReport(report); setIsFobModalOpen(true); };
  const handleViewFobReport = (report: FobContractData) => { setSelectedFobReport(report); setIsFobViewOpen(true); };
  
  // Replaced confirm() with modal state
  const handleDeleteFobReport = (id?: string) => {
      if (!id) return;
      setFobReportToDelete(id);
  };

  const confirmDeleteFobReport = () => {
      if (!fobReportToDelete) return;
      let history = contract.fobContracts ? [...contract.fobContracts] : [];
      if (history.length === 0 && contract.fobContractData) { history.push({...contract.fobContractData, id: 'legacy'}); }
      const newHistory = history.filter(r => r.id !== fobReportToDelete && r.reportNo !== fobReportToDelete); 
      onUpdateContractDirectly({ ...contract, fobContracts: newHistory });
      setFobReportToDelete(null);
  };

  const handleDuplicateFobReport = (report: FobContractData) => {
       const { id, reportNo, ...rest } = report;
       setSelectedFobReport({ ...rest, reportNo: '', id: undefined } as FobContractData);
       setIsFobModalOpen(true);
  };
  
  // Updated Status Components with Animations
  const FijacionStatus: React.FC<{partida: Partida}> = ({partida}) => {
    if(partida.fijacion) {
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/50 px-2 py-1 text-xs font-bold text-green-700 dark:text-green-300 shadow-sm">+{Number(partida.fijacion).toFixed(2)}</span>
    }
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/50 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Pendiente
        </span>
    );
  };

  const ISFStatus: React.FC<{partida: Partida}> = ({partida}) => {
      if (!partida.isfRequerido) return <span className="text-xs text-gray-400">N/A</span>;
      if (partida.isfEnviado) return <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Enviado</span>;
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Pendiente
        </span>
      );
  };

  const InfoItem: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
    <div className={className}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="font-semibold text-foreground">{value || '-'}</div>
    </div>
  );

  const formatDate = (dateString?: string) => {
      if (!dateString) return '-';
      return new Date(dateString + 'T00:00:00').toLocaleDateString('es-GT');
  };

  const formatCurrency = (val: number | string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val));
  
  // ... Save Fob Handler (unchanged) ...
  const handleSaveFobData = (data: FobContractData) => {
      let history = contract.fobContracts ? [...contract.fobContracts] : [];
      if (history.length === 0 && contract.fobContractData) { history.push({ ...contract.fobContractData, id: 'legacy-' + new Date().getTime() }); }
      if (data.id) {
          const index = history.findIndex(h => h.id === data.id);
          if (index >= 0) { history[index] = data; }
      } else {
          const newRecord = { ...data, id: new Date().toISOString() };
          history.push(newRecord);
      }
      onUpdateContractDirectly({ ...contract, fobContracts: history, fobContractData: data });
      setIsFobModalOpen(false);
  };

  const allFobReports = useMemo(() => {
      let history = contract.fobContracts ? [...contract.fobContracts] : [];
      if (history.length === 0 && contract.fobContractData) { history.push({ ...contract.fobContractData, id: 'legacy-item' }); }
      return history.filter(h => h).sort((a, b) => (b.reportNo || '').localeCompare(a.reportNo || ''));
  }, [contract]);

  return (
    <div>
      {/* Delete Modal */}
      {fobReportToDelete && (
          <DeleteFobModal 
            onConfirm={confirmDeleteFobReport} 
            onCancel={() => setFobReportToDelete(null)} 
          />
      )}

      {isFobModalOpen && (
          <FobContractModal 
            isOpen={isFobModalOpen} 
            onClose={() => { setIsFobModalOpen(false); setSelectedFobReport(null); }} 
            contract={contract} 
            contracts={contracts}
            buyers={buyers} 
            onSaveData={handleSaveFobData}
            initialData={selectedFobReport || undefined}
          />
      )}
      
      {isFobViewOpen && selectedFobReport && buyer && (
          <FobContractViewModal
            isOpen={isFobViewOpen}
            onClose={() => { setIsFobViewOpen(false); setSelectedFobReport(null); }}
            contract={contract}
            buyer={buyer}
            data={selectedFobReport}
            companyInfo={companyInfo}
          />
      )}
      
      {/* ... Header and Contract Info Section (Unchanged) ... */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="w-5 h-5" /> Volver a Contratos
        </button>
      </div>

      <div className="bg-card p-6 rounded-lg border shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold text-red-500">Contrato: {contract.contractNumber}</h1>
            <p className="text-lg font-semibold text-foreground">{contract.buyer}</p>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button type="button" onClick={() => onEditContract(contract)} className="px-3 py-1.5 text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-input shadow-sm">Editar</button>
              <button type="button" onClick={() => onDeleteContract(contract.id)} className="px-3 py-1.5 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-sm">Eliminar</button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-4 gap-x-6 pt-4 pb-4">
          <InfoItem label="Exportadora" value={contract.company === 'dizano' ? 'Dizano, S.A.' : 'Proben, S.A.'} />
          <InfoItem label="Fecha Venta" value={contract.saleDate} />
          <InfoItem label="Cantidad Total qqs." value={totalQuintales} />
          <InfoItem label="Diferencial" value={contract.differential} />
          <InfoItem label="Tipo de Café" value={<span className="font-bold text-green-500">{contract.coffeeType}</span>} />
          <InfoItem label="Posición (Mes)" value={contract.marketMonth} />
          <InfoItem label="Mes Embarque" value={contract.shipmentMonth} />
          {hasCertifications && <InfoItem label="Certificaciones" value={<CertificationsDisplay certifications={contract.certifications} />} className="col-span-2"/>}
          <InfoItem label="Contrato Terminado" value={contract.isTerminated ? 'Sí' : 'No'} className={contract.isTerminated ? 'text-green-500 font-bold' : ''}/>
        </div>
        <div className="flex gap-4 pt-4 border-t">
          {contract.contractPdf && <button onClick={() => openPdf(contract.contractPdf)} className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent">Ver PDF Contrato</button>}
          {contract.instructionsPdf && <button onClick={() => openPdf(contract.instructionsPdf)} className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent">Ver PDF Instrucciones</button>}
        </div>
      </div>
      
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="border-b">
          <nav className="flex space-x-2 p-4 overflow-x-auto">
            <button onClick={() => setActiveTab('partidas')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'partidas' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}>
                <QueueListIcon className="w-4 h-4" />
                Partidas
            </button>
            <button onClick={() => setActiveTab('empaque')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'empaque' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}>
                <CubeIcon className="w-4 h-4" />
                Gestión de Empaque
            </button>
             <button onClick={() => setActiveTab('documentos')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'documentos' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}>
                <FileTextIcon className="w-4 h-4" />
                Documentos FOB
            </button>
            {contract.isLicenseRental && (
                <button onClick={() => setActiveTab('liquidaciones')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'liquidaciones' ? 'bg-green-600 text-white shadow-sm' : 'hover:bg-green-50 text-green-700'}`}>
                    <BanknotesIcon className="w-4 h-4" />
                    Liquidaciones
                </button>
            )}
          </nav>
        </div>
        
        {activeTab === 'partidas' && (
          <div>
            <div className="p-4 flex justify-between items-center">
              <h3 className="font-semibold">Listado de Partidas</h3>
              {canEdit && <button onClick={onAddPartida} className="inline-flex items-center gap-2 text-sm font-semibold bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700"><PlusIcon className="w-4 h-4"/>Agregar Partida</button>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/50 text-muted-foreground uppercase font-medium text-xs border-b border-border">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Partida</th>
                    <th className="px-4 py-3">Bultos</th>
                    <th className="px-4 py-3">Empaque</th>
                    <th className="px-4 py-3">Peso qqs.</th>
                    <th className="px-4 py-3">Fijación</th>
                    <th className="px-4 py-3">Precio Final</th>
                    <th className="px-4 py-3">Booking</th>
                    <th className="px-4 py-3">Cut Off</th>
                    <th className="px-4 py-3">Destino</th>
                    <th className="px-4 py-3">ISF</th>
                    <th className="px-4 py-3">Contenedor</th>
                    <th className="px-4 py-3 rounded-tr-lg text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(Array.isArray(contract.partidas) ? contract.partidas : []).filter(p => p).map(p => {
                      const isCutOffPassed = p.cutOffPort ? new Date(p.cutOffPort) < new Date() : false;
                      return (
                    <React.Fragment key={p.id}>
                      <tr onClick={() => onViewPartida(p)} className="hover:bg-muted/50 cursor-pointer transition-colors relative border-t group">
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-red-500">{prefix}{p.partidaNo}</span>
                                {p.transportType === 'Air' && (
                                    <span className="inline-flex items-center rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-800 border border-sky-200" title="Envío Aéreo">
                                        <PaperAirplaneIcon className="w-3 h-3 mr-1"/>AÉREO
                                    </span>
                                )}
                            </div>
                        </td>
                        <td className="px-4 py-3">{p.numBultos}</td>
                        <td className="px-4 py-3 font-semibold text-amber-600">{p.packageType === 'Otro' ? p.customPackageType : p.packageType}</td>
                        <td className="px-4 py-3">{p.pesoQqs ? Number(p.pesoQqs).toFixed(2) : (Number(p.pesoKg) / 46).toFixed(2)}</td>
                        <td className="px-4 py-3"><FijacionStatus partida={p} /></td>
                        <td className="px-4 py-3 font-bold text-foreground">{p.finalPrice ? formatCurrency(p.finalPrice) : '-'}</td>
                        <td className="px-4 py-3"><ShippingLineBadge name={p.naviera === 'Otro' ? p.customNaviera : p.naviera} booking={p.booking} /></td>
                        <td className={`px-4 py-3 font-medium ${isCutOffPassed ? 'text-red-500' : 'text-muted-foreground'}`}>{formatDate(p.cutOffPort)}</td>
                        <td className="px-4 py-3 text-xs max-w-[120px] truncate text-muted-foreground" title={p.destino}>{p.destino || '-'}</td>
                        <td className="px-4 py-3"><ISFStatus partida={p} /></td>
                        <td className="px-4 py-3">
                            <div className="flex flex-col">
                                <span className="font-medium">{p.containerNo || '-'}</span>
                                {p.sealNo && <span className="text-xs text-muted-foreground">{p.sealNo}</span>}
                            </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canEdit && <div className="flex gap-2 justify-end relative z-10">
                              {/* NEW: Document Generation Menu */}
                              {onGenerateDocumentFromPartida && (
                                  <PartidaActionMenu partida={p} onGenerate={(type) => onGenerateDocumentFromPartida(p, type)} />
                              )}
                              
                              <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onDuplicatePartida(p); }}
                                  className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full"
                                  title="Duplicar Partida"
                              >
                                  <DocumentDuplicateIcon className="w-4 h-4 text-blue-500"/>
                              </button>
                              <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onEditPartida(p); }}
                                  className="p-1.5 hover:bg-accent rounded-full"
                                  title="Editar Partida"
                              >
                                  <PencilIcon className="w-4 h-4 text-muted-foreground hover:text-primary"/>
                              </button>
                              <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onDeletePartida(p.id); }}
                                  className="p-1.5 hover:bg-destructive/10 rounded-full"
                                  title="Eliminar Partida"
                              >
                                  <TrashIcon className="w-4 h-4 text-muted-foreground hover:text-destructive"/>
                              </button>
                          </div>}
                        </td>
                      </tr>
                      <tr onClick={() => onViewPartida(p)} className="hover:bg-muted/50 cursor-pointer transition-colors">
                          <td colSpan={12} className="px-0 pb-2 pt-0 border-b">
                              <WorkflowBadges partida={p} />
                          </td>
                      </tr>
                    </React.Fragment>
                  )})}
                </tbody>
              </table>
              {(Array.isArray(contract.partidas) ? contract.partidas : []).length === 0 && <p className="text-center text-muted-foreground py-8">No hay partidas agregadas a este contrato.</p>}
            </div>
          </div>
        )}
        
        {/* ... Other tabs content (unchanged) ... */}
        {activeTab === 'empaque' && <PackagingManager contract={contract} onUpdate={onUpdateContractDirectly} />}
        {activeTab === 'documentos' && (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-semibold">Informes de Venta (FOB Contracts)</h3>
                        <p className="text-sm text-muted-foreground">Historial de contratos generados.</p>
                    </div>
                    <button onClick={handleCreateFobReport} className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md shadow hover:bg-primary/90 flex items-center gap-2">
                        <PlusIcon className="w-5 h-5" />Generar Nuevo Informe
                    </button>
                </div>
                {allFobReports.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden bg-card">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Informe No.</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Cantidad</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Precio</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {allFobReports.map((report, idx) => (
                                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-bold text-primary">{report.reportNo}</td>
                                        <td className="px-4 py-3">{formatDate(report.date)}</td>
                                        <td className="px-4 py-3">{report.quantityText}</td>
                                        <td className="px-4 py-3 font-medium">{formatCurrency(report.price)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleViewFobReport(report)} className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-accent" title="Ver PDF"><EyeIcon className="w-4 h-4"/></button>
                                                <button onClick={() => handleDuplicateFobReport(report)} className="p-1.5 text-muted-foreground hover:text-blue-500 rounded-md hover:bg-blue-50" title="Copiar"><DocumentDuplicateIcon className="w-4 h-4"/></button>
                                                <button onClick={() => handleEditFobReport(report)} className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-accent" title="Editar"><PencilIcon className="w-4 h-4"/></button>
                                                <button onClick={() => handleDeleteFobReport(report.id || report.reportNo)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10" title="Eliminar"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <FileTextIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No hay informes generados aún.</p>
                        <button onClick={handleCreateFobReport} className="mt-2 text-primary font-medium hover:underline">Crear el primer informe</button>
                    </div>
                )}
            </div>
        )}
        {activeTab === 'liquidaciones' && contract.isLicenseRental && (
            <LicenseSettlementManager contract={contract} payments={licensePayments || []} onUpdatePayments={setLicensePayments} onUpdateContract={onUpdateContractDirectly} buyer={buyer} logo={logo} companyInfo={companyInfo} />
        )}
      </div>
    </div>
  );
};

export default ContractDetailView;
