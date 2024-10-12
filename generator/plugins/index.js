import path from 'path';
import { readdir } from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function loadPlugins() {
  const pluginsDirectory = path.join(__dirname);
  const pluginFolders = await readdir(pluginsDirectory, { withFileTypes: true });

  const pluginsList = await Promise.all(
    pluginFolders
      .filter(dirent => dirent.isDirectory()) // Filtra solo las carpetas
      .map(async folder => {
        const { execute } = await import(`./${folder.name}/index.js`);
        return { name: folder.name, execute };
      })
  );

  return pluginsList;
}
