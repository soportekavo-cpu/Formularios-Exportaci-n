import React, { useMemo, useState } from 'react';
import { ShipIcon, FileTextIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon, CubeIcon, ChevronDownIcon } from './Icons';
import type { Contract, Shipment, Certificate, PackagingRecord, CertificateType } from '../types';

interface HomeDashboardProps {
    contracts: Contract[];
    shipments: Shipment[];
    certificates: Certificate[];
    alerts: any[];
    activeCompany: string;
    setPage: (page: any) => void;
    setView: (view: any) => void;
    setViewingContractId: (id: string | null) => void;
    setActiveCertType: (type: CertificateType) => void;
    onNavigateToContract: (contractId: string, tab: 'partidas' | 'empaque' | 'liquidaciones' | 'documentos') => void;
}

const getPartidaPrefix = (company: string) => {
    return company === 'dizano' ? '11/988/' : '11/44360/';
};

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, triangleColor, onClick }: any) => (
    <div 
        onClick={onClick}
        className="group relative overflow-hidden rounded-xl bg-white dark:bg-card border border-border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02]"
    >
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass.replace('text-', 'bg-')}`}></div>
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

const InventoryMetric = ({ label, current, total, colorClass }: { label: string, current: number, total: number, colorClass: string }) => {
    const percent = total > 0 ? Math.round((current / total) * 100) : 100;
    const isComplete = current >= total;

    return (
        <div className="flex flex-col p-4 bg-muted/20 rounded-lg border border-border">
            <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
                <span className={`text-xs font-bold ${isComplete ? 'text-green-600' : 'text-amber-600'}`}>
                    {percent}%
                </span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold text-foreground">{current}</span>
                <span className="text-xs text-muted-foreground">/ {total}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : colorClass}`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
};

