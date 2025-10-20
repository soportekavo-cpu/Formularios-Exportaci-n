export interface AdjustmentItem {
  id: string;
  description: string;
  amount: number | '';
}

export interface Customer {
  id: string;
  name: string;
  address: string;
}

export interface BankAccount {
  id: string;
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

export interface Driver {
  name: string;
  license: string;
}

export interface Certificate {
  id:string;
  type: CertificateType;
  certificateNumber?: string;
  certificateDate: string;
  shipper?: string;
  consignee: string;
  notify?: string;
  billOfLadingNo: string;
  shipmentDate: string;
  shippingLine: string;
  destination: string;
  product: string;
  packages: PackageItem[];
  totalNetWeight: number;
  totalGrossWeight?: number;
  containerNo: string;
  exporterName: string;
  // Packing List specific fields
  contractNo?: string;
  sealNo?: string;
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
  customerName?: string;
  shippedVia?: string;
  terms?: string;
  adjustments?: AdjustmentItem[];
  advances?: AdjustmentItem[];
  totalAmount?: number;
  // Payment Instruction specific fields
  icoNumbers?: string;
  attachedDocuments?: string[];
  bankAccountId?: string;
  signerName?: string;
  signerTitle?: string;
}