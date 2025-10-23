import React, { useState, useEffect } from 'react';
import type { Certificate, PackageItem, CertificateType } from '../types';
import { ArrowLeftIcon, PlusIcon, TrashIcon, DocumentDuplicateIcon } from './Icons';
import { companyData } from '../utils/companyData';

interface ShipmentFormProps {
  onSubmit: (data: Omit<Certificate, 'id' | 'type' | 'certificateNumber'>, types: CertificateType[]) => void;
  onCancel: () => void;
  initialShipmentData?: Partial<Certificate> | null;
}

const inputStyles = "block w-full text-base text-gray-900 bg-gray-50 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 hover:bg-white focus:bg-white transition-colors duration-200 px-4 py-3";
const textareaStyles = `${inputStyles} min-h-[110px]`;
const readOnlyInputStyles = `${inputStyles} bg-gray-200 cursor-not-allowed`;

const docTypes: { key: CertificateType; label: string; description: string }[] = [
    { key: 'weight', label: 'Certificado de Peso', description: 'Genera un certificado formal de peso.' },
    { key: 'quality', label: 'Certificado de Calidad', description: 'Incluye detalles de calidad del producto.' },
    { key: 'packing', label: 'Lista de Empaque', description: 'Crea una lista de empaque detallada.' },
];

