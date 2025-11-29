import React from 'react';
import type { Certificate } from '../types';
import { numberToWords } from '../utils/numberToWords';
import type { CompanyInfo } from '../utils/companyData';

interface InvoicePDFProps {
  certificate: Certificate;
  logo: string | null;
  companyInfo: CompanyInfo;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ certificate, logo, companyInfo }) => {
  const isProben = certificate.company === 'proben';

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
  };
  
  const subtotal = (certificate.packages || []).reduce((sum, p) => sum + (Number(p.quantity) || 0) * (Number(p.unitValue) || 0), 0);
  
  const InfoBlock: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
    <div className={className}>
      <p style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</p>
      <div style={{ fontSize: '11px', color: '#1f2937', whiteSpace: 'pre-wrap' }}>{children}</div>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#0d223f', padding: '20px' }}>
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
      <div style={{ marginTop: '24px', borderTop: '1px solid #d1d5db' }}></div>
      
      <section style={{ textAlign: 'center', margin: '16px 0' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937' }}>INVOICE</h2>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', marginTop: '4px' }}>NO: {certificate.invoiceNo}</p>
      </section>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '25px' }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'top', width: '50%' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Bill To:</p>
                {certificate.customerName && <p style={{ fontSize: '14px', fontWeight: 700, color: '#1f2937', margin: '0 0 2px 0' }}>{certificate.customerName}</p>}
                <div style={{ fontSize: '11px', color: '#1f2937', whiteSpace: 'pre-wrap' }}>{certificate.consignee}</div>
            </td>
            <td style={{ verticalAlign: 'top', textAlign: 'right', width: '50%' }}><InfoBlock label="Date:">{formatDate(certificate.certificateDate)}</InfoBlock></td>
          </tr>
        </tbody>
      </table>

      <div style={{ fontFamily: 'Inter, sans-serif', marginTop: '20px', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #f3f4f6' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '25%', verticalAlign: 'top' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Contract No.</p>
                  <div style={{ fontSize: '11px', color: '#1f2937', whiteSpace: 'pre-wrap' }}>{certificate.contractNo}</div>
                </div>
              </td>
              <td style={{ width: '25%', verticalAlign: 'top' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Shipped Via.</p>
                  <div style={{ fontSize: '11px', color: '#1f2937', whiteSpace: 'pre-wrap' }}>{certificate.shippedVia}</div>
                </div>
              </td>
              <td style={{ width: '25%', verticalAlign: 'top' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>BILL OF LADING.</p>
                  <div style={{ fontSize: '11px', color: '#1f2937', whiteSpace: 'pre-wrap' }}>{certificate.billOfLadingNo}</div>
                </div>
              </td>
              <td style={{ width: '25%', verticalAlign: 'top' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Terms.</p>
                  <div style={{ fontSize: '11px', color: '#1f2937', whiteSpace: 'pre-wrap' }}>{certificate.terms}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {certificate.observations && (
          <section style={{ marginTop: '15px', pageBreakInside: 'avoid' }}>
              <InfoBlock label="Observations">
                  {certificate.observations}
              </InfoBlock>
          </section>
      )}

      <main style={{ marginTop: '25px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead style={{ backgroundColor: '#0d223f', color: 'white' }}>
            <tr>
              <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700, fontSize: '10px', width: '10%', borderRight: '1px solid #374151' }}>QTY</th>
              <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700, fontSize: '10px', width: '55%', borderRight: '1px solid #374151' }}>DESCRIPTION</th>
              <th style={{ padding: '8px', textAlign: 'right', fontWeight: 700, fontSize: '10px', width: '15%', borderRight: '1px solid #374151' }}>UNIT VALUE</th>
              <th style={{ padding: '8px', textAlign: 'right', fontWeight: 700, fontSize: '10px', width: '20%' }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {(certificate.packages || []).map(pkg => (
              <tr key={pkg.id} style={{ borderBottom: '1px solid #e5e7eb', pageBreakInside: 'avoid' }}>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>{pkg.quantity}</td>
                <td style={{ padding: '8px', verticalAlign: 'top', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  <p style={{ fontWeight: 700, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{pkg.description}</p>
                  {pkg.partidaNo && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#dc2626', fontWeight: 600, marginTop: '4px', margin: 0 }}>OIC: {pkg.partidaNo}</p>}
                </td>
                <td style={{ padding: '8px', verticalAlign: 'top', textAlign: 'right' }}>${formatNumber(pkg.unitValue)}</td>
                <td style={{ padding: '8px', verticalAlign: 'top', textAlign: 'right', fontWeight: 700 }}>${formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.unitValue) || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      <footer style={{ marginTop: '25px', pageBreakInside: 'avoid' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ verticalAlign: 'bottom', width: '60%' }}>
                   <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px' }}><InfoBlock label="Total in words:">{numberToWords(certificate.totalAmount)}</InfoBlock></div>
                </td>
                <td style={{ verticalAlign: 'bottom', width: '40%', paddingLeft: '20px' }}>
                    <table style={{ width: '100%', fontSize: '11px' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '4px 0', fontWeight: '700' }}>Subtotal:</td>
                                <td style={{ padding: '4px 0', textAlign: 'right' }}>${formatNumber(subtotal)}</td>
                            </tr>
                            {(certificate.adjustments?.length || 0) > 0 && (
                                <tr><td colSpan={2} style={{ paddingTop: '5px' }}>
                                    <p style={{ fontWeight: '700', margin: 0 }}>Adjustments:</p>
                                    {certificate.adjustments?.map(adj => adj.amount ? (<div key={adj.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#4b5563', paddingLeft: '8px' }}><p style={{ fontFamily: 'Inter, sans-serif', margin: 0 }}>{adj.description}</p><p style={{ margin: 0, color: '#dc2626' }}>-${formatNumber(Math.abs(Number(adj.amount)))}</p></div>) : null)}
                                </td></tr>
                            )}
                             {(certificate.advances?.length || 0) > 0 && (
                                <tr><td colSpan={2} style={{ paddingTop: '5px' }}>
                                    <p style={{ fontWeight: '700', margin: 0 }}>Advances:</p>
                                    {certificate.advances?.map(adv => adv.amount ? (<div key={adv.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#4b5563', paddingLeft: '8px' }}><p style={{ fontFamily: 'Inter, sans-serif', margin: 0 }}>{adv.description}</p><p style={{ margin: 0, color: '#dc2626' }}>-${formatNumber(Math.abs(Number(adv.amount)))}</p></div>) : null)}
                                </td></tr>
                            )}
                             <tr>
                                <td style={{ paddingTop: '10px', borderTop: '2px solid #0d223f', fontWeight: '800', fontSize: '16px' }}>Total:</td>
                                <td style={{ paddingTop: '10px', borderTop: '2px solid #0d223f', textAlign: 'right', fontWeight: '800', fontSize: '16px' }}>${formatNumber(certificate.totalAmount)}</td>
                            </tr>
                        </tbody>
                    </table>
                </td>
              </tr>
            </tbody>
         </table>
      </footer>
      <div style={{ fontFamily: 'Inter, sans-serif', textAlign: 'center', marginTop: '60px', color: '#6b7280', fontSize: '11px' }}>Thank you for your business.</div>
    </div>
  );
};

export default InvoicePDF;