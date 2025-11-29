
import React, { useState, useEffect, useRef } from 'react';
import type { Certificate, PackageItem, Driver, Container, TransportUnitItem } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ArrowLeftIcon, PlusIcon, TrashIcon, DocumentDuplicateIcon } from './Icons';

interface CertificateFormProps {
  initialData: Partial<Certificate>;
  onSubmit: (data: Certificate) => void;
  onCancel: () => void;
}

const inputStyles = "block w-full text-base bg-background rounded-lg border-input shadow-sm focus:border-primary focus:ring-primary transition-colors duration-200 px-4 py-3 ring-1 ring-inset focus:ring-2 focus:ring-inset";
const textareaStyles = `${inputStyles} min-h-[110px]`;
const readOnlyInputStyles = `${inputStyles} bg-muted cursor-not-allowed`;

// Simple Rich Text Editor Component
const RichTextEditor = ({ value, onChange }: { value?: string, onChange: (html: string) => void }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        onChange(e.currentTarget.innerHTML);
    };

    const applyCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            editorRef.current.focus();
            onChange(editorRef.current.innerHTML);
        }
    };
    
    const ToolButton = ({ onClick, children }: { onClick: () => void, children?: React.ReactNode }) => (
        <button 
            type="button" 
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            className="px-3 py-1 text-sm font-bold text-foreground rounded hover:bg-muted"
        >
            {children}
        </button>
    );

    const ColorButton = ({ color }: { color: string }) => (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); applyCommand('foreColor', color); }}
            className="w-6 h-6 rounded border border-border"
            style={{ backgroundColor: color }}
            title={color}
        />
    );
    
    return (
        <div>
            <div className="flex flex-wrap items-center gap-x-1 p-1.5 border border-border border-b-0 rounded-t-lg bg-muted/50">
                <ToolButton onClick={() => applyCommand('bold')}><b>B</b></ToolButton>
                <ToolButton onClick={() => applyCommand('italic')}><i>I</i></ToolButton>
                <ToolButton onClick={() => applyCommand('underline')}><u>U</u></ToolButton>
                <div className="h-5 w-px bg-border mx-2"></div>
                <div className="flex items-center gap-x-2">
                    <ColorButton color="hsl(var(--foreground))" />
                    <ColorButton color="#ef4444" /> {/* red-500 */}
                    <ColorButton color="#22c55e" /> {/* green-500 */}
                    <ColorButton color="#3b82f6" /> {/* blue-500 */}
                </div>
            </div>
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className={`${textareaStyles} min-h-[150px] rounded-t-none focus:ring-2 focus:ring-primary`}
                style={{ whiteSpace: 'pre-wrap' }}
            />
        </div>
    );
};


