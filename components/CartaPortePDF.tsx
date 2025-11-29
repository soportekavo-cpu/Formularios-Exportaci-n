import React from 'react';
import type { Certificate } from '../types';
import type { CompanyInfo } from '../utils/companyData';

interface CartaPortePDFProps {
  certificate: Certificate;
  logo: string | null;
  companyInfo: CompanyInfo;
}

const CartaPortePDF: React.FC<CartaPortePDFProps> = ({ certificate, logo, companyInfo }) => {
  
  const isProben = certificate.company === 'proben';

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
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

  const InfoBlock: React.FC<{ label: string; children: React.ReactNode; isPre?: boolean }> = ({ label, children, isPre=false }) => (
    <div>
        <h3 style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</h3>
        <div style={{ marginTop: '1px', fontSize: '11px', lineHeight: '1.4', color: '#1f2937', whiteSpace: isPre ? 'pre-wrap' : 'normal', wordBreak: 'break-word', fontWeight: 500 }}>{children || '-'}</div>
    </div>
  );
  
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: '15px', fontSize: '11px' }}>
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
      
      {/* Section for Title, Date, and Consignee */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', marginTop: '24px' }}>
          <tbody>
              {/* Row 1: Title and Date */}
              <tr>
                  {/* Title */}
                  <td style={{ verticalAlign: 'bottom', width: '50%', paddingBottom: '10px' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#166534', letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase' }}>Carta de Porte</h2>
                      <p style={{ fontSize: '11px', fontWeight: '600', color: '#1f2937', margin: '4px 0 0 0' }}>No: {certificate.certificateNumber}</p>
                  </td>
                  {/* Date */}
                  <td style={{ verticalAlign: 'bottom', textAlign: 'right', width: '50%', paddingBottom: '10px' }}>
                      <table style={{ borderCollapse: 'collapse', marginLeft: 'auto', backgroundColor: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                          <tbody>
                              <tr>
                                  <td style={{ padding: '4px 8px' }}>
                                      <h3 style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Lugar y Fecha</h3>
                                      <div style={{ marginTop: '2px', fontSize: '11px', lineHeight: '1.4', color: '#1f2937', fontWeight: 500, minHeight: '16px' }}>
                                          {`${certificate.place || 'Guatemala'}, ${formatDate(certificate.certificateDate)}`.replace(/, $/, '') || '\u00A0'}
                                      </div>
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                  </td>
              </tr>
              {/* Row 2: Consignee (centered) */}
              <tr>
                  <td colSpan={2} style={{ textAlign: 'center', paddingTop: '10px' }}>
                      <table style={{ borderCollapse: 'collapse', margin: '0 auto', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '50%' }}>
                          <tbody>
                              <tr>
                                  <td style={{ padding: '8px', textAlign: 'left' }}>
                                      <h3 style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>CONSIGNADA A</h3>
                                      <div style={{ marginTop: '2px', fontSize: '12px', lineHeight: '1.4', color: '#1f2937', fontWeight: 'bold', minHeight: '18px' }}>
                                          {certificate.consignee || '\u00A0'}
                                      </div>
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                  </td>
              </tr>
          </tbody>
      </table>
      
      {/* Main Table */}
      <main>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
              <thead style={{ borderBottom: '2px solid #374151', borderTop: '2px solid #374151' }}>
                  <tr>
                      <th style={{ width: '8%', padding: '4px 2px', textAlign: 'left', fontWeight: '600' }}>CANT.</th>
                      <th style={{ width: '10%', padding: '4px 2px', textAlign: 'left', fontWeight: '600' }}>CLASE</th>
                      <th style={{ width: '24%', padding: '4px 2px', textAlign: 'left', fontWeight: '600' }}>MARCAS</th>
                      <th style={{ width: '18%', padding: '4px 2px', textAlign: 'left', fontWeight: '600' }}>CONTIENE</th>
                      <th style={{ width: '13%', padding: '4px 2px', textAlign: 'right', fontWeight: '600' }}>P. NETO (KG)</th>
                      <th style={{ width: '13%', padding: '4px 2px', textAlign: 'right', fontWeight: '600' }}>TARA (KG)</th>
                      <th style={{ width: '14%', padding: '4px 2px', textAlign: 'right', fontWeight: '600' }}>P. BRUTO (KG)</th>
                  </tr>
              </thead>
              <tbody>
                  {allPackages.map((pkg) => (
                      <tr key={pkg.id} style={{ pageBreakInside: 'avoid', borderBottom: '0.5px solid #e5e7eb' }}>
                          <td style={{ padding: '3px 2px', textAlign: 'left' }}>{formatNumber(pkg.quantity, 0)}</td>
                          <td style={{ padding: '3px 2px' }}>{pkg.type}</td>
                          <td style={{ padding: '3px 2px' }}>{pkg.marks}</td>
                          <td style={{ padding: '3px 2px' }}>{pkg.contains}</td>
                          <td style={{ padding: '3px 2px', textAlign: 'right', fontWeight: '500' }}>{formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.unitWeight) || 0))}</td>
                          <td style={{ padding: '3px 2px', textAlign: 'right', fontWeight: '500' }}>{formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.tareUnitWeight) || 0))}</td>
                          <td style={{ padding: '3px 2px', textAlign: 'right', fontWeight: '500' }}>{formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.grossUnitWeight) || 0))}</td>
                      </tr>
                  ))}
              </tbody>
              <tfoot style={{ borderTop: '2px solid #374151' }}>
                  <tr style={{ pageBreakInside: 'avoid' }}>
                      <td style={{ paddingTop: '5px', paddingLeft: '2px', fontWeight: '700', textAlign: 'left' }}>{formatNumber(totalPackages, 0)}</td>
                      <td colSpan={3} style={{ paddingTop: '5px', paddingLeft: '2px', fontWeight: '700' }}>TOTALES</td>
                      <td style={{ paddingTop: '5px', textAlign: 'right', fontWeight: '700' }}>{formatNumber(certificate.totalNetWeight)}</td>
                      <td style={{ paddingTop: '5px', textAlign: 'right', fontWeight: '700' }}>{formatNumber(totalTare)}</td>
                      <td style={{ paddingTop: '5px', textAlign: 'right', fontWeight: '700' }}>{formatNumber(certificate.totalGrossWeight)}</td>
                  </tr>
              </tfoot>
          </table>
      </main>

       {/* Transport Details */}
      <section style={{ marginTop: '20px', paddingTop: '10px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>Detalles del Transporte</h3>
          <div style={{ borderCollapse: 'collapse', fontSize: '11px' }}>
              <div style={{ padding: '4px 0 8px 0', borderBottom: '0.5px solid transparent' }}>
                  <InfoBlock label="Compañía Contratista">{certificate.transportCompany}</InfoBlock>
              </div>
              <table style={{ width: '100%', tableLayout: 'fixed' }}><tbody>
              <tr style={{ borderBottom: '0.5px solid transparent' }}>
                  <td style={{ width: '33.33%', padding: '8px 8px 8px 0', verticalAlign: 'top' }}>
                      <InfoBlock label="Piloto">{certificate.driverName}</InfoBlock>
                  </td>
                  <td style={{ width: '33.33%', padding: '8px 8px 8px 8px', verticalAlign: 'top' }}>
                      <InfoBlock label="Licencia">{certificate.driverLicense}</InfoBlock>
                  </td>
                  <td style={{ width: '33.33%', padding: '8px 0 8px 8px', verticalAlign: 'top' }}>
                      <InfoBlock label="Placas">{certificate.licensePlate}</InfoBlock>
                  </td>
              </tr>
              <tr style={{ borderBottom: '0.5px solid transparent' }}>
                  <td style={{ padding: '8px 8px 8px 0', verticalAlign: 'top' }}>
                      <InfoBlock label="Furgon/Plataforma">{certificate.transportUnit}</InfoBlock>
                  </td>
                  <td style={{ padding: '8px 8px 8px 8px', verticalAlign: 'top' }}>
                      <InfoBlock label="Contenedor">{containerNos}</InfoBlock>
                  </td>
                  <td style={{ padding: '8px 0 8px 8px', verticalAlign: 'top' }}>
                      <InfoBlock label="Marchamo">{sealNos}</InfoBlock>
                  </td>
              </tr>
              <tr>
                  <td style={{ padding: '8px 8px 8px 0', verticalAlign: 'top' }}>
                      <InfoBlock label="Vapor">{certificate.shippingLine}</InfoBlock>
                  </td>
                  <td style={{ padding: '8px 8px 8px 8px', verticalAlign: 'top' }}>
                      <InfoBlock label="Descargar En">{certificate.destination}</InfoBlock>
                  </td>
                  <td></td>
              </tr>
              </tbody></table>
          </div>
      </section>

      {/* Observations */}
      <section style={{ marginTop: '15px', paddingTop: '15px', pageBreakInside: 'avoid' }}>
          <InfoBlock label="Observaciones">
               <div style={{fontSize: '10px', whiteSpace: 'pre-wrap'}} dangerouslySetInnerHTML={{ __html: certificate.observations || '' }} />
          </InfoBlock>
      </section>

      {/* Signatures & Note */}
      <footer style={{ marginTop: '80px', pageBreakInside: 'avoid' }}>
        <table style={{ width: '100%', tableLayout: 'fixed', marginBottom: '15px' }}>
            <tbody>
                <tr>
                    <td style={{ width: '50%', paddingRight: '20px' }}>
                        <div style={{ paddingTop: '25px', borderTop: '1px solid #6b7280' }}>
                            <p style={{ fontSize: '10px', fontWeight: '600', margin: 0 }}>Firma del Remitente</p>
                        </div>
                    </td>
                    <td style={{ width: '50%', paddingLeft: '20px' }}>
                        <div style={{ paddingTop: '25px', borderTop: '1px solid #6b7280' }}>
                            <p style={{ fontSize: '10px', fontWeight: '600', margin: 0 }}>Firma del Piloto</p>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
        <p style={{ fontSize: '9px', color: '#4b5563', margin: '0' }}>{noteText}</p>
      </footer>
    </div>
  );
};

export default CartaPortePDF;