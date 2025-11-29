import React from 'react';
import type { Certificate, BankAccount } from '../types';
import type { CompanyInfo } from '../utils/companyData';

interface PaymentInstructionPDFProps {
  certificate: Certificate;
  bankAccounts: BankAccount[];
  logo: string | null;
  companyInfo: CompanyInfo;
}

const PaymentInstructionPDF: React.FC<PaymentInstructionPDFProps> = ({ certificate, bankAccounts, logo, companyInfo }) => {
  const isProben = certificate.company === 'proben';

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  };
  
  const formatNumber = (num?: number | '') => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(num) || 0);

  const selectedBank = bankAccounts.find(b => b.id === certificate.bankAccountId);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#1f2937', padding: '20px', fontSize: '11px', lineHeight: '1.5' }}>
      <header style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'inline-block' }}>
          <div style={{ height: '96px', marginBottom: '4px' }}>
              {logo ? (
                  <img src={logo} alt="Company Logo" style={{ maxHeight: '96px', width: 'auto', margin: '0 auto', objectFit: 'contain' }} />
              ) : (
                  <div style={{ height: '96px' }}></div>
              )}
          </div>
          {!isProben && <h2 style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '0.1em', marginTop: '8px', margin: '8px 0 0 0' }}>LAS REGIONES</h2>}
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{companyInfo.name}</h1>
        </div>
      </header>
      
      <p style={{ textAlign: 'right', marginBottom: '20px' }}>Guatemala, {formatDate(certificate.certificateDate)}</p>

      <section style={{ marginBottom: '15px' }}>
        <p style={{ fontWeight: 'bold', margin: 0 }}>{certificate.customerName}</p>
        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{certificate.consignee}</p>
      </section>

      <section style={{ marginBottom: '15px' }}>
        <p>
          These are the payment instructions for the contract <span style={{ fontWeight: 'bold' }}>{certificate.contractNo}</span>, ICO <span style={{ fontWeight: 'bold' }}>{certificate.icoNumbers}</span>, attach the following documents.
        </p>

        <div style={{ paddingLeft: '30px', marginTop: '10px' }}>
          <ul style={{ margin: 0, padding: 0, listStyleType: 'disc' }}>
            {(certificate.attachedDocuments || []).map((doc, index) => (
              <li key={index} style={{ marginBottom: '3px' }}>{doc}</li>
            ))}
          </ul>
        </div>
        
        <p style={{ marginTop: '15px' }}>
          Kindly request you to transfer the amount of <span style={{ fontWeight: 'bold' }}>US$ {formatNumber(certificate.totalAmount)}</span> to our account as follows:
        </p>
      </section>
      
      {selectedBank && (
        <section style={{ marginBottom: '20px', backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '10px' }}>
            <tbody>
              <tr style={{ verticalAlign: 'top' }}><td style={{ width: '150px', padding: '3px 0', color: '#6b7280' }}>Beneficiary's Bank:</td><td style={{ padding: '3px 0', fontWeight: '600' }}>{selectedBank.bankName}</td></tr>
              <tr style={{ verticalAlign: 'top' }}><td style={{ padding: '3px 0', color: '#6b7280' }}>Swift:</td><td style={{ padding: '3px 0', fontWeight: '600' }}>{selectedBank.swift}</td></tr>
              <tr style={{ verticalAlign: 'top' }}><td style={{ padding: '3px 0', color: '#6b7280' }}>Final Beneficiary's:</td><td style={{ padding: '3px 0', fontWeight: '600' }}>{selectedBank.beneficiary}</td></tr>
              <tr style={{ verticalAlign: 'top' }}><td style={{ padding: '3px 0', color: '#6b7280' }}>Account number:</td><td style={{ padding: '3px 0', fontWeight: '600' }}>{selectedBank.accountNumber}</td></tr>
              <tr style={{ verticalAlign: 'top' }}><td style={{ padding: '3px 0', color: '#6b7280' }}>IBAN:</td><td style={{ padding: '3px 0', fontWeight: '600' }}>{selectedBank.iban}</td></tr>
              {selectedBank.notes && (
                <tr style={{ verticalAlign: 'top' }}>
                  <td style={{ paddingTop: '6px', color: '#6b7280', borderTop: '1px solid #e5e7eb' }}>Notes:</td>
                  <td style={{ paddingTop: '6px', fontWeight: '600', borderTop: '1px solid #e5e7eb', whiteSpace: 'pre-wrap' }}>{selectedBank.notes}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      <p style={{ marginBottom: '50px' }}>Sincerely.</p>

      <footer style={{ paddingTop: '2px', pageBreakInside: 'avoid', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', textAlign: 'center' }}>
              <div style={{ height: '40px' }}></div>
              <div style={{ borderTop: '1px solid black', paddingTop: '4px', width: '250px' }}>
                  <p style={{ fontWeight: 'bold', margin: 0, fontSize: '11px' }}>{certificate.signerName || 'Yony Roquel.'}</p>
                  <p style={{ margin: '0', fontSize: '10px', color: '#6b7280' }}>{certificate.signerTitle || 'Export Manager.'}</p>
              </div>
          </div>
      </footer>
    </div>
  );
};

export default PaymentInstructionPDF;
