import React, { useState, useEffect, useRef } from 'react';
// FIX: Imported the 'ShipmentTask' type to resolve a type error where it was used without being imported.
import type { Shipment, DocumentAttachment, TaskStatus, AnacafeSubtask, TaskPriority, ShipmentTask } from '../types';
import { UploadIcon, PaperClipIcon, TrashIcon } from './Icons';

const inputStyles = "block w-full text-base bg-background rounded-lg border-input shadow-sm focus:border-primary focus:ring-primary transition-colors duration-200 px-4 py-3 ring-1 ring-inset focus:ring-2 focus:ring-inset";
const textareaStyles = `${inputStyles} min-h-[110px]`;

const statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'in_progress', label: 'En Progreso' },
    { value: 'completed', label: 'Completado' },
    { value: 'skipped', label: 'Cancelado' },
    { value: 'backlog', label: 'En Espera' },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
    { value: 'Low', label: 'Baja' },
    { value: 'Medium', label: 'Media' },
    { value: 'High', label: 'Alta' },
];

// Helper Functions & Components
const fileToAttachment = (file: File): Promise<DocumentAttachment> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve({
      id: new Date().toISOString() + file.name,
      name: file.name,
      type: file.type,
      data: (reader.result as string).split(',')[1]
    });
    reader.onerror = error => reject(error);
  });
};

