import client from './bot/index.js';
import net from "net";
import random from "random";
import { deleteSource, getRandomSource } from "./database/services/source.service.js";
import { getAllQuotes } from "./database/services/quote.service.js";
import { downloadVideo } from "./youtube/index.js";
import generateClip from "./generator/index.js";
import { cleanUp } from "./generator/utils/misc.js";
import { getVideoInfo } from "./youtube/index.js";
import { clips } from "./config/streamConfig.js";
import { tempPath } from "./config/pathConfig.js";
import path from "path";
import fs from "fs";
import { getTwitchUsername } from "./database/services/user.service.js";
import os from "os";

let pipePath;
let currentSocket = null;
let bufferQueue = []; // Cola para almacenar los buffers generados
let generatingClips = false;

if (os.platform() === "win32") {
  // Windows named pipe path
  pipePath = "\\\\.\\pipe\\twitch_pipe";
} else {
  // Linux named pipe path
  pipePath = "/tmp/twitch_pipe";
  if (fs.existsSync(pipePath)) fs.unlinkSync(pipePath);
}

// Función para enviar el buffer al socket o almacenarlo en la cola si el socket está desconectado
const sendBuffer = (socket, buffer) => {
  console.log(`Buffer generado con tamaño ${buffer.length}`);
  if (socket && !socket.destroyed) {
    console.log(`Enviando buffer con tamaño ${buffer.length}`);
    socket.write(buffer);
  } else {
    console.log('Cliente desconectado. Guardando buffer en la cola.');
    bufferQueue.push(buffer);
  }
};

// Función para enviar los buffers pendientes al cliente reconectado
const sendQueuedBuffers = (socket) => {
  while (bufferQueue.length > 0) {
    const buffer = bufferQueue.shift(); // Elimina y obtiene el primer buffer de la cola
    sendBuffer(socket, buffer);
  }
};

// Función para generar clips continuamente
const startClipGeneration = async () => {
  if (generatingClips) return;
  
  generatingClips = true;
  try {
    while (true) {
      const source = await getRandomSource();
      const RNG = random.clone(Date.now().toString());
      const quotes = await getAllQuotes();
      const sourceVideoInfo = await getVideoInfo(source.videoId);
      const sourceVideo = await downloadVideo(source);
      const username = await getTwitchUsername(source.user.userId);
      const textOverlay = `Video Original: ${
        sourceVideoInfo?.videoDetails?.title ??
        "Hay problemas para obtener información del video"
      }\nEnviado por: ${username}`;
      const textFilePath = path.join(tempPath, "overlay.txt");
      await fs.promises.writeFile(textFilePath, textOverlay, "utf8");

      // Escapar la ruta del archivo de texto
      const escapedTextFilePath = textFilePath
        .replace(/\\/g, "\\\\")
        .replace(/:/g, "\\:");

      for (let i = 1; i <= clips; i++) {
        const clipBuffer = await generateClip(
          {
            textOverlay: escapedTextFilePath,
            path: sourceVideo.filename,
          },
          quotes,
          RNG
        );
        bufferQueue.push(clipBuffer); // Agrega cada clip a la cola

        // Si hay un cliente conectado, envía los buffers inmediatamente
        if (currentSocket && !currentSocket.destroyed) {
          sendQueuedBuffers(currentSocket);
        }
      }

      await fs.promises.unlink(textFilePath);
    }
  } catch (e) {
    console.error('-------------------------');
    console.error(e);
    console.error('-------------------------');
    if (e.videoId) await deleteSource(e.videoId);
  } finally {
    generatingClips = false;
  }
};

// Iniciar la generación de clips al arrancar el servidor
startClipGeneration();

const server = net.createServer((socket) => {
  console.log("Cliente conectado al pipe.");
  currentSocket = socket;

  // Al conectar, enviar todos los buffers pendientes
  sendQueuedBuffers(socket);

  socket.on("end", () => {
    console.log("Cliente desconectado.");
    currentSocket = null;
  });

  socket.on("error", (err) => {
    console.error(`Socket error: ${err.message}`);
    currentSocket = null;
  });
});

server.listen(pipePath, () => {
  console.log(`Pipe creado y escuchando en ${pipePath}`);
});

const closeServer = () => {
  if (server) {
    server.close(() => {
      console.log("Servidor cerrado.");
    });
  }
};

const handleTermination = () => {
  closeServer();
  process.exit();
};

process.on("SIGINT", handleTermination);
process.on("SIGTERM", handleTermination);

// Manejar otros eventos si es necesario
process.on("uncaughtException", (err) => {
  console.error(err);
  closeServer();
  process.exit(1);
});
