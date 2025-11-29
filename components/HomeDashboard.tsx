
import React from 'react';
import { ShipIcon, FileTextIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon, CubeIcon } from './Icons';
import type { Contract, Shipment, Certificate } from '../types';

interface HomeDashboardProps {
    contracts: Contract[];
    shipments: Shipment[];
    certificates: Certificate[];
    alerts: any[];
    activeCompany: string;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ contracts, shipments, certificates, alerts, activeCompany }) => {
    
    // Calculate Stats
    const activeContracts = contracts.filter(c => !c.isTerminated && c.company === activeCompany);
    const totalQuintales = activeContracts.reduce((sum, c) => {
        return sum + (c.partidas || []).reduce((pSum, p) => pSum + (Number(p.pesoKg || 0) / 46), 0);
    }, 0);

    const activeShipmentsCount = shipments.filter(s => s.company === activeCompany && s.status !== 'completed').length;
    
    // Pending Documents (Approximation: Shipments in progress)
    const pendingShipments = shipments.filter(s => s.company === activeCompany && s.status !== 'completed');
    
    const recentDocs = certificates
        .filter(c => c.company === activeCompany)
        .sort((a, b) => new Date(b.certificateDate).getTime() - new Date(a.certificateDate).getTime())
        .slice(0, 5);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Vista general de operaciones para {activeCompany === 'dizano' ? 'Dizano, S.A.' : 'Proben, S.A.'}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Contratos Activos</h3>
                        <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{activeContracts.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">{totalQuintales.toFixed(2)} qqs. por embarcar</p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Embarques en Curso</h3>
                        <ShipIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{activeShipmentsCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">En tránsito o planificación</p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Alertas Prioritarias</h3>
                        <ExclamationTriangleIcon className={`h-4 w-4 ${alerts.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                    </div>
                    <div className={`text-2xl font-bold ${alerts.length > 0 ? 'text-destructive' : ''}`}>{alerts.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Requieren atención inmediata</p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Docs. Generados (Mes)</h3>
                        <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">
                        {certificates.filter(c => c.company === activeCompany && new Date(c.certificateDate).getMonth() === new Date().getMonth()).length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">+12% vs mes anterior</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Activity / Documents */}
                <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="p-6 flex flex-col space-y-1.5">
                        <h3 className="font-semibold leading-none tracking-tight">Documentos Recientes</h3>
                        <p className="text-sm text-muted-foreground">Últimos 5 documentos generados.</p>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="space-y-4">
                            {recentDocs.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/50 border">
                                            <FileTextIcon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{doc.type.toUpperCase()} {doc.certificateNumber || doc.invoiceNo}</p>
                                            <p className="text-xs text-muted-foreground">{doc.customerName || doc.consignee?.substring(0, 30)}...</p>
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium text-muted-foreground">{doc.certificateDate}</div>
                                </div>
                            ))}
                            {recentDocs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay actividad reciente.</p>}
                        </div>
                    </div>
                </div>

                {/* Quick Status / Alerts */}
                <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="p-6 flex flex-col space-y-1.5">
                        <h3 className="font-semibold leading-none tracking-tight">Estado de Alertas</h3>
                        <p className="text-sm text-muted-foreground">Próximos vencimientos y tareas.</p>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="space-y-4">
                            {alerts.slice(0, 5).map(alert => (
                                <div key={alert.id} className="flex items-start space-x-4 rounded-md border p-3 bg-accent/10 hover:bg-accent/30 transition-colors">
                                    <ClockIcon className={`mt-0.5 h-5 w-5 ${alert.daysRemaining <= 3 ? 'text-destructive' : 'text-yellow-500'}`} />
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {alert.type === 'cutoff' ? 'Cut Off' : 'Alerta'} - {alert.contractNo}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {alert.message || `Vence en ${alert.daysRemaining} días`} ({alert.date})
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {alerts.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <CheckCircleIcon className="h-12 w-12 text-green-500 mb-2" />
                                    <p className="text-sm font-medium">Todo en orden</p>
                                    <p className="text-xs text-muted-foreground">No hay alertas pendientes.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeDashboard;
