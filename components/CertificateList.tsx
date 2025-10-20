import React, { useState, useMemo } from 'react';
import type { Certificate, CertificateType } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, DocumentDuplicateIcon, CurrencyDollarIcon } from './Icons';

interface CertificateListProps {
  certificates: Certificate[];
  activeCertType: CertificateType;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onCreatePaymentInstruction: (id: string) => void;
}

const CertificateList: React.FC<CertificateListProps> = ({ certificates, activeCertType, onAdd, onEdit, onView, onDelete, onDuplicate, onCreatePaymentInstruction }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCertificates = useMemo(() => {
    if (!searchTerm) {
      return certificates;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return certificates.filter(cert => {
      const qualityString = (cert.packages || [])
        .map(p => p.quality)
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
        
      return (cert.consignee || '').toLowerCase().includes(lowercasedFilter) ||
        (cert.customerName || '').toLowerCase().includes(lowercasedFilter) ||
        (cert.containerNo || '').toLowerCase().includes(lowercasedFilter) ||
        (cert.driverName || '').toLowerCase().includes(lowercasedFilter) ||
        (cert.licensePlate || '').toLowerCase().includes(lowercasedFilter) ||
        (cert.invoiceNo || '').toLowerCase().includes(lowercasedFilter) ||
        (cert.certificateNumber || '').toLowerCase().includes(lowercasedFilter) ||
        qualityString.includes(lowercasedFilter);
    });
  }, [certificates, searchTerm]);

  const isWeight = activeCertType === 'weight';
  const isQuality = activeCertType === 'quality';
  const isPacking = activeCertType === 'packing';
  const isPorte = activeCertType === 'porte';
  const isInvoice = activeCertType === 'invoice';
  const isPayment = activeCertType === 'payment';
  
  let title = '';
  let description = '';
  let searchPlaceholder = 'Buscar...';
  let addButtonText = '';


  if (isWeight) {
    title = 'Certificados de Peso';
    description = 'Una lista de todos los certificados de peso guardados.';
    searchPlaceholder = 'Buscar por consignatario, contenedor...';
    addButtonText = 'Crear Nuevo Embarque';
  } else if (isQuality) {
    title = 'Certificados de Calidad';
    description = 'Una lista de todos los certificados de calidad guardados.';
    searchPlaceholder = 'Buscar por consignatario, contenedor, calidad...';
    addButtonText = 'Crear Nuevo Embarque';
  } else if (isPacking) {
    title = 'Listas de Empaque';
    description = 'Una lista de todas las listas de empaque guardadas.';
    searchPlaceholder = 'Buscar por consignatario, contenedor...';
    addButtonText = 'Crear Nuevo Embarque';
  } else if (isPorte) {
    title = 'Cartas de Porte';
    description = 'Una lista de todas las cartas de porte guardadas.';
    searchPlaceholder = 'Buscar por consignatario, piloto o placas...';
    addButtonText = 'Crear Carta de Porte';
  } else if (isInvoice) {
    title = 'Invoices';
    description = 'Una lista de todas las facturas guardadas.';
    searchPlaceholder = 'Buscar por cliente o Nº de factura...';
    addButtonText = 'Crear Nuevo Invoice';
  } else if (isPayment) {
    title = 'Instrucciones de Pago';
    description = 'Una lista de todas las instrucciones de pago guardadas.';
    searchPlaceholder = 'Buscar por cliente, contrato o Nº de factura...';
    addButtonText = 'Crear Instrucción';
  }


  return (
    <div className="pt-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold leading-6 text-gray-900">{title}</h1>
          <p className="mt-2 text-sm text-gray-700">{description}</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          {activeCertType !== 'payment' && (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusIcon className="w-5 h-5" />
              {addButtonText}
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-6 max-w-md">
        <label htmlFor="search" className="sr-only">Buscar</label>
        <input
            type="text"
            name="search"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder={searchPlaceholder}
        />
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {filteredCertificates.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    {isInvoice ? (
                      <>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Fecha</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nº Invoice</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Bill To</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total</th>
                      </>
                    ) : isPayment ? (
                      <>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Fecha</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Cliente</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Contrato</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Monto</th>
                      </>
                    ) : (
                      <>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">{isPorte ? 'Destino' : 'Consignatario'}</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{isPorte ? 'Piloto' : 'Nº de Contenedor'}</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{isPacking ? 'Fecha de Empaque' : isPorte ? 'Fecha' : 'Fecha de Embarque'}</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {isWeight ? 'Peso Neto (kgs)' 
                            : isQuality ? 'Calidad' 
                            : isPacking ? 'Total Bultos'
                            : 'Peso Neto (kgs)'}
                        </th>
                      </>
                    )}
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-50">
                      {isInvoice ? (
                          <>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{cert.certificateDate}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{cert.invoiceNo}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{cert.customerName}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                ${(Number(cert.totalAmount) || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </td>
                          </>
                      ) : isPayment ? (
                          <>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{cert.certificateDate}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{cert.customerName}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{cert.contractNo}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                ${(Number(cert.totalAmount) || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </td>
                          </>
                      ) : (
                          <>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{(cert.consignee || '').split('\n')[0]}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{isPorte ? cert.driverName : cert.containerNo || ''}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{isPacking || isPorte ? cert.certificateDate : (cert.shipmentDate || '')}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {isWeight || isPorte
                                  ? (Number(cert.totalNetWeight) || 0).toFixed(2) 
                                  : isQuality
                                      ? (cert.packages || []).map(p => p.quality).filter(Boolean).join(', ')
                                      : (cert.packages || []).reduce((sum, p) => sum + Number(p.quantity || 0), 0)
                              }
                            </td>
                          </>
                      )}
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                        <div className="flex justify-end items-center gap-x-4">
                          <button onClick={() => onView(cert.id)} className="text-indigo-600 hover:text-indigo-900" title="Ver">
                            <EyeIcon />
                          </button>
                          {isInvoice && (
                              <button onClick={() => onCreatePaymentInstruction(cert.id)} className="text-green-600 hover:text-green-900" title="Crear Instrucciones de Pago">
                                <CurrencyDollarIcon />
                              </button>
                          )}
                          {!isPayment && (
                            <button onClick={() => onDuplicate(cert.id)} className="text-gray-600 hover:text-gray-900" title="Duplicar">
                                <DocumentDuplicateIcon />
                            </button>
                          )}
                          <button onClick={() => onEdit(cert.id)} className="text-gray-600 hover:text-gray-900" title="Editar">
                             <PencilIcon />
                          </button>
                          <button onClick={() => onDelete(cert.id)} className="text-red-600 hover:text-red-900" title="Eliminar">
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">{searchTerm ? 'No se encontraron documentos' : 'No hay documentos'}</h3>
                    <p className="mt-1 text-sm text-gray-500">{searchTerm ? 'Intenta con otros términos de búsqueda.' : isPorte ? 'Crea tu primera carta de porte para empezar.' : isInvoice ? 'Crea tu primer invoice para empezar.' : isPayment ? 'Crea instrucciones de pago desde un invoice existente.' : 'Crea tu primer embarque para empezar.'}</p>
                    {!searchTerm && activeCertType !== 'payment' && (
                        <div className="mt-6">
                            <button
                              type="button"
                              onClick={onAdd}
                              className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                              <PlusIcon className="w-5 h-5" />
                              {addButtonText}
                            </button>
                        </div>
                    )}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateList;