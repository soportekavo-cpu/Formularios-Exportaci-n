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
                systemInstruction: `Eres el Gerente de Operaciones y Trazabilidad de Dizano/Proben.`,
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
        // Disabled logic
        return "El asistente de IA ha sido desactivado.";
    }
}

export const aiAgent = new LogisticsAgent();