const ShipmentForm: React.FC<ShipmentFormProps> = ({ onSubmit, onCancel, initialShipmentData }) => {
  const [selectedDocs, setSelectedDocs] = useState<Record<string, boolean>>({
    weight: true,
    quality: true,
    packing: true,
  });
  const [formData, setFormData] = useState<Partial<Certificate>>({});

  useEffect(() => {
    const defaultPackage: PackageItem = { id: new Date().toISOString(), type: 'BAGS', quantity: '', unitWeight: '', grossUnitWeight: '', marks: '', quality: '' };
    const defaultData = {
      product: 'GREEN COFFEE, CROP 2024/2025',
      shipper: companyData.dizano.shipperText,
      consignee: `Jacobs Douwe Egberts C&T Utrecht\nVleutensevaart 35 Utrecht\n3532 AD, The Netherlands`,
      notify: `Jacobs Douwe Egberts C&T Utrecht\nVleutensevaart 35 Utrecht\n3532 AD, The Netherlands`,
      exporterName: 'Yony Roquel',
      packages: [defaultPackage],
      certificateDate: new Date().toISOString().split('T')[0],
    };

    setFormData({ ...defaultData, ...initialShipmentData });

  }, [initialShipmentData]);

  useEffect(() => {
    const totalNet = formData.packages?.reduce((sum, pkg) => sum + ((Number(pkg.quantity) || 0) * (Number(pkg.unitWeight) || 0)), 0) || 0;
    const totalGross = formData.packages?.reduce((sum, pkg) => sum + ((Number(pkg.quantity) || 0) * (Number(pkg.grossUnitWeight) || 0)), 0) || 0;
    setFormData(prev => ({ ...prev, totalNetWeight: totalNet, totalGrossWeight: totalGross }));
  }, [formData.packages]);

  const handleDocSelectionChange = (key: string) => {
    setSelectedDocs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePackageChange = (id: string, field: keyof PackageItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages?.map(pkg => pkg.id === id ? { ...pkg, [field]: value } : pkg),
    }));
  };

  const addPackage = () => {
    const newPackage: PackageItem = { id: new Date().toISOString(), type: 'BAGS', quantity: '', unitWeight: '', grossUnitWeight: '', marks: '', quality: '' };
    setFormData(prev => ({ ...prev, packages: [...(prev.packages || []), newPackage] }));
  };
  
  const removePackage = (id: string) => {
      setFormData(prev => ({...prev, packages: prev.packages?.filter(pkg => pkg.id !== id) }));
  };
  
  const duplicatePackage = (id: string) => {
    const originalPackage = formData.packages?.find(p => p.id === id);
    if (originalPackage) {
        const newPackage = { ...originalPackage, id: new Date().toISOString() + Math.random(), marks: '' };
        const index = formData.packages?.findIndex(p => p.id === id) ?? -1;
        if(index > -1) {
            const newPackages = [...formData.packages!];
            newPackages.splice(index + 1, 0, newPackage);
            setFormData(prev => ({...prev, packages: newPackages}));
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const typesToCreate = Object.entries(selectedDocs)
      .filter(([, isSelected]) => isSelected)
      .map(([type]) => type as CertificateType);
    
    if (typesToCreate.length === 0) {
        alert("Por favor, selecciona al menos un documento para generar.");
        return;
    };

    const { id, type, certificateNumber, ...submissionData } = formData as Certificate;
    onSubmit(submissionData, typesToCreate);
  };

  const isQuality = selectedDocs.quality;
  const isPacking = selectedDocs.packing;
  const isWeight = selectedDocs.weight;

  const formatNumber = (num: number, digits = 2) => new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(num);
  const totalPackages = formData.packages?.reduce((sum, pkg) => sum + (Number(pkg.quantity) || 0), 0) || 0;
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <button onClick={onCancel} className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900">
          <ArrowLeftIcon className="w-5 h-5" />
          Volver a la lista
        </button>
      </div>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nuevo Embarque</h1>
        <p className="text-base text-gray-600 mb-10">
          {initialShipmentData ? 'Datos extraídos con IA. Revisa y completa la información.' : 'Completa la información para generar los documentos del embarque.'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-10">
            {/* Document Selection */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Documentos a Generar</h2>
                <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <legend className="sr-only">Tipos de Documento</legend>
                    {docTypes.map(doc => (
                        <div key={doc.key} className="relative flex items-start">
                        <div className="flex h-6 items-center">
                            <input
                            id={doc.key}
                            name="docs"
                            type="checkbox"
                            checked={selectedDocs[doc.key]}
                            onChange={() => handleDocSelectionChange(doc.key)}
                            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                            />
                        </div>
                        <div className="ml-3 text-sm leading-6">
                            <label htmlFor={doc.key} className="font-medium text-gray-900">{doc.label}</label>
                        </div>
                        </div>
                    ))}
                </fieldset>
            </div>


            {/* Parties Info */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Información de las Partes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {(isWeight || isQuality) && (
                        <div>
                            <label htmlFor="shipper" className="block text-sm font-medium text-gray-800 mb-2">Seller</label>
                            <textarea id="shipper" name="shipper" value={formData.shipper || ''} onChange={handleChange} required className={textareaStyles}></textarea>
                        </div>
                    )}
                    <div className={(isWeight || isQuality) ? '' : 'md:col-span-2'}>
                        <label htmlFor="consignee" className="block text-sm font-medium text-gray-800 mb-2">Consignee</label>
                        <textarea id="consignee" name="consignee" value={formData.consignee || ''} onChange={handleChange} required className={textareaStyles}></textarea>
                    </div>
                    <div>
                        <label htmlFor="notify" className="block text-sm font-medium text-gray-800 mb-2">Notify</label>
                        <textarea id="notify" name="notify" value={formData.notify || ''} onChange={handleChange} required className={textareaStyles}></textarea>
                    </div>
                     {isPacking && (
                        <div>
                            <label htmlFor="packingPlace" className="block text-sm font-medium text-gray-800 mb-2">Lugar de Empaque</label>
                            <textarea id="packingPlace" name="packingPlace" value={formData.packingPlace || ''} onChange={handleChange} className={textareaStyles} />
                        </div>
                    )}
                </div>
            </div>

            {/* Shipment Info */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Detalles del Envío</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                  <div>
                      <label htmlFor="certificateDate" className="block text-sm font-medium text-gray-800 mb-2">{isPacking && !isWeight && !isQuality ? 'Packing Date' : 'Fecha del Documento'}</label>
                      <input type="date" id="certificateDate" name="certificateDate" value={formData.certificateDate || ''} onChange={handleChange} required className={inputStyles} />
                  </div>
                  {(isWeight || isQuality) && (
                      <div>
                          <label htmlFor="shipmentDate" className="block text-sm font-medium text-gray-800 mb-2">Fecha de Embarque</label>
                          <input type="date" id="shipmentDate" name="shipmentDate" value={formData.shipmentDate || ''} onChange={handleChange} required className={inputStyles} />
                      </div>
                  )}
                  <div>
                      <label htmlFor="product" className="block text-sm font-medium text-gray-800 mb-2">Producto</label>
                      <input type="text" id="product" name="product" value={formData.product || ''} onChange={handleChange} required className={inputStyles} />
                  </div>
                  <div>
                      <label htmlFor="containerNo" className="block text-sm font-medium text-gray-800 mb-2">Nº de Contenedor</label>
                      <input type="text" id="containerNo" name="containerNo" value={formData.containerNo || ''} onChange={handleChange} required className={inputStyles} />
                  </div>
                   {isPacking && (
                      <>
                          <div>
                              <label htmlFor="sealNo" className="block text-sm font-medium text-gray-800 mb-2">Nº de Sello</label>
                              <input type="text" id="sealNo" name="sealNo" value={formData.sealNo || ''} onChange={handleChange} className={inputStyles} />
                          </div>
                           <div>
                              <label htmlFor="contractNo" className="block text-sm font-medium text-gray-800 mb-2">Contrato</label>
                              <input type="text" id="contractNo" name="contractNo" value={formData.contractNo || ''} onChange={handleChange} className={inputStyles} />
                          </div>
                      </>
                  )}
                  <div>
                      <label htmlFor="billOfLadingNo" className="block text-sm font-medium text-gray-800 mb-2">Nº de Bill of Lading</label>
                      <input type="text" id="billOfLadingNo" name="billOfLadingNo" value={formData.billOfLadingNo || ''} onChange={handleChange} required className={inputStyles} />
                  </div>
                  <div>
                      <label htmlFor="shippingLine" className="block text-sm font-medium text-gray-800 mb-2">Línea Naviera</label>
                      <input type="text" id="shippingLine" name="shippingLine" value={formData.shippingLine || ''} onChange={handleChange} required className={inputStyles} />
                  </div>
                  <div>
                      <label htmlFor="destination" className="block text-sm font-medium text-gray-800 mb-2">Destino</label>
                      <input type="text" id="destination" name="destination" value={formData.destination || ''} onChange={handleChange} required className={inputStyles} />
                  </div>
              </div>
            </div>

            {(isWeight || isQuality) && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Información del Exportador</h2>
                <div>
                    <label htmlFor="exporterName" className="block text-sm font-medium text-gray-800 mb-2">Nombre para la Firma</label>
                    <input type="text" id="exporterName" name="exporterName" value={formData.exporterName || ''} onChange={handleChange} required className={inputStyles} placeholder="Ej: Yony Roquel"/>
                </div>
                </div>
            )}

            {/* Packages Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Items de Carga</h2>
                <div className="space-y-4">
                    {formData.packages?.map((pkg, index) => (
                        <div key={pkg.id} className="p-4 bg-slate-50 rounded-lg border space-y-4">
                            <div className="grid grid-cols-12 gap-x-6 gap-y-4 items-end">
                                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo #{index + 1}</label>
                                    <input type="text" value={pkg.type} onChange={e => handlePackageChange(pkg.id, 'type', e.target.value.toUpperCase())} placeholder="EJ: BAGS" className={inputStyles}/>
                                </div>
                                <div className="col-span-6 sm:col-span-3 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                                    <input type="number" value={pkg.quantity} onChange={e => handlePackageChange(pkg.id, 'quantity', e.target.value)} className={inputStyles}/>
                                </div>
                                <div className="col-span-6 sm:col-span-3 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">P. Neto Unit. (kg)</label>
                                    <input type="number" step="0.01" value={pkg.unitWeight} onChange={e => handlePackageChange(pkg.id, 'unitWeight', e.target.value)} className={inputStyles}/>
                                </div>
                                {isPacking && (
                                    <div className="col-span-6 sm:col-span-4 md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">P. Bruto Unit. (kg)</label>
                                        <input type="number" step="0.01" value={pkg.grossUnitWeight} onChange={e => handlePackageChange(pkg.id, 'grossUnitWeight', e.target.value)} className={inputStyles}/>
                                    </div>
                                )}
                                <div className="col-span-12 sm:col-span-8 md:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Marcas</label>
                                    <input type="text" value={pkg.marks} onChange={e => handlePackageChange(pkg.id, 'marks', e.target.value)} className={inputStyles}/>
                                </div>
                                <div className="col-span-12 sm:col-span-4 md:col-span-2 flex items-end justify-end space-x-2">
                                    <button type="button" onClick={() => duplicatePackage(pkg.id)} className="text-indigo-600 hover:text-indigo-800 p-2 rounded-md hover:bg-indigo-50" title="Duplicar Item"><DocumentDuplicateIcon/></button>
                                    <button type="button" onClick={() => removePackage(pkg.id)} className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50" title="Eliminar Item"><TrashIcon/></button>
                                </div>
                                {isQuality && (
                                    <div className="col-span-12">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Calidad</label>
                                        <input type="text" value={pkg.quality || ''} onChange={e => handlePackageChange(pkg.id, 'quality', e.target.value)} placeholder="Ej: SHB EP..." className={inputStyles}/>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex justify-end">
                    <button type="button" onClick={addPackage} className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                        <PlusIcon className="w-5 h-5" />
                        Agregar Item
                    </button>
                </div>
                <div className="flex justify-end pt-6 mt-6 border-t">
                    <div className="w-full max-w-sm space-y-3">
                        <div className="flex justify-between items-center"><label className="text-sm font-medium text-gray-700">Total Bultos</label><p className={`${readOnlyInputStyles} w-48 text-lg font-bold text-right`}>{formatNumber(totalPackages, 0)}</p></div>
                        {isPacking && (<div className="flex justify-between items-center"><label className="text-sm font-medium text-gray-700">Peso Bruto Total (kgs)</label><p className={`${readOnlyInputStyles} w-48 text-lg font-bold text-right`}>{formatNumber(formData.totalGrossWeight || 0)}</p></div>)}
                        <div className="flex justify-between items-center"><label className="text-sm font-bold text-gray-900">Peso Neto Total (kgs)</label><p className={`${readOnlyInputStyles} w-48 text-xl font-bold text-right`}>{formatNumber(formData.totalNetWeight || 0)}</p></div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
                <button type="button" onClick={onCancel} className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="inline-flex justify-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">Guardar y Generar</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ShipmentForm;