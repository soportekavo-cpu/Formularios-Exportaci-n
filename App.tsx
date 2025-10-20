import React, { useState, useMemo } from 'react';
import type { Certificate, CertificateType, PackageItem, BankAccount } from './types';
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
import { ExclamationTriangleIcon } from './components/Icons';
import { printComponent } from './utils/printUtils';
import CertificatePDF from './components/CertificatePDF';
import PackingListPDF from './components/PackingListPDF';
import CartaPortePDF from './components/CartaPortePDF';
import InvoicePDF from './components/InvoicePDF';
import PaymentInstructionPDF from './components/PaymentInstructionPDF';

type View = 'list' | 'form' | 'view' | 'new_shipment';

const DeleteConfirmationModal = ({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) => (
    <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">Eliminar Documento</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">¿Estás seguro de que quieres eliminar este documento? Esta acción no se puede deshacer.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <button type="button" onClick={onConfirm} className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto">Eliminar</button>
                        <button type="button" onClick={onCancel} className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);


const App: React.FC = () => {
  const [storedCertificates, setCertificates] = useLocalStorage<Certificate[]>('certificates', []);
  const [bankAccounts, setBankAccounts] = useLocalStorage<BankAccount[]>('bankAccounts', [
    {
      id: 'bi-gt-1',
      bankName: 'Banco Industrial, S.A. (Guatemala)',
      swift: 'INDLGTGC',
      beneficiary: 'Dizano, S.A.',
      accountNumber: '650-000601-7',
      iban: 'GT80-INDL-0201-0000-0065-0000-6017',
      notes: ''
    }
  ]);
  const [logo, setLogo] = useLocalStorage<string | null>('companyLogo', null);
  
  const certificates = Array.isArray(storedCertificates) ? storedCertificates : [];

  const [currentView, setCurrentView] = useState<View>('list');
  const [activeCertType, setActiveCertType] = useState<CertificateType>('weight');
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [duplicateSourceId, setDuplicateSourceId] = useState<string | null>(null);

  const handleAdd = () => {
    setSelectedCertificateId(null);
    setDuplicateSourceId(null);
    if (activeCertType === 'porte' || activeCertType === 'invoice') {
      setCurrentView('form');
    } else {
      setCurrentView('new_shipment');
    }
  };

  const handleEdit = (id: string) => {
    setSelectedCertificateId(id);
    setDuplicateSourceId(null);
    setCurrentView('form');
  };
  
  const handleView = (id: string) => {
    setSelectedCertificateId(id);
    setCurrentView('view');
  };

  const handleDuplicate = (id: string) => {
    setDuplicateSourceId(id);
    setSelectedCertificateId(null);
    setCurrentView('form');
  };

  const handleCreatePaymentInstruction = (invoiceId: string) => {
    setDuplicateSourceId(invoiceId);
    setSelectedCertificateId(null);
    setActiveCertType('payment');
    setCurrentView('form');
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteConfirmId(id);
  };
  
  const confirmDelete = () => {
    if(deleteConfirmId) {
       setCertificates(certs => certs.filter(c => c.id !== deleteConfirmId));
       setDeleteConfirmId(null);
    }
  };

  const cancelDelete = () => {
      setDeleteConfirmId(null);
  }

  const handleCancel = () => {
    setSelectedCertificateId(null);
    setDuplicateSourceId(null);
    setCurrentView('list');
  };

  const handleSubmitForm = (data: Certificate) => {
    let savedCertificate: Certificate | undefined;
    
    if (data.id) {
      savedCertificate = data;
      setCertificates(certs => certs.map(c => (c.id === data.id ? data : c)));
    } else {
      const isInvoice = activeCertType === 'invoice';
      const isPayment = activeCertType === 'payment';

      const newCert: Certificate = { 
        ...data, 
        id: new Date().toISOString(), 
        type: activeCertType,
        certificateDate: data.certificateDate || new Date().toISOString().split('T')[0],
        packages: data.packages || [], // Ensure packages is not undefined
      };
      
      if (!isPayment) {
        const prefix = isInvoice ? 'EXP' : activeCertType === 'porte' ? 'CP' : 'CERT';
        const currentYear = new Date().getFullYear().toString();
        
        const certsOfType = certificates.filter(c => c.type === activeCertType);
        const numberField = isInvoice ? 'invoiceNo' : 'certificateNumber';

        const certsThisYear = certsOfType.filter(c => {
            const num = c[numberField as keyof Certificate] as string | undefined;
            return num && num.startsWith(`${prefix}-${currentYear}`);
        });
        
        let maxCounter = 0;
        certsThisYear.forEach(c => {
            const num = c[numberField as keyof Certificate] as string | undefined;
            if (num) {
              const parts = num.split('-');
              if (parts.length === 3) {
                  const counter = parseInt(parts[2], 10);
                  if (!isNaN(counter) && counter > maxCounter) {
                      maxCounter = counter;
                  }
              }
            }
        });

        const newCounter = maxCounter + 1;
        const newCertificateNumber = `${prefix}-${currentYear}-${newCounter.toString().padStart(3, '0')}`;
        
        if (isInvoice) {
          newCert.invoiceNo = newCertificateNumber;
        } else {
          newCert.certificateNumber = newCertificateNumber;
        }
      }
      
      setCertificates(certs => [...certs, newCert]);
      savedCertificate = newCert;
    }
    
    if(savedCertificate) {
       if (savedCertificate.type === 'packing') {
          printComponent(
            <PackingListPDF certificate={savedCertificate} logo={logo} />,
            `PackingList-${savedCertificate.certificateNumber}`,
            { orientation: 'portrait' }
          );
        } else if (savedCertificate.type === 'porte') {
          printComponent(
            <CartaPortePDF certificate={savedCertificate} logo={logo} />,
            `CartaPorte-${savedCertificate.certificateNumber}`,
            { orientation: 'portrait' }
          );
        } else if (savedCertificate.type === 'invoice') {
           printComponent(
            <InvoicePDF certificate={savedCertificate} logo={logo} />,
            `Invoice-${savedCertificate.invoiceNo}`,
            { orientation: 'portrait', showFooter: true }
          );
        } else if (savedCertificate.type === 'payment') {
          printComponent(
            <PaymentInstructionPDF certificate={savedCertificate} bankAccounts={bankAccounts} logo={logo} />,
            `PaymentInstruction-${savedCertificate.contractNo}`,
            { orientation: 'portrait', showFooter: true }
          )
        }
        else {
          const certificateTypeForFilename = savedCertificate.type === 'quality' ? 'Quality' : 'Weight';
          printComponent(
            <CertificatePDF certificate={savedCertificate} logo={logo} />,
            `${certificateTypeForFilename}-Certificate-${savedCertificate.certificateNumber}`
          );
        }
    }
    
    setCurrentView('list');
    setSelectedCertificateId(null);
    setDuplicateSourceId(null);
  };
  
  const handleCreateShipment = (data: Omit<Certificate, 'id' | 'type' | 'certificateNumber'>, types: CertificateType[]) => {
      const createdCerts: Certificate[] = [];
      let newCertificates = [...certificates];

      types.forEach(type => {
        const prefix = 'CERT'; 
        const currentYear = new Date().getFullYear().toString();
        const certsThisYear = newCertificates.filter(c => c.certificateNumber && c.certificateNumber.startsWith(`${prefix}-${currentYear}`));
        
        let maxCounter = 0;
        certsThisYear.forEach(c => {
            const parts = c.certificateNumber!.split('-');
            if (parts.length === 3) {
                const counter = parseInt(parts[2], 10);
                if (!isNaN(counter) && counter > maxCounter) {
                    maxCounter = counter;
                }
            }
        });

        const newCounter = maxCounter + 1;
        const newCertificateNumber = `${prefix}-${currentYear}-${newCounter.toString().padStart(3, '0')}`;

        const newCert: Certificate = {
            ...data,
            id: `${new Date().toISOString()}-${type}`,
            type: type,
            certificateNumber: newCertificateNumber,
            certificateDate: data.certificateDate || new Date().toISOString().split('T')[0],
        };
        
        if (type !== 'packing') {
            delete newCert.contractNo;
            delete newCert.sealNo;
            delete newCert.packingPlace;
        }
        if (type === 'packing') {
            delete newCert.shipper;
        }

        createdCerts.push(newCert);
        newCertificates.push(newCert);
      });

      setCertificates(newCertificates);

      createdCerts.forEach(cert => {
          if (cert.type === 'packing') {
            printComponent(
                <PackingListPDF certificate={cert} logo={logo} />,
                `PackingList-${cert.certificateNumber}`,
                { orientation: 'portrait' }
            );
          } else {
            const certificateTypeForFilename = cert.type === 'quality' ? 'Quality' : 'Weight';
            printComponent(
                <CertificatePDF certificate={cert} logo={logo} />,
                `${certificateTypeForFilename}-Certificate-${cert.certificateNumber}`
            );
          }
      });
      
      setCurrentView('list');
  };

  const initialFormData = useMemo((): Partial<Certificate> => {
    if (activeCertType === 'payment') {
      if (duplicateSourceId) {
        const sourceInvoice = certificates.find(c => c.id === duplicateSourceId);
        if (sourceInvoice) {
          const formatNumber = (num?: number | '') => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(num) || 0);

          const icoNumbers = (sourceInvoice.packages || [])
            .map(p => p.partidaNo)
            .filter(Boolean)
            .join(', ');

          const attachedDocuments = [
            `Commercial Invoice No. ${sourceInvoice.invoiceNo}, US$${formatNumber(sourceInvoice.totalAmount)}`,
            'SeaWaybill',
            'Phytosanitary Certificate',
            'Certificate of Origin',
            'Weight Certificate',
            'Quality Certificate',
            'Packing List',
            'Fumigation Certificate',
          ];
          
          const defaultBankId = bankAccounts.length > 0 ? bankAccounts[0].id : undefined;

          return {
            type: 'payment',
            certificateDate: new Date().toISOString().split('T')[0],
            customerName: sourceInvoice.customerName,
            consignee: sourceInvoice.consignee,
            contractNo: sourceInvoice.contractNo,
            icoNumbers: icoNumbers,
            totalAmount: sourceInvoice.totalAmount,
            attachedDocuments: attachedDocuments,
            invoiceNo: sourceInvoice.invoiceNo,
            packages: [],
            bankAccountId: defaultBankId,
            signerName: 'Yony Roquel.',
            signerTitle: 'Export Manager.',
          };
        }
      }
      if (selectedCertificateId) return certificates.find(c => c.id === selectedCertificateId) || {};
      return { 
        type: 'payment', 
        attachedDocuments: [], 
        packages: [], 
        bankAccountId: bankAccounts.length > 0 ? bankAccounts[0].id : undefined,
        signerName: 'Yony Roquel.',
        signerTitle: 'Export Manager.',
      };
    }

    if (duplicateSourceId) {
        const sourceCert = certificates.find(c => c.id === duplicateSourceId);
        if (sourceCert) {
            const { id, certificateNumber, invoiceNo, ...rest } = sourceCert;

            const duplicatedPackages = sourceCert.packages.map(pkg => ({ ...pkg, id: new Date().toISOString() + Math.random() }));
            const duplicatedAdjustments = sourceCert.adjustments?.map(adj => ({ ...adj, id: new Date().toISOString() + Math.random() }));
            const duplicatedAdvances = sourceCert.advances?.map(adv => ({ ...adv, id: new Date().toISOString() + Math.random() }));
            
            const duplicatedData: Partial<Certificate> = {
                ...rest,
                packages: duplicatedPackages,
                adjustments: duplicatedAdjustments,
                advances: duplicatedAdvances,
                type: activeCertType, 
                certificateDate: '',
                shipmentDate: '',
                billOfLadingNo: '',
                containerNo: '',
            }

            if (activeCertType === 'packing') delete duplicatedData.shipper;
            return duplicatedData;
        }
    }

    if (selectedCertificateId) return certificates.find(c => c.id === selectedCertificateId) || {};
    
    if(activeCertType === 'invoice') {
        const defaultInvPackage: PackageItem = { id: new Date().toISOString(), type: 'qqs.', quantity: '', unitWeight: '', marks: '', description: '', partidaNo: '', unitValue: '' };
        return {
            type: 'invoice',
            certificateDate: new Date().toISOString().split('T')[0],
            consignee: '', // Bill To
            billOfLadingNo: '',
            packages: [defaultInvPackage],
            adjustments: [],
            advances: [],
            observations: '',
        };
    }
    
    const commonDefaults = { product: 'GREEN COFFEE, CROP 2024/2025' };
    
    if (activeCertType === 'packing') {
        const defaultPackingPackage: PackageItem = { id: new Date().toISOString(), type: 'BAGS', quantity: '', unitWeight: '', grossUnitWeight: '', marks: '' };
         return {
            ...commonDefaults, type: 'packing',
            consignee: `Jacobs Douwe Egberts C&T Utrecht\nVleutensevaart 35 Utrecht\n3532 AD, The Netherlands`,
            notify: `Jacobs Douwe Egberts C&T Utrecht\nVleutensevaart 35 Utrecht\n3532 AD, The Netherlands`,
            packages: [defaultPackingPackage],
            packingPlace: 'Jacobs Douwe Egberts C&T Utrecht Vleutensevaart 35, 3532 AD, The Netherlands',
            exporterName: 'Yony Roquel',
        };
    }
    
    if (activeCertType === 'porte') {
        const defaultPortePackage: PackageItem = { id: new Date().toISOString(), type: 'SACO', quantity: '', unitWeight: '', tareUnitWeight: '', grossUnitWeight: '', marks: '', contains: 'CAFE ORO' };
        return {
            type: 'porte', certificateDate: new Date().toISOString().split('T')[0], place: 'Guatemala', consignee: 'PUERTO BARRIOS',
            transportCompany: 'Transportes Nexus Cargo, S.A.', driverName: 'JONATAN MAURICIO DIAZ CRUZ', driverLicense: '2277 35579 0101',
            licensePlate: 'C133BWG', shippingLine: 'GARDINER, 5SF V.541S', destination: 'PUERTO BARRIOS', sealNo: 'GT0079885',
            containerNo: 'MRKU8488533', observations: `EN CASO DE EMERGENCIA LLAMAR AL 5417-5500 O 3761-2791<br>ENVASADO EN <b>GRAINPRO</b>`,
            packages: [defaultPortePackage]
        }
    }

    const certDefaults = {
        ...commonDefaults,
        shipper: `DIZANO, S.A.\n1RA. AV. A 4-33 GRANJAS LA JOYA ZONA 8, SAN MIGUEL PETAPA, GUATEMALA, GUATEMALA`,
        consignee: `Jacobs Douwe Egberts C&T Utrecht\nVleutensevaart 35 Utrecht\n3532 AD, The Netherlands`,
        notify: `Jacobs Douwe Egberts C&T Utrecht\nVleutensevaart 35 Utrecht\n3532 AD, The Netherlands`,
        exporterName: 'Yony Roquel',
    };

    if (activeCertType === 'quality') {
        const defaultQualityPackage: PackageItem = { id: new Date().toISOString(), type: 'BAGS', quantity: '', unitWeight: '', marks: '', quality: 'SHB EP Caturra Fully Washed' };
        return { ...certDefaults, type: 'quality', packages: [defaultQualityPackage] };
    }

    const defaultWeightPackage: PackageItem = { id: new Date().toISOString(), type: 'BAGS', quantity: '', unitWeight: '', marks: '' };
    return { ...certDefaults, type: 'weight', packages: [defaultWeightPackage] };
  }, [activeCertType, selectedCertificateId, duplicateSourceId, certificates, bankAccounts]);
  
  const tabs: { name: string, type: CertificateType }[] = [
      { name: 'Certificados de Peso', type: 'weight' },
      { name: 'Certificados de Calidad', type: 'quality' },
      { name: 'Listas de Empaque', type: 'packing' },
      { name: 'Cartas de Porte', type: 'porte' },
      { name: 'Invoices', type: 'invoice' },
      { name: 'Instrucciones de Pago', type: 'payment' },
  ];

  const selectedCertificate = certificates.find(c => c.id === selectedCertificateId) || null;

  const renderCurrentView = () => {
    switch (currentView) {
        case 'new_shipment':
            return <ShipmentForm onSubmit={handleCreateShipment} onCancel={handleCancel} />;
        case 'form':
            if (activeCertType === 'invoice') {
                return <InvoiceForm initialData={initialFormData} onSubmit={handleSubmitForm} onCancel={handleCancel} />;
            }
             if (activeCertType === 'payment') {
                return <PaymentInstructionForm initialData={initialFormData} onSubmit={handleSubmitForm} onCancel={handleCancel} bankAccounts={bankAccounts} setBankAccounts={setBankAccounts} />;
            }
            return <CertificateForm initialData={initialFormData} onSubmit={handleSubmitForm} onCancel={handleCancel} />;
        case 'view':
            if (selectedCertificate?.type === 'packing') return <PackingListView certificate={selectedCertificate} onBack={handleCancel} logo={logo} />;
            if (selectedCertificate?.type === 'porte') return <CartaPorteView certificate={selectedCertificate} onBack={handleCancel} logo={logo} />;
            if (selectedCertificate?.type === 'invoice') return <InvoiceView certificate={selectedCertificate} onBack={handleCancel} logo={logo} />;
            if (selectedCertificate?.type === 'payment') return <PaymentInstructionView certificate={selectedCertificate} onBack={handleCancel} bankAccounts={bankAccounts} logo={logo} />;
            return <CertificateView certificate={selectedCertificate} onBack={handleCancel} logo={logo} />;
        case 'list':
        default:
            return (
                <div className="p-4 sm:p-6 lg:p-8">
                    <LogoUploader logo={logo} setLogo={setLogo} />
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.name}
                                    onClick={() => setActiveCertType(tab.type)}
                                    className={`${
                                        tab.type === activeCertType
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                                    aria-current={tab.type === activeCertType ? 'page' : undefined}
                                >
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <CertificateList
                      certificates={certificates.filter(c => c.type === activeCertType)}
                      activeCertType={activeCertType}
                      onAdd={handleAdd}
                      onEdit={handleEdit}
                      onView={handleView}
                      onDelete={handleDeleteRequest}
                      onDuplicate={handleDuplicate}
                      onCreatePaymentInstruction={handleCreatePaymentInstruction}
                    />
                </div>
            )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {deleteConfirmId && <DeleteConfirmationModal onConfirm={confirmDelete} onCancel={cancelDelete} />}
      {renderCurrentView()}
    </div>
  );
};

export default App;