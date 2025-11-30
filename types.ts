

export interface AdjustmentItem {
  id: string;
  description: string;
  amount: number | '';
}

export interface Buyer {
  id: string;
  name: string;
  contactPerson?: string;
  address: string;
  phone?: string;
  email?: string;
  signature?: string; // Base64 image of signature
}

export interface Consignee {
  id: string;
  name: string;
  address: string;
}

export interface Notifier {
  id: string;
  name: string;
  address: string;
}

export interface BankAccount {
  id:string;
  bankName: string;
  swift: string;
  beneficiary: string;
  accountNumber: string;
  iban: string;
  notes?: string;
}

export interface PackageItem {
  id:string;
  type: string;
  quantity: number | '';
  unitWeight: number | ''; // Net weight
  grossUnitWeight?: number | '';
  tareUnitWeight?: number | '';
  marks: string;
  quality?: string;
  contains?: string;
  // Invoice specific
  description?: string;
  partidaNo?: string;
  unitValue?: number | '';
}

export type CertificateType = 'weight' | 'quality' | 'packing' | 'porte' | 'invoice' | 'payment';

export type Company = 'dizano' | 'proben';

export interface Driver {
  name: string;
  license: string;
}

// NEW: Auto-complete types
export interface TransportUnitItem {
    id: string;
    name: string; // The identifier (e.g., Plate number or Unit number)
}

export interface Container {
  id: string;
  containerNo: string;
  sealNo?: string;
  packages: PackageItem[];
}

export interface Certificate {
  id:string;
  company: Company;
  type: CertificateType;
  certificateNumber?: string;
  certificateDate: string;
  consignee?: string;
  notify?: string;
  billOfLadingNo?: string;
  shipmentDate?: string;
  shippingLine?: string;
  destination: string;
  product: string;
  containers?: Container[];
  totalNetWeight: number;
  totalGrossWeight?: number;
  exporterName: string;
  // Packing List specific fields
  contractNo?: string;
  packingPlace?: string;
  // Carta de Porte specific fields
  place?: string;
  transportCompany?: string;
  transportUnit?: string;
  licensePlate?: string;
  driverName?: string;
  driverLicense?: string;
  observations?: string;
  // Invoice specific fields
  invoiceNo?: string;
  invoiceType?: 'export' | 'general'; // New field to distinguish sequence
  customerName?: string;
  shippedVia?: string;
  terms?: string;
  adjustments?: AdjustmentItem[];
  advances?: AdjustmentItem[];
  totalAmount?: number;
  packages?: PackageItem[];
  // Payment Instruction specific fields
  icoNumbers?: string;
  attachedDocuments?: string[];
  bankAccountId?: string;
  signerName?: string;
  signerTitle?: string;
}

// --- PERMISSIONS SYSTEM ---
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

// Granular resources for better control
export type Resource = 
    | 'dashboard' 
    | 'contracts' 
    | 'shipments' 
    | 'admin' 
    | 'liquidaciones'
    | 'documents_weight'    // Certificado de Peso
    | 'documents_quality'   // Certificado de Calidad
    | 'documents_packing'   // Lista de Empaque
    | 'documents_porte'     // Carta de Porte
    | 'documents_invoice'   // Invoices
    | 'documents_payment';  // Instrucciones de Pago

export interface Permission {
    resource: Resource;
    actions: PermissionAction[];
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    isDefault?: boolean; // Permite acceso total sin definir permisos manuales (Super Admin)
    permissions: Permission[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string; // Linked to Role.id
}

export type MarksStatus = 'pending' | 'sent' | 'confirmed';
export type MuestraStatus = 'pending' | 'sent' | 'approved';
export type TransportType = 'Maritime' | 'Air';

export interface PackagingRecord {
    itemName: string;
    required: number;
    purchased: number;
}

export type WorkflowStepStatus = 'pending' | 'completed' | 'not_applicable';

export interface ExportWorkflowStep {
    id: string;
    label: string;
    status: WorkflowStepStatus;
    completedDate?: string;
    notes?: string;
}

export interface Partida {
    id: string;
    partidaNo: string;
    packageType: string;
    customPackageType?: string;
    quintales: number | '';
    finalPrice: number;
    
    // Marks moved to General Info
    marks?: string;
    marksStatus?: MarksStatus;
    marksAttachment?: DocumentAttachment;

    numBultos: number | '';
    pesoKg: number | '';
    pesoQqs?: number | ''; // New field for manual override
    fijacion: number | '';
    fechaFijacion?: string;
    pdfFijacion?: DocumentAttachment;
    
    // Logistics
    transportType?: TransportType; // New field
    destino?: string;
    isfRequerido?: boolean;
    isfEnviado?: boolean; // New field
    booking?: string;
    bookingAttachment?: DocumentAttachment;
    naviera?: string;
    customNaviera?: string;
    containerNo?: string;
    sealNo?: string;
    etd?: string; // Estimated Time of Departure (Zarpe)
    cutOffPort?: string; // New field: Fecha Cut Off Puerto
    blNumber?: string; // NEW: Número de BL
    blAttachment?: DocumentAttachment;

    // Fiscal
    invoiceNo?: string;
    invoicePdf?: DocumentAttachment;
    ducaZNo?: string; // Duca Simplificada
    ducaZPdf?: DocumentAttachment;
    ducaCNo?: string; // Duca Complementaria
    ducaCPdf?: DocumentAttachment;

