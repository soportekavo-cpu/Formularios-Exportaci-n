import React, { useState, useEffect, useRef } from 'react';
import type { Certificate, PackageItem, Driver } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ArrowLeftIcon, PlusIcon, TrashIcon, DocumentDuplicateIcon } from './Icons';

interface CertificateFormProps {
  initialData: Partial<Certificate>;
  onSubmit: (data: Certificate) => void;
  onCancel: () => void;
}

const inputStyles = "block w-full text-base text-gray-900 bg-gray-50 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 hover:bg-white focus:bg-white transition-colors duration-200 px-4 py-3";
const textareaStyles = `${inputStyles} min-h-[110px]`;
const readOnlyInputStyles = `${inputStyles} bg-gray-200 cursor-not-allowed`;

const predefinedConsignees = [
    'PUERTO BARRIOS',
    'PUERTO SANTO TOMAS DE CASTILLA',
    'PUERTO QUETZAL'
];

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
    
    const ToolButton = ({ onClick, children }: { onClick: () => void, children: React.ReactNode }) => (
        <button 
            type="button" 
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            className="px-3 py-1 text-sm font-bold text-gray-700 rounded hover:bg-gray-200"
        >
            {children}
        </button>
    );

    const ColorButton = ({ color }: { color: string }) => (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); applyCommand('foreColor', color); }}
            className="w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: color }}
            title={color}
        />
    );
    
    return (
        <div>
            <div className="flex flex-wrap items-center gap-x-1 p-1.5 border border-gray-300 border-b-0 rounded-t-lg bg-gray-100">
                <ToolButton onClick={() => applyCommand('bold')}><b>B</b></ToolButton>
                <ToolButton onClick={() => applyCommand('italic')}><i>I</i></ToolButton>
                <ToolButton onClick={() => applyCommand('underline')}><u>U</u></ToolButton>
                <div className="h-5 w-px bg-gray-300 mx-2"></div>
                <div className="flex items-center gap-x-2">
                    <ColorButton color="#000000" />
                    <ColorButton color="#ef4444" /> {/* red-500 */}
                    <ColorButton color="#22c55e" /> {/* green-500 */}
                    <ColorButton color="#3b82f6" /> {/* blue-500 */}
                </div>
            </div>
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className={`${textareaStyles} min-h-[150px] rounded-t-none focus:ring-2 focus:ring-indigo-500`}
                style={{ whiteSpace: 'pre-wrap' }}
            />
        </div>
    );
};


