import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

const distPath = join(__dirname, 'dist');

// Check if dist exists to provide better error logs in Cloud Run
if (!existsSync(distPath)) {
  console.error('ERROR CRITICO: La carpeta "dist" no existe. El build de Vite falló o no se ejecutó.');
}

// Serve static files from the dist directory
app.use(express.static(distPath));

// Handle client-side routing, return all requests to index.html
app.get('*', (req, res) => {
  const indexPath = join(distPath, 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Error: index.html no encontrado. Asegúrate de que el build se completó.');
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
  console.log(`Sirviendo archivos desde: ${distPath}`);
});