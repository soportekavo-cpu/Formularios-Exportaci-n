import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Certificate, CertificateType, PackageItem, BankAccount, Company, User, Role, Container, Shipment, ShipmentTask, AnacafeSubtask, TaskPriority, TaskCategory, Partida, Contract, Buyer, Consignee, Notifier, LicensePayment, Resource, PermissionAction } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import CertificateList from './components/CertificateList';
import CertificateForm from './components/CertificateForm';
import ShipmentForm from './components/ShipmentForm';
import InvoiceForm from './components/InvoiceForm';
import PaymentInstructionForm from './components/PaymentInstructionForm';
import CertificateView from './components/CertificateView';
import PackingListView from './components/PackingListView';
import CartaPorteView from './components/CartaPorteView';
import InvoiceView from './components/InvoiceView';
import PaymentInstructionView from './components/PaymentInstructionView';
import LogoUploader from './components/LogoUploader';
import UserManagement from './components/UserManagement';
import LoginScreen from './components/LoginScreen';
import { companyData } from './utils/companyData';
import type { CompanyInfo } from './utils/companyData';
import CompanyInfoManager from './components/CompanyInfoManager';
import DataExtractorModal from './components/DataExtractorModal';
import ShipmentDashboard from './components/ShipmentDashboard';
import ContractModal from './components/ContractModal';
import AddShipmentModal from './components/ShipmentModal';
import BuyerManager from './components/BuyerManager';
import ConsigneeManager from './components/ConsigneeManager';
import NotifierManager from './components/NotifierManager';
import LicenseSettlementDashboard from './components/LicenseSettlementDashboard';
import ContractDetailView from './components/ContractDetailView';
import PartidaModal from './components/PartidaModal';
import { mapPartidaToCertificate } from './utils/documentMappers';
import DashboardLayout from './components/DashboardLayout';
import HomeDashboard from './components/HomeDashboard';
import RoleManager from './components/RoleManager';
import { ExclamationTriangleIcon, SparklesIcon } from './components/Icons';

type View = 'list' | 'form' | 'view' | 'new_shipment';
type Page = 'dashboard' | 'shipments' | 'documents' | 'admin' | 'liquidaciones';
type Theme = 'light' | 'dark' | 'system';
type AdminTab = 'dizano' | 'proben' | 'users' | 'roles' | 'buyers' | 'consignees' | 'notifiers';

// Updated Default Roles with Granular Permissions
const defaultRoles: Role[] = [
    { id: 'admin', name: 'Admin', permissions: [
        { resource: 'dashboard', actions: ['view'] },
        { resource: 'contracts', actions: ['view', 'create', 'edit', 'delete'] },
        { resource: 'shipments', actions: ['view', 'create', 'edit', 'delete'] },
        { resource: 'liquidaciones', actions: ['view', 'create', 'edit', 'delete'] },
        { resource: 'admin', actions: ['view', 'create', 'edit', 'delete'] },
        // Full document access
        { resource: 'documents_weight', actions: ['view', 'create', 'edit', 'delete'] },
        { resource: 'documents_quality', actions: ['view', 'create', 'edit', 'delete'] },
        { resource: 'documents_packing', actions: ['view', 'create', 'edit', 'delete'] },
        { resource: 'documents_porte', actions: ['view', 'create', 'edit', 'delete'] },
        { resource: 'documents_invoice', actions: ['view', 'create', 'edit', 'delete'] },
        { resource: 'documents_payment', actions: ['view', 'create', 'edit', 'delete'] },
    ]},
    { id: 'logistics', name: 'Logística', permissions: [
        { resource: 'dashboard', actions: ['view'] },
        { resource: 'contracts', actions: ['view'] },
        { resource: 'shipments', actions: ['view', 'create', 'edit'] },
        { resource: 'documents_weight', actions: ['view', 'create', 'edit'] },
        { resource: 'documents_quality', actions: ['view', 'create', 'edit'] },
        { resource: 'documents_packing', actions: ['view', 'create', 'edit'] },
        { resource: 'documents_porte', actions: ['view', 'create', 'edit'] },
    ]},
    { id: 'billing', name: 'Facturación', permissions: [
        { resource: 'dashboard', actions: ['view'] },
        { resource: 'contracts', actions: ['view'] },
        { resource: 'liquidaciones', actions: ['view', 'create', 'edit'] },
        { resource: 'documents_invoice', actions: ['view', 'create', 'edit'] },
        { resource: 'documents_payment', actions: ['view', 'create', 'edit'] },
    ]}
];

const defaultUsers: User[] = [
    { id: '1', name: 'Yony Roquel', email: 'yroquel@gmail.com', roleId: 'admin' },
    { id: '2', name: 'Logistics User', email: 'logistics@example.com', roleId: 'logistics' },
    { id: '3', name: 'Billing User', email: 'billing@example.com', roleId: 'billing' },
];

const defaultTasks: Omit<ShipmentTask, 'id'>[] = [
    { key: 'contract', label: 'Contrato e Instrucciones Recibidas', status: 'pending', priority: 'High', category: 'Documentación' },
    { key: 'booking', label: 'Booking con Naviera Confirmado', status: 'pending', priority: 'High', category: 'Logística' },
    { key: 'anacafe', label: 'Permiso de Anacafé', status: 'pending', priority: 'High', category: 'Documentación' },
    { key: 'bl_approval', label: 'Borrador de BL Aprobado', status: 'pending', priority: 'High', category: 'Documentación' },
    { key: 'fitosanitario', label: 'Certificado Fitosanitario', status: 'pending', priority: 'Medium', category: 'Documentación' },
    { key: 'isf', label: 'ISF Enviado (si aplica)', status: 'pending', priority: 'Medium', category: 'Aduanas' },
    { key: 'carta_porte', label: 'Carta de Porte Generada', status: 'pending', priority: 'Medium', category: 'Logística' },
    { key: 'zarpe', label: 'Zarpe Confirmado por Naviera', status: 'pending', priority: 'High', category: 'Logística' },
    { key: 'final_docs', label: 'Documentos Finales Generados', status: 'pending', priority: 'High', category: 'Documentación' },
    { key: 'cobro', label: 'Cobro Enviado', status: 'pending', priority: 'High', category: 'Financiero' },
    { key: 'pago', label: 'Pago Recibido', status: 'pending', priority: 'High', category: 'Financiero' },
];

const defaultAnacafeSubtasks: AnacafeSubtask[] = [
    { key: 'informe_venta', label: 'Informe de Venta', completed: false },
    { key: 'fob_contrat', label: 'FOB Contrat', completed: false },
    { key: 'factura_especial', label: 'Factura Especial', completed: false },
    { key: 'pago_impuestos', label: 'Pago de Impuestos', completed: false },
];

