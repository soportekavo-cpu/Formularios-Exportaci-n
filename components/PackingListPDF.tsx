import React from 'react';
import type { Certificate } from '../types';
import { getCompanyInfo } from '../utils/companyData';

interface PackingListPDFProps {
  certificate: Certificate;
  logo: string | null;
}

const PackingListPDF: React.FC<PackingListPDFProps> = ({ certificate, logo }) => {
  
  const companyInfo = getCompanyInfo(certificate.company);
  const isProben = certificate.company === 'proben';

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(date);
  }

  const formatNumber = (num?: number | '', digits = 2) => {
      return new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(num) || 0);
  }
  
  const totalQuantity = (certificate.packages || []).reduce((sum, p) => sum + Number(p.quantity || 0), 0);

  const InfoBlock: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <h3 style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</h3>
        <div style={{ fontSize: '10px', lineHeight: '1.4', color: '#1f2937', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{children || '-'}</div>
    </div>
  );
  
  return (
    <div className="bg-white font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
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
      
        <section style={{ textAlign: 'center', margin: '16px 0' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                Packing List
            </h2>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Nº: {certificate.certificateNumber || certificate.id.substring(0, 8).toUpperCase()}</p>
        </section>

      <section style={{ marginBottom: '10px' }}>
        <table style={{ width: '100%', tableLayout: 'fixed', marginBottom: '10px', pageBreakInside: 'avoid' }}>
            <tbody>
                <tr>
                    <td style={{ width: '33.33%', verticalAlign: 'top', paddingRight: '10px' }}>
                        <InfoBlock label="Consignee">{certificate.consignee}</InfoBlock>
                    </td>
                    <td style={{ width: '33.33%', verticalAlign: 'top', padding: '0 10px' }}>
                        {certificate.notify && <InfoBlock label="Notify">{certificate.notify}</InfoBlock>}
                    </td>
                    <td style={{ width: '33.33%', verticalAlign: 'top', paddingLeft: '10px' }}>
                        {certificate.packingPlace && <InfoBlock label="Packing Place">{certificate.packingPlace}</InfoBlock>}
                    </td>
                </tr>
            </tbody>
        </table>
        
        <div style={{ pageBreakInside: 'avoid', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
           <table style={{width: '100%', tableLayout: 'fixed'}}>
               <tbody>
                   <tr>
                       <td style={{width: '25%', verticalAlign: 'top', padding: '0 4px 4px 0'}}><InfoBlock label="Packing Date">{formatDate(certificate.certificateDate)}</InfoBlock></td>
                       <td style={{width: '25%', verticalAlign: 'top', padding: '0 4px 4px'}}><InfoBlock label="B/L No.">{certificate.billOfLadingNo}</InfoBlock></td>
                       <td style={{width: '25%', verticalAlign: 'top', padding: '0 4px 4px'}}><InfoBlock label="Container No.">{certificate.containerNo}</InfoBlock></td>
                       <td style={{width: '25%', verticalAlign: 'top', padding: '0 0 4px 4px'}}><InfoBlock label="Shipping Line">{certificate.shippingLine}</InfoBlock></td>
                   </tr>
                    <tr>
                       <td style={{width: '25%', verticalAlign: 'top', padding: '4px 4px 0 0'}}><InfoBlock label="Seal No.">{certificate.sealNo}</InfoBlock></td>
                       <td style={{width: '25%', verticalAlign: 'top', padding: '4px 4px 0'}}><InfoBlock label="Destination">{certificate.destination}</InfoBlock></td>
                       <td style={{width: '25%', verticalAlign: 'top', padding: '4px 4px 0'}}><InfoBlock label="Product">{certificate.product}</InfoBlock></td>
                       <td style={{width: '25%', verticalAlign: 'top', padding: '4px 0 0 4px'}}><InfoBlock label="Contract No.">{certificate.contractNo}</InfoBlock></td>
                   </tr>
               </tbody>
           </table>
        </div>
      </section>

      <main>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', tableLayout: 'fixed' }}>
          <thead style={{ borderBottom: '1px solid #a1a1aa' }}>
            <tr>
              <th style={{ padding: '4px 2px', textAlign: 'left', fontWeight: '600', color: '#111827', width: '5%' }}>No.</th>
              <th style={{ padding: '4px 2px', textAlign: 'left', fontWeight: '600', color: '#111827', width: '20%' }}>MARKS</th>
              <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: '600', color: '#111827', width: '12%' }}>TYPE</th>
              <th style={{ padding: '4px 6px', textAlign: 'right', fontWeight: '600', color: '#111827', width: '8%' }}>QUANTITY</th>
              <th style={{ padding: '4px 2px', textAlign: 'right', fontWeight: '600', color: '#111827', width: '20%' }}>WEIGHT PER ITEM (KG)</th>
              <th style={{ padding: '4px 2px', textAlign: 'right', fontWeight: '600', color: '#111827', width: '15%' }}>NET WEIGHT (KG)</th>
              <th style={{ padding: '4px 2px', textAlign: 'right', fontWeight: '600', color: '#111827', width: '20%' }}>GROSS WEIGHT (KG)</th>
            </tr>
          </thead>
          <tbody>
            {(certificate.packages || []).map((pkg, index) => (
              <tr key={pkg.id} style={{ pageBreakInside: 'avoid', borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '3px 2px', textAlign: 'left' }}>{index + 1}</td>
                <td style={{ padding: '3px 2px', textAlign: 'left' }}>{pkg.marks}</td>
                <td style={{ padding: '3px 6px', textAlign: 'left' }}>{pkg.type}</td>
                <td style={{ padding: '3px 6px', textAlign: 'right' }}>{formatNumber(pkg.quantity, 0)}</td>
                <td style={{ padding: '3px 2px', textAlign: 'right' }}>{formatNumber(pkg.unitWeight)}</td>
                <td style={{ padding: '3px 2px', textAlign: 'right', fontWeight:'500' }}>{formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.unitWeight) || 0))}</td>
                <td style={{ padding: '3px 2px', textAlign: 'right', fontWeight:'500' }}>{formatNumber((Number(pkg.quantity) || 0) * (Number(pkg.grossUnitWeight) || 0))}</td>
              </tr>
            ))}
          </tbody>
           <tfoot style={{ borderTop: '2px solid #111827' }}>
              <tr style={{ pageBreakInside: 'avoid' }}>
                <td colSpan={3} style={{ paddingTop: '6px', paddingRight: '12px', textAlign: 'right', fontSize: '10px', fontWeight: '700' }}>TOTALS:</td>
                <td style={{ paddingTop: '6px', paddingLeft: '6px', paddingRight: '6px', textAlign: 'right', fontSize: '10px', fontWeight: '700' }}>{formatNumber(totalQuantity, 0)}</td>
                <td></td>
                <td style={{ paddingTop: '6px', paddingLeft: '2px', paddingRight: '2px', textAlign: 'right', fontSize: '10px', fontWeight: '700' }}>{formatNumber(certificate.totalNetWeight)}</td>
                <td style={{ paddingTop: '6px', paddingLeft: '2px', paddingRight: '2px', textAlign: 'right', fontSize: '10px', fontWeight: '700' }}>{formatNumber(certificate.totalGrossWeight)}</td>
              </tr>
          </tfoot>
        </table>
         <footer style={{ marginTop: '96px', paddingTop: '12px', fontSize: '12px', pageBreakInside: 'avoid' }}>
            <div style={{ width: '288px' }}>
                <div style={{ borderTop: '1px solid black', paddingTop: '8px' }}>
                    <p style={{ fontWeight: '600', fontSize: '12px', color: '#1f2937', margin: '0' }}>{certificate.exporterName}</p>
                    <p style={{ fontSize: '11px', color: '#4b5563', margin: '2px 0 0 0' }}>Exports.</p>
                </div>
            </div>
        </footer>
         <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', fontWeight: '600', color: '#1f2937', pageBreakInside: 'avoid' }}>
            CLEAN ON BOARD
        </div>
      </main>
    </div>
  );
};

export default PackingListPDF;