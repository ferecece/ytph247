// /client/clientCommands.js

import net from 'net';
import { controlPort, serverHost } from '../config/serverConfig.js';

export function addVideoToQueue(videoPath) {
    const client = new net.Socket();

    client.connect(controlPort, serverHost, () => {
        //console.log(`Connected to control server at ${serverHost}:${controlPort}`);
        client.write(`ADD ${videoPath}`);
        client.end();
    });

    client.on('error', (err) => {
        console.error('Client error:', err.message);
    });
}
