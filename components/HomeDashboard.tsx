

import React, { useMemo } from 'react';
import { ShipIcon, FileTextIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon, CubeIcon } from './Icons';
import type { Contract, Shipment, Certificate, PackagingRecord, CertificateType } from '../types';

interface HomeDashboardProps {
    contracts: Contract[];
    shipments: Shipment[];
    certificates: Certificate[];
    alerts: any[];
    activeCompany: string;
    // Navigation props
    setPage: (page: any) => void;
    setView: (view: any) => void;
    setViewingContractId: (id: string | null) => void;
    setActiveCertType: (type: CertificateType) => void;
}

const getPartidaPrefix = (company: string) => {
    return company === 'dizano' ? '11/988/' : '11/44360/';
};

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, triangleColor, onClick }: any) => (
    <div 
        onClick={onClick}
        className="group relative overflow-hidden rounded-xl bg-white dark:bg-card border border-border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02]"
    >
        {/* Decorative Left Border */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass.replace('text-', 'bg-')}`}></div>
        
        {/* Minimalist Triangle Alert */}
        <svg className={`absolute top-0 right-0 h-12 w-12 transform translate-x-4 -translate-y-4 ${triangleColor || 'text-transparent'}`} viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 0 L100 0 L100 100 Z" fill="currentColor" />
        </svg>

        <div className="p-6 flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
                <h3 className="text-3xl font-bold mt-2 text-foreground">{value}</h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{subtext}</p>
            </div>
            <div className={`p-3 rounded-full bg-opacity-10 ${colorClass.replace('text-', 'bg-')} ${colorClass}`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    </div>
);

const ProgressBar = ({ current, total, color = 'bg-blue-600' }: { current: number, total: number, color?: string }) => {
    const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
            <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

interface GroupedPartidaItem {
    contractId: string;
    contractNo: string;
    partidaId: string;
    partidaNo: string;
    items: Array<{ material: string; missing: number; required: number; purchased: number }>;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ contracts, shipments, certificates, alerts, activeCompany, setPage, setView, setViewingContractId, setActiveCertType }) => {
    
    // Calculate Stats
    const activeContracts = contracts.filter(c => !c.isTerminated && c.company === activeCompany);
    const totalQuintales = activeContracts.reduce((sum, c) => {
        return sum + (c.partidas || []).reduce((pSum, p) => pSum + (Number(p.pesoKg || 0) / 46), 0);
    }, 0);

    const activeShipmentsCount = shipments.filter(s => s.company === activeCompany && s.status !== 'completed').length;
    
    // --- PACKAGING LOGIC ---
    // Calculates what is required vs purchased for ALL active partidas
    const packagingData = useMemo(() => {
        const groupedItems: Record<string, GroupedPartidaItem> = {};

        const summary = {
            sacos: { req: 0, bought: 0 },
            grainpro: { req: 0, bought: 0 },
            bigbag: { req: 0, bought: 0 },
            jumbo: { req: 0, bought: 0 },
            totalItemsMissing: 0
        };

        activeContracts.forEach(contract => {
            (contract.partidas || []).forEach(partida => {
                let records: PackagingRecord[] = [];
                
                // Use existing records or calculate defaults if empty
                if (partida.packagingRecords && partida.packagingRecords.length > 0) {
                    records = partida.packagingRecords;
                } else {
                    // Simple default calculation based on type
                    const qty = Number(partida.numBultos || 0);
                    const type = String(partida.packageType || '');
                    if (qty > 0) {
                        if (type.includes('Saco') && type.includes('GrainPro')) {
                            records.push({ itemName: 'Sacos de Yute', required: qty, purchased: 0 });
                            records.push({ itemName: 'Bolsas GrainPro', required: qty, purchased: 0 });
                        } else if (type.includes('Saco')) {
                            records.push({ itemName: 'Sacos de Yute', required: qty, purchased: 0 });
                        } else if (type.includes('Big Bag')) {
                            records.push({ itemName: 'Big Bag', required: qty, purchased: 0 });
                        } else if (type.includes('Jumbo')) {
                            records.push({ itemName: 'Jumbo', required: qty, purchased: 0 });
                        }
                    }
                }

                records.forEach(rec => {
                    const missing = Math.max(0, rec.required - rec.purchased);
                    
                    // Update Summary
                    const nameLower = rec.itemName.toLowerCase();
                    if (nameLower.includes('saco')) { summary.sacos.req += rec.required; summary.sacos.bought += rec.purchased; }
                    else if (nameLower.includes('grainpro')) { summary.grainpro.req += rec.required; summary.grainpro.bought += rec.purchased; }
                    else if (nameLower.includes('big')) { summary.bigbag.req += rec.required; summary.bigbag.bought += rec.purchased; }
                    else if (nameLower.includes('jumbo')) { summary.jumbo.req += rec.required; summary.jumbo.bought += rec.purchased; }

                    if (missing > 0) {
                        summary.totalItemsMissing += missing;
                        
                        const groupKey = `${contract.id}-${partida.id}`;
                        if (!groupedItems[groupKey]) {
                            groupedItems[groupKey] = {
                                contractId: contract.id,
                                contractNo: contract.contractNumber,
                                partidaId: partida.id,
                                partidaNo: getPartidaPrefix(activeCompany) + partida.partidaNo,
                                items: []
                            };
                        }
                        
                        groupedItems[groupKey].items.push({
                            material: rec.itemName,
                            required: rec.required,
                            purchased: rec.purchased,
                            missing: missing
                        });
                    }
                });
            });
        });

        return { missingPartidas: Object.values(groupedItems), summary };
    }, [activeContracts, activeCompany]);

    const recentDocs = certificates
        .filter(c => c.company === activeCompany)
        .sort((a, b) => new Date(b.certificateDate).getTime() - new Date(a.certificateDate).getTime())
        .slice(0, 5);

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Centro de Comando</h1>
                <p className="text-muted-foreground mt-1">Visión global de operaciones para <span className="font-semibold text-foreground">{activeCompany === 'dizano' ? 'Dizano, S.A.' : 'Proben, S.A.'}</span></p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Contratos Activos" 
                    value={activeContracts.length} 
                    subtext={`${totalQuintales.toFixed(2)} qqs. pendientes`} 
                    icon={FileTextIcon} 
                    colorClass="text-blue-600"
                    onClick={() => { setPage('shipments'); setViewingContractId(null); }}
                />
                <StatCard 
                    title="Embarques en Curso" 
                    value={activeShipmentsCount} 
                    subtext="En tránsito o planificación" 
                    icon={ShipIcon} 
                    colorClass="text-indigo-600"
                    onClick={() => { setPage('shipments'); setViewingContractId(null); }}
                />
                <StatCard 
                    title="Alertas Activas" 
                    value={alerts.length} 
                    subtext="Requieren atención" 
                    icon={ExclamationTriangleIcon} 
                    colorClass="text-amber-500"
                    triangleColor={alerts.length > 0 ? "text-amber-500/20" : undefined}
                    onClick={() => { /* Scroll or filter */ }}
                />
                <StatCard 
                    title="Docs. Este Mes" 
                    value={certificates.filter(c => c.company === activeCompany && new Date(c.certificateDate).getMonth() === new Date().getMonth()).length} 
                    subtext="Generados exitosamente" 
                    icon={CheckCircleIcon} 
                    colorClass="text-emerald-600"
                    onClick={() => { setPage('documents'); setView('list'); setActiveCertType('weight'); }}
                />
            </div>

            {/* Packaging Procurement Section */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* Packaging Detailed List */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <CubeIcon className="w-5 h-5 text-amber-600" />
                                    Gestión de Abastecimiento de Empaque
                                </h3>
                                <p className="text-sm text-muted-foreground">Materiales pendientes de compra por partida.</p>
                            </div>
                            <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200">
                                {packagingData.missingPartidas.length} Partidas Incompletas
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                    <tr>
                                        <th className="px-6 py-3">Contrato / Partida</th>
                                        <th className="px-6 py-3">Materiales Pendientes</th>
                                        <th className="px-6 py-3 text-right">Faltante Total</th>
                                        <th className="px-6 py-3 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {packagingData.missingPartidas.length > 0 ? (
                                        packagingData.missingPartidas.map((item) => (
                                            <tr 
                                                key={item.partidaId} 
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                                                onClick={() => { setPage('shipments'); setViewingContractId(item.contractId); }}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-foreground">{item.contractNo}</div>
                                                    <div className="text-xs text-muted-foreground">{item.partidaNo}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        {item.items.map((mat, idx) => (
                                                            <div key={idx} className="flex justify-between text-xs">
                                                                <span className="font-medium text-amber-700 dark:text-amber-400">{mat.material}</span>
                                                                <span className="text-muted-foreground">({mat.purchased}/{mat.required})</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-red-600">
                                                    -{item.items.reduce((sum, i) => sum + i.missing, 0)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 uppercase tracking-wide">
                                                        Pendiente
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                                <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-3 opacity-50" />
                                                <p>Todo el material de empaque ha sido comprado.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Packaging Summary Side Card */}
                <div className="space-y-6">
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                        <h3 className="font-semibold mb-6">Resumen Global de Inventario</h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Sacos de Yute</span>
                                    <span className="font-medium">{packagingData.summary.sacos.bought} / {packagingData.summary.sacos.req}</span>
                                </div>
                                <ProgressBar current={packagingData.summary.sacos.bought} total={packagingData.summary.sacos.req} color="bg-amber-600" />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Bolsas GrainPro</span>
                                    <span className="font-medium">{packagingData.summary.grainpro.bought} / {packagingData.summary.grainpro.req}</span>
                                </div>
                                <ProgressBar current={packagingData.summary.grainpro.bought} total={packagingData.summary.grainpro.req} color="bg-green-600" />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Big Bags</span>
                                    <span className="font-medium">{packagingData.summary.bigbag.bought} / {packagingData.summary.bigbag.req}</span>
                                </div>
                                <ProgressBar current={packagingData.summary.bigbag.bought} total={packagingData.summary.bigbag.req} color="bg-blue-600" />
                            </div>
                            {/* Jumbo Section - Only show if required > 0 */}
                            {packagingData.summary.jumbo.req > 0 && (
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-muted-foreground">Jumbos</span>
                                        <span className="font-medium">{packagingData.summary.jumbo.bought} / {packagingData.summary.jumbo.req}</span>
                                    </div>
                                    <ProgressBar current={packagingData.summary.jumbo.bought} total={packagingData.summary.jumbo.req} color="bg-purple-600" />
                                </div>
                            )}
                        </div>
                        <div className="mt-8 pt-6 border-t border-border">
                            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-lg">
                                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                                <div>
                                    <p className="text-xs font-bold text-red-800 dark:text-red-300 uppercase">Faltante Total</p>
                                    <p className="text-lg font-bold text-red-700 dark:text-red-400">{packagingData.summary.totalItemsMissing} Unidades</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alerts Card */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                        <div className="p-4 bg-muted/30 border-b border-border">
                            <h3 className="font-semibold text-sm">Próximos Vencimientos</h3>
                        </div>
                        <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                            {alerts.slice(0, 5).map(alert => (
                                <div key={alert.id} onClick={() => { setPage('shipments'); setViewingContractId(alert.contractId); }} className="p-3 hover:bg-accent cursor-pointer transition-colors flex gap-3">
                                    <div className={`mt-1 p-1.5 rounded-full bg-opacity-20 flex-shrink-0 ${alert.daysRemaining <= 3 ? 'bg-red-500 text-red-600' : 'bg-amber-500 text-amber-600'}`}>
                                        <ClockIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{alert.type === 'cutoff' ? 'Cut Off Puerto' : 'Alerta'}</p>
                                        <p className="text-xs text-muted-foreground mb-1">{alert.contractNo} - {alert.partidaNo}</p>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${alert.daysRemaining <= 2 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {alert.daysRemaining < 0 ? 'VENCIDO' : `${alert.daysRemaining} días restantes`}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {alerts.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No hay alertas pendientes.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeDashboard;