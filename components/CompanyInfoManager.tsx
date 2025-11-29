
import React, { useState, useEffect, useRef } from 'react';
import type { CompanyInfo } from '../utils/companyData';
import { TrashIcon, UploadIcon, CheckCircleIcon } from './Icons';
import { removeWhiteBackground } from '../utils/imageProcessing';

interface CompanyInfoManagerProps {
  title: string;
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: CompanyInfo) => void;
}

const inputStyles = "block w-full text-base bg-background rounded-lg border-input shadow-sm focus:border-primary focus:ring-primary transition-colors duration-200 px-4 py-3 ring-1 ring-inset focus:ring-2 focus:ring-inset";
const textareaStyles = `${inputStyles} min-h-[80px]`;

const CompanyInfoManager: React.FC<CompanyInfoManagerProps> = ({ title, companyInfo, setCompanyInfo }) => {
  const [localInfo, setLocalInfo] = useState<CompanyInfo>(companyInfo);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalInfo(companyInfo);
  }, [companyInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalInfo(prev => ({ ...prev, [name]: value }));
    if (saveStatus === 'success') setSaveStatus('idle');
  };
  
  const handleSignatureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const rawResult = reader.result as string;
            try {
                const processed = await removeWhiteBackground(rawResult);
                setLocalInfo(prev => ({ ...prev, signature: processed }));
            } catch (e) {
                console.error("Failed to process signature transparency", e);
                setLocalInfo(prev => ({ ...prev, signature: rawResult }));
            }
            if (saveStatus === 'success') setSaveStatus('idle');
        };
        reader.readAsDataURL(file);
      }
  };

  const handleRemoveSignature = () => {
      setLocalInfo(prev => ({ ...prev, signature: undefined }));
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
        setCompanyInfo(localInfo);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600); // Fake delay for visual effect
  };

  return (
    <div className="bg-card p-4 rounded-lg border">
      <h3 className="font-semibold text-foreground mb-4">{title}</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-muted-foreground">Nombre</label><input type="text" name="name" value={localInfo.name} onChange={handleChange} className={inputStyles} /></div>
            <div><label className="text-sm font-medium text-muted-foreground">Beneficiario</label><input type="text" name="beneficiary" value={localInfo.beneficiary} onChange={handleChange} className={inputStyles} /></div>
            <div><label className="text-sm font-medium text-muted-foreground">Dirección Línea 1</label><input type="text" name="address1" value={localInfo.address1} onChange={handleChange} className={inputStyles} /></div>
            <div><label className="text-sm font-medium text-muted-foreground">Dirección Línea 2</label><input type="text" name="address2" value={localInfo.address2} onChange={handleChange} className={inputStyles} /></div>
            <div><label className="text-sm font-medium text-muted-foreground">Ciudad/Estado</label><input type="text" name="cityState" value={localInfo.cityState} onChange={handleChange} className={inputStyles} /></div>
            <div><label className="text-sm font-medium text-muted-foreground">Teléfono</label><input type="text" name="phone" value={localInfo.phone} onChange={handleChange} className={inputStyles} /></div>
            <div className="sm:col-span-2"><label className="text-sm font-medium text-muted-foreground">Email</label><input type="email" name="email" value={localInfo.email} onChange={handleChange} className={inputStyles} /></div>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Dirección Completa (Pie de Página)</label>
          <textarea name="fullAddress" value={localInfo.fullAddress} onChange={handleChange} className={textareaStyles}></textarea>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Texto de Remitente (Carta Porte)</label>
          <textarea name="shipperText" value={localInfo.shipperText} onChange={handleChange} className={textareaStyles}></textarea>
        </div>
        
        <div className="border-t pt-4">
            <label className="text-sm font-medium text-muted-foreground block mb-2">Firma del Representante (Imagen)</label>
            <div className="flex items-center gap-4">
                {localInfo.signature ? (
                    <div className="relative border rounded p-2 bg-white">
                        <img src={localInfo.signature} alt="Firma" className="h-16 w-auto object-contain"/>
                        <button onClick={handleRemoveSignature} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                ) : (
                    <div className="h-16 w-32 border border-dashed rounded flex items-center justify-center text-xs text-muted-foreground bg-muted/20">Sin firma</div>
                )}
                <div className="flex-1">
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        className="flex items-center gap-2 px-3 py-2 text-sm border border-input rounded hover:bg-accent bg-background text-foreground font-medium"
                    >
                        <UploadIcon className="w-4 h-4"/> Subir Imagen (JPG/PNG)
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleSignatureChange}/>
                    <p className="text-xs text-muted-foreground mt-1">El fondo blanco se eliminará automáticamente.</p>
                </div>
            </div>
        </div>

        <div className="flex justify-end items-center pt-2">
            <button 
                onClick={handleSave} 
                disabled={saveStatus !== 'idle'}
                className={`rounded-md px-6 py-2.5 text-sm font-semibold shadow-sm flex items-center gap-2 transition-all duration-200 ${
                    saveStatus === 'success' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
            >
                {saveStatus === 'saving' && (
                    <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {saveStatus === 'success' && <CheckCircleIcon className="h-5 w-5" />}
                {saveStatus === 'idle' ? 'Guardar Cambios' : saveStatus === 'saving' ? 'Guardando...' : '¡Guardado!'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoManager;