const ContractPackagingRow: React.FC<{ contractData: any, onClick: () => void, prefix: string, onDetailClick: () => void }> = ({ contractData, onClick, prefix, onDetailClick }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border border-border rounded-lg bg-card overflow-hidden transition-all duration-200 hover:shadow-sm">
            <div 
                className="p-4 flex items-center justify-between cursor-pointer bg-white dark:bg-card hover:bg-muted/30"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${contractData.missingTotal > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        <CubeIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground flex items-center gap-2">
                            Contrato {contractData.contractNo}
                            {contractData.missingTotal > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                    Faltan {contractData.missingTotal} Items
                                </span>
                            )}
                        </h4>
                        <p className="text-xs text-muted-foreground">{contractData.buyer}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">Partidas</p>
                        <p className="text-sm font-semibold">{contractData.partidas.length}</p>
                    </div>
                    <button className={`p-1 rounded-full hover:bg-muted transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
                        <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-border bg-muted/10 p-4">
                    <div className="space-y-3">
                        {contractData.partidas.map((partida: any) => (
                            <div key={partida.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white dark:bg-background border border-border rounded-md gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-1 bg-red-500 rounded-full"></div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{prefix}{partida.partidaNo}</p>
                                        <p className="text-xs text-muted-foreground">{partida.packageType}</p>
                                    </div>
                                </div>
                                
                                <div className="flex-1 sm:px-8 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {partida.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-xs bg-muted/30 p-1.5 rounded">
                                            <span className="font-medium text-foreground">{item.material}</span>
                                            <div className="flex gap-2">
                                                <span className="text-muted-foreground">{item.purchased}/{item.required}</span>
                                                {item.missing > 0 ? (
                                                    <span className="font-bold text-red-600">Falta {item.missing}</span>
                                                ) : (
                                                    <span className="font-bold text-green-600">OK</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDetailClick(); }}
                                    className="text-xs font-semibold text-primary hover:underline whitespace-nowrap self-start sm:self-center"
                                >
                                    Ver Detalle &rarr;
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const HomeDashboard: React.FC<HomeDashboardProps> = ({ contracts, shipments, certificates, alerts, activeCompany, setPage, setView, setViewingContractId, setActiveCertType, onNavigateToContract }) => {
    
    const activeContracts = contracts.filter(c => !c.isTerminated && c.company === activeCompany);
    const totalQuintales = activeContracts.reduce((sum, c) => {
        return sum + (c.partidas || []).reduce((pSum, p) => pSum + (Number(p.pesoKg || 0) / 46), 0);
    }, 0);

    const activeShipmentsCount = shipments.filter(s => s.company === activeCompany && s.status !== 'completed').length;
    const prefix = getPartidaPrefix(activeCompany);

    const packagingData = useMemo(() => {
        const contractGroups: Record<string, any> = {};
        const summary = {
            sacos: { req: 0, bought: 0 },
            grainpro: { req: 0, bought: 0 },
            bigbag: { req: 0, bought: 0 },
            jumbo: { req: 0, bought: 0 },
            totalMissing: 0
        };

        activeContracts.forEach(contract => {
            let contractMissingTotal = 0;
            const relevantPartidas: any[] = [];

            (contract.partidas || []).forEach(partida => {
                let records: PackagingRecord[] = [];
                
                if (partida.packagingRecords && partida.packagingRecords.length > 0) {
                    records = partida.packagingRecords;
                } else {
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

                const itemsStatus = records.map(rec => {
                    const missing = Math.max(0, rec.required - rec.purchased);
                    
                    // Summary Aggregation
                    const nameLower = rec.itemName.toLowerCase();
                    if (nameLower.includes('saco')) { summary.sacos.req += rec.required; summary.sacos.bought += rec.purchased; }
                    else if (nameLower.includes('grainpro')) { summary.grainpro.req += rec.required; summary.grainpro.bought += rec.purchased; }
                    else if (nameLower.includes('big')) { summary.bigbag.req += rec.required; summary.bigbag.bought += rec.purchased; }
                    else if (nameLower.includes('jumbo')) { summary.jumbo.req += rec.required; summary.jumbo.bought += rec.purchased; }
                    
                    if (missing > 0) {
                        contractMissingTotal += missing;
                        summary.totalMissing += missing;
                    }

                    return {
                        material: rec.itemName,
                        required: rec.required,
                        purchased: rec.purchased,
                        missing: missing
                    };
                });

                // Only add partida if it has requirements, regardless if complete or not, 
                // but for the dashboard focus, let's show all active partidas so users can see status.
                if (itemsStatus.length > 0) {
                    relevantPartidas.push({
                        id: partida.id,
                        partidaNo: partida.partidaNo,
                        packageType: partida.packageType === 'Otro' ? partida.customPackageType : partida.packageType,
                        items: itemsStatus,
                        missingCount: itemsStatus.reduce((acc, i) => acc + i.missing, 0)
                    });
                }
            });

            if (relevantPartidas.length > 0) {
                contractGroups[contract.id] = {
                    id: contract.id,
                    contractNo: contract.contractNumber,
                    buyer: contract.buyer,
                    partidas: relevantPartidas,
                    missingTotal: contractMissingTotal
                };
            }
        });

        // Sort: Contracts with missing items first
        const sortedContracts = Object.values(contractGroups).sort((a: any, b: any) => b.missingTotal - a.missingTotal);

        return { contracts: sortedContracts, summary };
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

            {/* Top KPIs */}
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

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Unified Packaging Management Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <CubeIcon className="w-5 h-5 text-amber-600" />
                                    Control de Abastecimiento de Empaque
                                </h3>
                                {packagingData.summary.totalMissing > 0 ? (
                                    <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200">
                                        -{packagingData.summary.totalMissing} Unidades Totales
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200">
                                        Inventario Completo
                                    </span>
                                )}
                            </div>
                            
                            {/* Global Summary Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <InventoryMetric label="Sacos Yute" current={packagingData.summary.sacos.bought} total={packagingData.summary.sacos.req} colorClass="bg-amber-500" />
                                <InventoryMetric label="GrainPro" current={packagingData.summary.grainpro.bought} total={packagingData.summary.grainpro.req} colorClass="bg-emerald-500" />
                                <InventoryMetric label="Big Bags" current={packagingData.summary.bigbag.bought} total={packagingData.summary.bigbag.req} colorClass="bg-blue-500" />
                                <InventoryMetric label="Jumbos" current={packagingData.summary.jumbo.bought} total={packagingData.summary.jumbo.req} colorClass="bg-purple-500" />
                            </div>
                        </div>

                        {/* Contract List Accordions */}
                        <div className="p-6 bg-muted/5 space-y-4">
                            {packagingData.contracts.length > 0 ? (
                                packagingData.contracts.map((contract: any) => (
                                    <ContractPackagingRow 
                                        key={contract.id} 
                                        contractData={contract} 
                                        prefix={prefix}
                                        onClick={() => { setPage('shipments'); setViewingContractId(contract.id); }}
                                        onDetailClick={() => onNavigateToContract(contract.id, 'empaque')}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-3 opacity-50" />
                                    <p>No hay contratos con requerimientos de empaque pendientes.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Alerts & Quick Actions */}
                <div className="space-y-6">
                    {/* Alerts List */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                        <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                            <h3 className="font-semibold text-sm">Próximos Vencimientos</h3>
                            <span className="text-xs bg-white border px-2 py-0.5 rounded text-muted-foreground">Top 5</span>
                        </div>
                        <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                            {alerts.slice(0, 5).map(alert => (
                                <div key={alert.id} onClick={() => { setPage('shipments'); setViewingContractId(alert.contractId); }} className="p-4 hover:bg-accent cursor-pointer transition-colors flex gap-3 group">
                                    <div className={`mt-1 p-2 rounded-full bg-opacity-10 flex-shrink-0 ${alert.daysRemaining <= 3 ? 'bg-red-500 text-red-600' : 'bg-amber-500 text-amber-600'}`}>
                                        <ClockIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-start w-full">
                                            <p className="text-sm font-bold text-foreground">{alert.type === 'cutoff' ? 'Cut Off Puerto' : 'Alerta'}</p>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 ${alert.daysRemaining <= 2 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {alert.daysRemaining < 0 ? 'VENCIDO' : `${alert.daysRemaining} días`}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            <span className="font-medium text-foreground">{alert.contractNo}</span> - {prefix}{alert.partidaNo.split('/').pop()}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-1 group-hover:text-primary transition-colors">Ver Contrato &rarr;</p>
                                    </div>
                                </div>
                            ))}
                            {alerts.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Todo al día. No hay alertas pendientes.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeDashboard;