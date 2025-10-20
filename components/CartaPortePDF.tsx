import React from 'react';
import type { Certificate } from '../types';

interface CartaPortePDFProps {
  certificate: Certificate;
  logo: string | null;
}

const CartaPortePDF: React.FC<CartaPortePDFProps> = ({ certificate, logo }) => {

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat('es-GT', { dateStyle: 'long' }).format(date);
  }

  const formatNumber = (num?: number | '', digits = 2) => {
      return new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(num) || 0);
  }
  
  const totalPackages = (certificate.packages || []).reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  const totalTare = (certificate.packages || []).reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.tareUnitWeight) || 0)), 0);

  
  const headerFooterInfo = {
    name: 'DIZANO, S.A.',
    address1: '1ra. Av. A 4-33 Granjas La Joya',
    address2: 'Zona 8 San Miguel Petapa',
    cityState: 'Guatemala, Guatemala.',
    phone: '(502) 2319-8700',
    email: 'exportaciones@cafelasregiones.gt'
  };
  
  const noteText = "NOTA: El presente envio no debe ser firmado por personal de la empresa portuaria, sino que ésta emitirá y entregará al piloto de la unidad de transporte un acuse de recibo de exportación en donde se indicará la cantidad de bultos, peso total recibido, faltantes, excedentes y condiciones en que se recibe la mercaderia para conocimiento y registros del remitente.";


  const InfoBlock: React.FC<{ label: string; children: React.ReactNode; isPre?: boolean }> = ({ label, children, isPre=false }) => (
    <div>
        <h3 style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</h3>
        <div style={{ marginTop: '1px', fontSize: '11px', lineHeight: '1.4', color: '#1f2937', whiteSpace: isPre ? 'pre-wrap' : 'normal', wordBreak: 'break-word' }}>{children || '-'}</div>
    </div>
  );
  
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: '15px' }}>
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

      {/* Title & Date */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
          <tbody>
              <tr>
                  <td style={{ verticalAlign: 'bottom' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#166534', letterSpacing: '0.1em', margin: 0 }}>CARTA DE PORTE</h2>
                      <p style={{ fontSize: '11px', fontWeight: '600', color: '#1f2937', margin: '2px 0 0 0' }}>No: {certificate.certificateNumber}</p>
                  </td>
                  <td style={{ verticalAlign: 'bottom', textAlign: 'right' }}>
                      <InfoBlock label="Lugar y Fecha">
                          {certificate.place}, {formatDate(certificate.certificateDate)}
                      </InfoBlock>
                  </td>
              </tr>
          </tbody>
      </table>
      
      {/* Consignee */}
      <div style={{ marginBottom: '15px', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb', pageBreakInside: 'avoid' }}>
          <InfoBlock label="Consignada A">
              <p style={{ fontWeight: '600', fontSize: '12px' }}>{certificate.consignee}</p>
          </InfoBlock>
      </div>

      {/* Main Table */}
      <main>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
              <thead style={{ borderBottom: '2px solid #374151' }}>
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
                  {(certificate.packages || []).map((pkg) => (
                      <tr key={pkg.id} style={{ pageBreakInside: 'avoid', borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '3px 2px' }}>{formatNumber(pkg.quantity, 0)}</td>
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
                      <td style={{ paddingTop: '5px', fontWeight: '700' }}>{formatNumber(totalPackages, 0)}</td>
                      <td colSpan={3} style={{ paddingTop: '5px', fontWeight: '700' }}>TOTALES</td>
                      <td style={{ paddingTop: '5px', textAlign: 'right', fontWeight: '700' }}>{formatNumber(certificate.totalNetWeight)}</td>
                      <td style={{ paddingTop: '5px', textAlign: 'right', fontWeight: '700' }}>{formatNumber(totalTare)}</td>
                      <td style={{ paddingTop: '5px', textAlign: 'right', fontWeight: '700' }}>{formatNumber(certificate.totalGrossWeight)}</td>
                  </tr>
              </tfoot>
          </table>
      </main>

       {/* Transport Details */}
      <section style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e5e7eb', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>Detalles del Transporte</h3>
          <table style={{ width: '100%', tableLayout: 'fixed' }}>
              <tbody>
                  <tr>
                      <td style={{ width: '33.33%', paddingRight: '8px', paddingBottom: '6px' }}><InfoBlock label="Compañía Contratista">{certificate.transportCompany}</InfoBlock></td>
                      <td style={{ width: '33.33%', padding: '0 8px 6px' }}><InfoBlock label="Piloto">{certificate.driverName}</InfoBlock></td>
                      <td style={{ width: '33.33%', paddingLeft: '8px', paddingBottom: '6px' }}><InfoBlock label="Licencia">{certificate.driverLicense}</InfoBlock></td>
                  </tr>
                  <tr>
                      <td style={{ width: '33.33%', paddingRight: '8px', paddingBottom: '6px' }}><InfoBlock label="Placas">{certificate.licensePlate}</InfoBlock></td>
                      <td style={{ width: '33.33%', padding: '0 8px 6px' }}><InfoBlock label="Furgon/Plataforma">{certificate.transportUnit}</InfoBlock></td>
                      <td style={{ width: '33.33%', paddingLeft: '8px', paddingBottom: '6px' }}><InfoBlock label="Contenedor">{certificate.containerNo}</InfoBlock></td>
                  </tr>
                  <tr>
                      <td style={{ width: '33.33%', paddingRight: '8px' }}><InfoBlock label="Marchamo">{certificate.sealNo}</InfoBlock></td>
                      <td style={{ width: '33.33%', padding: '0 8px' }}><InfoBlock label="Vapor">{certificate.shippingLine}</InfoBlock></td>
                      <td style={{ width: '33.33%', paddingLeft: '8px' }}><InfoBlock label="Descargar En">{certificate.destination}</InfoBlock></td>
                  </tr>
              </tbody>
          </table>
      </section>

      {/* Observations */}
      {certificate.observations && (
          <section style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e5e7eb', pageBreakInside: 'avoid' }}>
              <InfoBlock label="Observaciones">
                   <div style={{fontSize: '9px', whiteSpace: 'pre-wrap'}} dangerouslySetInnerHTML={{ __html: certificate.observations || '' }} />
              </InfoBlock>
          </section>
      )}

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

        <div style={{ paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '8px', color: '#4b5563', fontStyle: 'italic', margin: '0' }}>
                {noteText}
            </p>
        </div>
      </footer>

    </div>
  );
};

export default CartaPortePDF;