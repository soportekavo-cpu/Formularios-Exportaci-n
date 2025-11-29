
import React, { useRef, useState, useEffect } from 'react';
import { TrashIcon } from './Icons';

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  initialValue?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onChange, initialValue }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialValue);

  // Initialize canvas with correct DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Increase ratio to 4 to ensure high fidelity on Retina screens and prevent pixelation when resized
      const ratio = Math.max(window.devicePixelRatio || 1, 4); 
      const rect = canvas.getBoundingClientRect();
      
      // Set actual size in memory (scaled to account for extra pixel density)
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      
      // Normalize coordinate system to use css pixels
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
        // Default style
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3; // Slightly thicker for visibility when scaled down
        
        // Redraw initial value if exists
        if (initialValue) {
          const img = new Image();
          img.src = initialValue;
          img.onload = () => {
             // Draw image to fit the CSS size
             ctx.drawImage(img, 0, 0, rect.width, rect.height);
          };
        }
      }
    }
  }, [initialValue]);

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
      };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const { x, y } = getCoords(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const { x, y } = getCoords(e);
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasSignature(true);
    }
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
        setIsDrawing(false);
        // Export high-res image
        // We export the full resolution canvas
        onChange(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      // Clear using the scaled dimensions
      const ratio = Math.max(window.devicePixelRatio || 1, 4);
      ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
      setHasSignature(false);
      onChange(null);
    }
  };

  return (
    <div className="border border-input rounded-md p-2 bg-white">
        <p className="text-xs text-muted-foreground mb-2">Firma aquí (Usa el Apple Pencil o dedo)</p>
        <div className="relative border border-dashed border-gray-300 rounded bg-white touch-none h-[180px] w-full overflow-hidden">
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', touchAction: 'none' }}
                className="cursor-crosshair block"
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
            />
            {hasSignature && (
                 <button
                    type="button"
                    onClick={clear}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded shadow text-destructive hover:bg-destructive/10 border border-gray-200 transition-colors z-10"
                    title="Limpiar firma"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            )}
        </div>
    </div>
  );
};

export default SignaturePad;
