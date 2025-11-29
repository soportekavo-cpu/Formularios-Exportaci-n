

import React from 'react';
import type { Contract, Buyer, LicensePayment } from '../types';
import type { CompanyInfo } from '../utils/companyData';

interface LiquidationSummaryPDFProps {
  contract: Contract;
  buyer: Buyer;
  calculations: {
      totalValue: number;
      taxes: number;
      totalPaid: number;
      balance: number;
      overpayment: number;
      extraTaxes: number;
      licenseFee: number;
      fitoCost: number;
      totalDeductions: number;
  };
  payments: LicensePayment[];
  logo: string | null;
  companyInfo: CompanyInfo;
}

const LiquidationSummaryPDF: React.FC<LiquidationSummaryPDFProps> = ({ contract, buyer, calculations, payments, logo, companyInfo }) => {
  const isProben = contract.company === 'proben';

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat('es-GT', { dateStyle: 'long' }).format(date);
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const hasDynamicCosts = contract.liquidationCosts && contract.liquidationCosts.length > 0;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#1f2937', padding: '20px', fontSize: '11px', lineHeight: '1.5' }}>
      {/* Header */}
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

      {/* Title */}
      <section style={{ textAlign: 'center', margin: '20px 0' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Resumen de Liquidación</h2>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginTop: '4px' }}>Contrato No: {contract.contractNumber}</p>
      </section>

      {/* Info */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px' }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'top', width: '60%' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>CLIENTE</p>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#1f2937', margin: '0 0 2px 0' }}>{buyer.name}</p>
                <div style={{ fontSize: '11px', color: '#4b5563', whiteSpace: 'pre-wrap' }}>{buyer.address}</div>
            </td>
            <td style={{ verticalAlign: 'top', textAlign: 'right', width: '40%' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>FECHA EMISIÓN</p>
                <p style={{ fontSize: '11px', fontWeight: 500 }}>{formatDate(new Date().toISOString().split('T')[0])}</p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Summary Table */}
      <section style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#1f2937', marginBottom: '8px', borderBottom: '2px solid #1f2937', paddingBottom: '4px' }}>Detalle Financiero</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 4px', fontWeight: 600 }}>Valor Total del Contrato</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(calculations.totalValue)}</td>
                </tr>
                
                {/* Dynamic Costs */}
                {hasDynamicCosts ? (
                    (contract.liquidationCosts || []).map(cost => (
                         <tr key={cost.id} style={{ borderBottom: '1px solid #e5e7eb', color: '#dc2626' }}>
                            <td style={{ padding: '8px 4px' }}>(-) {cost.concept}</td>
                            <td style={{ padding: '8px 4px', textAlign: 'right' }}>- {formatCurrency(Number(cost.amount))}</td>
                        </tr>
                    ))
                ) : (
                    // Fallback for legacy data
                    <>
                        <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#dc2626' }}>
                            <td style={{ padding: '8px 4px' }}>(-) Impuestos (2.5% Alquiler Licencia)</td>
                            <td style={{ padding: '8px 4px', textAlign: 'right' }}>- {formatCurrency(calculations.taxes)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#dc2626' }}>
                            <td style={{ padding: '8px 4px' }}>(-) Honorarios Licencia ($1.00/qq)</td>
                            <td style={{ padding: '8px 4px', textAlign: 'right' }}>- {formatCurrency(calculations.licenseFee)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#dc2626' }}>
                            <td style={{ padding: '8px 4px' }}>(-) Costo Fitosanitario (Fijo)</td>
                            <td style={{ padding: '8px 4px', textAlign: 'right' }}>- {formatCurrency(calculations.fitoCost)}</td>
                        </tr>
                    </>
                )}

                 <tr style={{ borderBottom: '2px solid #374151', backgroundColor: '#f9fafb' }}>
                    <td style={{ padding: '8px 4px', fontWeight: 700 }}>Valor Neto Estimado</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(calculations.totalValue - calculations.totalDeductions)}</td>
                </tr>
                <tr><td colSpan={2} style={{ height: '10px' }}></td></tr>
                 <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#166534' }}>
                    <td style={{ padding: '8px 4px' }}>(-) Total Pagado (Anticipos / Abonos)</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right' }}>- {formatCurrency(calculations.totalPaid)}</td>
                </tr>
                <tr style={{ backgroundColor: calculations.balance <= 0 ? '#f0fdf4' : '#fffbeb' }}>
                    <td style={{ padding: '12px 4px', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}>
                        {calculations.balance <= 0 ? 'Saldo a Favor (Liquidado)' : 'Saldo Pendiente (Por Recibir)'}
                    </td>
                    <td style={{ padding: '12px 4px', textAlign: 'right', fontWeight: 800, fontSize: '12px', color: calculations.balance <= 0 ? '#166534' : '#d97706' }}>
                        {formatCurrency(calculations.balance)}
                    </td>
                </tr>
            </tbody>
          </table>
      </section>

      {/* Payments History */}
      <section>
        <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#1f2937', marginBottom: '8px', borderBottom: '2px solid #1f2937', paddingBottom: '4px' }}>Historial de Pagos</h3>
        {payments.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                        <th style={{ padding: '6px', textAlign: 'left', fontWeight: 600, width: '10%' }}>#</th>
                        <th style={{ padding: '6px', textAlign: 'left', fontWeight: 600, width: '25%' }}>Fecha</th>
                        <th style={{ padding: '6px', textAlign: 'left', fontWeight: 600 }}>Concepto</th>
                        <th style={{ padding: '6px', textAlign: 'right', fontWeight: 600, width: '20%' }}>Monto</th>
                    </tr>
                </thead>
                <tbody>
                    {payments.map((p, idx) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '6px' }}>{idx + 1}</td>
                            <td style={{ padding: '6px' }}>{formatDate(p.date)}</td>
                            <td style={{ padding: '6px', color: '#6b7280' }}>{p.concept || '-'}</td>
                            <td style={{ padding: '6px', textAlign: 'right' }}>{formatCurrency(p.amount)}</td>
                        </tr>
                    ))}
                </tbody>
                 <tfoot>
                    <tr>
                        <td colSpan={3} style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700 }}>Total Pagado:</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(calculations.totalPaid)}</td>
                    </tr>
                </tfoot>
            </table>
        ) : (
            <p style={{ fontStyle: 'italic', color: '#6b7280', textAlign: 'center', padding: '10px' }}>No hay pagos registrados.</p>
        )}
      </section>

      {/* Footer Signatures */}
      <footer style={{ marginTop: '80px', pageBreakInside: 'avoid' }}>
        <table style={{ width: '100%', tableLayout: 'fixed' }}>
            <tbody>
                <tr>
                    <td style={{ width: '40%', paddingRight: '20px' }}>
                        <div style={{ paddingTop: '10px', borderTop: '1px solid #9ca3af' }}>
                            <p style={{ fontSize: '10px', fontWeight: 700, margin: 0 }}>{companyInfo.name}</p>
                            <p style={{ fontSize: '9px', color: '#6b7280', margin: 0 }}>Autorizado</p>
                        </div>
                    </td>
                    <td style={{ width: '20%' }}></td>
                    <td style={{ width: '40%', paddingLeft: '20px' }}>
                         <div style={{ paddingTop: '10px', borderTop: '1px solid #9ca3af' }}>
                            <p style={{ fontSize: '10px', fontWeight: 700, margin: 0 }}>{buyer.name}</p>
                            <p style={{ fontSize: '9px', color: '#6b7280', margin: 0 }}>Recibido / Conforme</p>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
      </footer>
    </div>
  );
};

export default LiquidationSummaryPDF;
