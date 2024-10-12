import path from 'path';
import { videosDownloadPath } from '../config/pathConfig.js';
import fs from 'fs'
import ytdl from "@distube/ytdl-core";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/*
{
    url: 'https://www.youtube.com/watch?v=GfHGVY7rhk0',
    videoId: 'GfHGVY7rhk0',
    videoTitle: 'AGUANTAAAA-ORIGINAL',
    userid: '586116059',
    username: 'patotel_'
  }
*/

const agent = ytdl.createAgent(JSON.parse(fs.readFileSync(path.join(__dirname, 'cookies.json'))));

export const downloadVideo = ({ videoId }) => new Promise((resolve, reject) => {
        const filename = path.join(videosDownloadPath, `${videoId}.mp4`);
        if (fs.existsSync(filename)) {
            resolve({
                videoId,
                filename: filename,
                usedCount: 0
            });
            return;
        }
        const writeStream = fs.createWriteStream(filename)
        writeStream.on('close', () => {
            resolve({
                videoId,
                filename,
                usedCount: 0
            })
        })
        writeStream.on('error', e => {
            fs.unlinkSync(filename);
            reject({
                message: e.message,
                videoId
            });
        });
        const dl = ytdl(videoId, {
            quality: 'lowestvideo',
            filter: 'audioandvideo',
            agent: agent
        });
        
        dl.pipe(writeStream)
        dl.on('error', e => {
            if (fs.existsSync(filename)) fs.unlinkSync(filename);
            reject({
                message: e.message,
                videoId
            });
        })
})

export const getVideoInfo = async(videoUrl) => {
    try {
        return await ytdl.getBasicInfo(videoUrl, {
            agent
        });
    }
    catch (e) {
        console.error(e);
        return null;
    }
}