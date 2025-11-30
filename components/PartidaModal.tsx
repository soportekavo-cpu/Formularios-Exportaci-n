

import React, { useState, useEffect, useMemo } from 'react';
import type { Partida, DocumentAttachment, MarksStatus, Company, ExportWorkflowStep, Contract, TransportType } from '../types';
import { PaperClipIcon, TrashIcon, EyeIcon, CheckCircleIcon, ExclamationTriangleIcon, ShipIcon, PaperAirplaneIcon, LockClosedIcon, LockOpenIcon, UploadIcon } from './Icons';
import { getHarvestYear } from '../utils/companyData';
import { uploadFileWithProgress } from '../services/uploadService';
import { ProgressBar } from './ProgressBar';

interface PartidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (partida: Partida) => void;
  initialData: Partial<Partida> | null;
  contractId: string | null;
  contractDifferential: string;
  activeCompany: Company;
  isReadOnly?: boolean;
  contracts?: Contract[];
}

const packageTypes = ["Saco de Yute", "Sacos de Yute y GrainPro", "Caja", "Big Bag", "Jumbo", "Otro"];
const navieras = ["Seaboard", "Maersk", "MSC", "Hapag-Lloyd", "CMA CGM", "ONE", "Evergreen", "ZIM", "Otro"];
const marksStatuses: { key: MarksStatus; label: string }[] = [
    { key: 'pending', label: 'Pendiente' },
    { key: 'sent', label: 'Enviada' },
    { key: 'confirmed', label: 'Confirmada para Impresión' },
];

