import { GoogleGenAI, Type, FunctionDeclaration, Chat } from "@google/genai";
import { dbService } from "./db";
import type { Contract, Certificate } from "../types";

// Acceso seguro a la API Key
const getApiKey = () => {
  // 1. Runtime Injection (Producción con App Hosting / Docker vía server.js)
  if (typeof window !== 'undefined' && (window as any).env && (window as any).env.VITE_GEMINI_API_KEY) {
    return (window as any).env.VITE_GEMINI_API_KEY;
  }

  // 2. Vite Build Time (Desarrollo Local)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_GEMINI_API_KEY) {
    return (import.meta as any).env.VITE_GEMINI_API_KEY;
  }
  
  // 3. Local Storage (Respaldo Manual para Admins)
  if (typeof window !== 'undefined') {
      const localKey = window.localStorage.getItem('gemini_api_key');
      if (localKey) return localKey;
  }
  
  // 4. Process Env (Node/SSR fallback)
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env) {
    // @ts-ignore
    return process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  }
  return undefined;
};

// Reiniciar instancia de AI si la key cambia
export const resetAiInstance = () => {
    ai = null;
};

let ai: GoogleGenAI | null = null;

// --- TOOL DEFINITIONS ---

const listAllPartidasTool: FunctionDeclaration = {
    name: "listAllPartidas",
    description: "HERRAMIENTA MAESTRA DE DATOS. Devuelve una tabla unificada con: Contratos, Partidas, Logística, Empaque y DOCUMENTOS GENERADOS (Facturas, Cartas de Porte, Certificados). Úsala para cualquier consulta sobre el estado del negocio.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: { type: Type.STRING, description: "El término de búsqueda (ej: 'Partida 1', 'Contrato 105', 'Panamerican', 'SPGT-1'). Si es vacío, trae lo más reciente." }
        }
    }
};

const createRecordTool: FunctionDeclaration = {
    name: "createRecord",
    description: "Crea registros nuevos (Solo Compradores por ahora).",
    parameters: {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, description: "Solo soporta 'buyer'." },
            dataJSON: { type: Type.STRING, description: "JSON string con los datos (name, address son obligatorios)." }
        },
        required: ["type", "dataJSON"]
    }
};

const listDocumentsTool: FunctionDeclaration = {
    name: "listDocuments",
    description: "Lista detallada de documentos específicos generados en el sistema.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            filter: { type: Type.STRING, description: "Filtro opcional (ej: 'invoice', 'weight', 'porte')." }
        }
    }
};

// --- AGENT IMPLEMENTATION ---

export class LogisticsAgent {
    private chatSession: Chat | undefined;

    constructor() {
    }

