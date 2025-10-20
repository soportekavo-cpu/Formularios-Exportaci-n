import React from 'react';
import type { Certificate } from '../types';
import { ArrowLeftIcon, PrintIcon, DownloadIcon } from './Icons';
import { printComponent } from '../utils/printUtils';
import PackingListPDF from './PackingListPDF';

interface PackingListViewProps {
  certificate: Certificate | null;
  onBack: () => void;
  logo: string | null;
}

const PackingListView: React.FC<PackingListViewProps> = ({ certificate, onBack, logo }) => {

  const handlePrint = () => {
    if (certificate) {
      printComponent(
        <PackingListPDF certificate={certificate} logo={logo} />, 
        `PackingList-${certificate.certificateNumber || certificate.id}`,
        { saveOnly: false, orientation: 'portrait' }
      );
    }
  };
  
  const handleSave = () => {
    if (certificate) {
      printComponent(
        <PackingListPDF certificate={certificate} logo={logo} />, 
        `PackingList-${certificate.certificateNumber || certificate.id}`,
        { saveOnly: true, orientation: 'portrait' }
      );
    }
  };

  if (!certificate) {
    return (
      <div className="p-8 text-center">
        <p>Lista de Empaque no encontrada.</p>
        <button onClick={onBack} className="mt-4 text-indigo-600 hover:text-indigo-800">Volver a la lista</button>
      </div>
    );
  }
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Treat date as local
    return new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(date);
  }
  
  const formatNumber = (num?: number | '', digits = 2) => {
      return new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(num) || 0);
  }
  
  const totalQuantity = (certificate.packages || []).reduce((sum, p) => sum + Number(p.quantity || 0), 0);

  const headerFooterInfo = {
    name: 'DIZANO, S.A.',
    address1: '1ra. Av. A 4-33 Granjas La Joya',
    address2: 'Zona 8 San Miguel Petapa',
    cityState: 'Guatemala, Guatemala.',
    phone: '(502) 2319-8700',
    email: 'exportaciones@cafelasregiones.gt'
  };

  const InfoBlock: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="min-w-0">
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</h3>
        <div className="mt-1 text-[11px] leading-relaxed text-gray-900 whitespace-pre-wrap break-words">{children || '-'}</div>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
        <div className="max-w-5xl mx-auto mb-6 print:hidden">
            <div className="flex justify-between items-center">
                 <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-300"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    Volver
                </button>
                 <div className="flex items-center gap-x-3">
                    <button
                        onClick={handleSave}
                        className="inline-flex items-center gap-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg shadow-sm"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        Guardar PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-sm"
                    >
                        <PrintIcon className="w-5 h-5" />
                        Imprimir
                    </button>
                </div>
            </div>
        </div>
        
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hidden, .print\\:hidden { display: none !important; }
          #packing-list-paper { 
            box-shadow: none !important; 
            border: none !important; 
            margin: 0; 
            padding: 0;
            max-width: 100%; 
            width: 100%;
            border-radius: 0;
            min-height: 100vh;
          }
        }
      `}</style>

      <div id="packing-list-paper" className="max-w-5xl mx-auto bg-white p-8 sm:p-12 shadow-lg border border-gray-200 rounded-lg">
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
            <h2 className="text-xl font-bold text-gray-800">Packing List</h2>
            <p className="text-xs text-gray-500 mt-1">Nº: {certificate.certificateNumber || certificate.id.substring(0, 8).toUpperCase()}</p>
          </section>

          <section className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 mb-6">
              <div>
                <InfoBlock label="Consignee">{certificate.consignee}</InfoBlock>
              </div>
              <div>
                {certificate.notify && <InfoBlock label="Notify">{certificate.notify}</InfoBlock>}
              </div>
              <div>
                {certificate.packingPlace && <InfoBlock label="Packing Place">{certificate.packingPlace}</InfoBlock>}
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-lg border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                    <InfoBlock label="Packing Date">{formatDate(certificate.certificateDate)}</InfoBlock>
                    <InfoBlock label="Bill of Lading No.">{certificate.billOfLadingNo}</InfoBlock>
                    <InfoBlock label="Container No.">{certificate.containerNo}</InfoBlock>
                    <InfoBlock label="Shipping Line">{certificate.shippingLine}</InfoBlock>
                    <InfoBlock label="Seal No.">{certificate.sealNo}</InfoBlock>
                    <InfoBlock label="Destination">{certificate.destination}</InfoBlock>
                    <InfoBlock label="Product">{certificate.product}</InfoBlock>
                    <InfoBlock label="Contract No.">{certificate.contractNo}</InfoBlock>
                </div>
            </div>
          </section>

          <main>
            <div className="flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full table-fixed">
                    <thead className="border-b border-gray-300">
                      <tr>
                        <th scope="col" className="py-2 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-0 w-[5%]">No.</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-900 w-[20%]">MARKS</th>
                        <th scope="col" className="px-2 py-2 text-left text-xs font-semibold text-gray-900 w-[12%]">TYPE</th>
                        <th scope="col" className="px-2 py-2 text-right text-xs font-semibold text-gray-900 w-[8%]">QUANTITY</th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-gray-900 w-[20%] whitespace-nowrap">WEIGHT PER ITEM (KG)</th>
                        <th scope="col" className="py-2 pl-3 pr-4 text-right text-xs font-semibold text-gray-900 sm:pr-0 w-[15%]">NET WEIGHT (KG)</th>
                        <th scope="col" className="py-2 pl-3 pr-4 text-right text-xs font-semibold text-gray-900 sm:pr-0 w-[20%]">GROSS WEIGHT (KG)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(certificate.packages || []).map((pkg, index) => (
                        <tr key={pkg.id}>
                          <td className="whitespace-nowrap py-2 pl-4 pr-3 text-xs text-gray-500 sm:pl-0">{index + 1}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">{pkg.marks}</td>
                          <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-500">{pkg.type}</td>
                          <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-500 text-right">{pkg.quantity}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500 text-right">{formatNumber(pkg.unitWeight)}</td>
                          <td className="whitespace-nowrap py-2 pl-3 pr-4 text-xs font-medium text-gray-900 sm:pr-0 text-right">{formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.unitWeight) || 0))}</td>
                          <td className="whitespace-nowrap py-2 pl-3 pr-4 text-xs font-medium text-gray-900 sm:pr-0 text-right">{formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.grossUnitWeight) || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-900">
                        <tr>
                            <td colSpan={3} className="py-3 pr-3 text-right text-sm font-bold text-gray-900">TOTALS:</td>
                            <td className="whitespace-nowrap px-2 py-3 text-right text-sm font-bold text-gray-900">{formatNumber(totalQuantity, 0)}</td>
                            <td></td>
                            <td className="whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm font-bold text-gray-900 sm:pr-0">{formatNumber(certificate.totalNetWeight)}</td>
                            <td className="whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm font-bold text-gray-900 sm:pr-0">{formatNumber(certificate.totalGrossWeight)}</td>
                        </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
             <footer className="mt-24 pt-6 text-sm">
                <div className="w-72">
                    <div className="border-t border-black pt-2">
                        <p className="font-semibold text-sm text-gray-900">{certificate.exporterName}</p>
                        <p className="text-xs text-gray-600">Exports.</p>
                    </div>
                </div>
            </footer>
             <div className="text-center mt-6 text-sm font-semibold text-gray-800">
                CLEAN ON BOARD
            </div>
          </main>
      </div>
    </div>
  );
};

export default PackingListView;