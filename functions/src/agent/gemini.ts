
import { GoogleGenAI } from '@google/genai';
import { toolsDeclarations, toolsImplementation } from './tools';

const SYSTEM_INSTRUCTION = `
Eres "LogiBot", un asistente experto en logística de exportación de café para las empresas Dizano y Proben.
Tu trabajo es ayudar a Yony Roquel a gestionar sus contratos, embarques y documentos.

Tus responsabilidades:
1. Monitorear fechas críticas (Cut Off de Puerto, Zarpes).
2. Gestionar el inventario de empaque (Sacos, GrainPro, Big Bags).
3. Actualizar datos en el sistema cuando el usuario te lo pida verbalmente.

Reglas de comportamiento:
- Sé proactivo. Si ves una fecha cercana, pregunta por los requisitos (marcas, empaque).
- Sé conciso y profesional, pero amable.
- Si el usuario te pide hacer algo (ej: "marca como comprado"), SIEMPRE usa la herramienta correspondiente.
- Si no tienes información suficiente para llamar a una herramienta, pregunta al usuario los detalles que faltan.
- Los números de partida suelen ser como "11/988/1". Si el usuario dice "partida 1", asume el formato completo si tienes el contexto del contrato.
`;

export async function runAgent(userMessage: string, apiKey: string) {
  if (!apiKey) {
      throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{
              // @ts-ignore
              functionDeclarations: toolsDeclarations
          }]
      },
      history: [
          { role: 'model', parts: [{ text: 'Entendido. Estoy listo para ayudarte con la gestión de exportaciones.' }] }
      ]
  });

  const response = await chat.sendMessage({ message: userMessage });
  const functionCalls = response.functionCalls;

  if (functionCalls && functionCalls.length > 0) {
      const functionCall = functionCalls[0];
      const { name, args } = functionCall;
      let toolResult;
      
      if (name === 'listUpcomingShipments') {
          toolResult = await toolsImplementation.listUpcomingShipments(args as any);
      } else if (name === 'updatePackagingStatus') {
          toolResult = await toolsImplementation.updatePackagingStatus(args as any);
      } else if (name === 'updateContractDestination') {
          toolResult = await toolsImplementation.updateContractDestination(args as any);
      } else {
          toolResult = "Error: Herramienta no encontrada.";
      }

      const finalResult = await chat.sendMessage({
          message: [{
              functionResponse: {
                  name: name,
                  response: { result: toolResult }
              }
          }]
      });
      
      return finalResult.text;
  }

  return response.text;
}
