
import React, { useState, useRef, useEffect } from 'react';
import { aiAgent } from '../services/aiAgent';
import { ChatBubbleIcon, XMarkIcon, SendIcon, SparklesIcon } from './Icons';

interface Message {
    role: 'user' | 'model';
    text: string;
}

const TraceabilityAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initial greeting
        if (messages.length === 0) {
            setMessages([{ role: 'model', text: '¡Hola! Soy tu Asistente de Trazabilidad. ¿En qué puedo ayudarte hoy? (Ej: "Busca el contrato 105", "¿Tengo alertas pendientes?", "Crea un invoice")' }]);
        }
    }, []);

    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const response = await aiAgent.sendMessage(userMsg);
            setMessages(prev => [...prev, { role: 'model', text: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: 'Lo siento, tuve un problema de conexión.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessageText = (text: string) => {
        const lines = text.split('\n');
        return lines.map((line, idx) => {
            // Basic Markdown parsing
            let formattedLine: React.ReactNode = line;
            
            // Bold: **text** -> <strong>text</strong>
            const parts = line.split(/(\*\*.*?\*\*)/g);
            if (parts.length > 1) {
                formattedLine = parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                });
            }

            // Bullet points
            if (line.trim().startsWith('* ')) {
                return <li key={idx} className="ml-4 list-disc">{formattedLine}</li>;
            }
            
            return <p key={idx} className="min-h-[1.2em]">{formattedLine}</p>;
        });
    };

    return (
        <>
            {/* Floating Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="fixed bottom-6 right-6 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center"
                title="Asistente IA"
            >
                {isOpen ? <XMarkIcon className="w-6 h-6" /> : <ChatBubbleIcon className="w-6 h-6" />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-card border border-border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10">
                    {/* Header */}
                    <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
                        <div className="bg-white/20 p-1.5 rounded-full">
                            <SparklesIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Asistente Virtual</h3>
                            <p className="text-xs opacity-80">Conectado a tu base de datos local</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div 
                                    className={`max-w-[85%] p-3 rounded-lg text-sm ${
                                        msg.role === 'user' 
                                        ? 'bg-primary text-primary-foreground rounded-br-none' 
                                        : 'bg-muted/50 text-foreground border border-border rounded-bl-none'
                                    }`}
                                >
                                    {renderMessageText(msg.text)}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-muted/50 p-3 rounded-lg rounded-bl-none flex gap-1 items-center">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t bg-card flex gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Escribe tu consulta..."
                            className="flex-1 bg-muted/30 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default TraceabilityAssistant;
