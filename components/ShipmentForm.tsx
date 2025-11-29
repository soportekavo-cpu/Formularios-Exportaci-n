
import React, { useState, useEffect } from 'react';
import type { Certificate, PackageItem, CertificateType, Container } from '../types';
import { ArrowLeftIcon, PlusIcon, TrashIcon, DocumentDuplicateIcon } from './Icons';

interface ShipmentFormProps {
  onSubmit: (data: Omit<Certificate, 'id' | 'type' | 'certificateNumber'>, types: CertificateType[]) => void;
  onCancel: () => void;
  initialShipmentData?: Partial<Certificate> | null;
}

const inputStyles = "block w-full text-base bg-background rounded-lg border-input shadow-sm focus:border-primary focus:ring-primary transition-colors duration-200 px-4 py-3 ring-1 ring-inset focus:ring-2 focus:ring-inset";
const textareaStyles = `${inputStyles} min-h-[110px]`;
const readOnlyInputStyles = `${inputStyles} bg-muted cursor-not-allowed`;

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
    const defaultContainer: Container = { id: new Date().toISOString(), containerNo: '', sealNo: '', packages: [defaultPackage] };
    
    const defaultData: Partial<Certificate> = {
      product: 'GREEN COFFEE, CROP 2024/2025',
      consignee: `Jacobs Douwe Egberts C&T Utrecht\nVleutensevaart 35 Utrecht\n3532 AD, The Netherlands`,
      notify: `Jacobs Douwe Egberts C&T Utrecht\nVleutensevaart 35 Utrecht\n3532 AD, The Netherlands`,
      exporterName: 'Yony Roquel',
      containers: [defaultContainer],
      certificateDate: new Date().toISOString().split('T')[0],
    };
    
    // If there's initial data, merge it, ensuring containers and packages have unique IDs.
    if (initialShipmentData) {
        const mergedData = { ...defaultData, ...initialShipmentData };
        if (initialShipmentData.containers) {
            mergedData.containers = initialShipmentData.containers.map(c => ({
                ...c,
                id: c.id || new Date().toISOString() + Math.random(),
                packages: (c.packages || [defaultPackage]).map(p => ({
                    ...p,
                    id: p.id || new Date().toISOString() + Math.random()
                }))
            }));
        }
        setFormData(mergedData);
    } else {
        setFormData(defaultData);
    }

  }, [initialShipmentData]);

  useEffect(() => {
    const allPackages = formData.containers?.flatMap(c => c.packages) || [];
    const totalNet = allPackages.reduce((sum, pkg) => sum + ((Number(pkg.quantity) || 0) * (Number(pkg.unitWeight) || 0)), 0);
    const totalGross = allPackages.reduce((sum, pkg) => sum + ((Number(pkg.quantity) || 0) * (Number(pkg.grossUnitWeight) || 0)), 0);
    setFormData(prev => ({ ...prev, totalNetWeight: totalNet, totalGrossWeight: totalGross }));
  }, [formData.containers]);

  const handleDocSelectionChange = (key: string) => {
    setSelectedDocs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContainerChange = (id: string, field: keyof Container, value: string) => {
      setFormData(prev => ({
          ...prev,
          containers: prev.containers?.map(c => c.id === id ? { ...c, [field]: value } : c)
      }));
  };

  const addContainer = () => {
      const newPackage: PackageItem = { id: new Date().toISOString(), type: 'BAGS', quantity: '', unitWeight: '', grossUnitWeight: '', marks: '', quality: '' };
      const newContainer: Container = { id: new Date().toISOString(), containerNo: '', sealNo: '', packages: [newPackage] };
      setFormData(prev => ({ ...prev, containers: [...(prev.containers || []), newContainer] }));
  };

  const removeContainer = (id: string) => {
      if (formData.containers && formData.containers.length <= 1) {
          alert("Debe haber al menos un contenedor.");
          return;
      }
      setFormData(prev => ({ ...prev, containers: prev.containers?.filter(c => c.id !== id) }));
  };
  
  const handlePackageChange = (containerId: string, packageId: string, field: keyof PackageItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      containers: prev.containers?.map(c => 
        c.id === containerId 
        ? { ...c, packages: c.packages.map(p => p.id === packageId ? { ...p, [field]: value } : p) }
        : c
      ),
    }));
  };

  const addPackage = (containerId: string) => {
    const newPackage: PackageItem = { id: new Date().toISOString(), type: 'BAGS', quantity: '', unitWeight: '', grossUnitWeight: '', marks: '', quality: '' };
    setFormData(prev => ({
        ...prev,
        containers: prev.containers?.map(c => 
            c.id === containerId ? { ...c, packages: [...c.packages, newPackage] } : c
        )
    }));
  };
  
  const removePackage = (containerId: string, packageId: string) => {
      setFormData(prev => ({
          ...prev,
          containers: prev.containers?.map(c => {
              if (c.id === containerId) {
                  // Prevent removing the last package in a container
                  if (c.packages.length <= 1) {
                      alert("Cada contenedor debe tener al menos un item de carga.");
                      return c;
                  }
                  return { ...c, packages: c.packages.filter(p => p.id !== packageId) };
              }
              return c;
          })
      }));
  };
  
  const duplicatePackage = (containerId: string, packageId: string) => {
    setFormData(prev => {
        const newContainers = prev.containers?.map(c => {
            if (c.id === containerId) {
                const packageIndex = c.packages.findIndex(p => p.id === packageId);
                if (packageIndex !== -1) {
                    const originalPackage = c.packages[packageIndex];
                    const newPackage = { ...originalPackage, id: new Date().toISOString() + Math.random(), marks: '' };
                    const newPackages = [...c.packages];
                    newPackages.splice(packageIndex + 1, 0, newPackage);
                    return { ...c, packages: newPackages };
                }
            }
            return c;
        });
        return { ...prev, containers: newContainers };
    });
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
  
  const allPackages = formData.containers?.flatMap(c => c.packages) || [];
  const totalPackages = allPackages.reduce((sum, pkg) => sum + (Number(pkg.quantity) || 0), 0);
  
  return (
    <div>
      <div className="mb-8">
        <button onClick={onCancel} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="w-5 h-5" />
          Volver a la lista
        </button>
      </div>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Nuevo Embarque</h1>
        <p className="text-base text-muted-foreground mb-10">
          {initialShipmentData ? 'Datos extraídos con IA. Revisa y completa la información.' : 'Completa la información para generar los documentos del embarque.'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-10">
            {/* Document Selection */}
            <div className="bg-card p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-card-foreground border-b pb-4 mb-6">Documentos a Generar</h2>
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
                            className="h-5 w-5 rounded border-input text-primary focus:ring-primary"
                            />
                        </div>
                        <div className="ml-3 text-sm leading-6">
                            <label htmlFor={doc.key} className="font-medium text-foreground">{doc.label}</label>
                        </div>
                        </div>
                    ))}
                </fieldset>
            </div>


            {/* Parties Info */}
            <div className="bg-card p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-card-foreground border-b pb-4 mb-6">Información de las Partes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="md:col-span-1">
                        <label htmlFor="consignee" className="block text-sm font-medium text-card-foreground mb-2">Consignee</label>
                        <textarea id="consignee" name="consignee" value={formData.consignee || ''} onChange={handleChange} required className={textareaStyles}></textarea>
                    </div>
                    <div>
                        <label htmlFor="notify" className="block text-sm font-medium text-card-foreground mb-2">Notify</label>
                        <textarea id="notify" name="notify" value={formData.notify || ''} onChange={handleChange} required className={textareaStyles}></textarea>
                    </div>
                     {isPacking && (
                        <div className="md:col-span-2">
                            <label htmlFor="packingPlace" className="block text-sm font-medium text-card-foreground mb-2">Lugar de Empaque</label>
                            <textarea id="packingPlace" name="packingPlace" value={formData.packingPlace || ''} onChange={handleChange} className={textareaStyles} />
                        </div>
                    )}
                </div>
            </div>

            {/* Shipment Info */}
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold text-card-foreground border-b pb-4 mb-6">Detalles del Envío</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                  <div>
                      <label htmlFor="certificateDate" className="block text-sm font-medium text-card-foreground mb-2">{isPacking && !isWeight && !isQuality ? 'Packing Date' : 'Fecha del Documento'}</label>
                      <input type="date" id="certificateDate" name="certificateDate" value={formData.certificateDate || ''} onChange={handleChange} required className={inputStyles} />
                  </div>
                  {(isWeight || isQuality) && (
                      <div>
                          <label htmlFor="shipmentDate" className="block text-sm font-medium text-card-foreground mb-2">Fecha de Embarque</label>
                          <input type="date" id="shipmentDate" name="shipmentDate" value={formData.shipmentDate || ''} onChange={handleChange} required className={inputStyles} />
                      </div>
                  )}
                  <div>
                      <label htmlFor="product" className="block text-sm font-medium text-card-foreground mb-2">Producto</label>
                      <input type="text" id="product" name="product" value={formData.product || ''} onChange={handleChange} required className={inputStyles} />
                  </div>
                  <div>
                      <label htmlFor="contractNo" className="block text-sm font-medium text-card-foreground mb-2">Contrato</label>
                      <input type="text" id="contractNo" name="contractNo" value={formData.contractNo || ''} onChange={handleChange} className={inputStyles} />
                  </div>
                  <div>
                      <label htmlFor="billOfLadingNo" className="block text-sm font-medium text-card-foreground mb-2">Nº de Bill of Lading</label>
                      <input type="text" id="billOfLadingNo" name="billOfLadingNo" value={formData.billOfLadingNo || ''} onChange={handleChange} required className={inputStyles} />
                  </div>
                  <div>
                      <label htmlFor="shippingLine" className="block text-sm font-medium text-card-foreground mb-2">Línea Naviera</label>
                      <input type="text" id="shippingLine" name="shippingLine" value={formData.shippingLine || ''} onChange={handleChange} required className={inputStyles} />
                  </div>
                  <div>
                      <label htmlFor="destination" className="block text-sm font-medium text-card-foreground mb-2">Destino</label>
                      <input type="text" id="destination" name="destination" value={formData.destination || ''} onChange={handleChange} required className={inputStyles} />
                  </div>
              </div>
            </div>

            {(isWeight || isQuality) && (
                <div className="bg-card p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-card-foreground border-b pb-4 mb-6">Información del Exportador</h2>
                <div>
                    <label htmlFor="exporterName" className="block text-sm font-medium text-card-foreground mb-2">Nombre para la Firma</label>
                    <input type="text" id="exporterName" name="exporterName" value={formData.exporterName || ''} onChange={handleChange} required className={inputStyles} placeholder="Ej: Yony Roquel"/>
                </div>
                </div>
            )}

            {/* Containers Section */}
            <div className="space-y-8">
              {formData.containers?.map((container, containerIndex) => (
                  <div key={container.id} className="bg-card p-6 rounded-lg shadow-sm border">
                      <div className="flex justify-between items-center border-b pb-4 mb-6">
                        <h2 className="text-xl font-semibold text-card-foreground">Contenedor #{containerIndex + 1}</h2>
                        <button type="button" onClick={() => removeContainer(container.id)} className="text-destructive hover:text-destructive/80 text-sm font-medium">Eliminar Contenedor</button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mb-8">
                          <div>
                              <label htmlFor={`containerNo-${container.id}`} className="block text-sm font-medium text-card-foreground mb-2">Nº de Contenedor</label>
                              <input type="text" id={`containerNo-${container.id}`} value={container.containerNo} onChange={e => handleContainerChange(container.id, 'containerNo', e.target.value)} required className={inputStyles} />
                          </div>
                          <div>
                              <label htmlFor={`sealNo-${container.id}`} className="block text-sm font-medium text-card-foreground mb-2">Nº de Sello (Marchamo)</label>
                              <input type="text" id={`sealNo-${container.id}`} value={container.sealNo || ''} onChange={e => handleContainerChange(container.id, 'sealNo', e.target.value)} className={inputStyles} />
                          </div>
                      </div>

                      <h3 className="text-lg font-semibold text-card-foreground mb-4">Items de Carga de este Contenedor</h3>
                      <div className="space-y-4">
                          {container.packages.map((pkg, pkgIndex) => (
                              <div key={pkg.id} className="p-4 bg-muted/30 rounded-lg border space-y-4">
                                  <div className="grid grid-cols-12 gap-x-6 gap-y-4 items-end">
                                      <div className="col-span-12 sm:col-span-6 md:col-span-3">
                                          <label className="block text-sm font-medium text-muted-foreground mb-2">Tipo #{pkgIndex + 1}</label>
                                          <input type="text" value={pkg.type} onChange={e => handlePackageChange(container.id, pkg.id, 'type', e.target.value.toUpperCase())} placeholder="EJ: BAGS" className={inputStyles}/>
                                      </div>
                                      <div className="col-span-6 sm:col-span-3 md:col-span-2">
                                          <label className="block text-sm font-medium text-muted-foreground mb-2">Cantidad</label>
                                          <input type="number" inputMode="decimal" value={pkg.quantity} onChange={e => handlePackageChange(container.id, pkg.id, 'quantity', e.target.value)} className={inputStyles}/>
                                      </div>
                                      <div className="col-span-6 sm:col-span-3 md:col-span-2">
                                          <label className="block text-sm font-medium text-muted-foreground mb-2">P. Neto Unit. (kg)</label>
                                          <input type="number" inputMode="decimal" step="0.01" value={pkg.unitWeight} onChange={e => handlePackageChange(container.id, pkg.id, 'unitWeight', e.target.value)} className={inputStyles}/>
                                      </div>
                                      {isPacking && (
                                          <div className="col-span-6 sm:col-span-4 md:col-span-2">
                                              <label className="block text-sm font-medium text-muted-foreground mb-2">P. Bruto Unit. (kg)</label>
                                              <input type="number" inputMode="decimal" step="0.01" value={pkg.grossUnitWeight} onChange={e => handlePackageChange(container.id, pkg.id, 'grossUnitWeight', e.target.value)} className={inputStyles}/>
                                          </div>
                                      )}
                                      <div className="col-span-12 sm:col-span-8 md:col-span-3">
                                          <label className="block text-sm font-medium text-muted-foreground mb-2">Marcas</label>
                                          <input type="text" value={pkg.marks} onChange={e => handlePackageChange(container.id, pkg.id, 'marks', e.target.value)} className={inputStyles}/>
                                      </div>
                                      <div className="col-span-12 sm:col-span-4 md:col-span-2 flex items-end justify-end space-x-2">
                                          <button type="button" onClick={() => duplicatePackage(container.id, pkg.id)} className="text-primary hover:text-primary/80 p-2 rounded-md hover:bg-accent" title="Duplicar Item"><DocumentDuplicateIcon/></button>
                                          <button type="button" onClick={() => removePackage(container.id, pkg.id)} className="text-destructive hover:text-destructive/80 p-2 rounded-md hover:bg-destructive/10" title="Eliminar Item"><TrashIcon/></button>
                                      </div>
                                      {isQuality && (
                                          <div className="col-span-12">
                                              <label className="block text-sm font-medium text-muted-foreground mb-2">Calidad</label>
                                              <input type="text" value={pkg.quality || ''} onChange={e => handlePackageChange(container.id, pkg.id, 'quality', e.target.value)} placeholder="Ej: SHB EP..." className={inputStyles}/>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button type="button" onClick={() => addPackage(container.id)} className="inline-flex items-center gap-x-2 rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/80">
                            <PlusIcon className="w-5 h-5" />
                            Agregar Item al Contenedor
                        </button>
                      </div>
                  </div>
              ))}
            </div>
             <div className="flex justify-end">
                <button type="button" onClick={addContainer} className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
                    <PlusIcon className="w-5 h-5" />
                    Agregar Contenedor
                </button>
            </div>
            
             <div className="flex justify-end pt-6 mt-6 border-t">
                <div className="w-full max-w-sm space-y-3">
                    <div className="flex justify-between items-center"><label className="text-sm font-medium text-muted-foreground">Total Bultos (Embarque)</label><p className={`${readOnlyInputStyles} w-48 text-lg font-bold text-right`}>{formatNumber(totalPackages, 0)}</p></div>
                    {isPacking && (<div className="flex justify-between items-center"><label className="text-sm font-medium text-muted-foreground">Peso Bruto Total (Embarque)</label><p className={`${readOnlyInputStyles} w-48 text-lg font-bold text-right`}>{formatNumber(formData.totalGrossWeight || 0)}</p></div>)}
                    <div className="flex justify-between items-center"><label className="text-sm font-bold text-foreground">Peso Neto Total (Embarque)</label><p className={`${readOnlyInputStyles} w-48 text-xl font-bold text-right`}>{formatNumber(formData.totalNetWeight || 0)}</p></div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
                <button type="button" onClick={onCancel} className="rounded-md bg-background px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent">Cancelar</button>
                <button type="submit" className="inline-flex justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">Guardar y Generar</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ShipmentForm;
