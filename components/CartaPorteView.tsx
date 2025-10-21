import React from 'react';
import type { Certificate } from '../types';
import { ArrowLeftIcon, PrintIcon, DownloadIcon } from './Icons';
import { printComponent } from '../utils/printUtils';
import CartaPortePDF from './CartaPortePDF';
import { getCompanyInfo } from '../utils/companyData';

interface CartaPorteViewProps {
  certificate: Certificate | null;
  onBack: () => void;
  logo: string | null;
}

const CartaPorteView: React.FC<CartaPorteViewProps> = ({ certificate, onBack, logo }) => {
  const companyInfo = getCompanyInfo(certificate?.company);

  const handlePrint = () => {
    if (certificate) {
      printComponent(
        <CartaPortePDF certificate={certificate} logo={logo} />, 
        `CartaPorte-${certificate.certificateNumber || certificate.id}`,
        { saveOnly: false, orientation: 'portrait', showFooter: true, companyInfo }
      );
    }
  };
  
  const handleSave = () => {
    if (certificate) {
      printComponent(
        <CartaPortePDF certificate={certificate} logo={logo} />, 
        `CartaPorte-${certificate.certificateNumber || certificate.id}`,
        { saveOnly: true, orientation: 'portrait', showFooter: true, companyInfo }
      );
    }
  };

  if (!certificate) {
    return (
      <div className="p-8 text-center">
        <p>Carta de Porte no encontrada.</p>
        <button onClick={onBack} className="mt-4 text-indigo-600 hover:text-indigo-800">Volver a la lista</button>
      </div>
    );
  }
  
  const isProben = certificate.company === 'proben';

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Treat date as local
    return new Intl.DateTimeFormat('es-GT', { dateStyle: 'long' }).format(date);
  }
  
  const formatNumber = (num?: number | '', digits = 2) => {
      return new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(num) || 0);
  }
  
  const totalPackages = (certificate.packages || []).reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  const totalTare = (certificate.packages || []).reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.tareUnitWeight) || 0)), 0);
  const noteText = "NOTA: El presente envio no debe ser firado por personal de la empresa portuaria, sino que ésta emitirá y entregará al piloto de la unidad de transporte un acuse de recibo de exportación en donde se indicará la cantidad de bultos, peso total recibido, faltantes, excedentes y condiciones en que se recibe la mercaderia para conocimiento v registros del remitente.";

  const InfoBlock: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
    <div className={className}>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</h3>
        <div className="mt-1 text-sm leading-relaxed text-gray-900 break-words">{children || '-'}</div>
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
          #cartaporte-paper { 
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
        .prose-sm { font-size: 0.875rem; line-height: 1.5; }
        .prose-sm b, .prose-sm strong { font-weight: 700; }
        .prose-sm i, .prose-sm em { font-style: italic; }
        .prose-sm u { text-decoration: underline; }
      `}</style>

      <div id="cartaporte-paper" className="max-w-5xl mx-auto bg-white p-8 sm:p-12 shadow-lg border border-gray-200 rounded-lg">
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

        <section className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-xl font-bold text-green-700 tracking-wider">CARTA DE PORTE</h2>
                <p className="text-sm font-semibold text-gray-800">No: {certificate.certificateNumber}</p>
            </div>
             <div className="text-right">
                <InfoBlock label="Lugar y Fecha">
                    {certificate.place}, {formatDate(certificate.certificateDate)}
                </InfoBlock>
            </div>
        </section>
        
        <section className="mb-8 p-4 bg-slate-50 rounded-lg border">
             <InfoBlock label="Consignada A">
                <p className="font-semibold text-base">{certificate.consignee}</p>
             </InfoBlock>
        </section>

         <main>
            <div className="flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full">
                    <thead className="border-b-2 border-gray-400">
                      <tr>
                        <th scope="col" className="py-2.5 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-0">CANTIDAD</th>
                        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900">CLASE</th>
                        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900">MARCAS</th>
                        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900">CONTIENE</th>
                        <th scope="col" className="py-2.5 pl-3 pr-4 text-right text-xs font-semibold text-gray-900 sm:pr-0">P. NETO (KG)</th>
                        <th scope="col" className="py-2.5 pl-3 pr-4 text-right text-xs font-semibold text-gray-900 sm:pr-0">TARA (KG)</th>
                        <th scope="col" className="py-2.5 pl-3 pr-4 text-right text-xs font-semibold text-gray-900 sm:pr-0">P. BRUTO (KG)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(certificate.packages || []).map((pkg) => (
                        <tr key={pkg.id}>
                          <td className="whitespace-nowrap py-2.5 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{formatNumber(pkg.quantity, 0)}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">{pkg.type}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">{pkg.marks}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">{pkg.contains}</td>
                          <td className="whitespace-nowrap py-2.5 pl-3 pr-4 text-sm font-medium text-gray-900 sm:pr-0 text-right">{formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.unitWeight) || 0))}</td>
                          <td className="whitespace-nowrap py-2.5 pl-3 pr-4 text-sm font-medium text-gray-900 sm:pr-0 text-right">{formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.tareUnitWeight) || 0))}</td>
                          <td className="whitespace-nowrap py-2.5 pl-3 pr-4 text-sm font-medium text-gray-900 sm:pr-0 text-right">{formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.grossUnitWeight) || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-400">
                        <tr>
                            <td className="py-3 pr-3 text-left text-sm font-bold text-gray-900">{formatNumber(totalPackages, 0)}</td>
                            <td colSpan={3} className="px-3 py-3 text-left text-sm font-bold text-gray-900">TOTALES</td>
                            <td className="whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm font-bold text-gray-900 sm:pr-0">{formatNumber(certificate.totalNetWeight)}</td>
                            <td className="whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm font-bold text-gray-900 sm:pr-0">{formatNumber(totalTare)}</td>
                            <td className="whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm font-bold text-gray-900 sm:pr-0">{formatNumber(certificate.totalGrossWeight)}</td>
                        </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
        </main>
        
        <section className="mt-8 pt-8 border-t">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Detalles del Transporte</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                <InfoBlock label="Compañía Contratista">{certificate.transportCompany}</InfoBlock>
                <InfoBlock label="Piloto">{certificate.driverName}</InfoBlock>
                <InfoBlock label="Licencia">{certificate.driverLicense}</InfoBlock>
                <InfoBlock label="Placas">{certificate.licensePlate}</InfoBlock>
                <InfoBlock label="Furgon/Plataforma">{certificate.transportUnit}</InfoBlock>
                <InfoBlock label="Contenedor">{certificate.containerNo}</InfoBlock>
                <InfoBlock label="Marchamo">{certificate.sealNo}</InfoBlock>
                <InfoBlock label="Vapor">{certificate.shippingLine}</InfoBlock>
                <InfoBlock label="Descargar En">{certificate.destination}</InfoBlock>
            </div>
        </section>

        {certificate.observations && (
            <section className="mt-8 pt-8 border-t">
                 <InfoBlock label="Observaciones">
                    <div className="prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: certificate.observations || '' }}/>
                 </InfoBlock>
            </section>
        )}
        
        <footer className="mt-40 space-y-12">
            <div className="grid grid-cols-2 gap-16">
              <div className="pt-2 border-t border-gray-400">
                  <p className="text-sm font-semibold">Firma del Remitente</p>
              </div>
               <div className="pt-2 border-t border-gray-400">
                  <p className="text-sm font-semibold">Firma del Piloto</p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 italic">{noteText}</p>
            </div>
        </footer>

        <div className="mt-16 pt-8 text-center text-[10px] text-gray-600 space-y-0.5">
            <div className="w-full h-0.5" style={{ backgroundColor: '#f97316' }}></div>
            <p className="pt-3">{companyInfo.fullAddress}</p>
            <p>PBX: {companyInfo.phone} - e-mail: {companyInfo.email}</p>
        </div>
      </div>
    </div>
  );
};

export default CartaPorteView;