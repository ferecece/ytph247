import fs from 'fs';
import path from 'path';
import random from 'random'
import { videosDownloadPath, tempPath } from '../../config/pathConfig.js';
import seedrandom from 'seedrandom'

export const fileExists = async path => !!(await fs.promises.stat(path).catch(e => false));
const cleanDirectory = async dirPath => {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });

    for (const file of files) {
        const filePath = path.join(dirPath, file.name);

        if (file.isDirectory()) {
            await cleanDirectory(filePath); // Recursively clean subdirectories
            await fs.promises.rmdir(filePath); // Remove the empty directory
        } else if (file.isFile() && file.name !== '.gitkeep') {
            await fs.promises.rm(filePath);
        }
    }
};

export const cleanUp = async source => {
    try {
        await cleanDirectory(tempPath); // Clean tempPath
        //await cleanDirectory(videosDownloadPath); // Clean videosDownloadPath
        /*
        const videoFiles = await fs.promises.readdir(videosDownloadPath);
        for (const v of videoFiles) {
            const filePath = path.join(videosDownloadPath, v);
            const exists = await fileExists(filePath);
            const [videoId] = v.split('.');
            if (source.videoId !== videoId && exists && v !== '.gitkeep') {
                await fs.promises.rm(filePath);
            }
        }*/
    } catch (e) {
        console.error(e);
        console.warn('ERROR al hacer cleanup');
    }
};


export const setRNG =(seed) => {
    random.use(seedrandom(seed));
}