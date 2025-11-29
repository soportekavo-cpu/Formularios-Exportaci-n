import React from 'react';
import type { Certificate } from '../types';
import type { CompanyInfo } from '../utils/companyData';

interface CertificatePDFProps {
  certificate: Certificate;
  logo: string | null;
  companyInfo: CompanyInfo;
}

const CertificatePDF: React.FC<CertificatePDFProps> = ({ certificate, logo, companyInfo }) => {
  const allPackages = certificate.containers?.flatMap(c => c.packages) || [];
  const numPackages = allPackages.length;
  const isProben = certificate.company === 'proben';
  const containerAndSealNos = certificate.containers?.map(c => `${c.containerNo}${c.sealNo ? ` / ${c.sealNo}`: ''}`).join(', ');

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(date);
  }

  const formatNumber = (value: unknown, digits: number = 2): string => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value) || 0);
  };
  
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
                      <div style={{ height: '80px', width: isProben ? '160px' : '80px', display: 'inline-block', padding: '4px' }}>
                        {logo ? (
                          <img src={logo} alt="Company Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ height: 'calc(100% - 8px)', width: 'calc(100% - 8px)', border: '4px solid #3B82F6', borderRadius: isProben ? '0' : '12px' }}></div>
                        )}
                      </div>
                      {!isProben && (
                        <h2 style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.1em', marginTop: '8px', color: '#1f2937', margin: 0 }}>
                          LAS REGIONES
                        </h2>
                      )}
                    </div>
                  </td>
                  <td style={{ width: '70%', verticalAlign: 'middle', textAlign: 'right', fontSize: '10px', color: '#4b5563' }}>
                    <p style={{ fontWeight: '700', fontSize: '12px', color: '#1f2937', margin: '0 0 2px 0' }}>{companyInfo.name}</p>
                    <p style={{ margin: '0 0 2px 0' }}>{companyInfo.address1}, {companyInfo.address2}</p>
                    <p style={{ margin: '0 0 2px 0' }}>{companyInfo.cityState}</p>
                    <p style={{ margin: '0 0 2px 0' }}>P: {companyInfo.phone}</p>
                    <p style={{ margin: '0' }}>E: {companyInfo.email}</p>
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
                            <p style={{ fontWeight: '700', fontSize: '12px', color: '#1f2937', margin: '0 0 2px 0' }}>{companyInfo.name}</p>
                            <p style={{ margin: '0 0 2px 0' }}>{companyInfo.address1}, {companyInfo.address2}</p>
                            <p style={{ margin: '0 0 2px 0' }}>{companyInfo.cityState}</p>
                            <p style={{ margin: '0 0 2px 0' }}>P: {companyInfo.phone}</p>
                            <p style={{ margin: '0' }}>E: {companyInfo.email}</p>
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
                    <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '15px' }}><InfoBlock label="Consignee">{certificate.consignee}</InfoBlock></td>
                    <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '15px' }}><InfoBlock label="Notify">{certificate.notify}</InfoBlock></td>
                </tr>
            </tbody>
        </table>
      </section>

      <section className="mb-6 p-4 bg-slate-50 rounded-lg border" style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <table style={{ width: '100%', tableLayout: 'fixed' }}>
            <tbody>
                <tr>
                    <td style={{ width: '25%', paddingBottom: '12px', verticalAlign: 'top' }}><InfoBlock label="Shipment Date">{formatDate(certificate.shipmentDate)}</InfoBlock></td>
                    <td style={{ width: '25%', paddingBottom: '12px', verticalAlign: 'top' }}><InfoBlock label="Bill of Lading No.">{certificate.billOfLadingNo}</InfoBlock></td>
                    <td style={{ width: '25%', paddingBottom: '12px', verticalAlign: 'top' }}><InfoBlock label="Container / Seal No(s).">{containerAndSealNos}</InfoBlock></td>
                    <td style={{ width: '25%', paddingBottom: '12px', verticalAlign: 'top' }}><InfoBlock label="Shipping Line">{certificate.shippingLine}</InfoBlock></td>
                </tr>
                <tr>
                    <td style={{ width: '25%', verticalAlign: 'top' }}><InfoBlock label="Destination">{certificate.destination}</InfoBlock></td>
                    <td style={{ width: '25%', verticalAlign: 'top' }}><InfoBlock label="Product">{certificate.product}</InfoBlock></td>
                    <td style={{ width: '25%', verticalAlign: 'top' }}>{certificate.contractNo && <InfoBlock label="Contract No.">{certificate.contractNo}</InfoBlock>}</td>
                    <td style={{ width: '25%', verticalAlign: 'top' }}></td>
                </tr>
            </tbody>
        </table>
      </section>

      <main>
        <h3 className="text-sm font-semibold text-gray-800 mb-2" style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>Details</h3>
        {certificate.containers && certificate.containers.length > 1 ? (
            certificate.containers.map(container => {
                const containerSubtotalQty = container.packages.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
                const containerSubtotalNet = container.packages.reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.unitWeight) || 0)), 0);

                return (
                    <div key={container.id} style={{ pageBreakInside: 'avoid', marginBottom: '16px' }}>
                        <div style={{ padding: '4px 8px', backgroundColor: '#f1f5f9', borderRadius: '4px', borderBottom: '2px solid #e2e8f0' }}>
                            <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                                CONTAINER: {container.containerNo}
                                {container.sealNo && ` / SEAL: ${container.sealNo}`}
                            </h4>
                        </div>
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
                                {container.packages.map((pkg) => (
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
                            <tfoot style={{ borderTop: '2px solid #6b7280' }}>
                                <tr>
                                    <td style={{ paddingTop: '4px', paddingRight: '12px', textAlign: 'left', fontSize: '10px', fontWeight: '700' }}>Subtotals</td>
                                    <td style={{ paddingTop: '4px', paddingLeft: '6px', paddingRight: '6px', textAlign: 'right', fontSize: '10px', fontWeight: '700' }}>{formatNumber(containerSubtotalQty, 0)}</td>
                                    <td colSpan={isQualityCert ? 3 : 2}></td>
                                    <td style={{ paddingTop: '4px', paddingLeft: '2px', paddingRight: '2px', textAlign: 'right', fontSize: '10px', fontWeight: '700' }}>{formatNumber(containerSubtotalNet)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )
            })
        ) : (
            <div>
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
                        {allPackages.map((pkg) => (
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
            </div>
        )}
      </main>
      
      {/* Footer Block */}
      <div style={{ marginTop: numPackages > 2 ? '24px' : '12px', pageBreakInside: 'avoid' }}>
          <div className="flex justify-end" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div className="w-full max-w-sm" style={{ width: '100%', maxWidth: '384px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', color: '#111827', paddingTop: '8px', marginTop: '12px', borderTop: '2px solid #111827' }}>
                      <span style={{ fontWeight: 600, fontSize: '11px' }}>TOTAL NET WEIGHT:</span>
                      <span style={{ fontWeight: 700, fontSize: '12px' }}>{formatNumber(certificate.totalNetWeight)} KG.</span>
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