const DocumentManager: React.FC<{
    docs: DocumentAttachment[];
    onAdd: (doc: DocumentAttachment) => void;
    onRemove: (id: string) => void;
    title?: string;
    multiple?: boolean;
}> = ({ docs = [], onAdd, onRemove, title = "Documentos Adjuntos", multiple = true }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;
        try {
            // FIX: Replaced Array.from with a standard for loop and .item(i) to be more explicit and avoid potential type inference issues.
            const fileList = event.target.files;
            for (let i = 0; i < fileList.length; i++) {
                const file = fileList.item(i);
                if (file) {
                    const attachment = await fileToAttachment(file);
                    onAdd(attachment);
                }
            }
        } catch (error) {
            console.error("Error processing file:", error);
            alert("Hubo un error al procesar el archivo.");
        }
    };

    return (
        <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">{title}</h4>
            <div className="space-y-2">
                {docs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-md border">
                        <div className="flex items-center gap-x-2 truncate">
                            <PaperClipIcon className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm truncate" title={doc.name}>{doc.name}</span>
                        </div>
                        <button type="button" onClick={() => onRemove(doc.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded-full"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
            {(multiple || docs.length === 0) && (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 w-full flex items-center justify-center gap-x-2 border-2 border-dashed border-border rounded-lg p-3 text-sm font-semibold text-muted-foreground hover:bg-accent hover:border-primary"
                >
                    <UploadIcon className="w-5 h-5" /> Subir Documento
                </button>
            )}
            <input type="file" ref={fileInputRef} multiple={multiple} onChange={handleFileChange} className="hidden" />
        </div>
    );
};

// Main Modal Component
interface ShipmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment;
  taskKey: string;
  onSave: (updatedShipment: Shipment) => void;
}

const ShipmentDetailModal: React.FC<ShipmentDetailModalProps> = ({ isOpen, onClose, shipment, taskKey, onSave }) => {
    const [localShipment, setLocalShipment] = useState<Shipment>(shipment);
    const [currentTask, setCurrentTask] = useState<ShipmentTask | null>(null);

    useEffect(() => {
        setLocalShipment(shipment);
        const task = shipment.tasks.find(t => t.key === taskKey);
        setCurrentTask(task || null);
    }, [shipment, taskKey, isOpen]);


    const handleSave = () => {
        if (!currentTask) return;
        const updatedTasks = localShipment.tasks.map(t =>
            t.key === taskKey ? currentTask : t
        );
        onSave({ ...localShipment, tasks: updatedTasks });
    };

    const handleTaskFieldChange = (field: keyof ShipmentTask, value: any) => {
        if (currentTask) {
            setCurrentTask({ ...currentTask, [field]: value });
        }
    };

    const renderContent = () => {
        const createFieldUpdater = <T,>(fieldName: keyof Shipment) => {
            return (data: T) => setLocalShipment(prev => ({ ...prev, [fieldName]: data }));
        };

        switch (taskKey) {
            case 'contract': return (
                <div className="space-y-4">
                    <DocumentManager docs={localShipment.contractDocuments || []} onAdd={(doc) => setLocalShipment(p => ({...p, contractDocuments: [...(p.contractDocuments || []), doc]}))} onRemove={(id) => setLocalShipment(p => ({...p, contractDocuments: (p.contractDocuments || []).filter(d => d.id !== id)}))} title="Contrato(s)"/>
                    <DocumentManager docs={localShipment.instructionDocuments || []} onAdd={(doc) => setLocalShipment(p => ({...p, instructionDocuments: [...(p.instructionDocuments || []), doc]}))} onRemove={(id) => setLocalShipment(p => ({...p, instructionDocuments: (p.instructionDocuments || []).filter(d => d.id !== id)}))} title="Instrucciones de Embarque"/>
                </div>
            );
            
            case 'booking': {
                const details = localShipment.bookingDetails || {};
                const setDetails = createFieldUpdater('bookingDetails');
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium text-muted-foreground mb-1">Nº de Booking</label><input type="text" value={details.bookingNumber || ''} onChange={e => setDetails({...details, bookingNumber: e.target.value})} className={inputStyles}/></div>
                            <div><label className="text-sm font-medium text-muted-foreground mb-1">Nº Contrato de Servicio</label><input type="text" value={details.serviceContract || ''} onChange={e => setDetails({...details, serviceContract: e.target.value})} className={inputStyles}/></div>
                            <div><label className="text-sm font-medium text-muted-foreground mb-1">Línea Naviera</label><input type="text" value={details.shippingLine || ''} onChange={e => setDetails({...details, shippingLine: e.target.value})} className={inputStyles}/></div>
                            <div><label className="text-sm font-medium text-muted-foreground mb-1">Nave / Viaje</label><input type="text" value={details.vesselVoyage || ''} onChange={e => setDetails({...details, vesselVoyage: e.target.value})} className={inputStyles}/></div>
                            <div><label className="text-sm font-medium text-muted-foreground mb-1">ETD (Salida)</label><input type="date" value={details.etd || ''} onChange={e => setDetails({...details, etd: e.target.value})} className={inputStyles}/></div>
                            <div><label className="text-sm font-medium text-muted-foreground mb-1">ETA (Llegada)</label><input type="date" value={details.eta || ''} onChange={e => setDetails({...details, eta: e.target.value})} className={inputStyles}/></div>
                        </div>
                        <DocumentManager docs={details.bookingConfirmation || []} onAdd={doc => setDetails({...details, bookingConfirmation: [...(details.bookingConfirmation || []), doc]})} onRemove={id => setDetails({...details, bookingConfirmation: (details.bookingConfirmation || []).filter(d => d.id !== id)})} title="Confirmación de Booking" />
                    </div>
                );
            }

            case 'anacafe': {
                const details = localShipment.anacafePermitDetails || { subtasks: [] };
                const setDetails = createFieldUpdater('anacafePermitDetails');
                
                const handleSubtaskChange = (key: string, field: 'completed' | 'date' | 'ref', value: boolean | string) => {
                    const updatedSubtasks = details.subtasks.map(st => st.key === key ? {...st, [field]: value} : st);
                    setDetails({...details, subtasks: updatedSubtasks});
                };

                return (
                    <div className="space-y-4">
                        {details.subtasks.map(st => (
                            <div key={st.key} className="p-3 bg-muted/50 rounded-md border grid grid-cols-12 gap-x-4 items-center">
                                <div className="col-span-12 sm:col-span-4 flex items-center gap-x-3">
                                    <input type="checkbox" checked={st.completed} onChange={e => handleSubtaskChange(st.key, 'completed', e.target.checked)} className="h-5 w-5 rounded border-input text-primary focus:ring-primary"/>
                                    <label className="font-medium">{st.label}</label>
                                </div>
                                <div className="col-span-6 sm:col-span-4"><input type="date" value={st.date || ''} onChange={e => handleSubtaskChange(st.key, 'date', e.target.value)} placeholder="Fecha" className={inputStyles + " py-1.5"}/></div>
                                <div className="col-span-6 sm:col-span-4"><input type="text" value={st.ref || ''} onChange={e => handleSubtaskChange(st.key, 'ref', e.target.value)} placeholder="Referencia" className={inputStyles + " py-1.5"}/></div>
                            </div>
                        ))}
                        <div className="pt-4 border-t">
                             <div><label className="text-sm font-medium text-muted-foreground mb-1">Nº de Permiso de Embarque</label><input type="text" value={details.permitNumber || ''} onChange={e => setDetails({...details, permitNumber: e.target.value})} className={inputStyles}/></div>
                             <DocumentManager docs={details.permitDocument || []} onAdd={doc => setDetails({...details, permitDocument: [...(details.permitDocument || []), doc]})} onRemove={id => setDetails({...details, permitDocument: (details.permitDocument || []).filter(d => d.id !== id)})} title="Permiso de Anacafé (Documento)" />
                        </div>
                    </div>
                );
            }

            case 'bl_approval': {
                const details = localShipment.blApprovalDetails || { isApproved: false };
                const setDetails = createFieldUpdater('blApprovalDetails');
                return (
                    <div className="space-y-4">
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                            <p><strong>Recordatorio:</strong> El número de Permiso de Anacafé debe ir en el Bill of Lading (BL) como el número de certificado de origen.</p>
                        </div>
                        <DocumentManager docs={details.drafts || []} onAdd={doc => setDetails({...details, drafts: [...(details.drafts || []), doc]})} onRemove={id => setDetails({...details, drafts: (details.drafts || []).filter(d => d.id !== id)})} title="Borradores de BL" />
                        <div className="flex items-center gap-x-3 p-3 bg-muted/50 rounded-md border">
                            <input id="bl-approved" type="checkbox" checked={details.isApproved} onChange={e => setDetails({...details, isApproved: e.target.checked})} className="h-5 w-5 rounded border-input text-primary focus:ring-primary"/>
                            <label htmlFor="bl-approved" className="font-medium">BL Aprobado por el Cliente</label>
                        </div>
                        <div><label className="text-sm font-medium text-muted-foreground mb-1">Fecha de Aprobación</label><input type="date" value={details.approvalDate || ''} onChange={e => setDetails({...details, approvalDate: e.target.value})} className={inputStyles}/></div>
                    </div>
                );
            }
            
            case 'fitosanitario': case 'isf': case 'carta_porte': case 'zarpe': case 'final_docs': case 'cobro': case 'pago': {
                const fieldMap = {
                    fitosanitario: { details: 'fitosanitarioDetails', fields: [{ name: 'certificateNumber', label: 'Nº Certificado' }, { name: 'issueDate', label: 'Fecha Emisión', type: 'date' }], docs: true, docTitle: 'Certificado Fitosanitario' },
                    isf: { details: 'isfDetails', fields: [{ name: 'confirmationNumber', label: 'Nº Confirmación' }, { name: 'filingDate', label: 'Fecha Envío', type: 'date' }], docs: true, docTitle: 'Documento ISF' },
                    carta_porte: { details: 'cartaPorteDetails', fields: [{ name: 'documentId', label: 'ID/Nº de Carta de Porte' }], docs: false },
                    zarpe: { details: 'zarpeDetails', fields: [{ name: 'confirmedDate', label: 'Fecha Confirmada', type: 'date' }], docs: true, docTitle: 'Confirmación de Zarpe' },
                    final_docs: { details: 'finalDocsDetails', fields: [{ name: 'generatedDate', label: 'Fecha de Generación', type: 'date' }], docs: true, docTitle: 'Documentos Finales (ZIP o individuales)' },
                    cobro: { details: 'cobroDetails', fields: [{ name: 'sentDate', label: 'Fecha de Envío', type: 'date' }, { name: 'invoiceId', label: 'ID/Nº de Invoice' }, { name: 'paymentInstructionId', label: 'ID de Instr. de Pago' }], docs: false },
                    pago: { details: 'pagoDetails', fields: [{ name: 'receivedDate', label: 'Fecha de Recepción', type: 'date' }], docs: true, docTitle: 'Confirmación de Pago' },
                } as const;
                const config = fieldMap[taskKey as keyof typeof fieldMap];
                const details = localShipment[config.details as keyof Shipment] as any || {};
                const setDetails = createFieldUpdater(config.details as keyof Shipment);
                
                return (
                    <div className="space-y-4">
                        {config.fields.map(field => (
                             <div key={field.name}><label className="text-sm font-medium text-muted-foreground mb-1">{field.label}</label><input type={field.type || 'text'} value={details[field.name] || ''} onChange={e => setDetails({...details, [field.name]: e.target.value})} className={inputStyles}/></div>
                        ))}
                        {config.docs && (
                            <DocumentManager docs={details.document || details.documents || []} onAdd={doc => {
                                const docField = details.documents ? 'documents' : 'document';
                                setDetails({...details, [docField]: [...(details[docField] || []), doc]})
                            }} onRemove={id => {
                                const docField = details.documents ? 'documents' : 'document';
                                setDetails({...details, [docField]: (details[docField] || []).filter((d: DocumentAttachment) => d.id !== id)})
                            }} title={config.docTitle} />
                        )}
                    </div>
                );
            }
            default: return <p>Gestión para esta tarea no implementada.</p>;
        }
    };
    
    if (!isOpen || !currentTask) return null;

    return (
      <div className="relative z-50">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm"></div>
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl rounded-lg bg-card border shadow-xl">
              <div className="p-6">
                <div className="flex justify-between items-start border-b pb-4">
                    <h3 className="text-xl font-semibold text-foreground">Gestionar: {currentTask.label}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-muted-foreground hover:bg-accent -mt-2 -mr-2"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Estado</label>
                        <select value={currentTask.status} onChange={(e) => handleTaskFieldChange('status', e.target.value)} className={inputStyles}>
                            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Prioridad</label>
                        <select value={currentTask.priority} onChange={(e) => handleTaskFieldChange('priority', e.target.value)} className={inputStyles}>
                             {priorityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Vencimiento</label>
                        <input type="date" value={currentTask.dueDate || ''} onChange={(e) => handleTaskFieldChange('dueDate', e.target.value)} className={inputStyles} />
                    </div>
                 </div>

                <div className="mt-4 pt-4 border-t max-h-[50vh] overflow-y-auto pr-3">
                  {renderContent()}
                </div>
              </div>
              <div className="bg-muted px-6 py-4 flex flex-row-reverse gap-3">
                <button onClick={handleSave} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">Guardar Cambios</button>
                <button onClick={onClose} className="rounded-md bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default ShipmentDetailModal;