const CertificateForm: React.FC<CertificateFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Certificate>>(initialData);
  const [showPackingPlace, setShowPackingPlace] = useState(!!initialData.packingPlace);
  const [showNotify, setShowNotify] = useState(!!initialData.notify);
  
  // State for Carta de Porte's "Consignado A" field
  const [consigneeSelection, setConsigneeSelection] = useState('PUERTO BARRIOS');
  const [customConsignee, setCustomConsignee] = useState('');

  // Local storage for drivers
  const [drivers, setDrivers] = useLocalStorage<Driver[]>('drivers', []);

  useEffect(() => {
    setFormData(initialData);
    setShowPackingPlace(!!initialData.packingPlace);
    setShowNotify(!!initialData.notify);
    
    if(initialData.type === 'porte') {
        const isPredefined = predefinedConsignees.includes(initialData.consignee || '');
        if (isPredefined) {
            setConsigneeSelection(initialData.consignee!);
            setCustomConsignee('');
        } else {
            setConsigneeSelection('Otro');
            setCustomConsignee(initialData.consignee || '');
        }
    }
  }, [initialData]);

  useEffect(() => {
    const totalNet = formData.packages?.reduce((sum, pkg) => sum + ((Number(pkg.quantity) || 0) * (Number(pkg.unitWeight) || 0)), 0) || 0;
    const totalGross = formData.packages?.reduce((sum, pkg) => sum + ((Number(pkg.quantity) || 0) * (Number(pkg.grossUnitWeight) || 0)), 0) || 0;
    setFormData(prev => ({ ...prev, totalNetWeight: totalNet, totalGrossWeight: totalGross }));
  }, [formData.packages]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };
  
  const handleDriverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const selectedDriver = drivers.find(d => d.name.toLowerCase() === value.toLowerCase());
      
      setFormData(prev => ({
          ...prev,
          driverName: value,
          driverLicense: selectedDriver ? selectedDriver.license : prev.driverLicense,
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

  const handlePackageChange = (id: string, field: keyof PackageItem, value: string | number) => {
      setFormData(prev => {
        const newPackages = prev.packages?.map(pkg => {
          if (pkg.id === id) {
            const updatedPkg = { ...pkg, [field]: value };
            // Auto-calculate gross weight for Carta de Porte
            if (formData.type === 'porte' && (field === 'unitWeight' || field === 'tareUnitWeight')) {
              const net = field === 'unitWeight' ? Number(value) : Number(updatedPkg.unitWeight || 0);
              const tare = field === 'tareUnitWeight' ? Number(value) : Number(updatedPkg.tareUnitWeight || 0);
              updatedPkg.grossUnitWeight = net + tare;
            }
            return updatedPkg;
          }
          return pkg;
        });
        return { ...prev, packages: newPackages };
      });
  };

  const addPackage = () => {
      const newPackage: PackageItem = {
          id: new Date().toISOString(),
          type: 'SACO',
          quantity: '',
          unitWeight: '',
          tareUnitWeight: '',
          grossUnitWeight: '',
          marks: '',
          quality: '',
          contains: 'CAFE ORO'
      };
      setFormData(prev => ({
          ...prev,
          packages: [...(prev.packages || []), newPackage]
      }));
  };

  const removePackage = (id: string) => {
      setFormData(prev => ({
          ...prev,
          packages: prev.packages?.filter(pkg => pkg.id !== id)
      }));
  };

  const duplicatePackage = (id: string) => {
    setFormData(prev => {
      const originalPackages = prev.packages || [];
      const packageIndex = originalPackages.findIndex(p => p.id === id);
      if (packageIndex === -1) return prev;

      const packageToDuplicate = originalPackages[packageIndex];
      const newPackage = {
        ...packageToDuplicate,
        id: new Date().toISOString() + Math.random(), // New unique ID
        marks: '', // Clear marks as requested
      };

      const newPackages = [
        ...originalPackages.slice(0, packageIndex + 1),
        newPackage,
        ...originalPackages.slice(packageIndex + 1),
      ];

      return { ...prev, packages: newPackages };
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as Certificate);
  };

  const isEditing = !!initialData.id;
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
  
  const handleConsigneeSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setConsigneeSelection(value);
      if (value !== 'Otro') {
          setFormData(prev => ({ ...prev, consignee: value, destination: value }));
      } else {
          setFormData(prev => ({ ...prev, consignee: customConsignee, destination: customConsignee }));
      }
  };

  const handleCustomConsigneeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setCustomConsignee(value);
      setFormData(prev => ({ ...prev, consignee: value, destination: value }));
  };


  const formatNumber = (num: number, digits = 2) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(num);
  }

  const totalPackages = formData.packages?.reduce((sum, pkg) => sum + (Number(pkg.quantity) || 0), 0) || 0;
  
  const totalTare = formData.packages?.reduce((sum, pkg) => sum + ((Number(pkg.quantity) || 0) * (Number(pkg.tareUnitWeight) || 0)), 0) || 0;


  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-8">
        <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver a la lista
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{getTitle()}</h1>
        <p className="text-base text-gray-600 mb-10">Completa los campos para generar el documento.</p>
        
        <form onSubmit={handleSubmit} className="space-y-10">
          
          {isEditing && formData.certificateNumber && (
             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
               <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Información General</h2>
               <div>
                  <label htmlFor="certificateNumber" className="block text-sm font-medium text-gray-800 mb-2">Nº de Documento</label>
                  <input type="text" id="certificateNumber" name="certificateNumber" value={formData.certificateNumber} readOnly className={readOnlyInputStyles} />
              </div>
            </div>
          )}

          {/* Parties Info */}
          {!isPorte && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Información de las Partes</h2>
              <div className={isPackingList ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'}>
                {!isPackingList && (
                  <div>
                      <label htmlFor="shipper" className="block text-sm font-medium text-gray-800 mb-2">Seller</label>
                      <textarea id="shipper" name="shipper" value={formData.shipper || ''} onChange={handleChange} required className={textareaStyles}></textarea>
                  </div>
                )}
                <div className={!isPackingList ? 'md:col-span-2' : ''}>
                    <label htmlFor="consignee" className="block text-sm font-medium text-gray-800 mb-2">Consignee</label>
                    <textarea id="consignee" name="consignee" value={formData.consignee || ''} onChange={handleChange} required className={textareaStyles}></textarea>
                </div>
                
                {isPackingList ? (
                  <>
                    <div>
                      {showNotify ? (
                          <>
                              <div className="flex justify-between items-center mb-2">
                                  <label htmlFor="notify" className="block text-sm font-medium text-gray-800">Notify</label>
                                  <button type="button" onClick={() => { setShowNotify(false); setFormData(prev => ({ ...prev, notify: '' })); }} className="text-xs font-semibold text-red-600 hover:text-red-800">Quitar</button>
                              </div>
                              <textarea id="notify" name="notify" value={formData.notify || ''} onChange={handleChange} className={textareaStyles}></textarea>
                          </>
                      ) : (
                          <div className="h-full flex items-start">
                              <button type="button" onClick={() => setShowNotify(true)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                                  + Agregar Notify
                              </button>
                          </div>
                      )}
                    </div>
                    <div>
                      {showPackingPlace ? (
                          <>
                              <div className="flex justify-between items-center mb-2">
                                  <label htmlFor="packingPlace" className="block text-sm font-medium text-gray-800">Lugar de Empaque</label>
                                  <button type="button" onClick={() => { setShowPackingPlace(false); setFormData(prev => ({ ...prev, packingPlace: '' })); }} className="text-xs font-semibold text-red-600 hover:text-red-800">Quitar</button>
                              </div>
                              <textarea id="packingPlace" name="packingPlace" value={formData.packingPlace || ''} onChange={handleChange} className={textareaStyles} />
                          </>
                      ) : (
                          <div className="h-full flex items-start">
                              <button type="button" onClick={() => setShowPackingPlace(true)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                                  + Agregar Lugar de Empaque
                              </button>
                          </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div>
                      <label htmlFor="notify" className="block text-sm font-medium text-gray-800 mb-2">Notify</label>
                      <textarea id="notify" name="notify" value={formData.notify || ''} onChange={handleChange} required className={textareaStyles}></textarea>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {isPorte && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Información General</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                    <div>
                        <label htmlFor="place" className="block text-sm font-medium text-gray-800 mb-2">Lugar de Emisión</label>
                        <input type="text" id="place" name="place" value={formData.place || ''} onChange={handleChange} required className={inputStyles} />
                    </div>
                    <div>
                        <label htmlFor="certificateDate" className="block text-sm font-medium text-gray-800 mb-2">Fecha</label>
                        <input type="date" id="certificateDate" name="certificateDate" value={formData.certificateDate || ''} onChange={handleChange} required className={inputStyles} />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="consignee" className="block text-sm font-medium text-gray-800 mb-2">Consignado A</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <select id="consignee" name="consignee" value={consigneeSelection} onChange={handleConsigneeSelectionChange} required className={`${inputStyles} sm:w-1/2`}>
                                {predefinedConsignees.map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="Otro">Otro (especificar)</option>
                            </select>
                            {consigneeSelection === 'Otro' && (
                                <input 
                                    type="text" 
                                    value={customConsignee} 
                                    onChange={handleCustomConsigneeChange} 
                                    placeholder="Ingrese destino"
                                    className={`${inputStyles} w-full`}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
          )}

          {isPorte && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Información de Transporte</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                    <div className="sm:col-span-2">
                        <label htmlFor="transportCompany" className="block text-sm font-medium text-gray-800 mb-2">Compañía Contratista</label>
                        <input type="text" id="transportCompany" name="transportCompany" value={formData.transportCompany || ''} onChange={handleChange} className={inputStyles} />
                    </div>
                     <div>
                        <label htmlFor="driverName" className="block text-sm font-medium text-gray-800 mb-2">Nombre del Piloto</label>
                        <input type="text" id="driverName" list="driver-list" name="driverName" value={formData.driverName || ''} onChange={handleDriverChange} onBlur={handleDriverBlur} className={inputStyles} autoComplete="off"/>
                         <datalist id="driver-list">
                            {drivers.map(d => <option key={d.name} value={d.name} />)}
                        </datalist>
                    </div>
                    <div>
                        <label htmlFor="driverLicense" className="block text-sm font-medium text-gray-800 mb-2">Licencia de Conducir</label>
                        <input type="text" id="driverLicense" name="driverLicense" value={formData.driverLicense || ''} onChange={handleChange} onBlur={handleDriverBlur} className={inputStyles} />
                    </div>
                    <div>
                        <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-800 mb-2">Placas</label>
                        <input type="text" id="licensePlate" name="licensePlate" value={formData.licensePlate || ''} onChange={handleChange} className={inputStyles} />
                    </div>
                    <div>
                        <label htmlFor="transportUnit" className="block text-sm font-medium text-gray-800 mb-2">Furgon/Plataforma</label>
                        <input type="text" id="transportUnit" name="transportUnit" value={formData.transportUnit || ''} onChange={handleChange} className={inputStyles} />
                    </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Información de Embarque</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                    <div>
                        <label htmlFor="containerNo" className="block text-sm font-medium text-gray-800 mb-2">Contenedor</label>
                        <input type="text" id="containerNo" name="containerNo" value={formData.containerNo || ''} onChange={handleChange} className={inputStyles} />
                    </div>
                    <div>
                        <label htmlFor="sealNo" className="block text-sm font-medium text-gray-800 mb-2">No. de Marchamo</label>
                        <input type="text" id="sealNo" name="sealNo" value={formData.sealNo || ''} onChange={handleChange} className={inputStyles} />
                    </div>
                    <div>
                        <label htmlFor="shippingLine" className="block text-sm font-medium text-gray-800 mb-2">Vapor</label>
                        <input type="text" id="shippingLine" name="shippingLine" value={formData.shippingLine || ''} onChange={handleChange} className={inputStyles} />
                    </div>
                     <div>
                        <label htmlFor="destination" className="block text-sm font-medium text-gray-800 mb-2">Descargar En</label>
                        <input type="text" id="destination" name="destination" value={formData.destination || ''} onChange={handleChange} className={inputStyles} />
                    </div>
                </div>
              </div>
            </>
          )}

          {/* Shipment Info */}
          {!isPorte && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Detalles del Envío</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                  <div>
                      <label htmlFor="certificateDate" className="block text-sm font-medium text-gray-800 mb-2">{isPackingList ? 'Packing Date' : 'Fecha del Certificado'}</label>
                      <input type="date" id="certificateDate" name="certificateDate" value={formData.certificateDate || ''} onChange={handleChange} required className={inputStyles} />
                  </div>
                  {!isPackingList && (
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
                  {isPackingList && (
                      <>
                          <div>
                              <label htmlFor="sealNo" className="block text-sm font-medium text-gray-800 mb-2">Nº de Sello</label>
                              <input type="text" id="sealNo" name="sealNo" value={formData.sealNo || ''} onChange={handleChange} className={inputStyles} />
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
                  {isPackingList && (
                      <div>
                          <label htmlFor="contractNo" className="block text-sm font-medium text-gray-800 mb-2">Contrato</label>
                          <input type="text" id="contractNo" name="contractNo" value={formData.contractNo || ''} onChange={handleChange} className={inputStyles} />
                      </div>
                  )}
              </div>
            </div>
          )}

          {/* Exporter Info */}
          {!isPorte && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-6">Información del Exportador</h2>
              <div>
                <label htmlFor="exporterName" className="block text-sm font-medium text-gray-800 mb-2">Nombre para la Firma</label>
                <input 
                  type="text" 
                  id="exporterName" 
                  name="exporterName" 
                  value={formData.exporterName || ''} 
                  onChange={handleChange} 
                  required 
                  className={inputStyles} 
                  placeholder="Ej: Yony Roquel"
                />
              </div>
            </div>
          )}
          
          {/* Packages Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Items de Carga</h2>
              </div>
              <div className="space-y-4">
              {formData.packages?.map((pkg, index) => (
                  <div key={pkg.id} className="p-4 bg-slate-50 rounded-lg border space-y-4">
                      <div className="grid grid-cols-12 gap-x-6 gap-y-4 items-end">
                          <div className="col-span-12 sm:col-span-6 md:col-span-3">
                              <label htmlFor={`type-${pkg.id}`} className="block text-sm font-medium text-gray-700 mb-2">{isPorte ? 'Clase' : 'Tipo'} #{index + 1}</label>
                              <input type="text" id={`type-${pkg.id}`} value={pkg.type} onChange={e => handlePackageChange(pkg.id, 'type', e.target.value.toUpperCase())} placeholder="EJ: BAGS, SACO" className={inputStyles}/>
                          </div>
                          <div className="col-span-6 sm:col-span-3 md:col-span-2">
                              <label htmlFor={`quantity-${pkg.id}`} className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                              <input type="number" id={`quantity-${pkg.id}`} value={pkg.quantity} onChange={e => handlePackageChange(pkg.id, 'quantity', e.target.value)} className={inputStyles}/>
                          </div>
                          <div className="col-span-6 sm:col-span-3 md:col-span-2">
                              <label htmlFor={`unitWeight-${pkg.id}`} className="block text-sm font-medium text-gray-700 mb-2">P. Neto Unit. (kg)</label>
                              <input type="number" step="0.01" id={`unitWeight-${pkg.id}`} value={pkg.unitWeight} onChange={e => handlePackageChange(pkg.id, 'unitWeight', e.target.value)} className={inputStyles}/>
                          </div>
                          {isPorte && (
                             <div className="col-span-6 sm:col-span-3 md:col-span-2">
                                <label htmlFor={`tareUnitWeight-${pkg.id}`} className="block text-sm font-medium text-gray-700 mb-2">Tara Unit. (kg)</label>
                                <input type="number" step="0.01" id={`tareUnitWeight-${pkg.id}`} value={pkg.tareUnitWeight} onChange={e => handlePackageChange(pkg.id, 'tareUnitWeight', e.target.value)} className={inputStyles}/>
                            </div>
                          )}
                           {isPackingList || isPorte ? (
                            <div className="col-span-6 sm:col-span-4 md:col-span-2">
                                <label htmlFor={`grossUnitWeight-${pkg.id}`} className="block text-sm font-medium text-gray-700 mb-2">P. Bruto Unit. (kg)</label>
                                <input type="number" step="0.01" id={`grossUnitWeight-${pkg.id}`} value={pkg.grossUnitWeight} readOnly={isPorte} className={isPorte ? readOnlyInputStyles : inputStyles} onChange={e => handlePackageChange(pkg.id, 'grossUnitWeight', e.target.value)}/>
                            </div>
                          ) : null}
                          <div className="col-span-6 sm:col-span-2 md:col-span-1 flex items-end justify-end space-x-2">
                              <button type="button" onClick={() => duplicatePackage(pkg.id)} className="text-indigo-600 hover:text-indigo-800 p-2 rounded-md hover:bg-indigo-50 transition-colors" title="Duplicar Item">
                                  <DocumentDuplicateIcon className="w-5 h-5"/>
                              </button>
                              <button type="button" onClick={() => removePackage(pkg.id)} className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors" title="Eliminar Item">
                                  <TrashIcon className="w-5 h-5"/>
                              </button>
                          </div>
                           <div className="col-span-12 sm:col-span-6">
                              <label htmlFor={`marks-${pkg.id}`} className="block text-sm font-medium text-gray-700 mb-2">Marcas</label>
                              <input type="text" id={`marks-${pkg.id}`} value={pkg.marks} onChange={e => handlePackageChange(pkg.id, 'marks', e.target.value)} className={inputStyles}/>
                          </div>
                          {isQualityCert && (
                              <div className="md:col-span-1">
                                  <label htmlFor={`quality-${pkg.id}`} className="block text-sm font-medium text-gray-700 mb-2">Calidad</label>
                                  <input type="text" id={`quality-${pkg.id}`} value={pkg.quality || ''} onChange={e => handlePackageChange(pkg.id, 'quality', e.target.value)} placeholder="Ej: SHB EP..." className={inputStyles}/>
                              </div>
                          )}
                          {isPorte && (
                             <div className="col-span-12 sm:col-span-6">
                                  <label htmlFor={`contains-${pkg.id}`} className="block text-sm font-medium text-gray-700 mb-2">Contiene</label>
                                  <input type="text" id={`contains-${pkg.id}`} value={pkg.contains || ''} onChange={e => handlePackageChange(pkg.id, 'contains', e.target.value)} className={inputStyles}/>
                              </div>
                          )}
                      </div>
                  </div>
              ))}
              </div>
              <div className="mt-4 flex justify-end">
                  <button type="button" onClick={addPackage} className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:scale-95 transition-transform duration-150">
                      <PlusIcon className="w-5 h-5" />
                      Agregar Item
                  </button>
              </div>
               <div className="flex justify-end pt-6 mt-6 border-t">
                  <div className="w-full max-w-sm space-y-3">
                      <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-gray-700">Total Bultos</label>
                          <p className={`${readOnlyInputStyles} w-48 text-lg font-bold text-right`}>{formatNumber(totalPackages, 0)}</p>
                      </div>
                      {(isPackingList || isPorte) && (
                        <>
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-700">Peso Bruto Total (kgs)</label>
                                <p className={`${readOnlyInputStyles} w-48 text-lg font-bold text-right`}>{formatNumber(formData.totalGrossWeight || 0)}</p>
                            </div>
                             <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-700">Tara Total (kgs)</label>
                                <p className={`${readOnlyInputStyles} w-48 text-lg font-bold text-right`}>{formatNumber(totalTare)}</p>
                            </div>
                        </>
                      )}
                       <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-gray-900">Peso Neto Total (kgs)</label>
                          <p className={`${readOnlyInputStyles} w-48 text-xl font-bold text-right`}>{formatNumber(formData.totalNetWeight || 0)}</p>
                      </div>
                  </div>
              </div>
          </div>
          
          {isPorte && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Observaciones y Notas</h2>
                <RichTextEditor 
                    value={formData.observations}
                    onChange={(html) => setFormData(prev => ({...prev, observations: html}))}
                />
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6">
            <button type="button" onClick={onCancel} className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="inline-flex justify-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CertificateForm;