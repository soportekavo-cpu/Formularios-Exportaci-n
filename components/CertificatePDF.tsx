import React from 'react';
import type { Certificate } from '../types';

interface CertificatePDFProps {
  certificate: Certificate;
  logo: string | null;
}

const CertificatePDF: React.FC<CertificatePDFProps> = ({ certificate, logo }) => {
  const numPackages = certificate.packages?.length || 0;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(date);
  }

  // FIX: Added a robust number formatting function to handle potentially non-numeric values.
  const formatNumber = (value: unknown): string => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0);
  };

  const headerFooterInfo = {
    name: 'DIZANO, S.A.',
    address1: '1ra. Av. A 4-33 Granjas La Joya',
    address2: 'Zona 8 San Miguel Petapa',
    cityState: 'Guatemala, Guatemala.',
    phone: '(502) 2319-8700',
    email: 'exportaciones@cafelasregiones.gt'
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
    <div>
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider" style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</h3>
        <div className="mt-1 text-[11px] leading-relaxed text-gray-900 whitespace-pre-wrap break-words" style={{ marginTop: '4px', fontSize: '10px', lineHeight: '1.6', color: '#1f2937', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{children}</div>
    </div>
  );

  const isQualityCert = certificate.type === 'quality';
  const isWeightCert = certificate.type === 'weight';
  
  return (
    <div className="bg-white font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
      {isWeightCert || isQualityCert ? (
        <>
          <header>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ width: '30%', verticalAlign: 'middle', textAlign: 'left' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ height: '80px', width: '80px', display: 'inline-block', padding: '4px' }}>
                        {logo ? (
                          <img src={logo} alt="Company Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ height: 'calc(100% - 8px)', width: 'calc(100% - 8px)', border: '4px solid #3B82F6', borderRadius: '12px' }}></div>
                        )}
                      </div>
                      <h2 style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.1em', marginTop: '8px', color: '#1f2937', margin: 0 }}>
                        LAS REGIONES
                      </h2>
                    </div>
                  </td>
                  <td style={{ width: '70%', verticalAlign: 'middle', textAlign: 'right', fontSize: '10px', color: '#4b5563' }}>
                    <p style={{ fontWeight: '700', fontSize: '12px', color: '#1f2937', margin: '0 0 2px 0' }}>{headerFooterInfo.name}</p>
                    <p style={{ margin: '0 0 2px 0' }}>{headerFooterInfo.address1}, {headerFooterInfo.address2}</p>
                    <p style={{ margin: '0 0 2px 0' }}>{headerFooterInfo.cityState}</p>
                    <p style={{ margin: '0 0 2px 0' }}>P: {headerFooterInfo.phone}</p>
                    <p style={{ margin: '0' }}>E: {headerFooterInfo.email}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </header>
          <div style={{ marginTop: '24px', marginBottom: '24px', borderTop: '1px solid #d1d5db' }}></div>
        </>
      ) : (
        <header style={{ paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                    <tr>
                        <td style={{ width: '30%', verticalAlign: 'top', textAlign: 'left' }}>
                            <div style={{ width: '96px' }}></div>
                        </td>
                        <td style={{ width: '70%', verticalAlign: 'top', textAlign: 'right', fontSize: '10px', color: '#4b5563', paddingTop: '8px' }}>
                            <p style={{ fontWeight: '700', fontSize: '12px', color: '#1f2937', margin: '0 0 2px 0' }}>{headerFooterInfo.name}</p>
                            <p style={{ margin: '0 0 2px 0' }}>{headerFooterInfo.address1}, {headerFooterInfo.address2}</p>
                            <p style={{ margin: '0 0 2px 0' }}>{headerFooterInfo.cityState}</p>
                            <p style={{ margin: '0 0 2px 0' }}>P: {headerFooterInfo.phone}</p>
                            <p style={{ margin: '0' }}>E: {headerFooterInfo.email}</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </header>
      )}

      <section className="text-center my-4">
        <h2 className="text-xl font-bold text-gray-800" style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
          {isQualityCert ? 'Quality Certificate' : 'Weight Certificate'}
        </h2>
        <p className="text-xs text-gray-500 mt-1" style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Nº: {certificate.certificateNumber || certificate.id.substring(0, 8).toUpperCase()}</p>
      </section>

      <section className="mb-6" style={{ marginBottom: '24px' }}>
         <table style={{ width: '100%', tableLayout: 'fixed' }}>
            <tbody>
                <tr>
                    <td style={{ width: '33.33%', verticalAlign: 'top', paddingRight: '10px' }}><InfoBlock label="Seller">{certificate.shipper}</InfoBlock></td>
                    <td style={{ width: '33.33%', verticalAlign: 'top', padding: '0 10px' }}><InfoBlock label="Consignee">{certificate.consignee}</InfoBlock></td>
                    <td style={{ width: '33.33%', verticalAlign: 'top', paddingLeft: '10px' }}><InfoBlock label="Notify">{certificate.notify}</InfoBlock></td>
                </tr>
            </tbody>
        </table>
      </section>

      <section className="mb-6 p-4 bg-slate-50 rounded-lg border" style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <table style={{ width: '100%', tableLayout: 'fixed' }}>
            <tbody>
                <tr>
                    <td style={{ width: '25%', paddingBottom: '12px', verticalAlign: 'top' }}><InfoBlock label="Certificate Date">{formatDate(certificate.certificateDate)}</InfoBlock></td>
                    <td style={{ width: '25%', paddingBottom: '12px', verticalAlign: 'top' }}><InfoBlock label="Shipment Date">{formatDate(certificate.shipmentDate)}</InfoBlock></td>
                    <td style={{ width: '25%', paddingBottom: '12px', verticalAlign: 'top' }}><InfoBlock label="Bill of Lading No.">{certificate.billOfLadingNo}</InfoBlock></td>
                    <td style={{ width: '25%', paddingBottom: '12px', verticalAlign: 'top' }}><InfoBlock label="Container No.">{certificate.containerNo}</InfoBlock></td>
                </tr>
                <tr>
                    <td style={{ width: '25%', verticalAlign: 'top' }}><InfoBlock label="Shipping Line">{certificate.shippingLine}</InfoBlock></td>
                    <td style={{ width: '25%', verticalAlign: 'top' }}><InfoBlock label="Destination">{certificate.destination}</InfoBlock></td>
                    <td style={{ width: '25%', verticalAlign: 'top' }}><InfoBlock label="Product">{certificate.product}</InfoBlock></td>
                    <td style={{ width: '25%', verticalAlign: 'top' }}>
                    </td>
                </tr>
            </tbody>
        </table>
      </section>

      <main>
        <h3 className="text-sm font-semibold text-gray-800 mb-2" style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>Details</h3>
        <table className="min-w-full" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
          <thead className="border-b border-gray-300">
            <tr>
              <th scope="col" className="py-2 pl-0 pr-3 text-left font-semibold text-gray-900">TYPE</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold text-gray-900">QUANTITY</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold text-gray-900">UNIT WEIGHT (KG)</th>
              <th scope="col" className="px-3 py-2 text-left font-semibold text-gray-900">MARKS</th>
              {isQualityCert && (
                <th scope="col" className="px-3 py-2 text-left font-semibold text-gray-900">QUALITY</th>
              )}
              <th scope="col" className="py-2 pl-3 pr-0 text-right font-semibold text-gray-900">TOTAL WEIGHT (KG)</th>
            </tr>
          </thead>
          <tbody>
            {(certificate.packages || []).map((pkg) => (
              <tr key={pkg.id} className="border-b border-gray-200" style={{ pageBreakInside: 'avoid' }}>
                <td className="whitespace-nowrap py-2 pl-0 pr-3 font-medium text-gray-900">{pkg.type}</td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-500 text-right">{pkg.quantity}</td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-500 text-right">{formatNumber(pkg.unitWeight)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-500">{pkg.marks}</td>
                {isQualityCert && (
                    <td className="px-3 py-2 text-gray-500" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{pkg.quality}</td>
                )}
                <td className="whitespace-nowrap py-2 pl-3 pr-0 font-medium text-gray-900 text-right">{formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.unitWeight) || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
      
      {/* Footer Block */}
      <div style={{ marginTop: numPackages > 2 ? '24px' : '12px', pageBreakInside: 'avoid' }}>
          <div className="flex justify-end" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div className="w-full max-w-sm space-y-2" style={{ width: '100%', maxWidth: '384px' }}>
                  {Object.entries(subtotals).map(([type, total]) => (
                      <div key={type} className="flex justify-between text-gray-600" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#4b5563' }}>
                          <span>TOTAL WEIGHT {type.toUpperCase()}:</span>
                          <span className="font-medium text-gray-700">{formatNumber(total)} KG.</span>
                      </div>
                  ))}
                   <div className="flex justify-between font-bold text-gray-900 pt-3 mt-3 border-t-2 border-gray-900" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '12px', color: '#111827', paddingTop: '12px', marginTop: '12px', borderTop: '2px solid #111827' }}>
                      <span>TOTAL NET WEIGHT:</span>
                      {/* FIX: Use the formatNumber helper to safely format the totalNetWeight. */}
                      <span>{formatNumber(certificate.totalNetWeight)} KG.</span>
                  </div>
              </div>
          </div>

          <footer className="mt-16 pt-6" style={{ marginTop: numPackages > 2 ? '64px' : '32px', paddingTop: '24px' }}>
              <div className="w-72" style={{ width: '288px' }}>
                  <div className="border-t border-black pt-2" style={{ borderTop: '1px solid black', paddingTop: '8px' }}>
                      <p className="font-semibold text-gray-900" style={{ fontSize: '12px', fontWeight: '600' }}>{certificate.exporterName}</p>
                      <p className="text-gray-600" style={{ fontSize: '11px', color: '#4b5563' }}>Exports.</p>
                  </div>
              </div>
          </footer>
      </div>
    </div>
  );
};

export default CertificatePDF;