    async startChat() {
        const key = getApiKey();
        
        if (!key) {
            // Retornamos null para indicar que falta la key
            return null; 
        }
        
        if (!ai) {
             try {
                ai = new GoogleGenAI({ apiKey: key });
             } catch (e) {
                 console.error("Error initializing Gemini:", e);
                 return null;
             }
        }

        this.chatSession = ai.chats.create({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: `Eres el Gerente de Operaciones y Trazabilidad de Dizano/Proben.
                
                **TU OBJETIVO:** Responder con precisión absoluta sobre el estado de contratos, partidas, logística y documentación.
                
                **ACCESO A DATOS (VISIÓN TOTAL):**
                Usas la herramienta 'listAllPartidas' para ver la "Super Tabla" de datos.
                Esta tabla contiene CADA detalle: 
                - Contratos (Padre) -> Partidas (Hijos)
                - Logística (Naviera, Booking, Contenedor, Cut Off, ETD)
                - Empaque (Cálculo de faltantes: Sacos, Tarimas, etc.)
                - **Documentos Generados:** Si existe un PDF (Invoice, Peso, Calidad, Porte), APARECERÁ en el campo 'documentos_encontrados'.

                **REGLAS DE INTERPRETACIÓN INTELIGENTE:**
                1. **Búsqueda Difusa:** Si el usuario dice "Partida 1" o "Contrato 1", busca en los campos 'id_corto' o 'tokens_busqueda'. No esperes coincidencia exacta de texto.
                2. **Jerarquía:** Entiende que una Partida pertenece a un Contrato. Si preguntan por el contrato de la partida 1, mira los datos del padre en esa fila.
                3. **IDs:** NUNCA muestres IDs técnicos (ej: "65a4s6d5..."). Usa los números legibles (ej: "11/988/1").
                4. **Precios:** Siempre formato moneda ($150.00).
                5. **Formato:** Usa saltos de línea y listas para que sea fácil de leer. No abuses de las negritas (**).

                **DOCUMENTOS:**
                Si te preguntan "¿Qué documentos hay?", lista lo que veas en el campo 'documentos_encontrados' de la herramienta. Tienes acceso a: Invoices, Cartas de Porte, Certificados de Peso/Calidad, Listas de Empaque e Instrucciones de Pago.
                `,
                tools: [{
                    functionDeclarations: [
                        listAllPartidasTool,
                        createRecordTool,
                        listDocumentsTool
                    ]
                }]
            }
        });
        return "READY";
    }

    async sendMessage(message: string): Promise<string> {
        const initStatus = await this.startChat();
        
        if (initStatus === null) {
             throw new Error("MISSING_API_KEY");
        }
        
        if (!this.chatSession) return "Error iniciando sesión de chat.";

        try {
            let result = await this.chatSession.sendMessage({ message });
            let functionCalls = result.functionCalls;

            while (functionCalls && functionCalls.length > 0) {
                const functionCall = functionCalls[0];
                const { name, args } = functionCall;
                let toolResult;

                console.log(`[AI Ops] Executing: ${name}`, args);

                try {
                    // --- LIST ALL PARTIDAS (MASTER DATA FLATTENING) ---
                    if (name === "listAllPartidas") {
                        const dbContracts = dbService.getService<Contract>();
                        const dbCerts = dbService.getService<Certificate>();
                        
                        const [contracts, certificates] = await Promise.all([
                            dbContracts.getAll('contracts'),
                            dbCerts.getAll('certificates')
                        ]);

                        const flatData: any[] = [];

                        contracts.forEach(c => {
                            if (c.isTerminated) return;
                            
                            // Identificadores Cortos
                            const contractNo = c.contractNumber || "S/N";
                            const contractShort = contractNo.replace(/[^0-9]/g, ''); // "SPGT-1" -> "1"
                            const prefix = c.company === 'dizano' ? '11/988/' : '11/44360/';

                            // Datos del Contrato (Padre)
                            const activeCerts: string[] = [];
                            if (c.certifications?.rainforest) activeCerts.push("Rainforest");
                            if (c.certifications?.organic) activeCerts.push("Orgánico");
                            if (c.certifications?.fairtrade) activeCerts.push("Fairtrade");
                            if (c.certifications?.eudr) activeCerts.push("EUDR");
                            
                            const contractBase = {
                                tipo: "CONTRATO",
                                contrato_numero: contractNo,
                                id_corto_contrato: contractShort,
                                cliente: c.buyer,
                                tipo_cafe: c.coffeeType || "N/A",
                                diferencial: c.differential ? `$${c.differential}` : "N/A",
                                cosecha: c.harvestYear || "N/A",
                                certificaciones_contrato: activeCerts.length > 0 ? activeCerts.join(", ") : "Ninguna",
                                mes_embarque: c.shipmentMonth || "No indicado",
                                posicion_mercado: c.marketMonth || "No indicado",
                                fecha_venta: c.saleDate || "N/A",
                                
                                // Búsqueda de documentos a nivel contrato
                                documentos_contrato: certificates.filter(cert => 
                                    cert.contractNo === contractNo || 
                                    (cert.type === 'payment' && cert.contractNo === contractNo) ||
                                    (cert.type === 'invoice' && cert.contractNo === contractNo)
                                ).map(d => `${d.type.toUpperCase()} #${d.certificateNumber || d.invoiceNo || 'BORRADOR'}`).join(', ')
                            };

                            // Si no tiene partidas, insertar registro solo de contrato
                            if (!c.partidas || c.partidas.length === 0) {
                                flatData.push({
                                    ...contractBase,
                                    estado: "Sin partidas asignadas",
                                    tokens_busqueda: [contractNo, `contrato ${contractNo}`, `contrato ${contractShort}`, c.buyer.toLowerCase()].join('|')
                                });
                            } else {
                                // Procesar Partidas (Hijos)
                                c.partidas.forEach(p => {
                                    if (!p) return;
                                    
                                    const partidaFull = prefix + p.partidaNo;
                                    const partidaShort = p.partidaNo; // "1"

                                    // Documentos de esta partida (Cruce por Contenedor, PartidaNo o Referencia)
                                    const docsPartida = certificates.filter(cert => {
                                        // Match por Contenedor
                                        if (p.containerNo && cert.containers?.some(cont => cont.containerNo === p.containerNo)) return true;
                                        // Match por Número de Partida en items
                                        if (cert.packages?.some(pkg => pkg.partidaNo === p.partidaNo || pkg.partidaNo === partidaFull)) return true;
                                        // Match en Carta de Porte (Observaciones suele tener la partida)
                                        if (cert.type === 'porte' && cert.observations && (cert.observations.includes(p.partidaNo) || cert.observations.includes(partidaFull))) return true;
                                        // Match por Booking
                                        if (p.booking && cert.billOfLadingNo === p.booking) return true; // A veces usan booking como ref
                                        return false;
                                    });

                                    const docsList = docsPartida.map(d => {
                                        let name = d.type.toUpperCase();
                                        if (name === 'WEIGHT') name = 'CERT. PESO';
                                        if (name === 'QUALITY') name = 'CERT. CALIDAD';
                                        if (name === 'PACKING') name = 'LISTA EMPAQUE';
                                        if (name === 'PORTE') name = 'CARTA DE PORTE';
                                        if (name === 'INVOICE') name = 'FACTURA';
                                        return `${name} ${d.certificateNumber || d.invoiceNo || '(Borrador)'}`;
                                    }).join(', ');

                                    // Cálculo de Empaque
                                    const qty = Number(p.numBultos || 0);
                                    let empaqueStatus = "PENDIENTE";
                                    if (qty > 0) {
                                        const pkgType = (p.packageType === 'Otro' ? p.customPackageType : p.packageType) || '';
                                        // Simple logic matching UI
                                        const needsPallets = pkgType.includes('Big Bag');
                                        let missing = [];
                                        
                                        // Check recorded vs required
                                        if (p.packagingRecords && p.packagingRecords.length > 0) {
                                            p.packagingRecords.forEach(r => {
                                                if (r.purchased < r.required) missing.push(r.itemName);
                                            });
                                        } else {
                                            // Default assumption if no records: Nothing bought yet
                                            missing.push(pkgType);
                                            if (needsPallets) missing.push("Tarimas");
                                        }
                                        
                                        if (missing.length === 0) empaqueStatus = "COMPLETO";
                                        else empaqueStatus = `FALTA: ${missing.join(', ')}`;
                                    }

                                    flatData.push({
                                        ...contractBase, // Datos heredados
                                        
                                        tipo: "PARTIDA",
                                        identificador_corto: partidaShort, // "1"
                                        partida_completa: partidaFull, // "11/988/1"
                                        
                                        // Datos Partida
                                        bultos: p.numBultos,
                                        empaque_tipo: p.packageType,
                                        estado_empaque_materiales: empaqueStatus,
                                        peso_kg: p.pesoKg,
                                        peso_qqs: p.pesoQqs || (Number(p.pesoKg)/46).toFixed(2),
                                        precio_final: `$${Number(p.finalPrice || 0).toFixed(2)}`,
                                        fijacion: p.fijacion ? `+${p.fijacion}` : "0",
                                        
                                        // Logística
                                        naviera: p.naviera === 'Otro' ? p.customNaviera : p.naviera || "Pendiente",
                                        booking_ref: p.booking || "Pendiente",
                                        numero_contenedor: p.containerNo || "Pendiente",
                                        numero_marchamo: p.sealNo || "Pendiente",
                                        fecha_zarpe_etd: p.etd ? new Date(p.etd).toLocaleDateString('es-GT') : "Pendiente",
                                        fecha_cut_off_puerto: p.cutOffPort ? new Date(p.cutOffPort).toLocaleDateString('es-GT') : "Pendiente",
                                        destino_final: p.destino || "No indicado",
                                        
                                        // Documentos / Trámites
                                        permiso_embarque: p.permisoEmbarqueNo || "No ingresado",
                                        fitosanitario: p.fitosanitarioNo || "No ingresado",
                                        estado_marcas: p.marksStatus === 'confirmed' ? "Confirmadas" : p.marksStatus === 'sent' ? "Enviadas" : "Pendientes",
                                        texto_marcas: p.marks || "N/A",
                                        
                                        // CRÍTICO: Documentos Encontrados
                                        documentos_encontrados: docsList || "Ninguno generado aún",
                                        
                                        // Tokens para búsqueda difusa (Hack para que encuentre "Partida 1")
                                        tokens_busqueda: [
                                            partidaShort, // "1"
                                            `partida ${partidaShort}`, // "partida 1"
                                            `p${partidaShort}`,
                                            partidaFull, // "11/988/1"
                                            contractNo,
                                            `contrato ${contractShort}`,
                                            c.buyer.toLowerCase()
                                        ].join('|')
                                    });
                                });
                            }
                        });

                        // --- LOGICA DE FILTRADO INTELIGENTE ---
                        const queryRaw = (args.query as string || '').toLowerCase().trim();
                        
                        if (queryRaw) {
                            // Limpiar query: "partida 1" -> "1", "contrato spgt-1" -> "spgt-1"
                            // Eliminamos palabras comunes para buscar el "núcleo"
                            const queryCore = queryRaw.replace(/^(partida|contrato|contract|spgt|part)\s*/i, '').replace(/[^a-z0-9]/g, ''); // "1"

                            const filtered = flatData.filter(row => {
                                // 1. Búsqueda exacta en ID corto (La más importante para "Partida 1")
                                if (row.identificador_corto === queryCore) return true;
                                if (row.id_corto_contrato === queryCore) return true;
                                
                                // 2. Búsqueda en tokens preparados
                                if (row.tokens_busqueda && row.tokens_busqueda.toLowerCase().includes(queryRaw)) return true;
                                
                                // 3. Búsqueda general en texto
                                const jsonStr = JSON.stringify(row).toLowerCase();
                                return jsonStr.includes(queryRaw);
                            });

                            if (filtered.length > 0) {
                                toolResult = JSON.stringify(filtered);
                            } else {
                                // Fallback: Si no encuentra nada específico, devuelve todo (limitado) para que la IA razone
                                toolResult = JSON.stringify(flatData.slice(0, 20)); 
                                console.log("No exact match, returning top 20 rows for context.");
                            }
                        } else {
                            toolResult = JSON.stringify(flatData);
                        }
                    }

                    // --- LIST DOCUMENTS (SPECIFIC) ---
                    else if (name === "listDocuments") {
                        const dbCerts = dbService.getService<Certificate>();
                        const allDocs = await dbCerts.getAll('certificates');
                        // Mapeo simple para la IA
                        const docsMapped = allDocs.map(d => ({
                            tipo: d.type,
                            numero: d.certificateNumber || d.invoiceNo || "Borrador",
                            cliente: d.customerName || d.consignee,
                            fecha: d.certificateDate,
                            contrato_ref: d.contractNo
                        }));
                        toolResult = JSON.stringify(docsMapped);
                    }

                    // --- CREATE RECORD ---
                    else if (name === "createRecord") {
                        const type = args.type as string;
                        const dataStr = args.dataJSON as string;
                        let data;
                        try { data = JSON.parse(dataStr); } catch (e) { toolResult = "Error: JSON inválido."; }

                        if (data) {
                            if (!data.id) data.id = new Date().toISOString();
                            const db = dbService.getService<any>();
                            
                            if (type === 'buyer') {
                                if (!data.name || !data.address) {
                                    toolResult = "Error: Faltan datos. Nombre y Dirección son obligatorios.";
                                } else {
                                    await db.create('buyers', data);
                                    toolResult = `ÉXITO: Comprador ${data.name} creado correctamente.`;
                                }
                            } else {
                                toolResult = "Tipo no soportado.";
                            }
                        }
                    }

                } catch (e: any) {
                    console.error(e);
                    toolResult = `Error interno: ${e.message}`;
                }

                result = await this.chatSession!.sendMessage({
                    message: [{
                        functionResponse: {
                            name: name,
                            response: { result: toolResult }
                        }
                    }]
                });
                
                functionCalls = result.functionCalls;
            }

            return result.text || "Listo.";
        } catch (error) {
            console.error("AI Error:", error);
            return "Tuve un problema técnico conectando con el cerebro de la IA. Por favor intenta de nuevo.";
        }
    }
}

export const aiAgent = new LogisticsAgent();