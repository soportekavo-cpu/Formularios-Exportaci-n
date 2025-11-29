import React from 'react';
import type { Certificate } from '../types';
import { ArrowLeftIcon, PrintIcon, DownloadIcon } from './Icons';
import { printComponent } from '../utils/printUtils';
import CartaPortePDF from './CartaPortePDF';
import type { CompanyInfo } from '../utils/companyData';

interface CartaPorteViewProps {
  certificate: Certificate | null;
  onBack: () => void;
  logo: string | null;
  companyInfo: CompanyInfo;
}

const CartaPorteView: React.FC<CartaPorteViewProps> = ({ certificate, onBack, logo, companyInfo }) => {

  const handlePrint = () => {
    if (certificate) {
      printComponent(
        <CartaPortePDF certificate={certificate} logo={logo} companyInfo={companyInfo} />, 
        `CartaPorte-${certificate.certificateNumber || certificate.id}`,
        { saveOnly: false, orientation: 'portrait', showFooter: true, companyInfo }
      );
    }
  };
  
  const handleSave = () => {
    if (certificate) {
      printComponent(
        <CartaPortePDF certificate={certificate} logo={logo} companyInfo={companyInfo} />, 
        `CartaPorte-${certificate.certificateNumber || certificate.id}`,
        { saveOnly: true, orientation: 'portrait', showFooter: true, companyInfo }
      );
    }
  };

  if (!certificate) {
    return (
      <div className="p-8 text-center">
        <p>Carta de Porte no encontrada.</p>
        <button onClick={onBack} className="mt-4 text-primary hover:text-primary/80">Volver a la lista</button>
      </div>
    );
  }
  
  const isProben = certificate.company === 'proben';

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Treat date as local
    return new Intl.DateTimeFormat('es-GT', { dateStyle: 'long' }).format(date);
  }
  
  const formatNumber = (num?: number | '', digits = 2) => {
      return new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(num) || 0);
  }
  
  const allPackages = certificate.containers?.flatMap(c => c.packages) || [];
  const totalPackages = allPackages.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  const totalTare = allPackages.reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.tareUnitWeight) || 0)), 0);
  const containerNos = certificate.containers?.map(c => c.containerNo).join(', ');
  const sealNos = certificate.containers?.map(c => c.sealNo).filter(Boolean).join(', ');

  const noteText = "NOTA: El presente envio no debe ser firmado por personal de la empresa portuaria, sino que ésta emitirá y entregará al piloto de la unidad de transporte un acuse de recibo de exportación en donde se indicará la cantidad de bultos, peso total recibido, faltantes, excedentes y condiciones en que se recibe la mercaderia para conocimiento y registros del remitente.";

  const InfoBlock: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
    <div className={className}>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</h3>
        <div className="mt-1 text-sm leading-relaxed text-gray-800 break-words">{children || '-'}</div>
    </div>
  );
  
  return (
    <div className="bg-background min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
        <div className="max-w-5xl mx-auto mb-6 print:hidden">
            <div className="flex justify-between items-center">
                 <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80 bg-card px-4 py-2 rounded-lg shadow-sm border"
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
                        className="inline-flex items-center gap-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg shadow-sm"
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

      <div id="cartaporte-paper" className="max-w-5xl mx-auto bg-white text-gray-900 p-8 sm:p-12 shadow-lg border rounded-lg">
        <header className="flex justify-between items-start">
            <div className="w-1/3"></div>
            <div className="w-1/3 text-center">
                <h1 className="text-2xl font-bold">{companyInfo.name}</h1>
            </div>
            <div className="w-1/3 text-right text-xs text-gray-600 space-y-0.5">
                <p>{companyInfo.address1}, {companyInfo.address2}</p>
                <p>{companyInfo.cityState}</p>
                <p>PBX: {companyInfo.phone} - {companyInfo.email}</p>
            </div>
        </header>
        
        <div className="my-6 border-t border-gray-300"></div>

        <section className="flex justify-between items-start mb-6">
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

        <section className="mb-8">
            <div className="p-3 bg-slate-50 rounded-lg border inline-block min-w-[300px]">
                <InfoBlock label="CONSIGNADA A">
                    <span className="font-bold text-base">{certificate.consignee}</span>
                </InfoBlock>
            </div>
        </section>
        
         <main>
            <div className="flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full">
                    <thead className="border-y-2 border-gray-900">
                      <tr>
                        <th scope="col" className="py-2.5 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-0">CANT.</th>
                        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900">CLASE</th>
                        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900">MARCAS</th>
                        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900">CONTIENE</th>
                        <th scope="col" className="py-2.5 pl-3 pr-4 text-right text-xs font-semibold text-gray-900 sm:pr-0">P. NETO (KG)</th>
                        <th scope="col" className="py-2.5 pl-3 pr-4 text-right text-xs font-semibold text-gray-900 sm:pr-0">TARA (KG)</th>
                        <th scope="col" className="py-2.5 pl-3 pr-4 text-right text-xs font-semibold text-gray-900 sm:pr-0">P. BRUTO (KG)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPackages.map((pkg) => (
                        <tr key={pkg.id}>
                          <td className="whitespace-nowrap py-2.5 pr-3 text-sm text-left font-medium text-gray-900 sm:pl-0">{formatNumber(pkg.quantity, 0)}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">{pkg.type}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">{pkg.marks}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">{pkg.contains}</td>
                          <td className="whitespace-nowrap py-2.5 pl-3 pr-4 text-sm font-medium text-gray-900 sm:pr-0 text-right">{formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.unitWeight) || 0))}</td>
                          <td className="whitespace-nowrap py-2.5 pl-3 pr-4 text-sm font-medium text-gray-900 sm:pr-0 text-right">{formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.tareUnitWeight) || 0))}</td>
                          <td className="whitespace-nowrap py-2.5 pl-3 pr-4 text-sm font-medium text-gray-900 sm:pr-0 text-right">{formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.grossUnitWeight) || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-900">
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
        
        <section className="mt-8 pt-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Detalles del Transporte</h3>
            <div className="space-y-6">
                <div><InfoBlock label="Compañía Contratista">{certificate.transportCompany}</InfoBlock></div>
                <div className="grid grid-cols-3 gap-x-8">
                    <InfoBlock label="Piloto">{certificate.driverName}</InfoBlock>
                    <InfoBlock label="Licencia">{certificate.driverLicense}</InfoBlock>
                    <InfoBlock label="Placas">{certificate.licensePlate}</InfoBlock>
                </div>
                <div className="grid grid-cols-3 gap-x-8">
                    <InfoBlock label="Furgon/Plataforma">{certificate.transportUnit}</InfoBlock>
                    <InfoBlock label="Contenedor">{containerNos}</InfoBlock>
                    <InfoBlock label="Marchamo">{sealNos}</InfoBlock>
                </div>
                <div className="grid grid-cols-2 gap-x-8">
                    <InfoBlock label="Vapor">{certificate.shippingLine}</InfoBlock>
                    <InfoBlock label="Descargar En">{certificate.destination}</InfoBlock>
                </div>
            </div>
        </section>

        <section className="mt-8 pt-6">
             <InfoBlock label="Observaciones">
                <div className="prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: certificate.observations || '' }}/>
             </InfoBlock>
        </section>
        
        <footer className="mt-24 space-y-12">
            <div className="grid grid-cols-2 gap-16">
              <div className="pt-2 border-t border-gray-400">
                  <p className="text-sm font-semibold">Firma del Remitente</p>
              </div>
               <div className="pt-2 border-t border-gray-400">
                  <p className="text-sm font-semibold">Firma del Piloto</p>
              </div>
            </div>
            <div className="pt-4">
                <p className="text-xs text-gray-600">{noteText}</p>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default CartaPorteView;