    muestraStatus?: MuestraStatus;
    packagingRecords?: PackagingRecord[];
    
    // Tracking / Workflow fields
    workflow?: ExportWorkflowStep[];
    permisoEmbarqueNo?: string;
    permisoEmbarquePdf?: DocumentAttachment;
    fitosanitarioNo?: string;
    fitosanitarioPdf?: DocumentAttachment;
}

// Nuevos tipos para la gestión de embarques
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'backlog';
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskCategory = 'Documentación' | 'Logística' | 'Financiero' | 'Aduanas';


export interface DocumentAttachment {
  id: string;
  name: string;
  type: string;
  data?: string; // base64 encoded (Legacy / Local)
  url?: string;  // Firebase Storage URL (Future)
}

export interface BookingDetails {
  shippingLine?: string;
  vesselVoyage?: string;
  etd?: string; // Estimated Time of Departure
  eta?: string; // Estimated Time of Arrival
  serviceContract?: string;
  bookingNumber?: string;
  bookingConfirmation?: DocumentAttachment[];
}

export interface AnacafeSubtask {
  key: 'informe_venta' | 'fob_contrat' | 'factura_especial' | 'pago_impuestos';
  label: string;
  completed: boolean;
  date?: string;
  ref?: string;
}

export interface AnacafePermitDetails {
  subtasks: AnacafeSubtask[];
  permitDocument?: DocumentAttachment[];
  permitNumber?: string;
}

export interface FitosanitarioDetails {
  certificateNumber?: string;
  issueDate?: string;
  document?: DocumentAttachment[];
}

export interface ISFDetails {
  filingDate?: string;
  confirmationNumber?: string;
  document?: DocumentAttachment[];
}

export interface BLApprovalDetails {
  drafts?: DocumentAttachment[];
  isApproved: boolean;
  approvalDate?: string;
}

export interface CartaPorteDetails {
  documentId?: string; // Link to the certificate created in the other module
}

export interface ZarpeDetails {
  confirmedDate?: string;
  confirmationDocument?: DocumentAttachment[];
}

export interface FinalDocsDetails {
  generatedDate?: string;
  documents?: DocumentAttachment[]; // Could be a zip or individual files
}

export interface CobroDetails {
  sentDate?: string;
  invoiceId?: string; // Link to invoice
  paymentInstructionId?: string; // Link to payment instruction
}

export interface PagoDetails {
  receivedDate?: string;
  confirmationDocument?: DocumentAttachment[];
}


// Updated ShipmentTask
export interface ShipmentTask {
  id: string;
  key: string; // e.g., 'contract', 'booking', 'anacafe'
  label: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: string;
}

export interface ContractCertifications {
    rainforest: boolean;
    organic: boolean;
    fairtrade: boolean;
    eudr: boolean;
}

export type PackagingStatus = 'pending' | 'ordered' | 'purchased';

export interface PackagingItemStatus {
  itemName: string;
  status: PackagingStatus;
}

export interface LiquidationDeduction {
    id: string;
    concept: string;
    amount: number;
}

export interface FobContractData {
    id?: string;
    reportNo: string;
    date: string;
    buyerId: string;
    buyerName?: string; // Nuevo campo para permitir edición del nombre en el PDF
    quantityText: string;
    weightText: string;
    description: string;
    price: number;
    shipmentPeriod: string;
    shippingPort: string;
    destinationPort: string;
}

export interface Contract {
    id: string;
    company: Company;
    contractNumber: string;
    saleDate?: string;
    harvestYear?: string; // e.g., "2024-2025"
    buyer: string;
    coffeeType?: string;
    marketMonth?: string;
    differential?: string;
    shipmentMonth?: string;
    priceUnit?: string;
    certifications?: ContractCertifications;
    isTerminated?: boolean;
    isLicenseRental?: boolean;
    contractPdf?: DocumentAttachment;
    instructionsPdf?: DocumentAttachment;
    partidas: Partida[];
    creationDate: string;
    notaAbonoGenerated?: boolean;
    packagingStatus?: PackagingItemStatus[];
    liquidationCosts?: LiquidationDeduction[];
    fobContractData?: FobContractData; // Legacy, singular
    fobContracts?: FobContractData[]; // New, history array
}

export interface LicensePayment {
    id: string;
    contractId: string;
    date: string;
    amount: number;
    concept?: string;
    notes?: string;
}


// Heavily expanded Shipment interface
export interface Shipment {
  id: string;
  company: Company;
  contractId: string;
  destination: string;
  status: 'planning' | 'in_transit' | 'awaiting_payment' | 'completed';
  creationDate: string;
  sailingDate?: string;
  tasks: ShipmentTask[];
  partidaIds: string[];

  // New detailed data fields
  contractDocuments?: DocumentAttachment[];
  instructionDocuments?: DocumentAttachment[];
  bookingDetails?: BookingDetails;
  anacafePermitDetails?: AnacafePermitDetails;
  fitosanitarioDetails?: FitosanitarioDetails;
  isfDetails?: ISFDetails;
  blApprovalDetails?: BLApprovalDetails;
  cartaPorteDetails?: CartaPorteDetails;
  zarpeDetails?: ZarpeDetails;
  finalDocsDetails?: FinalDocsDetails;
  cobroDetails?: CobroDetails;
  pagoDetails?: PagoDetails;
}