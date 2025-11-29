
import React, { useState, useEffect } from 'react';
import type { Contract, Buyer, Company, DocumentAttachment, ContractCertifications } from '../types';
import { PaperClipIcon, TrashIcon, UploadIcon } from './Icons';
import { getHarvestYear } from '../utils/companyData';
import { uploadFileWithProgress } from '../services/uploadService';
import { ProgressBar } from './ProgressBar';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contract: Partial<Contract>) => void;
  initialData: Partial<Contract> | null;
  buyers: Buyer[];
  activeCompany: Company;
  contracts?: Contract[]; 
}

const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const certificationsList: { key: keyof ContractCertifications; label: string }[] = [
    { key: 'rainforest', label: 'Rainforest' },
    { key: 'organic', label: 'Orgánico' },
    { key: 'fairtrade', label: 'Fairtrade' },
    { key: 'eudr', label: 'EUDR' },
];

const ContractModal: React.FC<ContractModalProps> = ({ isOpen, onClose, onSave, initialData, buyers, activeCompany }) => {
  const [data, setData] = useState<Partial<Contract>>({});
  // Upload states
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
        const today = new Date().toISOString().split('T')[0];
        const defaultHarvest = getHarvestYear(today);
        
        const baseData: Partial<Contract> = {
            company: activeCompany,
            saleDate: today,
            harvestYear: defaultHarvest,
            certifications: { rainforest: false, organic: false, fairtrade: false, eudr: false },
            isTerminated: false,
            isLicenseRental: false,
            marketMonth: 'Diciembre',
            shipmentMonth: 'Noviembre',
        };

        if (initialData) {
            setData({ ...baseData, ...initialData });
        } else {
            setData(baseData);
        }
    }
  }, [isOpen, initialData, activeCompany]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCertificationChange = (certKey: keyof ContractCertifications) => {
      setData(prev => ({
          ...prev,
          certifications: {
              ...(prev.certifications || { rainforest: false, organic: false, fairtrade: false, eudr: false }),
              [certKey]: !prev.certifications?.[certKey]
          }
      }));
  };
  
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      setData(prev => ({ ...prev, [name]: checked }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'contractPdf' | 'instructionsPdf') => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const path = `pdfs/${activeCompany}/${new Date().getFullYear()}/${file.name}`; // Structure path
        
        setUploadingField(field);
        setUploadProgress(0);

        try {
            const attachment = await uploadFileWithProgress(file, path, (progress) => {
                setUploadProgress(progress);
            });
            setData(prev => ({ ...prev, [field]: attachment }));
        } catch (error) {
            console.error("Upload failed", error);
            alert("Error al subir el archivo. Verifica tu conexión.");
        } finally {
            setUploadingField(null);
            setUploadProgress(0);
        }
    }
  };

  const removeFile = (field: 'contractPdf' | 'instructionsPdf') => {
      setData(prev => ({ ...prev, [field]: undefined }));
  };
  
  const handleSave = () => {
    const harvestYear = data.harvestYear || getHarvestYear(data.saleDate || new Date().toISOString().split('T')[0]);
    onSave({ ...data, harvestYear });
  };

  if (!isOpen) return null;

  const getExporterName = () => activeCompany === 'dizano' ? 'Dizano, S.A.' : 'Proben, S.A.';
  
  return (
    <div className="relative z-50">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm"></div>
      <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-4xl rounded-lg bg-card border shadow-xl">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-green-500 mb-6">{initialData?.id ? 'Editar' : 'Crear Nuevo'} Contrato</h3>
              
              <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2">
                {/* Información Principal */}
                <section>
                  <h4 className="text-lg font-semibold text-foreground mb-4 border-b pb-2">Información Principal</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1"><label className="text-sm font-medium text-muted-foreground">Número de Contrato</label><input type="text" name="contractNumber" value={data.contractNumber || ''} onChange={handleChange} className="bg-background border border-input rounded-md px-3 py-2 w-full" /></div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Fecha de Venta</label>
                        <input type="date" name="saleDate" value={data.saleDate || ''} onChange={handleChange} className="bg-background border border-input rounded-md px-3 py-2 w-full" />
                    </div>
                    <div className="space-y-1"><label className="text-sm font-medium text-muted-foreground">Exportadora</label><input type="text" value={getExporterName()} readOnly className="bg-muted border border-input rounded-md px-3 py-2 w-full cursor-not-allowed" /></div>
                    <div className="space-y-1"><label className="text-sm font-medium text-muted-foreground">Comprador</label><select name="buyer" value={data.buyer || ''} onChange={handleChange} className="bg-background border border-input rounded-md px-3 py-2 w-full"><option value="" disabled>Selecciona un comprador</option>{buyers.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}</select></div>
                  </div>
                </section>
                
                {/* Detalles del Café y Precio */}
                <section>
                  <h4 className="text-lg font-semibold text-foreground mb-4 border-b pb-2">Detalles del Café y Precio</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-end">
                    <div className="space-y-1"><label className="text-sm font-medium text-foreground text-green-500">Tipo de Café</label><input type="text" name="coffeeType" value={data.coffeeType || ''} onChange={handleChange} placeholder="Ej: SHB, Natural" className="bg-background border border-input rounded-md px-3 py-2 w-full" /></div>
                    <div className="space-y-1"><label className="text-sm font-medium text-muted-foreground">Posición (Mes Mercado)</label><select name="marketMonth" value={data.marketMonth || ''} onChange={handleChange} className="bg-background border border-input rounded-md px-3 py-2 w-full">{months.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                    <div className="space-y-1"><label className="text-sm font-medium text-muted-foreground">Diferencial ($)</label><input type="number" name="differential" value={data.differential || ''} placeholder="Ej: 10, -15" onChange={handleChange} className="bg-background border border-input rounded-md px-3 py-2 w-full" /></div>
                    <div className="space-y-1"><label className="text-sm font-medium text-muted-foreground">Mes de Embarque</label><select name="shipmentMonth" value={data.shipmentMonth || ''} onChange={handleChange} className="bg-background border border-input rounded-md px-3 py-2 w-full">{months.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                  </div>
                </section>

                {/* Certificaciones */}
                <section>
                    <h4 className="text-lg font-semibold text-foreground mb-4 border-b pb-2">Certificaciones</h4>
                    <div className="flex flex-wrap gap-4">
                        {certificationsList.map(({ key, label }) => (
                            <button key={key} type="button" onClick={() => handleCertificationChange(key)} className={`flex items-center gap-2 rounded-full px-4 py-2 border text-sm font-medium transition-colors ${data.certifications?.[key] ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-input hover:bg-accent'}`}>
                                <div className={`w-4 h-4 rounded-full border-2 ${data.certifications?.[key] ? 'bg-primary-foreground border-primary-foreground' : 'bg-transparent border-input'}`}></div>
                                {label}
                            </button>
                        ))}
                    </div>
                </section>
                
                {/* Estado y Documentos */}
                <section>
                    <h4 className="text-lg font-semibold text-foreground mb-4 border-b pb-2">Estado y Documentos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-4">
                            <label className="flex items-center justify-between p-4 rounded-lg border"><div><p className="font-medium text-foreground">Contrato Terminado</p><p className="text-sm text-muted-foreground">Indica si el contrato se ha completado.</p></div><input type="checkbox" name="isTerminated" checked={data.isTerminated || false} onChange={handleSwitchChange} className="toggle-switch" /></label>
                            <label className="flex items-center justify-between p-4 rounded-lg border"><div><p className="font-medium text-foreground">Alquiler de Licencia</p><p className="text-sm text-muted-foreground">Activar si solo se presta la licencia.</p></div><input type="checkbox" name="isLicenseRental" checked={data.isLicenseRental || false} onChange={handleSwitchChange} className="toggle-switch" /></label>
                        </div>
                        
                        {/* Files with Progress Bar */}
                        <div className="space-y-6">
                            {/* Contract PDF */}
                            <div>
                                <p className="text-sm font-medium text-foreground mb-1">PDF Contrato</p>
                                {uploadingField === 'contractPdf' ? (
                                    <div className="py-2">
                                        <p className="text-xs text-blue-600 mb-1">Subiendo... {Math.round(uploadProgress)}%</p>
                                        <ProgressBar progress={uploadProgress} />
                                    </div>
                                ) : data.contractPdf ? (
                                    <div className="flex items-center justify-between p-2 border rounded bg-muted/20">
                                        <div className="flex items-center gap-2 text-sm truncate">
                                            <PaperClipIcon className="w-4 h-4 flex-shrink-0 text-blue-500" />
                                            <a href={data.contractPdf.url || '#'} target="_blank" rel="noopener noreferrer" className="truncate underline hover:text-blue-600">{data.contractPdf.name}</a>
                                        </div>
                                        <button type="button" onClick={() => removeFile('contractPdf')}><TrashIcon className="w-4 h-4 text-destructive" /></button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <button type="button" onClick={() => document.getElementById('contractPdf-upload')?.click()} className="w-full flex items-center justify-center gap-2 bg-white border border-dashed border-input text-muted-foreground font-medium rounded-md py-3 hover:bg-accent/50 text-sm transition-colors">
                                            <UploadIcon className="w-4 h-4" /> Subir PDF Contrato
                                        </button>
                                        <input type="file" id="contractPdf-upload" onChange={(e) => handleFileUpload(e, 'contractPdf')} className="hidden" accept=".pdf" />
                                    </div>
                                )}
                            </div>

                            {/* Instructions PDF */}
                            <div>
                                <p className="text-sm font-medium text-foreground mb-1">PDF Instrucciones</p>
                                {uploadingField === 'instructionsPdf' ? (
                                    <div className="py-2">
                                        <p className="text-xs text-blue-600 mb-1">Subiendo... {Math.round(uploadProgress)}%</p>
                                        <ProgressBar progress={uploadProgress} />
                                    </div>
                                ) : data.instructionsPdf ? (
                                    <div className="flex items-center justify-between p-2 border rounded bg-muted/20">
                                        <div className="flex items-center gap-2 text-sm truncate">
                                            <PaperClipIcon className="w-4 h-4 flex-shrink-0 text-blue-500" />
                                            <a href={data.instructionsPdf.url || '#'} target="_blank" rel="noopener noreferrer" className="truncate underline hover:text-blue-600">{data.instructionsPdf.name}</a>
                                        </div>
                                        <button type="button" onClick={() => removeFile('instructionsPdf')}><TrashIcon className="w-4 h-4 text-destructive" /></button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <button type="button" onClick={() => document.getElementById('instructionsPdf-upload')?.click()} className="w-full flex items-center justify-center gap-2 bg-white border border-dashed border-input text-muted-foreground font-medium rounded-md py-3 hover:bg-accent/50 text-sm transition-colors">
                                            <UploadIcon className="w-4 h-4" /> Subir PDF Instrucciones
                                        </button>
                                        <input type="file" id="instructionsPdf-upload" onChange={(e) => handleFileUpload(e, 'instructionsPdf')} className="hidden" accept=".pdf" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
              </div>
            </div>
            <div className="bg-muted px-6 py-4 flex flex-row-reverse gap-3">
              <button onClick={handleSave} disabled={!!uploadingField} className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">Guardar Contrato</button>
              <button onClick={onClose} className="rounded-md bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 3.25rem;
            height: 1.75rem;
            -webkit-appearance: none;
            appearance: none;
            background-color: hsl(var(--input));
            border-radius: 9999px;
            transition: background-color 0.2s;
            cursor: pointer;
        }
        .toggle-switch:checked {
            background-color: hsl(var(--primary));
        }
        .toggle-switch::before {
            content: '';
            position: absolute;
            top: 0.25rem;
            left: 0.25rem;
            width: 1.25rem;
            height: 1.25rem;
            background-color: white;
            border-radius: 9999px;
            transition: transform 0.2s;
        }
        .toggle-switch:checked::before {
            transform: translateX(1.5rem);
        }
      `}</style>
    </div>
  );
};

export default ContractModal;
