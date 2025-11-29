
import type { User, Role, ShipmentTask, AnacafeSubtask } from '../types';

export const defaultRoles: Role[] = [
    { id: 'admin', name: 'Admin', permissions: [
        { resource: 'dashboard', actions: ['view'] },
        { resource: 'contracts', actions: ['view', 'create', 'edit', 'delete'] },
        { resource: 'shipments', actions: ['view', 'create', 'edit', 'delete'] },
        { resource: 'liquidaciones', actions: ['view', 'create', 'edit', 'delete'] },
        { resource: 'admin', actions: ['view', 'create', 'edit', 'delete'] },
        { resource: 'documents_weight', actions: ['view', 'create', 'edit', 'delete'] },
        { resource: 'documents_quality', actions: ['view', 'create', 'edit', 'delete'] },
        { resource: 'documents_packing', actions: ['view', 'create', 'edit', 'delete'] },
        { resource: 'documents_porte', actions: ['view', 'create', 'edit', 'delete'] },
        { resource: 'documents_invoice', actions: ['view', 'create', 'edit', 'delete'] },
        { resource: 'documents_payment', actions: ['view', 'create', 'edit', 'delete'] },
    ]},
    { id: 'logistics', name: 'Logística', permissions: [
        { resource: 'dashboard', actions: ['view'] },
        { resource: 'contracts', actions: ['view'] },
        { resource: 'shipments', actions: ['view', 'create', 'edit'] },
        { resource: 'documents_weight', actions: ['view', 'create', 'edit'] },
        { resource: 'documents_quality', actions: ['view', 'create', 'edit'] },
        { resource: 'documents_packing', actions: ['view', 'create', 'edit'] },
        { resource: 'documents_porte', actions: ['view', 'create', 'edit'] },
    ]},
    { id: 'billing', name: 'Facturación', permissions: [
        { resource: 'dashboard', actions: ['view'] },
        { resource: 'contracts', actions: ['view'] },
        { resource: 'liquidaciones', actions: ['view', 'create', 'edit'] },
        { resource: 'documents_invoice', actions: ['view', 'create', 'edit'] },
        { resource: 'documents_payment', actions: ['view', 'create', 'edit'] },
    ]}
];

export const defaultUsers: User[] = [
    { id: '1', name: 'Yony Roquel', email: 'yroquel@gmail.com', roleId: 'admin' },
    { id: '2', name: 'Logistics User', email: 'logistics@example.com', roleId: 'logistics' },
    { id: '3', name: 'Billing User', email: 'billing@example.com', roleId: 'billing' },
];

export const defaultTasks: Omit<ShipmentTask, 'id'>[] = [
    { key: 'contract', label: 'Contrato e Instrucciones Recibidas', status: 'pending', priority: 'High', category: 'Documentación' },
    { key: 'booking', label: 'Booking con Naviera Confirmado', status: 'pending', priority: 'High', category: 'Logística' },
    { key: 'anacafe', label: 'Permiso de Anacafé', status: 'pending', priority: 'High', category: 'Documentación' },
    { key: 'bl_approval', label: 'Borrador de BL Aprobado', status: 'pending', priority: 'High', category: 'Documentación' },
    { key: 'fitosanitario', label: 'Certificado Fitosanitario', status: 'pending', priority: 'Medium', category: 'Documentación' },
    { key: 'isf', label: 'ISF Enviado (si aplica)', status: 'pending', priority: 'Medium', category: 'Aduanas' },
    { key: 'carta_porte', label: 'Carta de Porte Generada', status: 'pending', priority: 'Medium', category: 'Logística' },
    { key: 'zarpe', label: 'Zarpe Confirmado por Naviera', status: 'pending', priority: 'High', category: 'Logística' },
    { key: 'final_docs', label: 'Documentos Finales Generados', status: 'pending', priority: 'High', category: 'Documentación' },
    { key: 'cobro', label: 'Cobro Enviado', status: 'pending', priority: 'High', category: 'Financiero' },
    { key: 'pago', label: 'Pago Recibido', status: 'pending', priority: 'High', category: 'Financiero' },
];

export const defaultAnacafeSubtasks: AnacafeSubtask[] = [
    { key: 'informe_venta', label: 'Informe de Venta', completed: false },
    { key: 'fob_contrat', label: 'FOB Contrat', completed: false },
    { key: 'factura_especial', label: 'Factura Especial', completed: false },
    { key: 'pago_impuestos', label: 'Pago de Impuestos', completed: false },
];
