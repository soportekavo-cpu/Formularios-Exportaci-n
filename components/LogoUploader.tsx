import React, { useRef } from 'react';
import { TrashIcon } from './Icons';

interface LogoUploaderProps {
  logo: string | null;
  setLogo: (logo: string | null) => void;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({ logo, setLogo }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
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

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {logo ? (
              <img src={logo} alt="Logo de la compañía" className="h-16 w-auto object-contain bg-gray-50 p-1 rounded border" />
            ) : (
              <div className="h-16 w-32 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500 border">
                Sin logo
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-800">Logo de la Compañía</h3>
              <p className="text-xs text-gray-500">Usado en las instrucciones de pago.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg"
              className="hidden"
            />
            <button
              type="button"
              onClick={handleUploadClick}
              className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              {logo ? 'Cambiar' : 'Subir logo'}
            </button>
            {logo && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                title="Eliminar logo"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t text-xs text-gray-600 bg-blue-50 p-2 rounded-md">
            <span className="font-semibold">Recomendaciones:</span> Para mejor calidad, usa un archivo PNG con fondo transparente y una altura de al menos 200px.
        </div>
    </div>
  );
};

export default LogoUploader;
