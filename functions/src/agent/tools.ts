
import * as admin from 'firebase-admin';
import { FunctionDeclaration, SchemaType } from '@google-cloud/vertexai';

const db = admin.firestore();

// --- DEFINICIÓN DE HERRAMIENTAS (JSON SCHEMA) ---

export const toolsDeclarations: FunctionDeclaration[] = [
  {
    name: 'listUpcomingShipments',
    description: 'Lista los embarques o contratos que tienen fecha de Cut Off o Zarpe en los próximos días.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        days: { type: SchemaType.NUMBER, description: 'Número de días a futuro para buscar (por defecto 7).' }
      }
    }
  },
  {
    name: 'updatePackagingStatus',
    description: 'Actualiza el estado de compra de un material de empaque para una partida específica.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        contractNumber: { type: SchemaType.STRING, description: 'Número de contrato (ej: 105).' },
        partidaNo: { type: SchemaType.STRING, description: 'Número de partida (ej: 11/988/1).' },
        itemName: { type: SchemaType.STRING, description: 'Nombre del material (ej: Sacos de Yute, Big Bag).' },
        status: { type: SchemaType.STRING, description: 'Nuevo estado: "purchased" (Comprado) o "pending" (Pendiente).' }
      },
      required: ['contractNumber', 'partidaNo', 'itemName', 'status']
    }
  },
  {
    name: 'updateContractDestination',
    description: 'Cambia el destino final de una partida o contrato.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        contractNumber: { type: SchemaType.STRING, description: 'Número de contrato.' },
        partidaNo: { type: SchemaType.STRING, description: 'Número de partida.' },
        newDestination: { type: SchemaType.STRING, description: 'El nuevo destino (ciudad, país).' }
      },
      required: ['contractNumber', 'partidaNo', 'newDestination']
    }
  }
];

// --- IMPLEMENTACIÓN LÓGICA (INTERACCIÓN CON FIRESTORE) ---

export const toolsImplementation = {
  
  async listUpcomingShipments({ days = 7 }: { days?: number }) {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + days);

    // Buscamos en la colección de contratos
    // Nota: En producción, asegúrate de tener índices compuestos en Firestore para estas consultas
    const snapshot = await db.collection('contracts')
      .where('isTerminated', '==', false)
      .get();

    const upcoming: any[] = [];

    snapshot.forEach(doc => {
      const contract = doc.data();
      if (contract.partidas && Array.isArray(contract.partidas)) {
        contract.partidas.forEach((p: any) => {
          if (p.cutOffPort) {
            const cutOff = new Date(p.cutOffPort);
            if (cutOff >= today && cutOff <= future) {
              upcoming.push({
                type: 'Cut Off Puerto',
                date: p.cutOffPort,
                contract: contract.contractNumber,
                partida: p.partidaNo,
                buyer: contract.buyer,
                packagingStatus: p.packagingRecords || 'No info'
              });
            }
          }
        });
      }
    });

    if (upcoming.length === 0) return "No encontré embarques pendientes ni Cut Offs para los próximos días.";
    return JSON.stringify(upcoming);
  },

  async updatePackagingStatus({ contractNumber, partidaNo, itemName, status }: any) {
    // 1. Buscar el contrato
    const snapshot = await db.collection('contracts').where('contractNumber', '==', contractNumber).limit(1).get();
    
    if (snapshot.empty) return `No encontré ningún contrato con el número ${contractNumber}.`;
    
    const doc = snapshot.docs[0];
    const contract = doc.data();
    const partidas = contract.partidas || [];

    // 2. Buscar la partida
    const partidaIndex = partidas.findIndex((p: any) => p.partidaNo.includes(partidaNo) || p.partidaNo === partidaNo);
    
    if (partidaIndex === -1) return `No encontré la partida ${partidaNo} en el contrato ${contractNumber}.`;

    // 3. Actualizar el item específico
    const records = partidas[partidaIndex].packagingRecords || [];
    const itemIndex = records.findIndex((r: any) => r.itemName.toLowerCase().includes(itemName.toLowerCase()));

    if (itemIndex === -1) return `No encontré el material "${itemName}" en esta partida.`;

    // Actualizar lógica: Si es 'purchased', igualamos comprado a requerido
    if (status === 'purchased') {
        records[itemIndex].purchased = records[itemIndex].required;
    } else {
        records[itemIndex].purchased = 0;
    }

    partidas[partidaIndex].packagingRecords = records;

    // 4. Guardar en Firestore
    await doc.ref.update({ partidas });

    return `Listo. He marcado "${records[itemIndex].itemName}" como ${status === 'purchased' ? 'COMPRADO' : 'PENDIENTE'} para el contrato ${contractNumber}, partida ${partidaNo}.`;
  },

  async updateContractDestination({ contractNumber, partidaNo, newDestination }: any) {
    const snapshot = await db.collection('contracts').where('contractNumber', '==', contractNumber).limit(1).get();
    if (snapshot.empty) return `Error: Contrato ${contractNumber} no encontrado.`;

    const doc = snapshot.docs[0];
    const contract = doc.data();
    const partidas = contract.partidas || [];
    
    const partidaIndex = partidas.findIndex((p: any) => p.partidaNo.includes(partidaNo));
    if (partidaIndex === -1) return `Error: Partida ${partidaNo} no encontrada.`;

    partidas[partidaIndex].destino = newDestination;

    await doc.ref.update({ partidas });
    return `Entendido. El nuevo destino para la partida ${partidaNo} es ${newDestination}.`;
  }
};
