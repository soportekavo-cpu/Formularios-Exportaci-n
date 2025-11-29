import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

const distPath = join(__dirname, 'dist');

// Check if dist exists to provide better error logs in Cloud Run
if (!existsSync(distPath)) {
  console.error('ERROR CRITICO: La carpeta "dist" no existe. El build de Vite falló o no se ejecutó.');
}

// Serve static files from the dist directory, but IGNORE index.html so we can serve it manually
app.use(express.static(distPath, { index: false }));

// Handle client-side routing, return all requests to index.html with ENV injection
app.get('*', (req, res) => {
  const indexPath = join(distPath, 'index.html');
  if (existsSync(indexPath)) {
    try {
      let html = readFileSync(indexPath, 'utf8');
      
      // Inyectar variables de entorno en tiempo de ejecución (Runtime)
      // Esto permite que el secreto de App Hosting llegue al navegador
      const apiKey = process.env.VITE_GEMINI_API_KEY || '';
      
      // Sanitizar para evitar XSS simple (aunque la key es alfanumérica)
      const safeApiKey = apiKey.replace(/"/g, '\\"');

      const envScript = `
        <script>
          window.env = {
            VITE_GEMINI_API_KEY: "${safeApiKey}"
          };
        </script>
      `;
      
      // Insertar el script antes del cierre del head
      html = html.replace('</head>', `${envScript}</head>`);
      
      res.send(html);
    } catch (err) {
      console.error("Error leyendo/inyectando index.html:", err);
      res.status(500).send("Error interno del servidor al cargar la aplicación.");
    }
  } else {
    res.status(404).send('Error: index.html no encontrado. Asegúrate de que el build se completó.');
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
  console.log(`Sirviendo archivos desde: ${distPath}`);
});