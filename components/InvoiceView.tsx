import React from 'react';
import type { Certificate } from '../types';
import { ArrowLeftIcon, PrintIcon, DownloadIcon } from './Icons';
import { printComponent } from '../utils/printUtils';
import InvoicePDF from './InvoicePDF';
import { numberToWords } from '../utils/numberToWords';

interface InvoiceViewProps {
  certificate: Certificate | null;
  onBack: () => void;
  logo: string | null;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ certificate, onBack, logo }) => {

  const handlePrint = () => {
    if (certificate) {
      printComponent(
        <InvoicePDF certificate={certificate} logo={logo} />, 
        `Invoice-${certificate.invoiceNo || certificate.id}`,
        { saveOnly: false, orientation: 'portrait' }
      );
    }
  };
  
  const handleSave = () => {
    if (certificate) {
       printComponent(
        <InvoicePDF certificate={certificate} logo={logo} />, 
        `Invoice-${certificate.invoiceNo || certificate.id}`,
        { saveOnly: true, orientation: 'portrait' }
      );
    }
  };

  if (!certificate) {
    return (
      <div className="p-8 text-center">
        <p>Invoice no encontrado.</p>
        <button onClick={onBack} className="mt-4 text-indigo-600 hover:text-indigo-800">Volver a la lista</button>
      </div>
    );
  }
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const formatNumber = (num?: number | '') => {
      return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(num) || 0);
  }
  
  const headerFooterInfo = {
    name: 'DIZANO, S.A.',
    address1: '1ra. Av. A 4-33 Granjas La Joya',
    address2: 'Zona 8 San Miguel Petapa',
    cityState: 'Guatemala, Guatemala.',
    phone: '(502) 2319-8700',
    email: 'exportaciones@cafelasregiones.gt'
  };

  const subtotal = (certificate.packages || []).reduce((sum, p) => sum + (Number(p.quantity) || 0) * (Number(p.unitValue) || 0), 0);
  
  const InfoBlock: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
    <div className={className}>
      <p className="text-sm font-bold text-gray-500 uppercase">{label}</p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{children}</p>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto mb-6 print:hidden">
        <div className="flex justify-between items-center">
            <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-300"><ArrowLeftIcon className="w-5 h-5" />Volver</button>
            <div className="flex items-center gap-x-3">
                <button onClick={handleSave} className="inline-flex items-center gap-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg shadow-sm"><DownloadIcon className="w-5 h-5" />Guardar PDF</button>
                <button onClick={handlePrint} className="inline-flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-sm"><PrintIcon className="w-5 h-5" />Imprimir</button>
            </div>
        </div>
      </div>
      
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hidden, .print\\:hidden { display: none !important; }
          #invoice-paper { box-shadow: none !important; border: none !important; margin: 0; padding: 0; max-width: 100%; width: 100%; border-radius: 0; min-height: 100vh; }
        }
      `}</style>

      <div id="invoice-paper" className="max-w-5xl mx-auto bg-white p-12 shadow-lg border border-gray-200 rounded-lg text-[#0d223f]">
        <header className="flex justify-between items-center">
          <div className="flex flex-col items-center">
              <div className="h-20 w-20 flex items-center justify-center p-1">
                  {logo ? (
                      <img src={logo} alt="Company Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                      <div className="h-full w-full border-4 border-blue-500 rounded-xl"></div>
                  )}
              </div>
              <h2 className="text-sm font-bold tracking-[0.1em] mt-2" style={{ color: '#1f2937' }}>
                  LAS REGIONES
              </h2>
          </div>
          <div className="text-right text-[10px] text-gray-600 space-y-0.5">
              <p className="font-bold text-xs text-gray-800">{headerFooterInfo.name}</p>
              <p>{headerFooterInfo.address1}, {headerFooterInfo.address2}</p>
              <p>{headerFooterInfo.cityState}</p>
              <p>P: {headerFooterInfo.phone}</p>
              <p>E: {headerFooterInfo.email}</p>
          </div>
        </header>
        <div className="my-6 border-t border-gray-300"></div>
        
        <section className="text-center my-4">
          <h2 className="text-xl font-bold text-gray-800">INVOICE</h2>
          <p className="text-xs font-bold text-red-600 mt-1">NO: {certificate.invoiceNo}</p>
        </section>

        <section className="grid grid-cols-2 gap-10 mt-6">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase">Bill To:</p>
            {certificate.customerName && <p className="text-lg font-bold text-gray-800">{certificate.customerName}</p>}
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{certificate.consignee}</p>
          </div>
          <div className="text-right"><InfoBlock label="Date:">{formatDate(certificate.certificateDate)}</InfoBlock></div>
        </section>
        
        <section className="mt-6 p-3 bg-gray-50 rounded-md border border-gray-200">
            <div className="grid grid-cols-4 gap-4">
                <div>
                    <p className="text-sm font-bold text-gray-500 uppercase">Contract No.</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{certificate.contractNo}</p>
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-500 uppercase">Shipped Via.</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{certificate.shippedVia}</p>
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-500 uppercase">BILL OF LADING.</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{certificate.billOfLadingNo}</p>
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-500 uppercase">Terms.</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{certificate.terms}</p>
                </div>
            </div>
        </section>

        {certificate.observations && (
            <section className="mt-6">
                <InfoBlock label="Observations">
                    {certificate.observations}
                </InfoBlock>
            </section>
        )}

        <main className="mt-8">
            <table className="w-full">
                <thead style={{ backgroundColor: '#0d223f', color: 'white' }}>
                    <tr>
                        <th className="p-3 text-left font-bold text-sm" style={{width: '10%', borderRight: '1px solid #374151'}}>QTY</th>
                        <th className="p-3 text-left font-bold text-sm" style={{width: '55%', borderRight: '1px solid #374151'}}>DESCRIPTION</th>
                        <th className="p-3 text-right font-bold text-sm" style={{width: '15%', borderRight: '1px solid #374151'}}>UNIT VALUE</th>
                        <th className="p-3 text-right font-bold text-sm" style={{width: '20%'}}>AMOUNT</th>
                    </tr>
                </thead>
                <tbody>
                    {(certificate.packages || []).map(pkg => (
                        <tr key={pkg.id} className="border-b">
                            <td className="p-3 align-top text-gray-800">{pkg.quantity}</td>
                            <td className="p-3 align-top break-words">
                                <p className="font-bold text-gray-900 whitespace-pre-wrap">{pkg.description}</p>
                                {pkg.partidaNo && <p className="text-sm text-gray-500 mt-1">OIC: {pkg.partidaNo}</p>}
                            </td>
                            <td className="p-3 align-top text-right text-gray-800">${formatNumber(pkg.unitValue)}</td>
                            <td className="p-3 align-top text-right font-bold text-gray-800">${formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.unitValue) || 0))}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>

        <footer className="mt-8 flex justify-between items-end">
            <div className="text-sm w-1/2">
                <InfoBlock label="Total in words:">
                    <span>{numberToWords(certificate.totalAmount)}</span>
                </InfoBlock>
            </div>
            <div className="w-1/3 space-y-3 text-sm">
                <div className="flex justify-between font-bold"><p>Subtotal:</p><p>${formatNumber(subtotal)}</p></div>
                {(certificate.adjustments?.length || 0) > 0 && (
                    <div className="border-b pb-2">
                        <p className="font-bold">Adjustments:</p>
                        {certificate.adjustments?.map(adj => adj.amount ? (
                             <div key={adj.id} className="flex justify-between text-xs text-gray-600 pl-2">
                                <p>{adj.description}</p>
                                <p className="text-red-500">-${formatNumber(Math.abs(Number(adj.amount)))}</p>
                             </div>
                        ) : null)}
                    </div>
                )}
                 {(certificate.advances?.length || 0) > 0 && (
                    <div className="border-b pb-2">
                        <p className="font-bold">Advances:</p>
                        {certificate.advances?.map(adv => adv.amount ? (
                             <div key={adv.id} className="flex justify-between text-xs text-gray-600 pl-2">
                                <p>{adv.description}</p>
                                <p className="text-red-500">-${formatNumber(Math.abs(Number(adv.amount)))}</p>
                             </div>
                        ) : null)}
                    </div>
                )}
                <div className="flex justify-between font-extrabold text-lg pt-2 border-t-2 border-current"><p>Total:</p><p>${formatNumber(certificate.totalAmount)}</p></div>
            </div>
        </footer>
        <div className="text-center mt-16 text-gray-500 text-sm">Thank you for your business.</div>
      </div>
    </div>
  );
};

export default InvoiceView;