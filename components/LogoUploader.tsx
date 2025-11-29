
import React, { useRef, useState } from 'react';
import { TrashIcon } from './Icons';
import { uploadFileWithProgress } from '../services/uploadService';
import { ProgressBar } from './ProgressBar';

interface LogoUploaderProps {
  logo: string | null;
  setLogo: (logo: string | null) => void;
  company: 'dizano' | 'proben';
}

const LogoUploader: React.FC<LogoUploaderProps> = ({ logo, setLogo, company }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
        const path = `logos/${company}/${file.name}`;
        setIsUploading(true);
        setProgress(0);
        
        try {
            // Si está en producción, obtendremos la URL. En local, recibiremos base64 simulado.
            const attachment = await uploadFileWithProgress(file, path, (p) => setProgress(p));
            // Usamos attachment.url si existe (Storage), sino .data (Base64 legacy)
            const imageSrc = attachment.url || `data:${attachment.type};base64,${attachment.data}`;
            setLogo(imageSrc);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Error al subir el logo.");
        } finally {
            setIsUploading(false);
            setProgress(0);
        }
    } else {
        alert('Por favor, selecciona un archivo JPG o PNG.');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const isProben = company === 'proben';

  return (
    <div className="bg-card p-4 rounded-lg border">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-foreground">Logo de {isProben ? 'Proben, S.A.' : 'Dizano, S.A.'}</h3>
          <p className="text-sm text-muted-foreground">Usado en los encabezados de los documentos.</p>
        </div>
        <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg"
              className="hidden"
            />
            {isUploading ? (
                <div className="w-24">
                    <ProgressBar progress={progress} className="h-2" />
                </div>
            ) : (
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="rounded-md bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-secondary/80"
                >
                  {logo ? 'Cambiar' : 'Subir'}
                </button>
            )}
            
            {logo && !isUploading && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                title="Eliminar logo"
              >
                <TrashIcon />
              </button>
            )}
          </div>
      </div>
      <div className="mt-4 flex items-center gap-4">
          {logo ? (
            <img src={logo} alt="Logo de la compañía" className={`object-contain bg-muted/30 p-2 rounded border ${isProben ? 'h-20 w-40' : 'h-20 w-20'}`} />
          ) : (
            <div className={`bg-muted/30 rounded flex items-center justify-center text-sm text-muted-foreground border ${isProben ? 'h-20 w-40' : 'h-20 w-20'}`}>
              Sin logo
            </div>
          )}
          <p className="text-xs text-muted-foreground flex-1">
            <span className="font-semibold text-foreground">Recomendación:</span> {isProben 
              ? 'Usa un logo rectangular (PNG con fondo transparente).' 
              : 'Usa un logo cuadrado (PNG con fondo transparente y altura de 200px+).'}
          </p>
      </div>
    </div>
  );
};

export default LogoUploader;
