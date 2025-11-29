

import React from 'react';
import type { Contract, Buyer, LicensePayment } from '../types';
import { ArrowLeftIcon, PrintIcon, DownloadIcon } from './Icons';
import { printComponent } from '../utils/printUtils';
import LiquidationSummaryPDF from './LiquidationSummaryPDF';
import type { CompanyInfo } from '../utils/companyData';

interface LiquidationSummaryViewProps {
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
      totalDeductions: number; // Added
  };
  payments: LicensePayment[];
  onClose: () => void;
  logo: string | null;
  companyInfo: CompanyInfo;
}

const LiquidationSummaryView: React.FC<LiquidationSummaryViewProps> = ({ contract, buyer, calculations, payments, onClose, logo, companyInfo }) => {

    const handlePrint = () => {
        printComponent(
            <LiquidationSummaryPDF 
                contract={contract} 
                buyer={buyer} 
                calculations={calculations} 
                payments={payments} 
                logo={logo} 
                companyInfo={companyInfo} 
            />,
            `Liquidacion-${contract.contractNumber}`,
            { saveOnly: false, orientation: 'portrait', showFooter: false, companyInfo }
        );
    };
    
    const handleSave = () => {
         printComponent(
            <LiquidationSummaryPDF 
                contract={contract} 
                buyer={buyer} 
                calculations={calculations} 
                payments={payments} 
                logo={logo} 
                companyInfo={companyInfo} 
            />,
            `Liquidacion-${contract.contractNumber}`,
            { saveOnly: true, orientation: 'portrait', showFooter: false, companyInfo }
        );
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    const formatDate = (dateString: string) => new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium' }).format(new Date(dateString + 'T00:00:00'));

    const hasDynamicCosts = contract.liquidationCosts && contract.liquidationCosts.length > 0;

    return (
        <div className="bg-background min-h-full p-4 sm:p-6 lg:p-8 font-sans">
            <div className="max-w-4xl mx-auto mb-6 print:hidden">
                <div className="flex justify-between items-center">
                    <button onClick={onClose} className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80 bg-card px-4 py-2 rounded-lg shadow-sm border">
                        <ArrowLeftIcon className="w-5 h-5" /> Volver al Panel
                    </button>
                    <div className="flex items-center gap-x-3">
                        <button onClick={handleSave} className="inline-flex items-center gap-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg shadow-sm">
                            <DownloadIcon className="w-5 h-5" /> Guardar PDF
                        </button>
                        <button onClick={handlePrint} className="inline-flex items-center gap-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg shadow-sm">
                            <PrintIcon className="w-5 h-5" /> Imprimir
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview on Screen */}
            <div className="max-w-4xl mx-auto bg-white text-gray-900 p-12 shadow-lg border rounded-lg">
                <header className="flex justify-between items-start pb-6 border-b">
                    <div>
                        <h1 className="text-2xl font-bold text-green-800">RESUMEN DE LIQUIDACIÓN</h1>
                        <p className="text-sm text-gray-600 font-semibold">Contrato No. {contract.contractNumber}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold">{companyInfo.name}</p>
                        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
                    </div>
                </header>

                <section className="my-8 grid grid-cols-2 gap-8">
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Cliente</p>
                        <p className="font-bold text-lg">{buyer.name}</p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{buyer.address}</p>
                    </div>
                    <div className="text-right">
                         <p className="text-xs text-gray-500 font-bold uppercase">Saldo Actual</p>
                         <p className={`text-2xl font-bold ${calculations.balance <= 0 ? 'text-green-600' : 'text-amber-600'}`}>{formatCurrency(calculations.balance)}</p>
                         {calculations.balance <= 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">LIQUIDADO</span>}
                    </div>
                </section>

                <main className="space-y-8">
                     <div>
                        <h3 className="font-bold border-b pb-2 mb-4 text-sm uppercase text-gray-500">Detalle Financiero</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="font-medium">Valor Total Contrato</span><span>{formatCurrency(calculations.totalValue)}</span></div>
                            
                            {hasDynamicCosts ? (
                                (contract.liquidationCosts || []).map(cost => (
                                     <div key={cost.id} className="flex justify-between text-red-600">
                                         <span className="font-medium">(-) {cost.concept}</span>
                                         <span>- {formatCurrency(Number(cost.amount))}</span>
                                     </div>
                                ))
                            ) : (
                                <>
                                    <div className="flex justify-between text-red-600"><span className="font-medium">(-) Impuestos (2.5%)</span><span>- {formatCurrency(calculations.taxes)}</span></div>
                                    <div className="flex justify-between text-red-600"><span className="font-medium">(-) Honorarios Licencia</span><span>- {formatCurrency(calculations.licenseFee)}</span></div>
                                    <div className="flex justify-between text-red-600"><span className="font-medium">(-) Fitosanitario</span><span>- {formatCurrency(calculations.fitoCost)}</span></div>
                                </>
                            )}
                            
                            <div className="flex justify-between font-bold border-t pt-2"><span className="font-medium">Valor Neto Estimado</span><span>{formatCurrency(calculations.totalValue - calculations.totalDeductions)}</span></div>
                        </div>
                     </div>

                     <div>
                        <h3 className="font-bold border-b pb-2 mb-4 text-sm uppercase text-gray-500">Historial de Pagos</h3>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 text-left font-semibold">Fecha</th>
                                    <th className="p-2 text-left font-semibold">Concepto</th>
                                    <th className="p-2 text-right font-semibold">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length > 0 ? payments.map(p => (
                                    <tr key={p.id} className="border-b">
                                        <td className="p-2">{formatDate(p.date)}</td>
                                        <td className="p-2 text-gray-600">{p.concept || '-'}</td>
                                        <td className="p-2 text-right">{formatCurrency(p.amount)}</td>
                                    </tr>
                                )) : <tr><td colSpan={3} className="p-4 text-center text-gray-500 italic">Sin pagos registrados</td></tr>}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50 font-bold">
                                    <td colSpan={2} className="p-2 text-right">Total Pagado:</td>
                                    <td className="p-2 text-right text-green-600">{formatCurrency(calculations.totalPaid)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default LiquidationSummaryView;
