import React from 'react';
import type { Certificate } from '../types';
import { ArrowLeftIcon, PrintIcon, DownloadIcon } from './Icons';
import { printComponent } from '../utils/printUtils';
import CertificatePDF from './CertificatePDF';
import { getCompanyInfo } from '../utils/companyData';

interface CertificateViewProps {
  certificate: Certificate | null;
  onBack: () => void;
  logo: string | null;
}

const CertificateView: React.FC<CertificateViewProps> = ({ certificate, onBack, logo }) => {

  const companyInfo = getCompanyInfo(certificate?.company);

  const handlePrint = () => {
    if (certificate) {
      const typeName = certificate.type === 'quality' ? 'Quality' : 'Weight';
      printComponent(
        <CertificatePDF certificate={certificate} logo={logo} />, 
        `${typeName}-Certificate-${certificate.certificateNumber || certificate.id}`,
        { saveOnly: false, showFooter: true, companyInfo }
      );
    }
  };
  
  const handleSave = () => {
    if (certificate) {
      const typeName = certificate.type === 'quality' ? 'Quality' : 'Weight';
      printComponent(
        <CertificatePDF certificate={certificate} logo={logo} />, 
        `${typeName}-Certificate-${certificate.certificateNumber || certificate.id}`,
        { saveOnly: true, showFooter: true, companyInfo }
      );
    }
  };

  if (!certificate) {
    return (
      <div className="p-8 text-center">
        <p>Certificado no encontrado.</p>
        <button onClick={onBack} className="mt-4 text-indigo-600 hover:text-indigo-800">Volver a la lista</button>
      </div>
    );
  }
  
  const isProben = certificate.company === 'proben';

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Treat date as local
    return new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(date);
  }

  // FIX: Added a robust number formatting function to handle potentially non-numeric values.
  const formatNumber = (value: unknown): string => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0);
  };
  
  const subtotals = (certificate.packages || []).reduce((acc, pkg) => {
      const type = (pkg.type || '').toUpperCase();
      const totalWeight = (Number(pkg.quantity) || 0) * (Number(pkg.unitWeight) || 0);
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += totalWeight;
      return acc;
  }, {} as Record<string, number>);

  const InfoBlock: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="min-w-0">
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</h3>
        <div className="mt-1 text-[11px] leading-relaxed text-gray-900 whitespace-pre-wrap break-words">{children}</div>
    </div>
  );
  
  const isQualityCert = certificate.type === 'quality';
  const isWeightCert = certificate.type === 'weight';

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
          #certificate-paper { 
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

      <div id="certificate-paper" className="max-w-5xl mx-auto bg-white p-8 sm:p-12 shadow-lg border border-gray-200 rounded-lg">
          {/* Header */}
          {isWeightCert || isQualityCert ? (
            <>
              <header className="flex justify-between items-center">
                  <div className="flex flex-col items-center">
                      <div className={`flex items-center justify-center p-1 ${isProben ? 'h-20 w-40' : 'h-20 w-20'}`}>
                          {logo ? (
                              <img src={logo} alt="Company Logo" className="max-h-full max-w-full object-contain" />
                          ) : (
                              <div className={`h-full w-full border-4 border-blue-500 ${isProben ? '' : 'rounded-xl'}`}></div>
                          )}
                      </div>
                      {!isProben && (
                        <h2 className="text-sm font-bold tracking-[0.1em] mt-2" style={{ color: '#1f2937' }}>
                            LAS REGIONES
                        </h2>
                      )}
                  </div>
                  <div className="text-right text-[10px] text-gray-600 space-y-0.5">
                      <p className="font-bold text-xs text-gray-800">{companyInfo.name}</p>
                      <p>{companyInfo.address1}, {companyInfo.address2}</p>
                      <p>{companyInfo.cityState}</p>
                      <p>P: {companyInfo.phone}</p>
                      <p>E: {companyInfo.email}</p>
                  </div>
              </header>
              <div className="my-6 border-t border-gray-300"></div>
            </>
          ) : (
            <header className="flex justify-between items-start pb-6 border-b border-gray-200">
              <div className="w-24"></div>
              <div className="text-right text-[10px] text-gray-600 space-y-0.5 pt-2">
                  <p className="font-bold text-xs text-gray-800">{companyInfo.name}</p>
                  <p>{companyInfo.address1}, {companyInfo.address2}</p>
                  <p>{companyInfo.cityState}</p>
                  <p>P: {companyInfo.phone}</p>
                  <p>E: {companyInfo.email}</p>
              </div>
            </header>
          )}
          
          <section className="text-center my-4">
            <h2 className="text-xl font-bold text-gray-800">{isQualityCert ? 'Quality Certificate' : 'Weight Certificate'}</h2>
            <p className="text-xs text-gray-500 mt-1">Nº: {certificate.certificateNumber || certificate.id.substring(0, 8).toUpperCase()}</p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <InfoBlock label="Seller">{certificate.shipper}</InfoBlock>
            <InfoBlock label="Consignee">{certificate.consignee}</InfoBlock>
            <InfoBlock label="Notify">{certificate.notify}</InfoBlock>
          </section>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 p-4 bg-slate-50 rounded-lg border">
            <InfoBlock label="Certificate Date">{formatDate(certificate.certificateDate)}</InfoBlock>
            <InfoBlock label="Shipment Date">{formatDate(certificate.shipmentDate)}</InfoBlock>
            <InfoBlock label="Bill of Lading No.">{certificate.billOfLadingNo}</InfoBlock>
            <InfoBlock label="Container No.">{certificate.containerNo}</InfoBlock>
            <InfoBlock label="Shipping Line">{certificate.shippingLine}</InfoBlock>
            <InfoBlock label="Destination">{certificate.destination}</InfoBlock>
            <InfoBlock label="Product">{certificate.product}</InfoBlock>
          </section>

          <main>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Details</h3>
            <div className="flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full">
                    <thead className="border-b border-gray-300">
                      <tr>
                        <th scope="col" className="py-2 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-0">TYPE</th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-gray-900">QUANTITY</th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-gray-900">UNIT WEIGHT (KG)</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-900">MARKS</th>
                        {isQualityCert && (
                            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-900">QUALITY</th>
                        )}
                        <th scope="col" className="py-2 pl-3 pr-4 text-right text-xs font-semibold text-gray-900 sm:pr-0">TOTAL WEIGHT (KG)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(certificate.packages || []).map((pkg) => (
                        <tr key={pkg.id}>
                          <td className="whitespace-nowrap py-2 pl-4 pr-3 text-xs font-medium text-gray-900 sm:pl-0">{pkg.type}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500 text-right">{pkg.quantity}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500 text-right">{formatNumber(pkg.unitWeight)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">{pkg.marks}</td>
                          {isQualityCert && (
                              <td className="whitespace-pre-wrap px-3 py-2 text-xs text-gray-500 break-words max-w-xs">{pkg.quality}</td>
                          )}
                          <td className="whitespace-nowrap py-2 pl-3 pr-4 text-xs font-medium text-gray-900 sm:pr-0 text-right">{formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.unitWeight) || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Totals and Signature Block */}
            <div className="mt-6">
                <div className="flex justify-end">
                    <div className="w-full max-w-sm space-y-2">
                        {Object.entries(subtotals).map(([type, total]) => (
                            <div key={type} className="flex justify-between text-xs text-gray-600">
                                <span>TOTAL WEIGHT {type.toUpperCase()}:</span>
                                <span className="font-medium text-gray-700">{formatNumber(total)} KG.</span>
                            </div>
                        ))}
                         <div className="flex justify-between font-bold text-xs text-gray-900 pt-3 mt-3 border-t-2 border-gray-900">
                            <span>TOTAL NET WEIGHT:</span>
                            {/* FIX: Use the formatNumber helper to safely format the totalNetWeight. */}
                            <span>{formatNumber(certificate.totalNetWeight)} KG.</span>
                        </div>
                    </div>
                </div>

                <footer className="mt-16 pt-6 text-sm">
                    <div className="w-72">
                        <div className="border-t border-black pt-2">
                            <p className="font-semibold text-xs text-gray-900">{certificate.exporterName}</p>
                            <p className="text-xs text-gray-600">Exports.</p>
                        </div>
                    </div>
                </footer>
            </div>
          </main>
          <footer className="mt-16 pt-8 text-center text-[10px] text-gray-600 space-y-0.5">
              <div className="w-full h-0.5" style={{ backgroundColor: '#f97316' }}></div>
              <p className="pt-3">{companyInfo.fullAddress}</p>
              <p>PBX: {companyInfo.phone} - e-mail: {companyInfo.email}</p>
          </footer>
      </div>
    </div>
  );
};

export default CertificateView;