import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ubicación del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const videosDownloadPath = path.join(__dirname, '../../input');
export const tempPath = path.join(__dirname, '../generator/temp');