const ToggleSwitch = ({ label, checked, onChange, disabled, color = "green" }: { label: string, checked: boolean, onChange: (checked: boolean) => void, disabled?: boolean, color?: string }) => {
    const bgChecked = color === 'green' ? 'bg-green-500' : 'bg-blue-500';
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={`${
                    checked ? bgChecked : 'bg-gray-200'
                } relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                <span aria-hidden="true" className={`${checked ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
            </button>
        </div>
    );
};

const PartidaModal: React.FC<PartidaModalProps> = ({ isOpen, onClose, onSave, initialData, contractId, contractDifferential, activeCompany, isReadOnly = false, contracts = [] }) => {
  const [partida, setPartida] = useState<Partial<Partida>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPesoLocked, setIsPesoLocked] = useState(true);
  
  // Upload States
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
        const baseData: Partial<Partida> = {
            packageType: 'Saco de Yute',
            marksStatus: 'pending',
            isfRequerido: false,
            isfEnviado: false,
            fijacion: '',
            finalPrice: Number(contractDifferential || 0),
            workflow: [],
            transportType: 'Maritime',
            pesoQqs: ''
        };
        
        if (initialData) {
            if (initialData.id) {
                setPartida({ ...baseData, ...initialData });
            } else {
                setPartida({ ...baseData, ...initialData, id: new Date().toISOString() + Math.random().toString(36).substr(2, 9) });
            }
        } else {
             setPartida({ ...baseData, id: new Date().toISOString() + Math.random().toString(36).substr(2, 9) });
        }
        setValidationError(null);
        setIsPesoLocked(true);
    }
  }, [isOpen, initialData, contractDifferential]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isReadOnly) return;
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (type === 'checkbox') {
        finalValue = (e.target as HTMLInputElement).checked;
    }

    setPartida(prev => {
        let updated = { ...prev, [name]: finalValue };
        if (name === 'pesoKg' && isPesoLocked) {
            const kg = Number(finalValue);
            if (!isNaN(kg) && kg > 0) {
                 updated.pesoQqs = Number((kg / 46).toFixed(2));
            } else {
                 updated.pesoQqs = '';
            }
        }
        return updated;
    });
    if (name === 'partidaNo') setValidationError(null);
  };
  
  const handlePesoQqsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isReadOnly || isPesoLocked) return;
      const val = e.target.value;
      setPartida(prev => ({ ...prev, pesoQqs: val === '' ? '' : Number(val) }));
  };
  
  const togglePesoLock = () => {
      if (isReadOnly) return;
      if (!isPesoLocked) {
          const kg = Number(partida.pesoKg);
          if (!isNaN(kg) && kg > 0) {
              setPartida(prev => ({ ...prev, pesoQqs: Number((kg / 46).toFixed(2)) }));
          }
      }
      setIsPesoLocked(!isPesoLocked);
  };

  const calculatedFinalPrice = useMemo(() => {
      const diff = Number(contractDifferential || 0);
      const fix = Number(partida.fijacion || 0);
      return diff + fix;
  }, [contractDifferential, partida.fijacion]);
  
  const handleTransportTypeChange = (type: TransportType) => {
      if (isReadOnly) return;
      setPartida(prev => ({...prev, transportType: type}));
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof Partida) => {
    if (isReadOnly) return;
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const path = `pdfs/${activeCompany}/partidas/${partida.partidaNo || 'new'}/${file.name}`;
        
        setUploadingField(field as string);
        setUploadProgress(0);

        try {
            const attachment = await uploadFileWithProgress(file, path, (progress) => {
                setUploadProgress(progress);
            });
            setPartida(prev => ({ ...prev, [field]: attachment }));
        } catch (error) {
            console.error(error);
            alert("Error al subir el archivo.");
        } finally {
            setUploadingField(null);
            setUploadProgress(0);
        }
    }
  };
  
  const removeFile = (field: keyof Partida) => {
      if (isReadOnly) return;
      setPartida(prev => ({ ...prev, [field]: undefined }));
  };

  const validatePartidaNo = (): boolean => {
      if (!partida.partidaNo || !contractId) return true; 
      const currentContract = contracts.find(c => c.id === contractId);
      if (!currentContract) return true;
      const currentHarvest = currentContract.harvestYear || getHarvestYear(currentContract.saleDate || '');
      const normalizedPartidaNo = (partida.partidaNo || '').trim();

      for (const c of contracts) {
          const cHarvest = c.harvestYear || getHarvestYear(c.saleDate || '');
          if (cHarvest === currentHarvest && c.company === activeCompany) {
              const duplicate = (c.partidas || []).find(p => {
                  if (c.id === contractId && p.id === partida.id) return false;
                  return (p.partidaNo || '').trim() === normalizedPartidaNo;
              });
              if (duplicate) {
                  setValidationError(`El número de partida ${partida.partidaNo} ya existe en la cosecha ${currentHarvest} (Contrato ${c.contractNumber}).`);
                  return false;
              }
          }
      }
      return true;
  };

  const handleSave = () => {
    if (!validatePartidaNo()) return;
    onSave({ ...partida, finalPrice: calculatedFinalPrice } as Partida);
  };
  
  const openAttachment = (attachment: DocumentAttachment) => {
      // Support for both Legacy Base64 and New Firebase Storage URLs
      if (attachment.url) {
          window.open(attachment.url, '_blank');
      } else if (attachment.data) {
          const byteCharacters = atob(attachment.data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: attachment.type });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
      }
  };

  const FileUploader = ({ field, label, attachment }: { field: keyof Partida, label: string, attachment?: DocumentAttachment }) => (
      <div className="space-y-1">
          <label className="block text-xs font-medium">{label}</label>
          {uploadingField === field ? (
              <div className="p-2 border rounded bg-white dark:bg-background">
                  <p className="text-xs text-blue-600 mb-1">Subiendo... {Math.round(uploadProgress)}%</p>
                  <ProgressBar progress={uploadProgress} className="h-2" />
              </div>
          ) : attachment ? (
              <div className="flex items-center justify-between p-2 border rounded bg-white dark:bg-background">
                  <div className="flex items-center gap-2 truncate cursor-pointer hover:text-primary" onClick={() => openAttachment(attachment)}>
                      <PaperClipIcon className="w-4 h-4" />
                      <span className="truncate text-xs underline">{attachment.name}</span>
                  </div>
                  {!isReadOnly && <button type="button" onClick={() => removeFile(field)}><TrashIcon className="w-4 h-4 text-destructive" /></button>}
              </div>
          ) : (
              !isReadOnly && (
                  <div className="relative">
                      <button type="button" onClick={() => document.getElementById(`${field}-${partida.id || 'new'}`)?.click()} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-secondary/20 border border-input text-muted-foreground font-medium rounded-md py-1.5 hover:bg-accent text-xs">
                          <UploadIcon className="w-3 h-3" /> Subir PDF
                      </button>
                      <input type="file" id={`${field}-${partida.id || 'new'}`} onChange={(e) => handleFileUpload(e, field)} className="hidden" accept=".pdf,image/*" />
                  </div>
              )
          )}
      </div>
  );

  if (!isOpen) return null;
  
  const partidaPrefix = activeCompany === 'dizano' ? '11/988/' : '11/44360/';
  const formatCurrency = (num?: number) => (num || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const inputClass = `bg-background border border-input rounded-md px-3 py-2 w-full text-sm ${isReadOnly ? 'cursor-not-allowed bg-muted text-muted-foreground' : ''}`;

  return (
    <div className="relative z-[60]">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm"></div>
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-5xl rounded-lg bg-card border shadow-xl">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  {isReadOnly && <EyeIcon className="w-6 h-6 text-muted-foreground"/>}
                  {isReadOnly ? 'Detalle de Partida' : (initialData?.id ? 'Editar Partida' : 'Agregar Partida')}
              </h3>
              <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-3">
                 
                 {/* SECCIÓN AZUL: Información General */}
                 <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
                     <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-3 uppercase tracking-wide border-b border-blue-200 dark:border-blue-800 pb-1">Información General</h4>
                     <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-4">
                        {/* Partida Number - Compact */}
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium mb-1 text-blue-600 dark:text-blue-400">No. Partida</label>
                            <div className="flex items-center">
                                <input type="text" inputMode="decimal" name="partidaNo" value={partida.partidaNo || ''} onChange={handleChange} className={`bg-background border border-input rounded-md px-2 py-2 w-full text-sm font-bold text-center ${isReadOnly ? 'cursor-not-allowed bg-muted' : ''} ${validationError ? 'border-destructive ring-1 ring-destructive' : ''}`} readOnly={isReadOnly} placeholder="1" />
                            </div>
                             {validationError && <p className="text-xs text-destructive mt-1 absolute bg-white p-1 border rounded shadow-sm z-10">{validationError}</p>}
                             <span className="text-[10px] text-muted-foreground">{partidaPrefix}</span>
                        </div>
                        <div><label className="block text-xs font-medium mb-1">Bultos</label><input type="number" inputMode="decimal" name="numBultos" value={partida.numBultos || ''} onChange={handleChange} className={inputClass} readOnly={isReadOnly}/></div>
                        <div><label className="block text-xs font-medium mb-1">Peso Kg.</label><input type="number" inputMode="decimal" step="0.01" name="pesoKg" value={partida.pesoKg || ''} onChange={handleChange} className={inputClass} readOnly={isReadOnly}/></div>
                        
                        {/* Editable Peso Qqs with Lock */}
                        <div>
                            <label className="block text-xs font-medium mb-1 text-blue-700 dark:text-blue-300">Peso qqs.</label>
                            <div className="relative flex items-center">
                                <input 
                                    type="number" 
                                    inputMode="decimal"
                                    step="0.01" 
                                    name="pesoQqs" 
                                    value={partida.pesoQqs === undefined ? '' : partida.pesoQqs} 
                                    onChange={handlePesoQqsChange} 
                                    className={`${inputClass} pr-8 ${isPesoLocked ? 'cursor-not-allowed bg-gray-100 text-gray-500' : ''}`} 
                                    readOnly={isReadOnly || isPesoLocked}
                                    placeholder="Auto"
                                />
                                {!isReadOnly && (
                                    <button 
                                        type="button"
                                        onClick={togglePesoLock} 
                                        className="absolute right-2 p-1 text-muted-foreground hover:text-primary focus:outline-none"
                                        title={isPesoLocked ? "Desbloquear para editar manual" : "Bloquear para cálculo automático"}
                                    >
                                        {isPesoLocked ? <LockClosedIcon className="w-3 h-3" /> : <LockOpenIcon className="w-3 h-3" />}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div><label className="block text-xs font-medium mb-1">Fijación ($)</label><input type="number" inputMode="decimal" step="0.01" name="fijacion" value={partida.fijacion || ''} onChange={handleChange} className={inputClass} readOnly={isReadOnly}/></div>
                        
                        <div className="md:col-span-2 bg-white dark:bg-background border border-blue-200 dark:border-blue-800 rounded-md p-2 flex flex-col justify-center">
                             <span className="text-xs font-semibold text-muted-foreground">Precio Final (Diff + Fijación)</span>
                             <span className="text-lg font-bold text-green-600">{formatCurrency(calculatedFinalPrice)}</span>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-blue-200 dark:border-blue-800 pt-4">
                         <div>
                            <label className="block text-xs font-medium mb-1">Tipo Empaque</label>
                            <select name="packageType" value={partida.packageType} onChange={handleChange} className={inputClass} disabled={isReadOnly}>
                                {packageTypes.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            {partida.packageType === 'Otro' && (<input type="text" placeholder="Especificar" name="customPackageType" value={partida.customPackageType || ''} onChange={handleChange} className={`mt-2 ${inputClass}`} readOnly={isReadOnly} />)}
                         </div>
                         <div>
                             <div className="flex justify-between mb-1">
                                <label className="block text-xs font-medium">Instrucciones de Marcas</label>
                                <select name="marksStatus" value={partida.marksStatus} onChange={handleChange} className="text-xs border rounded p-1 bg-white dark:bg-background" disabled={isReadOnly}>{marksStatuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
                             </div>
                             <div className="grid grid-cols-3 gap-2">
                                <textarea name="marks" value={partida.marks || ''} onChange={handleChange} className={`${inputClass} col-span-2 min-h-[38px]`} readOnly={isReadOnly} placeholder="Texto de marcas..."/>
                                <FileUploader field="marksAttachment" label="" attachment={partida.marksAttachment} />
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* SECCIÓN VIOLETA: Logística */}
                 <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4">
                    <div className="flex justify-between items-center border-b border-indigo-200 dark:border-indigo-800 pb-1 mb-3">
                        <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">Logística</h4>
                        <div className="flex items-center gap-2 bg-white dark:bg-background rounded-md p-1 border border-indigo-200 dark:border-indigo-800">
                            <button onClick={() => handleTransportTypeChange('Maritime')} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${(!partida.transportType || partida.transportType === 'Maritime') ? 'bg-indigo-100 text-indigo-700' : 'text-muted-foreground hover:bg-muted'}`} type="button">
                                <ShipIcon className="w-3 h-3" /> Marítimo
                            </button>
                            <button onClick={() => handleTransportTypeChange('Air')} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${partida.transportType === 'Air' ? 'bg-sky-100 text-sky-700' : 'text-muted-foreground hover:bg-muted'}`} type="button">
                                <PaperAirplaneIcon className="w-3 h-3" /> Aéreo
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div><label className="block text-xs font-medium mb-1">Booking</label><input type="text" name="booking" value={partida.booking || ''} onChange={handleChange} className={inputClass} readOnly={isReadOnly}/></div>
                        <div><label className="block text-xs font-medium mb-1 text-purple-700 font-bold">Número de BL</label><input type="text" name="blNumber" value={partida.blNumber || ''} onChange={handleChange} className={inputClass} readOnly={isReadOnly}/></div>
                        <div>
                            <label className="block text-xs font-medium mb-1">{partida.transportType === 'Air' ? 'Aerolínea' : 'Naviera'}</label>
                            <select name="naviera" value={partida.naviera || ''} onChange={handleChange} className={inputClass} disabled={isReadOnly}>
                                <option value="">Selecciona</option>
                                {navieras.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            {partida.naviera === 'Otro' && (<input type="text" placeholder="Especificar" name="customNaviera" value={partida.customNaviera || ''} onChange={handleChange} className={`mt-2 ${inputClass}`} readOnly={isReadOnly} />)}
                        </div>
                        <div><label className="block text-xs font-medium mb-1">Destino Final</label><input type="text" name="destino" value={partida.destino || ''} onChange={handleChange} className={inputClass} placeholder="Ej: New York, USA" readOnly={isReadOnly}/></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                         <div><label className="block text-xs font-medium mb-1">{partida.transportType === 'Air' ? 'No. Guía / Ref' : 'Contenedor'}</label><input type="text" name="containerNo" value={partida.containerNo || ''} onChange={handleChange} className={inputClass} readOnly={isReadOnly}/></div>
                         <div><label className="block text-xs font-medium mb-1">Marchamo</label><input type="text" name="sealNo" value={partida.sealNo || ''} onChange={handleChange} className={inputClass} readOnly={isReadOnly}/></div>
                         <div><label className="block text-xs font-medium mb-1">Fecha Zarpe (ETD)</label><input type="date" name="etd" value={partida.etd || ''} onChange={handleChange} className={inputClass} readOnly={isReadOnly}/></div>
                         <div><label className="block text-xs font-medium mb-1 text-red-600 dark:text-red-400">Cut Off Puerto</label><input type="date" name="cutOffPort" value={partida.cutOffPort || ''} onChange={handleChange} className={inputClass} readOnly={isReadOnly}/></div>
                    </div>
                    
                    <div className="flex gap-8 items-center py-2 px-4 bg-white dark:bg-background rounded-md border border-indigo-100 dark:border-indigo-800">
                        <ToggleSwitch label="ISF Requerido" checked={!!partida.isfRequerido} onChange={(v) => setPartida(p => ({...p, isfRequerido: v, isfEnviado: v ? p.isfEnviado : false }))} disabled={isReadOnly} />
                        {partida.isfRequerido && (
                            <ToggleSwitch label="ISF Enviado" checked={!!partida.isfEnviado} onChange={(v) => setPartida(p => ({...p, isfEnviado: v}))} disabled={isReadOnly} />
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-indigo-100 dark:border-indigo-800 mt-4">
                        <FileUploader field="bookingAttachment" label="Confirmación Booking" attachment={partida.bookingAttachment} />
                        <FileUploader field="blAttachment" label="Documento BL" attachment={partida.blAttachment} />
                    </div>
                 </div>

                 {/* SECCIÓN VERDE: Seguimiento */}
                 <div className="bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-lg p-4">
                     <h4 className="text-sm font-bold text-green-700 dark:text-green-400 mb-3 uppercase tracking-wide border-b border-green-200 dark:border-green-800 pb-1">Permisos y Documentos</h4>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-green-800 dark:text-green-300">Permiso de Embarque</label>
                            <input type="text" placeholder="No. Permiso" className={inputClass} value={partida.permisoEmbarqueNo || ''} onChange={(e) => setPartida(prev => ({...prev, permisoEmbarqueNo: e.target.value}))} readOnly={isReadOnly}/>
                            <FileUploader field="permisoEmbarquePdf" label="" attachment={partida.permisoEmbarquePdf} />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-green-800 dark:text-green-300">Certificado Fitosanitario</label>
                            <input type="text" placeholder="No. Certificado" className={inputClass} value={partida.fitosanitarioNo || ''} onChange={(e) => setPartida(prev => ({...prev, fitosanitarioNo: e.target.value}))} readOnly={isReadOnly}/>
                            <FileUploader field="fitosanitarioPdf" label="" attachment={partida.fitosanitarioPdf} />
                        </div>
                     </div>
                 </div>
                 
                 {/* SECCIÓN NARANJA: Fiscal */}
                 <div className="bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 rounded-lg p-4">
                     <h4 className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-3 uppercase tracking-wide border-b border-orange-200 dark:border-orange-800 pb-1">Fiscal</h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="space-y-2">
                             <label className="block text-xs font-medium">Factura Fiscal</label>
                             <input type="text" name="invoiceNo" placeholder="No. Factura" value={partida.invoiceNo || ''} onChange={handleChange} className={inputClass} readOnly={isReadOnly}/>
                             <FileUploader field="invoicePdf" label="" attachment={partida.invoicePdf} />
                         </div>
                         <div className="space-y-2">
                             <label className="block text-xs font-medium">Duca Simplificada</label>
                             <input type="text" name="ducaZNo" placeholder="No. Duca Z" value={partida.ducaZNo || ''} onChange={handleChange} className={inputClass} readOnly={isReadOnly}/>
                             <FileUploader field="ducaZPdf" label="" attachment={partida.ducaZPdf} />
                         </div>
                         <div className="space-y-2">
                             <label className="block text-xs font-medium">Duca Complementaria</label>
                             <input type="text" name="ducaCNo" placeholder="No. Duca C" value={partida.ducaCNo || ''} onChange={handleChange} className={inputClass} readOnly={isReadOnly}/>
                             <FileUploader field="ducaCPdf" label="" attachment={partida.ducaCPdf} />
                         </div>
                     </div>
                 </div>

                 <div className="text-right pt-2 border-t">
                    <p className="text-xs text-muted-foreground mt-1">Valor del Cobro</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(Number(partida.pesoKg || 0) / 46 * (calculatedFinalPrice || 0))}</p>
                 </div>

              </div>
            </div>
            <div className="bg-muted px-6 py-4 flex flex-row-reverse gap-3">
              {!isReadOnly && <button onClick={handleSave} disabled={!!uploadingField} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">Guardar Partida</button>}
              <button onClick={onClose} className="rounded-md bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent">{isReadOnly ? 'Cerrar' : 'Cancelar'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartidaModal;