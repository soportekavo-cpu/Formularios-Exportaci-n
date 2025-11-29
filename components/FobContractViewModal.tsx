
import React from 'react';
import type { Contract, Buyer, FobContractData } from '../types';
import type { CompanyInfo } from '../utils/companyData';
import { printComponent } from '../utils/printUtils';
import FobContractPDF from './FobContractPDF';
import { ArrowLeftIcon, PrintIcon, DownloadIcon } from './Icons';

interface FobContractViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  buyer: Buyer;
  data: FobContractData;
  companyInfo: CompanyInfo;
}

const FobContractViewModal: React.FC<FobContractViewModalProps> = ({ isOpen, onClose, contract, buyer, data, companyInfo }) => {
    
    if (!isOpen) return null;

    const pdfData = {
        ...data,
        price: Number(data.price),
        buyerName: buyer.name,
        buyerSignature: buyer.signature
    };

    const handlePrint = () => {
        printComponent(
            <FobContractPDF data={pdfData} companyInfo={companyInfo} />,
            `FOB-Contract-${contract.contractNumber}-Report-${data.reportNo}`,
            { saveOnly: false, showFooter: false, companyInfo }
        );
    };

    const handleSave = () => {
        printComponent(
            <FobContractPDF data={pdfData} companyInfo={companyInfo} />,
            `FOB-Contract-${contract.contractNumber}-Report-${data.reportNo}`,
            { saveOnly: true, showFooter: false, companyInfo }
        );
    };

    return (
      <div className="relative z-[70]">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm"></div>
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-5xl rounded-lg bg-card border shadow-xl">
                <div className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 border-b pb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            Vista Previa Contrato FOB
                        </h3>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                            >
                                <DownloadIcon className="w-4 h-4" /> Guardar PDF
                            </button>
                            <button 
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                            >
                                <PrintIcon className="w-4 h-4" /> Imprimir
                            </button>
                            <div className="h-6 w-px bg-border mx-2"></div>
                            <button 
                                onClick={onClose} 
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted rounded-md"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 bg-gray-100 rounded-lg border p-4 overflow-y-auto max-h-[75vh] flex justify-center">
                        <div className="shadow-lg">
                            <FobContractPDF 
                                data={pdfData} 
                                companyInfo={companyInfo} 
                            />
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default FobContractViewModal;
