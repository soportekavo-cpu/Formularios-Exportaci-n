
import React, { useRef, useState, useEffect } from 'react';
import { 
    ShipIcon, FileTextIcon, FileSpreadsheetIcon, TruckIcon, DollarSignIcon, CogIcon,
    SunIcon, MoonIcon, PlusIcon, BellIcon, ExclamationTriangleIcon, CubeIcon,
    UserIcon, ChevronDownIcon, LogOutIcon, LayoutDashboardIcon
} from './Icons';
import type { User, Company, CertificateType, Resource, PermissionAction } from '../types';

interface DashboardLayoutProps {
    children: React.ReactNode;
    activeCompany: Company;
    setActiveCompany: (company: Company) => void;
    page: 'dashboard' | 'shipments' | 'documents' | 'admin' | 'liquidaciones';
    setPage: (page: 'dashboard' | 'shipments' | 'documents' | 'admin' | 'liquidaciones') => void;
    activeCertType: CertificateType;
    setActiveCertType: (type: CertificateType) => void;
    view: string;
    setView: (view: any) => void; 
    setViewingContractId: (id: string | null) => void;
    viewingContractId: string | null;
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    currentUser: User;
    onLogout: () => void;
    alerts: any[]; 
    onAlertClick: (alert: any) => void;
    canEdit: boolean;
    onOpenContractModal: () => void;
    hasPermission: (resource: Resource, action: PermissionAction) => boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    activeCompany, setActiveCompany,
    page, setPage,
    activeCertType, setActiveCertType,
    view, setView,
    setViewingContractId, viewingContractId,
    theme, setTheme,
    currentUser, onLogout,
    alerts, onAlertClick,
    canEdit,
    onOpenContractModal,
    hasPermission
}) => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isAlertMenuOpen, setIsAlertMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const alertMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (alertMenuRef.current && !alertMenuRef.current.contains(event.target as Node)) {
                setIsAlertMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuItems = [
        { type: 'weight', label: 'Cert. de Peso', icon: FileTextIcon, resource: 'documents_weight' as Resource },
        { type: 'quality', label: 'Cert. de Calidad', icon: FileSpreadsheetIcon, resource: 'documents_quality' as Resource },
        { type: 'packing', label: 'Lista de Empaque', icon: FileSpreadsheetIcon, resource: 'documents_packing' as Resource },
        { type: 'porte', label: 'Carta de Porte', icon: TruckIcon, resource: 'documents_porte' as Resource },
        { type: 'invoice', label: 'Invoices', icon: DollarSignIcon, resource: 'documents_invoice' as Resource },
        { type: 'payment', label: 'Inst. de Pago', icon: DollarSignIcon, resource: 'documents_payment' as Resource },
    ];

    const toggleTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    };

    const ThemeIcon = theme === 'light' ? SunIcon : theme === 'dark' ? MoonIcon : CogIcon;

    // Check if user has permission to view AT LEAST ONE document type
    const hasAnyDocPermission = menuItems.some(item => hasPermission(item.resource, 'view'));

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 border-r border-border flex flex-col bg-card/50">
                <div className="h-16 flex items-center px-6 border-b border-border">
                    <div className="flex flex-row items-center gap-2">
                        <span className="text-lg font-bold text-green-600 leading-tight">Gestión de Exportaciones</span>
                        <span className="text-sm font-bold text-gray-400 italic">by KAVO</span>
                    </div>
                </div>
                <div className="flex items-center p-3 border-b border-border gap-2">
                    <button onClick={() => { setActiveCompany('dizano'); setViewingContractId(null); }} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all border ${activeCompany === 'dizano' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground hover:text-foreground border-border'}`}>DIZANO</button>
                    <button onClick={() => { setActiveCompany('proben'); setViewingContractId(null); }} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all border ${activeCompany === 'proben' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground hover:text-foreground border-border'}`}>PROBEN</button>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {hasPermission('dashboard', 'view') && (
                        <button onClick={() => { setPage('dashboard'); setViewingContractId(null); }} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${page === 'dashboard' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}><LayoutDashboardIcon className="h-5 w-5 mr-3"/><span>Dashboard</span></button>
                    )}
                    
                    {hasPermission('contracts', 'view') && (
                        <button onClick={() => { setPage('shipments'); setViewingContractId(null); }} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${page === 'shipments' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}><ShipIcon className="h-5 w-5 mr-3"/><span>Contratos</span></button>
                    )}
                    
                    {hasAnyDocPermission && (
                        <>
                            <div className="pt-4 pb-2 px-3">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Documentación</p>
                            </div>
                            {menuItems.map(item => (
                                hasPermission(item.resource, 'view') && (
                                    <button 
                                        key={item.type}
                                        onClick={() => { setActiveCertType(item.type as CertificateType); setView('list'); setPage('documents'); setViewingContractId(null); }}
                                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeCertType === item.type && page === 'documents' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}
                                    >
                                        <item.icon className="h-4 w-4 mr-3"/>
                                        <span>{item.label}</span>
                                    </button>
                                )
                            ))}
                        </>
                    )}
                    
                    <div className="pt-4 border-t border-border mt-4"></div>
                    
                    {hasPermission('admin', 'view') && (
                        <button onClick={() => { setPage('admin'); setViewingContractId(null); }} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${page === 'admin' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}><CogIcon className="h-5 w-5 mr-3"/><span>Configuración</span></button>
                    )}
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 flex-shrink-0 border-b border-border flex items-center justify-between px-6 bg-card/30 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        {page === 'shipments' && !viewingContractId && hasPermission('contracts', 'create') && (
                            <button
                                type="button"
                                onClick={onOpenContractModal}
                                className="inline-flex items-center gap-x-2 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-95"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Nuevo Contrato
                            </button>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={toggleTheme} 
                            className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                            title={`Tema: ${theme}`}
                        >
                            <ThemeIcon className="w-5 h-5" />
                        </button>

                        {/* Alert Center */}
                        <div className="relative" ref={alertMenuRef}>
                            <button onClick={() => setIsAlertMenuOpen(!isAlertMenuOpen)} className="relative p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                                <BellIcon className="w-6 h-6" />
                                {alerts.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background"></span>
                                )}
                            </button>
                            
                            {isAlertMenuOpen && (
                                <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-lg bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-border z-20 overflow-hidden">
                                    <div className="p-3 border-b bg-muted/50">
                                        <h3 className="text-sm font-semibold">Notificaciones ({alerts.length})</h3>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {alerts.length > 0 ? alerts.map(alert => (
                                            <div key={alert.id} onClick={() => { onAlertClick(alert); setIsAlertMenuOpen(false); }} className="p-3 border-b hover:bg-accent cursor-pointer transition-colors">
                                                <div className="flex items-start gap-2">
                                                    <ExclamationTriangleIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${alert.daysRemaining < 0 ? 'text-destructive' : 'text-yellow-500'}`} />
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {alert.type === 'cutoff' ? 'Cut Off' : 'Alerta'} - {alert.contractNo}
                                                            <span className={`ml-2 text-xs font-bold ${alert.daysRemaining <= 2 ? 'text-destructive' : 'text-yellow-600'}`}>
                                                                {alert.daysRemaining < 0 ? 'VENCIDO' : `${alert.daysRemaining} días`}
                                                            </span>
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">Contrato {alert.contractNo} - Partida {alert.partidaNo}</p>
                                                        {alert.message && <p className="text-xs font-medium text-amber-600 mt-1">{alert.message}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="p-8 text-sm text-center text-muted-foreground">Todo al día. No hay alertas.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-6 w-px bg-border mx-1"></div>

                        <div className="relative" ref={userMenuRef}>
                            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-x-3 p-1.5 pr-3 rounded-full hover:bg-accent transition-colors border border-transparent hover:border-border">
                                <UserIcon className="w-8 h-8 p-1.5 rounded-full bg-primary/10 text-primary"/>
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-semibold text-foreground leading-none">{currentUser.name}</span>
                                    <span className="text-xs text-muted-foreground">{currentUser.roleId === 'admin' ? 'Admin' : 'Usuario'}</span>
                                </div>
                                <ChevronDownIcon className={`w-4 h-4 text-muted-foreground transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-border z-10">
                                    <div className="py-1">
                                        <button onClick={onLogout} className="w-full text-left flex items-center gap-x-2 text-destructive px-4 py-2 text-sm hover:bg-accent">
                                            <LogOutIcon className="w-4 h-4"/>
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto bg-muted/10">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
