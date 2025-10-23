import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { Certificate, PackageItem } from '../types';
import { DocumentMagnifyingGlassIcon, SparklesIcon } from './Icons';

interface DataExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtractionComplete: (data: Partial<Certificate>) => void;
}

// Helper to convert a File object to a GoogleGenerativeAI.Part object.
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imagePart = await fileToGenerativePart(file);
      const textPart = { text: "Extract the following details from this shipping document. If a value is not found, use an empty string or zero. For packages, extract each line item. The net weight per unit should go into 'unitWeight' and the gross weight per unit into 'grossUnitWeight'." };

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
              packages: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          quantity: { type: Type.NUMBER },
                          type: { type: Type.STRING },
                          marks: { type: Type.STRING },
                          unitWeight: { type: Type.NUMBER },
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

      const jsonData = JSON.parse(response.text);

      const mappedData: Partial<Certificate> = {
          ...jsonData,
          packages: (jsonData.packages || []).map((pkg: any): PackageItem => ({
              ...pkg,
              id: new Date().toISOString() + Math.random(),
              quantity: pkg.quantity || '',
              unitWeight: pkg.unitWeight || '',
              grossUnitWeight: pkg.grossUnitWeight || '',
          })),
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
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div className="bg-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold leading-6 text-gray-900" id="modal-title">Extracción Inteligente</h3>
                  <p className="mt-1 text-sm text-gray-500">Sube un Bill of Lading (PDF, JPG, PNG) para pre-rellenar el formulario.</p>
                </div>
                <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div 
                className={`mt-4 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2 block text-sm font-semibold text-gray-900">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500">
                        <span>Sube un archivo</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} accept=".pdf,.jpg,.jpeg,.png" />
                    </label>
                    <p className="pl-1 inline">o arrástralo aquí</p>
                </div>
                <p className="text-xs text-gray-500">PDF, PNG, JPG</p>
                {file && <p className="mt-2 text-sm font-medium text-green-700">Archivo seleccionado: {file.name}</p>}
              </div>

              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
            <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse sm:items-center gap-3">
              <button
                type="button"
                onClick={handleExtractData}
                disabled={!file || isLoading}
                className="inline-flex w-full justify-center items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
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