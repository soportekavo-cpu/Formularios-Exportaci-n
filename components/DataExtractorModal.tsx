
import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { Certificate, PackageItem } from '../types';
import { DocumentMagnifyingGlassIcon, SparklesIcon } from './Icons';

interface DataExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtractionComplete: (data: Partial<Certificate>) => void;
}

async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

const DataExtractorModal: React.FC<DataExtractorModalProps> = ({ isOpen, onClose, onExtractionComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      if (['image/jpeg', 'image/png', 'application/pdf'].includes(selectedFile.type)) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Por favor, sube un archivo JPG, PNG o PDF.');
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleExtractData = async () => {
    if (!file) {
      setError('Por favor, selecciona un archivo primero.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // Safe environment access
      // @ts-ignore
      const apiKey = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : undefined) || (typeof process !== 'undefined' ? process.env.VITE_GEMINI_API_KEY || process.env.API_KEY : undefined);
      
      if (!apiKey) {
          throw new Error("API Key not found. Check VITE_GEMINI_API_KEY configuration.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const imagePart = await fileToGenerativePart(file);
      const textPart = { text: "Extract details from this Bill of Lading or Carta de Porte. For a Carta de Porte, identify 'Lugar y Fecha' to populate 'place' and 'certificateDate'. Extract all transport-related fields: 'Compañía Contratista' for transportCompany, 'Piloto' for driverName, 'Licencia' for driverLicense, 'Placas' for licensePlate, 'Furgon/Plataforma' for transportUnit, 'Contenedor' for containerNo, 'Vapor' for shippingLine, and 'Marchamo' for sealNo. For the items table, extract each row into the `packages` array: 'CANT.' is quantity, 'CLASE' is type, 'P. NETO' is unitWeight, 'TARA' is tareUnitWeight, and 'P. BRUTO' is grossUnitWeight. If a value is not present, use an empty string." };

      const responseSchema = {
          type: Type.OBJECT,
          properties: {
              consignee: { type: Type.STRING },
              notify: { type: Type.STRING },
              billOfLadingNo: { type: Type.STRING },
              shippingLine: { type: Type.STRING },
              containerNo: { type: Type.STRING },
              sealNo: { type: Type.STRING },
              destination: { type: Type.STRING },
              product: { type: Type.STRING },
              transportCompany: { type: Type.STRING },
              driverName: { type: Type.STRING },
              driverLicense: { type: Type.STRING },
              transportUnit: { type: Type.STRING },
              licensePlate: { type: Type.STRING },
              observations: { type: Type.STRING },
              place: { type: Type.STRING },
              certificateDate: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
              packages: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          quantity: { type: Type.NUMBER },
                          type: { type: Type.STRING },
                          marks: { type: Type.STRING },
                          contains: { type: Type.STRING },
                          unitWeight: { type: Type.NUMBER },
                          tareUnitWeight: { type: Type.NUMBER },
                          grossUnitWeight: { type: Type.NUMBER },
                      }
                  }
              }
          }
      };

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: { parts: [imagePart, textPart] },
          config: {
              responseMimeType: "application/json",
              responseSchema: responseSchema,
          },
      });

      const jsonText = response.text;
      const jsonData = JSON.parse(jsonText);

      const mappedData: Partial<Certificate> = {
          ...jsonData,
          // Handle the case where the model might return a single containerNo string instead of a containers array
          containers: jsonData.containerNo ? [{
              id: new Date().toISOString(),
              containerNo: jsonData.containerNo,
              sealNo: jsonData.sealNo || '',
              packages: (jsonData.packages || []).map((pkg: any): PackageItem => ({
                ...pkg,
                id: new Date().toISOString() + Math.random(),
                quantity: pkg.quantity || '',
                unitWeight: pkg.unitWeight || '',
                tareUnitWeight: pkg.tareUnitWeight || '',
                grossUnitWeight: pkg.grossUnitWeight || '',
                contains: pkg.contains || '',
              }))
          }] : [],
      };

      onExtractionComplete(mappedData);

    } catch (err) {
      console.error(err);
      setError('No se pudieron extraer los datos. Intenta con un documento más claro o revisa la consola para ver detalles.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"></div>
      <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-card text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border">
            <div className="bg-card p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold leading-6 text-foreground" id="modal-title">Extracción Inteligente</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Sube un Bill of Lading o Carta de Porte (PDF, JPG, PNG) para pre-rellenar el formulario.</p>
                </div>
                <button onClick={onClose} className="p-1 rounded-full text-muted-foreground hover:bg-accent">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div 
                className={`mt-4 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-border'}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-2 block text-sm font-semibold text-foreground">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80">
                        <span>Sube un archivo</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} accept=".pdf,.jpg,.jpeg,.png" />
                    </label>
                    <p className="pl-1 inline">o arrástralo aquí</p>
                </div>
                <p className="text-xs text-muted-foreground">PDF, PNG, JPG</p>
                {file && <p className="mt-2 text-sm font-medium text-green-600">Archivo seleccionado: {file.name}</p>}
              </div>

              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            </div>
            <div className="bg-muted px-6 py-4 flex flex-col sm:flex-row-reverse sm:items-center gap-3">
              <button
                type="button"
                onClick={handleExtractData}
                disabled={!file || isLoading}
                className="inline-flex w-full justify-center items-center gap-x-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analizando...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5"/>
                    Extraer Datos con IA
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent sm:mt-0 sm:w-auto"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExtractorModal;