const CertificateForm: React.FC<CertificateFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Certificate>>(initialData);
  const [showPackingPlace, setShowPackingPlace] = useState(!!initialData.packingPlace);
  const [showNotify, setShowNotify] = useState(!!initialData.notify);
  const lastIdRef = useRef(initialData.id);
  
  const [drivers, setDrivers] = useLocalStorage<Driver[]>('drivers', []);
  // New LocalStorage hooks for Auto-complete
  const [licensePlates, setLicensePlates] = useLocalStorage<TransportUnitItem[]>('licensePlates', []);
  const [transportUnits, setTransportUnits] = useLocalStorage<TransportUnitItem[]>('transportUnits', []);

  // State for Carta de Porte consignee dropdown
  const [consigneeOption, setConsigneeOption] = useState('');
  const [manualConsignee, setManualConsignee] = useState('');
  const consigneeOptions = ["Puerto Santo Tomas de Castilla", "Puerto Barrios", "Puerto Quetzal"];

  // Getter for the single container this form manages
  const getContainer = (data: Partial<Certificate>): Partial<Container> => (data.containers?.[0] || {});
  const getPackages = (data: Partial<Certificate>): PackageItem[] => getContainer(data).packages || [];

  useEffect(() => {
    // Only reset form if the ID changes (switching documents)
    if (initialData.id !== lastIdRef.current) {
        setFormData(initialData);
        setShowPackingPlace(!!initialData.packingPlace);
        setShowNotify(!!initialData.notify);
        lastIdRef.current = initialData.id;
    }
  }, [initialData]);

  // Effect to manage consignee state for Carta de Porte
  useEffect(() => {
    if (formData.type === 'porte') {
        if (formData.consignee && consigneeOptions.includes(formData.consignee)) {
            setConsigneeOption(formData.consignee);
            setManualConsignee('');
        } else if (formData.consignee) {
            setConsigneeOption('Otro');
            setManualConsignee(formData.consignee);
        } else {
            setConsigneeOption('');
            setManualConsignee('');
        }
    }
  }, [formData.consignee, formData.type]);
  
  // Effect to autopopulate destination from consignee for Carta de Porte
  useEffect(() => {
    if (formData.type === 'porte' && formData.consignee && consigneeOption !== 'Otro') {
        setFormData(prev => ({ ...prev, destination: prev.consignee }));
    }
  }, [formData.consignee, consigneeOption, formData.type]);

  useEffect(() => {
    const packages = getPackages(formData);
    const totalNet = packages.reduce((sum, pkg) => sum + ((Number(pkg.quantity) || 0) * (Number(pkg.unitWeight) || 0)), 0);
    const totalGross = packages.reduce((sum, pkg) => sum + ((Number(pkg.quantity) || 0) * (Number(pkg.grossUnitWeight) || 0)), 0);
    setFormData(prev => ({ ...prev, totalNetWeight: totalNet, totalGrossWeight: totalGross }));
  }, [formData.containers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => {
        const newFormData = { ...prev };
        (newFormData as any)[name] = type === 'number' ? parseFloat(value) || 0 : value;
        // For weight/quality certs, certificate date is the same as shipment date
        if (name === 'shipmentDate' && (prev.type === 'weight' || prev.type === 'quality')) {
            newFormData.certificateDate = value;
        }
        return newFormData;
    });
  };

  const handleContainerChange = (field: keyof Container, value: string) => {
    setFormData(prev => ({
      ...prev,
      containers: [{ ...getContainer(prev), [field]: value }]
    }));
  };
  
  // --- DRIVER LOGIC ---
  const handleDriverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      const selectedDriver = drivers.find(d => d.name.toLowerCase() === value.toLowerCase());
      
      setFormData(prev => ({
          ...prev,
          driverName: value,
          driverLicense: selectedDriver ? selectedDriver.license : prev.driverLicense,
      }));
  };
  
  const handleDriverLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const selectedDriver = drivers.find(d => d.license === value);
    
    setFormData(prev => ({
        ...prev,
        driverLicense: value,
        driverName: selectedDriver ? selectedDriver.name : prev.driverName,
    }));
  };

  const handleDriverBlur = () => {
    const { driverName, driverLicense } = formData;
    if (driverName && driverLicense) {
        const newDriver: Driver = { name: driverName, license: driverLicense };
        const driverExists = drivers.some(d => d.name.toLowerCase() === newDriver.name.toLowerCase() && d.license === newDriver.license);
        
        if (!driverExists) {
            setDrivers(prevDrivers => {
                const existingDriverIndex = prevDrivers.findIndex(d => d.name.toLowerCase() === newDriver.name.toLowerCase());
                if(existingDriverIndex > -1) {
                    const updatedDrivers = [...prevDrivers];
                    updatedDrivers[existingDriverIndex] = newDriver;
                    return updatedDrivers;
                }
                return [...prevDrivers, newDriver];
            });
        }
    }
  };

  // --- TRANSPORT UNIT & PLATES LOGIC ---
  const handleSaveToDB = (key: 'licensePlates' | 'transportUnits', value: string) => {
      if (!value) return;
      const setter = key === 'licensePlates' ? setLicensePlates : setTransportUnits;
      setter(prev => {
          if (prev.some(item => item.name.toLowerCase() === value.toLowerCase())) return prev;
          return [...prev, { id: new Date().toISOString(), name: value }];
      });
  };

  const handlePackageChange = (id: string, field: keyof PackageItem, value: string | number) => {
    setFormData(prev => {
        const container = getContainer(prev);
        const newPackages = (container.packages || []).map(pkg => {
          if (pkg.id === id) {
            const updatedPkg = { ...pkg, [field]: value };
            if (formData.type === 'porte' && (field === 'unitWeight' || field === 'tareUnitWeight')) {
              const net = field === 'unitWeight' ? Number(value) : Number(updatedPkg.unitWeight || 0);
              const tare = field === 'tareUnitWeight' ? Number(value) : Number(updatedPkg.tareUnitWeight || 0);
              updatedPkg.grossUnitWeight = net + tare;
            }
            return updatedPkg;
          }
          return pkg;
        });
        return { ...prev, containers: [{ ...container, packages: newPackages }] };
    });
  };

  const addPackage = () => {
      const newPackage: PackageItem = {
          id: new Date().toISOString(), type: 'SACO', quantity: '', unitWeight: '',
          tareUnitWeight: '', grossUnitWeight: '', marks: '', quality: '', contains: 'CAFE ORO'
      };
      setFormData(prev => {
        const container = getContainer(prev);
        return { ...prev, containers: [{ ...container, packages: [...(container.packages || []), newPackage] }] };
      });
  };

  const removePackage = (id: string) => {
      setFormData(prev => {
        const container = getContainer(prev);
        return { ...prev, containers: [{ ...container, packages: (container.packages || []).filter(p => p.id !== id) }] };
      });
  };

  const duplicatePackage = (id: string) => {
    setFormData(prev => {
      const container = getContainer(prev);
      const originalPackages = container.packages || [];
      const packageIndex = originalPackages.findIndex(p => p.id === id);
      if (packageIndex === -1) return prev;

      const packageToDuplicate = originalPackages[packageIndex];
      const newPackage = { ...packageToDuplicate, id: new Date().toISOString() + Math.random(), marks: '' };
      
      const newPackages = [...originalPackages];
      newPackages.splice(packageIndex + 1, 0, newPackage);

      return { ...prev, containers: [{ ...container, packages: newPackages }] };
    });
  };
  
  const handleConsigneeChange = (value: string) => {
    setConsigneeOption(value);
    if (value === 'Otro') {
        setFormData(prev => ({ ...prev, consignee: manualConsignee }));
    } else {
        setFormData(prev => ({ ...prev, consignee: value }));
        setManualConsignee('');
    }
  };

  const handleManualConsigneeChange = (value: string) => {
      setManualConsignee(value);
      setFormData(prev => ({ ...prev, consignee: value }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as Certificate);
  };

  const isEditing = !!initialData.id;
  const isWeightCert = formData.type === 'weight';
  const isQualityCert = formData.type === 'quality';
  const isPackingList = formData.type === 'packing';
  const isPorte = formData.type === 'porte';

  const getTitle = () => {
    let titleType = '';
    if (isQualityCert) titleType = 'Calidad';
    else if (isPackingList) titleType = 'Lista de Empaque';
    else if (isPorte) titleType = 'Carta de Porte';
    else titleType = 'Peso';
    return `${isEditing ? 'Editar' : 'Crear'} ${titleType}`;
  };
  
  const formatNumber = (num: number, digits = 2) => new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(num);

  const totalPackages = getPackages(formData).reduce((sum, pkg) => sum + (Number(pkg.quantity) || 0), 0);
  const totalTare = getPackages(formData).reduce((sum, pkg) => sum + ((Number(pkg.quantity) || 0) * (Number(pkg.tareUnitWeight) || 0)), 0);

  const renderPorteForm = () => (
    <>
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            <div className="sm:col-span-2 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-green-700 tracking-wider">CARTA DE PORTE</h2>
                  <p className="text-sm font-semibold text-gray-800">No: {formData.certificateNumber || 'CP-XXXX-XXX'}</p>
                </div>
                <div className="w-full sm:w-1/2">
                    <label htmlFor="place" className="block text-sm font-medium text-card-foreground mb-2 text-right">Lugar y Fecha</label>
                    <div className="flex gap-x-2">
                        <input type="text" id="place" name="place" value={formData.place || ''} readOnly className={readOnlyInputStyles} placeholder="Lugar"/>
                        <input type="date" id="certificateDate" name="certificateDate" value={formData.certificateDate || ''} onChange={handleChange} required className={inputStyles} />
                    </div>
                </div>
            </div>
            <div className="mt-4">
                 <label htmlFor="consignee-select" className="block text-sm font-medium text-card-foreground mb-2">Consignada A</label>
                 <select id="consignee-select" value={consigneeOption} onChange={e => handleConsigneeChange(e.target.value)} required className={inputStyles}>
                    <option value="" disabled>Seleccione un destino</option>
                    {consigneeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    <option value="Otro">Otro (especificar)</option>
                </select>
                {consigneeOption === 'Otro' && (
                    <input type="text" id="consignee" name="consignee" value={manualConsignee} onChange={e => handleManualConsigneeChange(e.target.value)} required className={`${inputStyles} mt-2`} placeholder="Especifique el destino" />
                )}
            </div>
        </div>
      </div>
      <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-card-foreground border-b pb-4 mb-6">Detalles del Transporte</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-6">
              <div className="md:col-span-4">
                  <label htmlFor="transportCompany" className="block text-sm font-medium text-card-foreground mb-2">Compañía Contratista</label>
                  <input type="text" id="transportCompany" name="transportCompany" value={formData.transportCompany || ''} onChange={handleChange} className={inputStyles} />
              </div>
              <div className="md:col-span-2">
                  <label htmlFor="driverName" className="block text-sm font-medium text-card-foreground mb-2">Piloto</label>
                  <input type="text" id="driverName" list="driver-list" name="driverName" value={formData.driverName || ''} onChange={handleDriverChange} onBlur={handleDriverBlur} className={inputStyles} autoComplete="off"/>
                  <datalist id="driver-list">{drivers.map(d => <option key={d.name} value={d.name} />)}</datalist>
              </div>
              <div>
                  <label htmlFor="driverLicense" className="block text-sm font-medium text-card-foreground mb-2">Licencia</label>
                  <input type="text" id="driverLicense" name="driverLicense" value={formData.driverLicense || ''} onChange={handleDriverLicenseChange} onBlur={handleDriverBlur} className={inputStyles} />
              </div>
               <div>
                  <label htmlFor="licensePlate" className="block text-sm font-medium text-card-foreground mb-2">Placas</label>
                  <input 
                    type="text" 
                    id="licensePlate" 
                    list="plate-list"
                    name="licensePlate" 
                    value={formData.licensePlate || ''} 
                    onChange={handleChange} 
                    onBlur={(e) => handleSaveToDB('licensePlates', e.target.value)}
                    className={inputStyles} 
                    autoComplete="off"
                  />
                  <datalist id="plate-list">{licensePlates.map(p => <option key={p.id} value={p.name} />)}</datalist>
              </div>

               <div className="md:col-span-2">
                  <label htmlFor="transportUnit" className="block text-sm font-medium text-card-foreground mb-2">Furgon/Plataforma</label>
                  <input 
                    type="text" 
                    id="transportUnit" 
                    list="unit-list"
                    name="transportUnit" 
                    value={formData.transportUnit || ''} 
                    onChange={handleChange} 
                    onBlur={(e) => handleSaveToDB('transportUnits', e.target.value)}
                    className={inputStyles} 
                    autoComplete="off"
                  />
                  <datalist id="unit-list">{transportUnits.map(u => <option key={u.id} value={u.name} />)}</datalist>
              </div>
              <div>
                  <label htmlFor="containerNo" className="block text-sm font-medium text-card-foreground mb-2">Contenedor</label>
                  <input type="text" id="containerNo" name="containerNo" value={getContainer(formData).containerNo || ''} onChange={e => handleContainerChange('containerNo', e.target.value)} className={inputStyles} />
              </div>
              <div>
                  <label htmlFor="sealNo" className="block text-sm font-medium text-card-foreground mb-2">Marchamo</label>
                  <input type="text" id="sealNo" name="sealNo" value={getContainer(formData).sealNo || ''} onChange={e => handleContainerChange('sealNo', e.target.value)} className={inputStyles} />
              </div>

              <div className="md:col-span-2">
                  <label htmlFor="shippingLine" className="block text-sm font-medium text-card-foreground mb-2">Vapor</label>
                  <input type="text" id="shippingLine" name="shippingLine" value={formData.shippingLine || ''} onChange={handleChange} className={inputStyles} />
              </div>
              <div className="md:col-span-2">
                  <label htmlFor="destination" className="block text-sm font-medium text-card-foreground mb-2">Descargar En</label>
                  <input type="text" id="destination" name="destination" value={formData.destination || ''} onChange={handleChange} className={inputStyles} />
              </div>
          </div>
      </div>
    </>
  );

  return (
    <div>
       <div className="mb-8"><button onClick={onCancel} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeftIcon className="w-5 h-5" />Volver a la lista</button></div>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">{getTitle()}</h1>
        <p className="text-base text-muted-foreground mb-10">Completa los campos para generar el documento.</p>
        
        <form onSubmit={handleSubmit} className="space-y-10">
          
          {isEditing && formData.certificateNumber && !isPorte && (
             <div className="bg-card p-6 rounded-lg shadow-sm border">
               <h2 className="text-xl font-semibold text-card-foreground border-b pb-4 mb-6">Información General</h2>
               <div>
                  <label htmlFor="certificateNumber" className="block text-sm font-medium text-card-foreground mb-2">Nº de Documento</label>
                  <input type="text" id="certificateNumber" name="certificateNumber" value={formData.certificateNumber} readOnly className={readOnlyInputStyles} />
              </div>
            </div>
          )}
          
          {isPorte ? renderPorteForm() : (
            <>
              <div className="bg-card p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-card-foreground border-b pb-4 mb-6">Información de las Partes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className={isPackingList ? 'md:col-span-2' : ''}>
                    <label htmlFor="consignee" className="block text-sm font-medium text-card-foreground mb-2">Consignee</label>
                    <textarea id="consignee" name="consignee" value={formData.consignee || ''} onChange={handleChange} required className={textareaStyles}></textarea>
                  </div>
                  {isPackingList ? (
                    <>
                      <div>{showNotify ? (<><div className="flex justify-between items-center mb-2"><label htmlFor="notify" className="block text-sm font-medium text-card-foreground">Notify</label><button type="button" onClick={() => { setShowNotify(false); setFormData(prev => ({ ...prev, notify: '' })); }} className="text-xs font-semibold text-destructive hover:text-destructive/80">Quitar</button></div><textarea id="notify" name="notify" value={formData.notify || ''} onChange={handleChange} className={textareaStyles}></textarea></>) : (<div className="h-full flex items-start"><button type="button" onClick={() => setShowNotify(true)} className="text-sm font-semibold text-primary hover:text-primary/80">+ Agregar Notify</button></div>)}</div>
                      <div>{showPackingPlace ? (<><div className="flex justify-between items-center mb-2"><label htmlFor="packingPlace" className="block text-sm font-medium text-card-foreground">Lugar de Empaque</label><button type="button" onClick={() => { setShowPackingPlace(false); setFormData(prev => ({ ...prev, packingPlace: '' })); }} className="text-xs font-semibold text-destructive hover:text-destructive/80">Quitar</button></div><textarea id="packingPlace" name="packingPlace" value={formData.packingPlace || ''} onChange={handleChange} className={textareaStyles} /></>) : (<div className="h-full flex items-start"><button type="button" onClick={() => setShowPackingPlace(true)} className="text-sm font-semibold text-primary hover:text-primary/80">+ Agregar Lugar de Empaque</button></div>)}</div>
                    </>
                  ) : (
                    <div>
                      <label htmlFor="notify" className="block text-sm font-medium text-card-foreground mb-2">Notify</label>
                      <textarea id="notify" name="notify" value={formData.notify || ''} onChange={handleChange} required className={textareaStyles}></textarea>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-card-foreground border-b pb-4 mb-6">Detalles del Envío</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                    {isPackingList && (
                      <div>
                        <label htmlFor="certificateDate" className="block text-sm font-medium text-card-foreground mb-2">Packing Date</label>
                        <input type="date" id="certificateDate" name="certificateDate" value={formData.certificateDate || ''} onChange={handleChange} required className={inputStyles} />
                      </div>
                    )}
                    {!isPackingList && (
                      <div>
                        <label htmlFor="shipmentDate" className="block text-sm font-medium text-card-foreground mb-2">Fecha de Embarque</label>
                        <input type="date" id="shipmentDate" name="shipmentDate" value={formData.shipmentDate || ''} onChange={handleChange} required className={inputStyles} />
                      </div>
                    )}
                    <div><label htmlFor="product" className="block text-sm font-medium text-card-foreground mb-2">Producto</label><input type="text" id="product" name="product" value={formData.product || ''} onChange={handleChange} required className={inputStyles} /></div>
                    <div><label htmlFor="containerNo" className="block text-sm font-medium text-card-foreground mb-2">Nº de Contenedor</label><input type="text" id="containerNo" name="containerNo" value={getContainer(formData).containerNo || ''} onChange={e => handleContainerChange('containerNo', e.target.value)} required className={inputStyles} /></div>
                    {isPackingList && (<div><label htmlFor="sealNo" className="block text-sm font-medium text-card-foreground mb-2">Nº de Sello</label><input type="text" id="sealNo" name="sealNo" value={getContainer(formData).sealNo || ''} onChange={e => handleContainerChange('sealNo', e.target.value)} className={inputStyles} /></div>)}
                    <div><label htmlFor="billOfLadingNo" className="block text-sm font-medium text-card-foreground mb-2">Nº de Bill of Lading</label><input type="text" id="billOfLadingNo" name="billOfLadingNo" value={formData.billOfLadingNo || ''} onChange={handleChange} required className={inputStyles} /></div>
                    <div><label htmlFor="shippingLine" className="block text-sm font-medium text-card-foreground mb-2">Línea Naviera</label><input type="text" id="shippingLine" name="shippingLine" value={formData.shippingLine || ''} onChange={handleChange} required className={inputStyles} /></div>
                    <div><label htmlFor="destination" className="block text-sm font-medium text-card-foreground mb-2">Destino</label><input type="text" id="destination" name="destination" value={formData.destination || ''} onChange={handleChange} required className={inputStyles} /></div>
                    {(isPackingList || isWeightCert || isQualityCert) && (<div><label htmlFor="contractNo" className="block text-sm font-medium text-card-foreground mb-2">Contrato</label><input type="text" id="contractNo" name="contractNo" value={formData.contractNo || ''} onChange={handleChange} className={inputStyles} /></div>)}
                </div>
              </div>
            </>
          )}

          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-card-foreground border-b pb-4 mb-6">Información del Exportador</h2>
            <div>
              <label htmlFor="exporterName" className="block text-sm font-medium text-card-foreground mb-2">
                {isPorte ? 'Nombre del Remitente (para firma)' : 'Nombre para la Firma'}
              </label>
              <input type="text" id="exporterName" name="exporterName" value={formData.exporterName || ''} onChange={handleChange} required className={inputStyles} placeholder="Ej: Yony Roquel"/>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-center border-b pb-4 mb-6"><h2 className="text-xl font-semibold text-card-foreground">Items de Carga</h2></div>
              <div className="space-y-4">
              {getPackages(formData).map((pkg, index) => (
                  <div key={pkg.id} className="p-4 bg-muted/30 rounded-lg border space-y-4">
                      <div className="grid grid-cols-12 gap-x-6 gap-y-4 items-end">
                          <div className="col-span-12 sm:col-span-6 md:col-span-3"><label htmlFor={`type-${pkg.id}`} className="block text-sm font-medium text-muted-foreground mb-2">{isPorte ? 'Clase' : 'Tipo'} #{index + 1}</label><input type="text" id={`type-${pkg.id}`} value={pkg.type} onChange={e => handlePackageChange(pkg.id, 'type', e.target.value.toUpperCase())} placeholder="EJ: BAGS, SACO" className={inputStyles}/></div>
                          <div className="col-span-6 sm:col-span-3 md:col-span-2"><label htmlFor={`quantity-${pkg.id}`} className="block text-sm font-medium text-muted-foreground mb-2">Cantidad</label><input type="number" id={`quantity-${pkg.id}`} value={pkg.quantity} onChange={e => handlePackageChange(pkg.id, 'quantity', e.target.value)} className={inputStyles}/></div>
                          <div className="col-span-6 sm:col-span-3 md:col-span-2"><label htmlFor={`unitWeight-${pkg.id}`} className="block text-sm font-medium text-muted-foreground mb-2">P. Neto Unit. (kg)</label><input type="number" step="0.01" id={`unitWeight-${pkg.id}`} value={pkg.unitWeight} onChange={e => handlePackageChange(pkg.id, 'unitWeight', e.target.value)} className={inputStyles}/></div>
                          {isPorte && (<div className="col-span-6 sm:col-span-3 md:col-span-2"><label htmlFor={`tareUnitWeight-${pkg.id}`} className="block text-sm font-medium text-muted-foreground mb-2">Tara Unit. (kg)</label><input type="number" step="0.01" id={`tareUnitWeight-${pkg.id}`} value={pkg.tareUnitWeight} onChange={e => handlePackageChange(pkg.id, 'tareUnitWeight', e.target.value)} className={inputStyles}/></div>)}
                           {isPackingList || isPorte ? (<div className="col-span-6 sm:col-span-4 md:col-span-2"><label htmlFor={`grossUnitWeight-${pkg.id}`} className="block text-sm font-medium text-muted-foreground mb-2">P. Bruto Unit. (kg)</label><input type="number" step="0.01" id={`grossUnitWeight-${pkg.id}`} value={pkg.grossUnitWeight} readOnly={isPorte} className={isPorte ? readOnlyInputStyles : inputStyles} onChange={e => handlePackageChange(pkg.id, 'grossUnitWeight', e.target.value)}/></div>) : null}
                          <div className="col-span-6 sm:col-span-2 md:col-span-1 flex items-end justify-end space-x-2"><button type="button" onClick={() => duplicatePackage(pkg.id)} className="text-primary hover:text-primary/80 p-2 rounded-md hover:bg-accent transition-colors" title="Duplicar Item"><DocumentDuplicateIcon className="w-5 h-5"/></button><button type="button" onClick={() => removePackage(pkg.id)} className="text-destructive hover:text-destructive/80 p-2 rounded-md hover:bg-destructive/10 transition-colors" title="Eliminar Item"><TrashIcon className="w-5 h-5"/></button></div>
                           <div className="col-span-12 sm:col-span-6"><label htmlFor={`marks-${pkg.id}`} className="block text-sm font-medium text-muted-foreground mb-2">Marcas</label><input type="text" id={`marks-${pkg.id}`} value={pkg.marks} onChange={e => handlePackageChange(pkg.id, 'marks', e.target.value)} className={inputStyles}/></div>
                          {isQualityCert && (<div className="md:col-span-1"><label htmlFor={`quality-${pkg.id}`} className="block text-sm font-medium text-muted-foreground mb-2">Calidad</label><input type="text" id={`quality-${pkg.id}`} value={pkg.quality || ''} onChange={e => handlePackageChange(pkg.id, 'quality', e.target.value)} placeholder="Ej: SHB EP..." className={inputStyles}/></div>)}
                          {isPorte && (<div className="col-span-12 sm:col-span-6"><label htmlFor={`contains-${pkg.id}`} className="block text-sm font-medium text-muted-foreground mb-2">Contiene</label><input type="text" id={`contains-${pkg.id}`} value={pkg.contains || ''} onChange={e => handlePackageChange(pkg.id, 'contains', e.target.value)} className={inputStyles}/></div>)}
                      </div>
                  </div>
              ))}
              </div>
              <div className="mt-4 flex justify-end"><button type="button" onClick={addPackage} className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95 transition-transform duration-150"><PlusIcon className="w-5 h-5" />Agregar Item</button></div>
               <div className="flex justify-end pt-6 mt-6 border-t">
                  <div className="w-full max-w-sm space-y-3">
                      <div className="flex justify-between items-center"><label className="text-sm font-medium text-muted-foreground">Total Bultos</label><p className={`${readOnlyInputStyles} w-48 text-lg font-bold text-right`}>{formatNumber(totalPackages, 0)}</p></div>
                      {(isPackingList || isPorte) && (<><div className="flex justify-between items-center"><label className="text-sm font-medium text-muted-foreground">Peso Bruto Total (kgs)</label><p className={`${readOnlyInputStyles} w-48 text-lg font-bold text-right`}>{formatNumber(formData.totalGrossWeight || 0)}</p></div><div className="flex justify-between items-center"><label className="text-sm font-medium text-muted-foreground">Tara Total (kgs)</label><p className={`${readOnlyInputStyles} w-48 text-lg font-bold text-right`}>{formatNumber(totalTare)}</p></div></>)}
                       <div className="flex justify-between items-center"><label className="text-sm font-bold text-foreground">Peso Neto Total (kgs)</label><p className={`${readOnlyInputStyles} w-48 text-xl font-bold text-right`}>{formatNumber(formData.totalNetWeight || 0)}</p></div>
                  </div>
              </div>
          </div>
          
          {isPorte && (<div className="bg-card p-6 rounded-lg shadow-sm border"><h2 className="text-xl font-semibold text-card-foreground mb-4">Observaciones y Notas</h2><RichTextEditor value={formData.observations} onChange={(html) => setFormData(prev => ({...prev, observations: html}))}/></div>)}

          <div className="flex justify-end gap-4 pt-6"><button type="button" onClick={onCancel} className="rounded-md bg-background px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent">Cancelar</button><button type="submit" className="inline-flex justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">Guardar</button></div>
        </form>
      </div>
    </div>
  );
};

export default CertificateForm;
