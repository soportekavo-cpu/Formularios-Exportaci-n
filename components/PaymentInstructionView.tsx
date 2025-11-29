import React from 'react';
import type { Certificate, BankAccount } from '../types';
import { ArrowLeftIcon, PrintIcon, DownloadIcon } from './Icons';
import { printComponent } from '../utils/printUtils';
import PaymentInstructionPDF from './PaymentInstructionPDF';
import type { CompanyInfo } from '../utils/companyData';

interface PaymentInstructionViewProps {
  certificate: Certificate | null;
  onBack: () => void;
  bankAccounts: BankAccount[];
  logo: string | null;
  companyInfo: CompanyInfo;
}

const PaymentInstructionView: React.FC<PaymentInstructionViewProps> = ({ certificate, onBack, bankAccounts, logo, companyInfo }) => {

  const handlePrint = () => {
    if (certificate) {
      printComponent(
        <PaymentInstructionPDF certificate={certificate} bankAccounts={bankAccounts} logo={logo} companyInfo={companyInfo} />, 
        `PaymentInstruction-${certificate.contractNo || certificate.id}`,
        { saveOnly: false, orientation: 'portrait', showFooter: true, companyInfo }
      );
    }
  };
  
  const handleSave = () => {
    if (certificate) {
       printComponent(
        <PaymentInstructionPDF certificate={certificate} bankAccounts={bankAccounts} logo={logo} companyInfo={companyInfo} />, 
        `PaymentInstruction-${certificate.contractNo || certificate.id}`,
        { saveOnly: true, orientation: 'portrait', showFooter: true, companyInfo }
      );
    }
  };

  if (!certificate) {
    return (
      <div className="p-8 text-center">
        <p>Instrucciones de Pago no encontradas.</p>
        <button onClick={onBack} className="mt-4 text-primary hover:text-primary/80">Volver a la lista</button>
      </div>
    );
  }
  
  const isProben = certificate.company === 'proben';

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  };
  
  const formatNumber = (num?: number | '') => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(num) || 0);

  const selectedBank = bankAccounts.find(b => b.id === certificate.bankAccountId);

  return (
    <div className="bg-background min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto mb-6 print:hidden">
        <div className="flex justify-between items-center">
            <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80 bg-card px-4 py-2 rounded-lg shadow-sm border"><ArrowLeftIcon className="w-5 h-5" />Volver</button>
            <div className="flex items-center gap-x-3">
                <button onClick={handleSave} className="inline-flex items-center gap-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg shadow-sm"><DownloadIcon className="w-5 h-5" />Guardar PDF</button>
                <button onClick={handlePrint} className="inline-flex items-center gap-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg shadow-sm"><PrintIcon className="w-5 h-5" />Imprimir</button>
            </div>
        </div>
      </div>
      
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hidden, .print\\:hidden { display: none !important; }
          #payment-paper { box-shadow: none !important; border: none !important; margin: 0; padding: 0; max-width: 100%; width: 100%; border-radius: 0; min-height: 100vh; }
        }
        .signature-line {
          border-top: 1px solid black;
          padding-top: 8px;
        }
      `}</style>

      <div id="payment-paper" className="max-w-5xl mx-auto bg-white text-gray-900 p-16 shadow-lg border rounded-lg text-sm leading-relaxed">
        <header className="text-center mb-16">
            <div className="inline-block">
              <div className="h-24 w-auto flex justify-center items-center mb-2">
                {logo ? (
                    <img src={logo} alt="Company Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                    <div className="w-32 h-full bg-gray-100 rounded text-xs text-gray-400 flex items-center justify-center">Sin logo</div>
                )}
              </div>
              {!isProben && <h2 className="text-xl font-bold tracking-widest">LAS REGIONES</h2>}
              <h1 className="text-3xl font-bold">{companyInfo.name}</h1>
            </div>
        </header>
        
        <p className="text-right mb-16">Guatemala, {formatDate(certificate.certificateDate)}</p>

        <section className="mb-8">
            <p className="font-bold">{certificate.customerName}</p>
            <p className="whitespace-pre-wrap">{certificate.consignee}</p>
        </section>

        <section className="mb-8 space-y-4">
            <p>
                These are the payment instructions for the contract <span className="font-bold">{certificate.contractNo}</span>, ICO <span className="font-bold">{certificate.icoNumbers}</span>, attach the following documents.
            </p>

            <div className="pl-8">
              <ul className="list-disc space-y-1">
                  {(certificate.attachedDocuments || []).map((doc, index) => (
                      <li key={index}>{doc}</li>
                  ))}
              </ul>
            </div>
            
            <p>
                Kindly request you to transfer the amount of <span className="font-bold">US$ {formatNumber(certificate.totalAmount)}</span> to our account as follows:
            </p>
        </section>
        
        {selectedBank && (
            <section className="mb-16 bg-muted p-6 rounded-lg border">
                <table className="w-full text-sm">
                    <tbody>
                        <tr className="align-top"><td className="w-48 pb-2 text-muted-foreground">Beneficiary's Bank:</td><td className="font-semibold pb-2 text-foreground">{selectedBank.bankName}</td></tr>
                        <tr className="align-top"><td className="pb-2 text-muted-foreground">Swift:</td><td className="font-semibold pb-2 text-foreground">{selectedBank.swift}</td></tr>
                        <tr className="align-top"><td className="pb-2 text-muted-foreground">Final Beneficiary's:</td><td className="font-semibold pb-2 text-foreground">{selectedBank.beneficiary}</td></tr>
                        <tr className="align-top"><td className="pb-2 text-muted-foreground">Account number:</td><td className="font-semibold pb-2 text-foreground">{selectedBank.accountNumber}</td></tr>
                        <tr className="align-top"><td className="pb-2 text-muted-foreground">IBAN:</td><td className="font-semibold pb-2 text-foreground">{selectedBank.iban}</td></tr>
                        {selectedBank.notes && (
                           <tr className="align-top"><td className="pt-2 text-muted-foreground border-t">Notes:</td><td className="font-semibold pt-2 border-t whitespace-pre-wrap text-foreground">{selectedBank.notes}</td></tr>
                        )}
                    </tbody>
                </table>
            </section>
        )}

        <p className="mb-32">Sincerely.</p>

        <footer className="text-center">
            <div className="inline-block text-center">
                <div className="h-20"></div>
                <div className="signature-line w-64">
                    <p className="font-bold">{certificate.signerName || 'Yony Roquel.'}</p>
                    <p className="text-xs text-gray-600">{certificate.signerTitle || 'Export Manager.'}</p>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default PaymentInstructionView;