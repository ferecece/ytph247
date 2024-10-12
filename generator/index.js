import fs from 'fs'
import path from 'path';
import loadPlugins from './plugins/index.js';
import { fileURLToPath } from 'url';
import { debugMode } from '../config/serverConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const soundDir = path.join(__dirname, 'resources', 'sounds');
const musicDir = path.join(__dirname, 'resources', 'music');
const overlayDir = path.join(__dirname, 'resources', 'overlays');

const plugins = await loadPlugins();
const sounds = (await fs.promises.readdir(soundDir)).map(item => path.join(soundDir, item));
const musics = (await fs.promises.readdir(musicDir)).map(item => path.join(musicDir, item));
const overlays = (await fs.promises.readdir(overlayDir)).map(item => path.join(overlayDir, item));

const generateClip = async (source, quotes, RNG) => {
    const plugin = plugins[RNG.int(0, plugins.length - 1)];
    if (debugMode) console.log(`Applying ${plugin.name}...`);
    const clipBuffer = await plugin.execute(source, [quotes, sounds, musics, overlays], RNG);
    return clipBuffer;
};

export default generateClip;
