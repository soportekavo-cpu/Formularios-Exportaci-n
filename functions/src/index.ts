
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import { runAgent } from './agent/gemini';
import { toolsImplementation } from './agent/tools';

admin.initializeApp();

// Definimos el secreto que creaste en Google Cloud Secret Manager
const apiKey = defineSecret('VITE_GEMINI_API_KEY');

// 1. CHAT BOT INTERACTIVO (Google Chat Webhook)
export const onGoogleChat = functions.runWith({ 
    secrets: [apiKey], // Inyectamos el secreto
    timeoutSeconds: 60 
}).https.onRequest(async (req, res) => {
  if (req.method === 'GET' || !req.body.message) {
    res.send('Health check OK');
    return;
  }

  const userMessage = req.body.message.text;

  try {
    // Pasamos el valor del secreto (.value()) al agente
    const replyText = await runAgent(userMessage, apiKey.value());
    
    res.json({
      text: replyText
    });
  } catch (error) {
    console.error('Error en agente:', error);
    res.json({
      text: 'Lo siento, tuve un problema procesando tu solicitud. Por favor revisa los logs.'
    });
  }
});

// 2. AGENTE PROACTIVO (Cron Job Diario)
export const dailyLogisticsCheck = functions.pubsub.schedule('0 7 * * *').timeZone('America/Guatemala').onRun(async (context) => {
    const rawData = await toolsImplementation.listUpcomingShipments({ days: 5 });
    
    if (rawData.includes("No encontré")) return null;

    const shipments = JSON.parse(rawData);
    const criticalAlerts = shipments.filter((s: any) => {
        if (Array.isArray(s.packagingStatus)) {
            return s.packagingStatus.some((p: any) => p.purchased < p.required);
        }
        return false;
    });

    if (criticalAlerts.length > 0) {
        const WEBHOOK_URL = process.env.CHAT_WEBHOOK_URL; 
        
        if (WEBHOOK_URL) {
            const fetch = (await import('node-fetch')).default;
            const text = `🚨 *Alerta Diaria de Logística* 🚨\n\nHola Yony, he detectado ${criticalAlerts.length} embarques críticos próximos al Cut Off con faltantes de empaque:\n\n` +
                         criticalAlerts.map((s: any) => `• Contrato ${s.contract} (${s.partida}): Cut Off ${s.date}. Faltan materiales.`).join('\n') +
                         `\n\n¿Quieres que genere las órdenes de compra o marque algo como listo?`;

            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
        }
    }
    return null;
});