const DeleteConfirmationModal = ({ onConfirm, onCancel, title = "Eliminar Documento", message = "¿Estás seguro de que quieres eliminar este documento? Esta acción no se puede deshacer." }: { onConfirm: () => void, onCancel: () => void, title?: string, message?: string }) => (
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
                                <h3 className="text-base font-semibold leading-6 text-foreground" id="modal-title">{title}</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-muted-foreground">{message}</p>
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

const ShipmentCreationChoiceModal = ({ onSelectAi, onSelectManual, onCancel }: { onSelectAi: () => void, onSelectManual: () => void, onCancel: () => void }) => (
    <div className="relative z-40" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"></div>
        <div className="fixed inset-0 z-40 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-card text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md border">
                    <div className="bg-card px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div className="text-center">
                            <h3 className="text-xl font-semibold leading-6 text-foreground" id="modal-title">Crear Nuevo Embarque</h3>
                            <p className="mt-2 text-sm text-muted-foreground">¿Cómo quieres empezar? Puedes llenar los datos automáticamente desde un documento o hacerlo manualmente.</p>
                        </div>
                        <div className="mt-6 grid grid-cols-1 gap-4">
                             <button type="button" onClick={onSelectAi} className="w-full text-left p-4 rounded-lg border bg-card hover:bg-accent transition-all">
                                <div className="flex items-center gap-4">
                                    <SparklesIcon className="w-8 h-8 text-primary" />
                                    <div>
                                        <p className="font-semibold text-foreground">Crear desde Documento con IA</p>
                                        <p className="text-sm text-muted-foreground">Sube un Bill of Lading para extraer los datos.</p>
                                    </div>
                                </div>
                            </button>
                            <button type="button" onClick={onSelectManual} className="w-full text-left p-4 rounded-lg border bg-card hover:bg-accent transition-all">
                                <div className="flex items-center gap-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-muted-foreground">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                    </svg>
                                    <div>
                                        <p className="font-semibold text-foreground">Ingreso Manual</p>
                                        <p className="text-sm text-muted-foreground">Completa todos los campos del formulario.</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div className="bg-muted px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <button type="button" onClick={onCancel} className="mt-3 inline-flex w-full justify-center rounded-md bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent sm:mt-0 sm:w-auto">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

interface AlertItem {
  id: string;
  contractId: string;
  partidaId: string;
  contractNo: string;
  partidaNo: string;
  type: 'cutoff' | 'etd' | 'packaging' | 'marks';
  date?: string;
  daysRemaining: number;
  message?: string;
}

export default function App() {
  const [certificates, setCertificates] = useLocalStorage<Certificate[]>('certificates', []);
  const [contracts, setContracts] = useLocalStorage<Contract[]>('contracts', []);
  const [shipments, setShipments] = useLocalStorage<Shipment[]>('shipments', []);
  const [buyers, setBuyers] = useLocalStorage<Buyer[]>('buyers', []);
  const [consignees, setConsignees] = useLocalStorage<Consignee[]>('consignees', []);
  const [notifiers, setNotifiers] = useLocalStorage<Notifier[]>('notifiers', []);
  const [licensePayments, setLicensePayments] = useLocalStorage<LicensePayment[]>('licensePayments', []);
  const [view, setView] = useState<View>('list');
  const [page, setPage] = useState<Page>('dashboard'); // Default to Dashboard
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [activeCertType, setActiveCertType] = useState<CertificateType>('weight');
  const [dizanoLogo, setDizanoLogo] = useLocalStorage<string | null>('dizanoLogo', null);
  const [probenLogo, setProbenLogo] = useLocalStorage<string | null>('probenLogo', null);
  const [users, setUsers] = useLocalStorage<User[]>('users', defaultUsers);
  const [roles, setRoles] = useLocalStorage<Role[]>('roles', defaultRoles);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [dizanoBankAccounts, setDizanoBankAccounts] = useLocalStorage<BankAccount[]>('dizanoBankAccounts', []);
  const [probenBankAccounts, setProbenBankAccounts] = useLocalStorage<BankAccount[]>('probenBankAccounts', []);
  const [activeCompany, setActiveCompany] = useState<Company>('dizano');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);
  const [partidaToDelete, setPartidaToDelete] = useState<{contractId: string, partidaId: string} | null>(null);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'system');
  const [isShipmentChoiceModalOpen, setIsShipmentChoiceModalOpen] = useState(false);
  const [isDataExtractorModalOpen, setIsDataExtractorModalOpen] = useState(false);
  const [initialShipmentData, setInitialShipmentData] = useState<Partial<Certificate> | null>(null);
  const [prefilledDocumentData, setPrefilledDocumentData] = useState<Partial<Certificate> | null>(null);

  const [dizanoInfo, setDizanoInfo] = useLocalStorage<CompanyInfo>('dizanoCompanyInfo', companyData.dizano);
  const [probenInfo, setProbenInfo] = useLocalStorage<CompanyInfo>('probenCompanyInfo', companyData.proben);
  const [adminTab, setAdminTab] = useState<AdminTab>('dizano');
  
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Partial<Contract> | null>(null);
  
  const [isAddShipmentModalOpen, setIsAddShipmentModalOpen] = useState(false);
  const [contractForNewShipment, setContractForNewShipment] = useState<Contract | null>(null);
  const [viewingContractId, setViewingContractId] = useState<string | null>(null);
  const [liquidationContractId, setLiquidationContractId] = useState<string | null>(null);

  const [partidaModalState, setPartidaModalState] = useState<{
    isOpen: boolean;
    contractId: string | null;
    partida: Partial<Partida> | null;
    isReadOnly: boolean;
  }>({ isOpen: false, contractId: null, partida: null, isReadOnly: false });

  // Helper for checking permissions
  const hasPermission = (resource: Resource, action: PermissionAction) => {
      if (!currentUser) return false;
      const userRole = roles.find(r => r.id === currentUser.roleId);
      if (!userRole) return false;
      return userRole.permissions.some(p => p.resource === resource && p.actions.includes(action));
  };

  const canEditContracts = hasPermission('contracts', 'edit'); 
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };
  
  const handleLogout = () => {
      setCurrentUser(null);
      setPage('dashboard');
      setView('list');
      setViewingContractId(null);
  };

  const filteredCertificates = useMemo(() => {
    return (certificates || []).filter(cert => cert.type === activeCertType && cert.company === activeCompany);
  }, [certificates, activeCertType, activeCompany]);

  const filteredContracts = useMemo(() => {
    const safeContracts = (Array.isArray(contracts) ? contracts : []);
    return safeContracts.filter(c => c && c.company === activeCompany).sort((a, b) => {
        const dateA = a.creationDate ? new Date(a.creationDate).getTime() : 0;
        const dateB = b.creationDate ? new Date(b.creationDate).getTime() : 0;
        return dateB - dateA;
    });
  }, [contracts, activeCompany]);

  const alerts: AlertItem[] = useMemo(() => {
      const list: AlertItem[] = [];
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const safeContracts = Array.isArray(contracts) ? contracts : [];

      safeContracts.forEach(c => {
          if (!c || c.isTerminated || c.company !== activeCompany) return;
          (c.partidas || []).forEach(p => {
              if (!p) return;
              const prefix = c.company === 'dizano' ? '11/988/' : '11/44360/';

              if (p.cutOffPort) {
                  const date = new Date(p.cutOffPort + 'T00:00:00');
                  const diffTime = date.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                  
                  if (diffDays <= 5) { 
                      list.push({
                          id: `cutoff-${p.id}`,
                          contractId: c.id,
                          partidaId: p.id,
                          contractNo: c.contractNumber,
                          partidaNo: prefix + p.partidaNo,
                          type: 'cutoff',
                          date: p.cutOffPort,
                          daysRemaining: diffDays
                      });
                  }

                  if (diffDays <= 7 && diffDays >= 0) {
                      let packagingAlert = false;
                      if (p.packagingRecords && p.packagingRecords.length > 0) {
                          packagingAlert = p.packagingRecords.some(r => r.purchased < r.required);
                      } else if (Number(p.numBultos) > 0) {
                          packagingAlert = true;
                      }

                      if (packagingAlert) {
                          list.push({
                              id: `pack-${p.id}`,
                              contractId: c.id,
                              partidaId: p.id,
                              contractNo: c.contractNumber,
                              partidaNo: prefix + p.partidaNo,
                              type: 'packaging',
                              date: p.cutOffPort,
                              daysRemaining: diffDays,
                              message: 'Confirmar compra de materiales de empaque.'
                          });
                      }

                      if (p.marksStatus !== 'confirmed') {
                           list.push({
                              id: `marks-${p.id}`,
                              contractId: c.id,
                              partidaId: p.id,
                              contractNo: c.contractNumber,
                              partidaNo: prefix + p.partidaNo,
                              type: 'marks',
                              date: p.cutOffPort,
                              daysRemaining: diffDays,
                              message: 'Instrucciones de marcas pendientes de confirmación.'
                          });
                      }
                  }
              }

              if (p.etd) {
                  const date = new Date(p.etd + 'T00:00:00');
                  const diffTime = date.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                  
                  if (diffDays <= 5) { 
                      list.push({
                          id: `etd-${p.id}`,
                          contractId: c.id,
                          partidaId: p.id,
                          contractNo: c.contractNumber,
                          partidaNo: prefix + p.partidaNo,
                          type: 'etd',
                          date: p.etd,
                          daysRemaining: diffDays
                      });
                  }
              }
          });
      });
      
      return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [contracts, activeCompany]);

  const handleUnifiedAdd = () => {
      setInitialShipmentData(null);
      setIsShipmentChoiceModalOpen(true);
  };

  const handleAdd = () => {
    setCurrentId(null);
    setPrefilledDocumentData(null); 
    setView('form');
  };

  const handleEdit = (id: string) => {
    setCurrentId(id);
    setView('form');
  };

  const handleView = (id: string) => {
    setCurrentId(id);
    setView('view');
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };
  
  const confirmDelete = () => {
      if (deletingId) {
          setCertificates(prev => (prev || []).filter(c => c.id !== deletingId));
          setDeletingId(null);
      }
  };

  const handleBackToList = () => {
    setCurrentId(null);
    setPrefilledDocumentData(null);
    setView('list');
  };

  const handleDuplicate = (id: string) => {
    const certToDuplicate = (certificates || []).find(c => c.id === id);
    if (certToDuplicate) {
      const newCert: Certificate = {
        ...certToDuplicate,
        id: new Date().toISOString(),
        certificateNumber: undefined, 
        invoiceNo: undefined,
        certificateDate: new Date().toISOString().split('T')[0],
      };
      setCertificates(prev => [...(prev || []), newCert]);
    }
  };
  
  const handleCreatePaymentInstruction = (invoiceId: string) => {
      const invoice = (certificates || []).find(c => c.id === invoiceId && c.type === 'invoice');
      if (invoice) {
          setCurrentId(null); 
          const formatNumber = (num?: number | '') => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(num) || 0);
          const icoNumbers = (invoice.packages || []).map(p => p.partidaNo).filter(Boolean).join(', ');
          const attachedDocuments = [
              `Commercial Invoice No. ${invoice.invoiceNo} for US$ ${formatNumber(invoice.totalAmount)}`,
              'Bill of Lading', 'Weight Certificate', 'Quality Certificate', 'Packing List', 'ICO Certificate of Origin'
          ];
          
          const newPaymentInstruction: Partial<Certificate> = {
              company: invoice.company,
              type: 'payment',
              certificateDate: new Date().toISOString().split('T')[0],
              customerName: invoice.customerName,
              consignee: invoice.consignee,
              contractNo: invoice.contractNo,
              totalAmount: invoice.totalAmount,
              icoNumbers: icoNumbers,
              attachedDocuments: attachedDocuments,
              signerName: 'Yony Roquel',
              signerTitle: 'Export Manager',
          };
          setActiveCertType('payment');
          const newId = new Date().toISOString();
          setCertificates(prev => [...(prev || []), { ...newPaymentInstruction, id: newId } as Certificate]);
          setCurrentId(newId);
          setView('form');
      }
  };

  const handleFormSubmit = (data: Certificate) => {
    const certWithCompany: Certificate = { ...data, company: activeCompany };
    if (currentId) {
      setCertificates(prev => (prev || []).map(c => c.id === currentId ? certWithCompany : c));
    } else {
      const newId = new Date().toISOString();
      let newCert: Certificate;
      if (certWithCompany.type === 'invoice') {
          const type = certWithCompany.invoiceType || 'export';
          const invoiceCount = (certificates || []).filter(c => c.type === 'invoice' && c.company === activeCompany && (c.invoiceType || 'export') === type).length;
          const prefix = type === 'export' ? 'INV-' : 'VAR-';
          newCert = { ...certWithCompany, id: newId, invoiceNo: `${prefix}${String(invoiceCount + 1).padStart(3, '0')}` };
      } else if (certWithCompany.type === 'porte') {
        const year = new Date().getFullYear();
        const porteCountForYear = (certificates || []).filter(c => c.type === 'porte' && c.company === activeCompany && c.certificateDate.startsWith(String(year))).length;
        const certNumber = `CP-${year}-${String(porteCountForYear + 1).padStart(3, '0')}`;
        newCert = { ...certWithCompany, id: newId, certificateNumber: certNumber };
      } else {
          newCert = { ...certWithCompany, id: newId };
      }
      setCertificates(prev => [...(prev || []), newCert]);
    }
    setView('list');
    setCurrentId(null);
    setPrefilledDocumentData(null);
  };
  
  const handleShipmentFormSubmit = (data: Omit<Certificate, 'id' | 'type'>, types: CertificateType[]) => {
      const certsToCreate: Certificate[] = [];
      const baseId = new Date().toISOString();
      const weightCertCount = (certificates || []).filter(c => c.type === 'weight' && c.company === activeCompany).length;
      const qualityCertCount = (certificates || []).filter(c => c.type === 'quality' && c.company === activeCompany).length;
      const packingListCount = (certificates || []).filter(c => c.type === 'packing' && c.company === activeCompany).length;

      types.forEach((type, index) => {
          let certNumber: string | undefined = undefined;
          if (type === 'weight') certNumber = `CW-${activeCompany === 'dizano' ? 'D' : 'P'}${String(weightCertCount + 1).padStart(2, '0')}-001`;
          if (type === 'quality') certNumber = `CQ-${activeCompany === 'dizano' ? 'D' : 'P'}${String(qualityCertCount + 1).padStart(2, '0')}-001`;
          if (type === 'packing') certNumber = `PL-${activeCompany === 'dizano' ? 'D' : 'P'}${String(packingListCount + 1).padStart(2, '0')}-001`;
          
          certsToCreate.push({
              ...data,
              id: `${baseId}-${index}`,
              type: type,
              company: activeCompany,
              certificateNumber: certNumber,
              certificateDate: (type === 'weight' || type === 'quality') ? (data.shipmentDate || data.certificateDate) : data.certificateDate,
          });
      });
      setCertificates(prev => [...(prev || []), ...certsToCreate]);
      setView('list');
      setCurrentId(null);
      setInitialShipmentData(null);
  };
  
  const handleExtractionComplete = (data: Partial<Certificate>) => {
      const shipmentData: Partial<Certificate> = {
          consignee: data.consignee || '',
          notify: data.notify || data.consignee || '',
          billOfLadingNo: data.billOfLadingNo || '',
          shippingLine: data.shippingLine || '',
          destination: data.destination || '',
          product: data.product || 'GREEN COFFEE, CROP 2024/2025',
          containers: (data as any).containerNo ? [{
              id: new Date().toISOString(),
              containerNo: (data as any).containerNo,
              sealNo: (data as any).sealNo || '',
              packages: ((data as any).packages && (data as any).packages.length > 0 ? (data as any).packages : [{ id: new Date().toISOString(), type: 'BAGS', quantity: '', unitWeight: '', grossUnitWeight: '', marks: '' }]) as PackageItem[]
          }] : (data.containers || []),
      };
      setInitialShipmentData(shipmentData);
      setIsDataExtractorModalOpen(false);
      setView('new_shipment');
  };

  const handleOpenContractModal = (contract: Partial<Contract> | null = null) => {
    setEditingContract(contract);
    setIsContractModalOpen(true);
  };

  const handleSaveContract = (data: Partial<Contract>) => {
    if (data.id) { // Editing
      setContracts(prev => (prev || []).map(c => (c.id === data.id ? { ...c, ...data } as Contract : c)));
    } else { // Creating
      const newId = new Date().toISOString();
      const newContract: Contract = {
        id: newId,
        company: activeCompany,
        creationDate: new Date().toISOString().split('T')[0],
        partidas: [], 
        ...data,
      } as Contract;
      setContracts(prev => [newContract, ...(prev || [])]);
      setViewingContractId(newId); 
    }
    setIsContractModalOpen(false);
    setEditingContract(null);
  };

  const handleUpdateContractDirectly = (updatedContract: Contract) => {
    setContracts(prevContracts => (prevContracts || []).map(c => 
        c.id === updatedContract.id ? updatedContract : c
    ));
  };

  const handleDeleteContract = (id: string) => { setContractToDelete(id); };

  const confirmDeleteContract = () => {
      if (contractToDelete) {
          setContracts(prev => (prev || []).filter(c => c.id !== contractToDelete));
          if (viewingContractId === contractToDelete) { setViewingContractId(null); }
          setContractToDelete(null);
      }
  };
  
  const handleOpenPartidaModal = (contractId: string, partida: Partial<Partida> | null = null, isReadOnly: boolean = false) => {
    setPartidaModalState({ isOpen: true, contractId, partida, isReadOnly });
  };

  const handleDuplicatePartida = (partida: Partida) => {
    const { id, ...partidaData } = partida;
    const duplicatedData = { ...partidaData, partidaNo: '' };
    setPartidaModalState({ isOpen: true, contractId: viewingContractId, partida: duplicatedData, isReadOnly: false });
  };
  
  const handleClosePartidaModal = () => {
    setPartidaModalState({ isOpen: false, contractId: null, partida: null, isReadOnly: false });
  };
  
  const handleSavePartida = (partidaData: Partida) => {
    if (!partidaModalState.contractId) return;
    setContracts(prevContracts => (prevContracts || []).map(c => {
        if (c && c.id === partidaModalState.contractId) {
            const currentPartidas = Array.isArray(c.partidas) ? c.partidas : [];
            const validPartidas = currentPartidas.filter(p => p);
            const existingPartida = validPartidas.find(p => p.id === partidaData.id);
            let newPartidas;
            if (existingPartida) {
                newPartidas = currentPartidas.map(p => (p && p.id === partidaData.id) ? partidaData : p);
            } else {
                newPartidas = [...currentPartidas, partidaData];
            }
            return { ...c, partidas: newPartidas };
        }
        return c;
    }));
    handleClosePartidaModal();
  };

  const handleDeletePartida = (contractId: string, partidaId: string) => { setPartidaToDelete({ contractId, partidaId }); };

  const confirmDeletePartida = () => {
      if (partidaToDelete) {
          setContracts(prev => (prev || []).map(c => {
              if (c && c.id === partidaToDelete.contractId) {
                  const currentPartidas = Array.isArray(c.partidas) ? c.partidas : [];
                  return { ...c, partidas: currentPartidas.filter(p => p && p.id !== partidaToDelete.partidaId) };
              }
              return c;
          }));
          setPartidaToDelete(null);
      }
  };
  
  const handleGoToLiquidation = (contractId: string) => {
      setLiquidationContractId(contractId);
      setPage('liquidaciones');
      setViewingContractId(null);
  };

  const handleAlertClick = (alert: AlertItem) => {
      setPage('shipments');
      setViewingContractId(alert.contractId);
  }

  const handleOpenAddShipmentModal = (contract: Contract) => {
    setContractForNewShipment(contract);
    setIsAddShipmentModalOpen(true);
  };
  
  const handleSaveNewShipment = (data: { destination: string; partidaIds: string[] }) => {
    if (!contractForNewShipment) return;
    const newShipment: Shipment = {
      id: new Date().toISOString(),
      company: activeCompany,
      contractId: contractForNewShipment.id,
      destination: data.destination,
      partidaIds: data.partidaIds,
      status: 'planning',
      creationDate: new Date().toISOString().split('T')[0],
      tasks: defaultTasks.map(t => ({...t, id: `${t.key}-${new Date().toISOString()}`})),
      anacafePermitDetails: { subtasks: defaultAnacafeSubtasks },
    };
    setShipments(prev => [newShipment, ...(prev || [])]);
  };
  
  const handleGenerateDocumentFromPartida = (partida: Partida, type: CertificateType) => {
      const contract = contracts.find(c => c.partidas.some(p => p.id === partida.id));
      if (!contract) return;
      const mappedData = mapPartidaToCertificate(contract, partida, type, activeCompany);
      setPrefilledDocumentData(mappedData);
      setActiveCertType(type);
      setCurrentId(null);
      setPage('documents');
      setView('form');
      setViewingContractId(null); 
  };

  const renderDocumentsContent = () => {
    // Security check
    let resource: Resource | null = null;
    if (activeCertType === 'weight') resource = 'documents_weight';
    else if (activeCertType === 'quality') resource = 'documents_quality';
    else if (activeCertType === 'packing') resource = 'documents_packing';
    else if (activeCertType === 'porte') resource = 'documents_porte';
    else if (activeCertType === 'invoice') resource = 'documents_invoice';
    else if (activeCertType === 'payment') resource = 'documents_payment';

    if (resource && !hasPermission(resource, 'view')) {
        return <div className="p-8 text-center text-muted-foreground">No tienes permiso para ver estos documentos.</div>;
    }

    const certToView = (certificates || []).find(c => c.id === currentId);
  
    if (view === 'view' && !certToView) {
      alert("El documento no existe.");
      setView('list');
      setCurrentId(null);
      return null;
    }
  
    const companyInfoForView = certToView?.company === 'proben' ? probenInfo : dizanoInfo;
    const logoForView = certToView?.company === 'proben' ? probenLogo : dizanoLogo;

    const renderForm = () => {
        let initialFormData: Partial<Certificate>;
        if (currentId) {
            const certToEdit = (certificates || []).find(c => c.id === currentId);
            initialFormData = certToEdit ? { ...certToEdit } : {};
        } else if (prefilledDocumentData) {
            initialFormData = prefilledDocumentData;
        } else {
            initialFormData = { 
                type: activeCertType, 
                company: activeCompany, 
                certificateDate: new Date().toISOString().split('T')[0],
                ...(activeCertType === 'porte' && { place: 'Guatemala' })
            };
        }

        switch(activeCertType) {
            case 'weight': case 'quality': case 'packing': case 'porte':
                return <CertificateForm initialData={initialFormData} onSubmit={handleFormSubmit} onCancel={handleBackToList} />;
            case 'invoice':
                return <InvoiceForm 
                    initialData={initialFormData} 
                    onSubmit={handleFormSubmit} 
                    onCancel={handleBackToList} 
                    buyers={buyers || []}
                    setBuyers={setBuyers}
                />;
            case 'payment':
                return <PaymentInstructionForm 
                    initialData={initialFormData} onSubmit={handleFormSubmit} onCancel={handleBackToList} 
                    bankAccounts={activeCompany === 'dizano' ? (dizanoBankAccounts || []) : (probenBankAccounts || [])}
                    setBankAccounts={activeCompany === 'dizano' ? setDizanoBankAccounts : setProbenBankAccounts}
                    activeCompany={activeCompany} companyInfo={companyInfoForView}
                />;
            default: return <p>Tipo de formulario no reconocido.</p>
        }
    };
  
    switch (view) {
      case 'list': return (
        <CertificateList
            certificates={filteredCertificates}
            activeCertType={activeCertType} onAdd={handleAdd} onUnifiedAdd={handleUnifiedAdd}
            onView={handleView} onEdit={handleEdit} onDelete={handleDelete} onDuplicate={handleDuplicate}
            onCreatePaymentInstruction={handleCreatePaymentInstruction} 
            getPermission={hasPermission} // Pass permission function
        />
      );
      case 'form': return renderForm();
      case 'new_shipment': return <ShipmentForm onSubmit={handleShipmentFormSubmit} onCancel={handleBackToList} initialShipmentData={initialShipmentData}/>
      case 'view':
        switch (activeCertType) {
            case 'weight': case 'quality':
                return <CertificateView certificate={certToView || null} onBack={handleBackToList} logo={logoForView} companyInfo={companyInfoForView} />;
            case 'packing':
                return <PackingListView certificate={certToView || null} onBack={handleBackToList} logo={logoForView} companyInfo={companyInfoForView} />;
            case 'porte':
                return <CartaPorteView certificate={certToView || null} onBack={handleBackToList} logo={logoForView} companyInfo={companyInfoForView} />;
            case 'invoice':
                return <InvoiceView certificate={certToView || null} onBack={handleBackToList} logo={logoForView} companyInfo={companyInfoForView} />;
            case 'payment':
                return <PaymentInstructionView certificate={certToView || null} onBack={handleBackToList} bankAccounts={activeCompany === 'dizano' ? (dizanoBankAccounts || []) : (probenBankAccounts || [])} logo={logoForView} companyInfo={companyInfoForView} />;
            default:
                return <p>Vista no disponible.</p>;
        }
    default: return null;
    }
  };
  
  const viewingContract = useMemo(() => {
      if (!viewingContractId || !Array.isArray(contracts)) return undefined;
      return contracts.find(c => c && c.id === viewingContractId);
  }, [contracts, viewingContractId]);

  if (!currentUser) {
    return <LoginScreen users={users || defaultUsers} onLogin={handleLogin} />;
  }

  return (
    <DashboardLayout
        activeCompany={activeCompany}
        setActiveCompany={setActiveCompany}
        page={page}
        setPage={setPage}
        activeCertType={activeCertType}
        setActiveCertType={setActiveCertType}
        view={view}
        setView={setView}
        setViewingContractId={setViewingContractId}
        viewingContractId={viewingContractId}
        theme={theme}
        setTheme={setTheme}
        currentUser={currentUser}
        onLogout={handleLogout}
        alerts={alerts}
        onAlertClick={handleAlertClick}
        canEdit={canEditContracts}
        onOpenContractModal={() => handleOpenContractModal(null)}
        hasPermission={hasPermission}
    >
      {deletingId && <DeleteConfirmationModal onConfirm={confirmDelete} onCancel={() => setDeletingId(null)} />}
      {contractToDelete && <DeleteConfirmationModal title="Eliminar Contrato" message="¿Estás seguro de que deseas eliminar este contrato? Esta acción eliminará todas las partidas asociadas y no se puede deshacer." onConfirm={confirmDeleteContract} onCancel={() => setContractToDelete(null)} />}
      {partidaToDelete && <DeleteConfirmationModal title="Eliminar Partida" message="¿Estás seguro de que deseas eliminar esta partida? Esta acción no se puede deshacer." onConfirm={confirmDeletePartida} onCancel={() => setPartidaToDelete(null)} />}
      
      {isContractModalOpen && (
        <ContractModal
          isOpen={isContractModalOpen}
          onClose={() => {
            setIsContractModalOpen(false);
            setEditingContract(null);
          }}
          onSave={handleSaveContract}
          initialData={editingContract}
          buyers={buyers || []}
          activeCompany={activeCompany}
        />
      )}
      
      {partidaModalState.isOpen && (
          <PartidaModal
            isOpen={partidaModalState.isOpen}
            onClose={handleClosePartidaModal}
            onSave={handleSavePartida}
            initialData={partidaModalState.partida}
            contractId={partidaModalState.contractId}
            contractDifferential={(Array.isArray(contracts) ? contracts : []).find(c => c && c.id === partidaModalState.contractId)?.differential || '0'}
            activeCompany={activeCompany}
            isReadOnly={partidaModalState.isReadOnly}
            contracts={contracts || []}
          />
      )}

      {isAddShipmentModalOpen && (
        <AddShipmentModal
          isOpen={isAddShipmentModalOpen}
          onClose={() => {
            setIsAddShipmentModalOpen(false);
            setContractForNewShipment(null);
          }}
          onSave={handleSaveNewShipment}
          contract={contractForNewShipment}
          shipments={shipments || []}
        />
      )}

      {isShipmentChoiceModalOpen && <ShipmentCreationChoiceModal 
          onSelectAi={() => { setIsShipmentChoiceModalOpen(false); setIsDataExtractorModalOpen(true); }}
          onSelectManual={() => { setIsShipmentChoiceModalOpen(false); setView('new_shipment'); }}
          onCancel={() => setIsShipmentChoiceModalOpen(false)}
      />}
      {isDataExtractorModalOpen && <DataExtractorModal 
          isOpen={isDataExtractorModalOpen}
          onClose={() => setIsDataExtractorModalOpen(false)}
          onExtractionComplete={handleExtractionComplete}
      />}
      
      {/* Page Content */}
        {page === 'dashboard' && hasPermission('dashboard', 'view') && (
            <HomeDashboard 
                contracts={filteredContracts} 
                shipments={shipments || []} 
                certificates={certificates || []} 
                alerts={alerts} 
                activeCompany={activeCompany} 
            />
        )}
        {page === 'shipments' && hasPermission('contracts', 'view') && (
            viewingContract ? (
                <ContractDetailView
                    contract={viewingContract}
                    buyers={buyers || []}
                    onBack={() => setViewingContractId(null)}
                    onEditContract={handleOpenContractModal}
                    onDeleteContract={handleDeleteContract}
                    onAddPartida={() => handleOpenPartidaModal(viewingContract.id, null)}
                    onDuplicatePartida={handleDuplicatePartida}
                    onEditPartida={(partida) => handleOpenPartidaModal(viewingContract.id, partida)}
                    onDeletePartida={(partidaId) => handleDeletePartida(viewingContract.id, partidaId)}
                    onViewPartida={(partida) => handleOpenPartidaModal(viewingContract.id, partida, true)}
                    onUpdateContractDirectly={handleUpdateContractDirectly}
                    onGoToLiquidation={handleGoToLiquidation}
                    onGenerateDocumentFromPartida={handleGenerateDocumentFromPartida}
                    canEdit={canEditContracts}
                    licensePayments={licensePayments || []}
                    setLicensePayments={setLicensePayments}
                    logo={activeCompany === 'dizano' ? dizanoLogo : probenLogo}
                    companyInfo={activeCompany === 'dizano' ? dizanoInfo : probenInfo}
                />
            ) : (
                <ShipmentDashboard 
                    contracts={filteredContracts}
                    onViewContract={setViewingContractId}
                    onAddContract={(harvestYear) => handleOpenContractModal(harvestYear ? { harvestYear } : null)}
                    onEditContract={handleOpenContractModal}
                    onDeleteContract={handleDeleteContract}
                    canEdit={canEditContracts}
                />
            )
        )}
        {page === 'documents' && renderDocumentsContent()}
        {page === 'liquidaciones' && hasPermission('liquidaciones', 'view') && (
            <LicenseSettlementDashboard
            contracts={(Array.isArray(contracts) ? contracts : []).filter(c => c && c.isLicenseRental && c.company === activeCompany)}
            payments={licensePayments || []}
            setPayments={setLicensePayments}
            buyers={buyers || []}
            setContracts={setContracts}
            initialContractId={liquidationContractId}
            dizanoLogo={dizanoLogo}
            probenLogo={probenLogo}
            dizanoInfo={dizanoInfo}
            probenInfo={probenInfo}
            />
        )}
        {page === 'admin' && hasPermission('admin', 'view') && (
            <div>
                <h1 className="text-2xl font-bold mb-6">Administración</h1>
                <div className="border-b border-border">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                        <button onClick={() => setAdminTab('dizano')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${adminTab === 'dizano' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>Dizano, S.A.</button>
                        <button onClick={() => setAdminTab('proben')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${adminTab === 'proben' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>Proben, S.A.</button>
                        <button onClick={() => setAdminTab('users')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${adminTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>Usuarios</button>
                        <button onClick={() => setAdminTab('roles')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${adminTab === 'roles' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>Roles y Permisos</button>
                        <button onClick={() => setAdminTab('buyers')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${adminTab === 'buyers' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>Compradores</button>
                        <button onClick={() => setAdminTab('consignees')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${adminTab === 'consignees' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>Consignatarios</button>
                        <button onClick={() => setAdminTab('notifiers')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${adminTab === 'notifiers' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>Notificadores</button>
                    </nav>
                </div>

                <div className="pt-6">
                    {adminTab === 'dizano' && ( <div className="space-y-8"><LogoUploader logo={dizanoLogo} setLogo={setDizanoLogo} company="dizano" /><CompanyInfoManager title="Información de Dizano, S.A." companyInfo={dizanoInfo} setCompanyInfo={setDizanoInfo} /></div> )}
                    {adminTab === 'proben' && ( <div className="space-y-8"><LogoUploader logo={probenLogo} setLogo={setProbenLogo} company="proben" /><CompanyInfoManager title="Información de Proben, S.A." companyInfo={probenInfo} setCompanyInfo={setProbenInfo} /></div> )}
                    {adminTab === 'users' && ( <UserManagement users={users || defaultUsers} setUsers={setUsers} roles={roles || defaultRoles} /> )}
                    {adminTab === 'roles' && ( <RoleManager roles={roles || defaultRoles} setRoles={setRoles} /> )}
                    {adminTab === 'buyers' && ( <BuyerManager buyers={buyers || []} setBuyers={setBuyers} /> )}
                    {adminTab === 'consignees' && ( <ConsigneeManager consignees={consignees || []} setConsignees={setConsignees} /> )}
                    {adminTab === 'notifiers' && ( <NotifierManager notifiers={notifiers || []} setNotifiers={setNotifiers} /> )}
                </div>
            </div>
        )}
    </DashboardLayout>
  );
}