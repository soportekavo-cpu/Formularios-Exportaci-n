
import React, { useState, useMemo, useEffect } from 'react';
import type { Contract } from '../types';
import { PlusIcon, ShipIcon, PencilIcon, TrashIcon, EyeIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';
import { getHarvestYear } from '../utils/companyData';

interface ShipmentDashboardProps {
  contracts: Contract[];
  onViewContract: (id: string) => void;
  onAddContract: (harvestYear?: string) => void;
  onEditContract: (contract: Contract) => void;
  onDeleteContract: (id: string) => void;
  canEdit: boolean;
}

type SortKey = 'saleDate' | 'contractNumber' | 'buyer' | 'coffeeType' | 'totalQqs';

const ShipmentDashboard: React.FC<ShipmentDashboardProps> = ({ contracts, onViewContract, onAddContract, onEditContract, onDeleteContract, canEdit }) => {
    const [showActiveOnly, setShowActiveOnly] = useState(true);
    const [selectedHarvest, setSelectedHarvest] = useState<string>('');
    
    // Sorting state
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
        key: 'saleDate',
        direction: 'desc',
    });

    // Calculate available harvest years
    const availableHarvests = useMemo(() => {
        const years = new Set<string>();
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); 
        const baseYear = currentMonth >= 9 ? currentYear : currentYear - 1;

        years.add(`${baseYear - 1}-${baseYear}`);
        years.add(`${baseYear}-${baseYear + 1}`);
        years.add(`${baseYear + 1}-${baseYear + 2}`);
        
        contracts.forEach(c => {
            const harvest = c.harvestYear || getHarvestYear(c.saleDate || c.creationDate);
            if (harvest) years.add(harvest);
        });

        return Array.from(years).sort().reverse();
    }, [contracts]);

    useEffect(() => {
        if (!selectedHarvest) {
            const currentHarvest = getHarvestYear(new Date().toISOString().split('T')[0]);
            if (availableHarvests.includes(currentHarvest)) {
                setSelectedHarvest(currentHarvest);
            } else if (availableHarvests.length > 0) {
                setSelectedHarvest(availableHarvests[0]);
            }
        }
    }, [availableHarvests, selectedHarvest]);
    
    const calculateTotalQuintales = (partidas: Contract['partidas']) => {
        const safePartidas = Array.isArray(partidas) ? partidas : [];
        return safePartidas.filter(p => p).reduce((sum, p) => sum + Number(p.quintales || 0), 0);
    };

    const handleSort = (key: SortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredAndSortedContracts = useMemo(() => {
        // 1. Filter
        let result = contracts.filter(c => {
            const cHarvest = c.harvestYear || getHarvestYear(c.saleDate || c.creationDate);
            const matchesHarvest = cHarvest === selectedHarvest;
            const matchesStatus = showActiveOnly ? !c.isTerminated : true;
            return matchesHarvest && matchesStatus;
        });

        // 2. Sort
        result.sort((a, b) => {
            let aValue: any = '';
            let bValue: any = '';

            switch (sortConfig.key) {
                case 'saleDate':
                    aValue = new Date(a.saleDate || a.creationDate).getTime();
                    bValue = new Date(b.saleDate || b.creationDate).getTime();
                    break;
                case 'contractNumber':
                    aValue = a.contractNumber || '';
                    bValue = b.contractNumber || '';
                    break;
                case 'buyer':
                    aValue = a.buyer || '';
                    bValue = b.buyer || '';
                    break;
                case 'coffeeType':
                    aValue = a.coffeeType || '';
                    bValue = b.coffeeType || '';
                    break;
                case 'totalQqs':
                    aValue = calculateTotalQuintales(a.partidas);
                    bValue = calculateTotalQuintales(b.partidas);
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [contracts, selectedHarvest, showActiveOnly, sortConfig]);

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortConfig.key !== column) return <span className="ml-1 opacity-20">⇅</span>;
        return sortConfig.direction === 'asc' ? <ArrowUpIcon className="w-3 h-3 ml-1 inline" /> : <ArrowDownIcon className="w-3 h-3 ml-1 inline" />;
    };

    return (
        <div className="bg-background text-foreground min-h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h1 className="text-3xl font-bold">Contratos</h1>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center bg-card border rounded-md px-3 py-1.5 shadow-sm">
                        <label htmlFor="harvest-select" className="text-sm font-medium mr-2 text-muted-foreground">Cosecha:</label>
                        <select 
                            id="harvest-select" 
                            value={selectedHarvest} 
                            onChange={(e) => setSelectedHarvest(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer"
                        >
                            {availableHarvests.map(h => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>
                    </div>

                    <button 
                        onClick={() => setShowActiveOnly(!showActiveOnly)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${showActiveOnly ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-card text-muted-foreground hover:bg-accent'}`}
                    >
                        {showActiveOnly ? 'Ver Solo Activos' : 'Ver Todos'}
                    </button>

                    {canEdit && (
                        <button onClick={() => onAddContract(selectedHarvest)} type="button" className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
                            <PlusIcon className="w-5 h-5"/>
                            Nuevo Contrato
                        </button>
                    )}
                </div>
            </div>
            
            {filteredAndSortedContracts.length > 0 ? (
                <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground border-b font-medium uppercase">
                                <tr>
                                    <th className="px-6 py-3 cursor-pointer hover:text-foreground hover:bg-muted/80 transition-colors" onClick={() => handleSort('saleDate')}>
                                        Fecha Venta <SortIcon column="saleDate" />
                                    </th>
                                    <th className="px-6 py-3 cursor-pointer hover:text-foreground hover:bg-muted/80 transition-colors" onClick={() => handleSort('contractNumber')}>
                                        No. Contrato <SortIcon column="contractNumber" />
                                    </th>
                                    <th className="px-6 py-3 cursor-pointer hover:text-foreground hover:bg-muted/80 transition-colors" onClick={() => handleSort('buyer')}>
                                        Comprador <SortIcon column="buyer" />
                                    </th>
                                    <th className="px-6 py-3 cursor-pointer hover:text-foreground hover:bg-muted/80 transition-colors" onClick={() => handleSort('coffeeType')}>
                                        Tipo Café <SortIcon column="coffeeType" />
                                    </th>
                                    <th className="px-6 py-3 text-center">Partidas</th>
                                    <th className="px-6 py-3 text-right cursor-pointer hover:text-foreground hover:bg-muted/80 transition-colors" onClick={() => handleSort('totalQqs')}>
                                        Total qqs. <SortIcon column="totalQqs" />
                                    </th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredAndSortedContracts.map(contract => (
                                    <tr key={contract.id} onClick={() => onViewContract(contract.id)} className="hover:bg-muted/30 cursor-pointer transition-colors group">
                                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                            {new Date(contract.saleDate || contract.creationDate).toLocaleDateString('es-GT')}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-red-600 whitespace-nowrap">
                                            {contract.contractNumber}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-blue-600">
                                            {contract.buyer}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-green-600">
                                            {contract.coffeeType}
                                        </td>
                                        <td className="px-6 py-4 text-center text-muted-foreground">
                                            {(Array.isArray(contract.partidas) ? contract.partidas : []).length}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-foreground">
                                            {calculateTotalQuintales(contract.partidas).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onViewContract(contract.id); }}
                                                    className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-accent"
                                                    title="Ver Detalle"
                                                >
                                                    <EyeIcon className="w-4 h-4"/>
                                                </button>
                                                {canEdit && (
                                                    <>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onEditContract(contract); }}
                                                            className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-accent"
                                                            title="Editar"
                                                        >
                                                            <PencilIcon className="w-4 h-4"/>
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onDeleteContract(contract.id); }}
                                                            className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 relative z-10"
                                                            title="Eliminar"
                                                        >
                                                            <TrashIcon className="w-4 h-4"/>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center h-64 bg-muted/10 border-2 border-dashed border-muted rounded-lg text-center">
                    <ShipIcon className="h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-sm font-semibold text-foreground">No se encontraron contratos</h3>
                    <p className="text-sm text-muted-foreground mt-1">No hay contratos para la cosecha {selectedHarvest} con el filtro seleccionado.</p>
                    {canEdit && (
                        <button onClick={() => onAddContract(selectedHarvest)} className="mt-4 text-primary font-medium hover:underline">
                            Crear contrato para esta cosecha
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ShipmentDashboard;
