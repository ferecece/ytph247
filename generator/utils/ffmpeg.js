import { spawn } from "child_process";
import { debugMode } from "../../config/serverConfig.js";

const ffmpegPath =
  process.platform === "win32" ? "ffmpeg" : "/usr/lib/jellyfin-ffmpeg/ffmpeg";

export const ffmpeg = (args) => {
  let stderr = "";
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpegPath, args);
    let buffer = Buffer.alloc(0);

    ffmpegProcess.stdout.on("data", (data) => {
      buffer = Buffer.concat([buffer, data]);
    });
    ffmpegProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        resolve(buffer);
      } else {
        reject(new Error(stderr));
      }
    });
  });
};

export const ffmpegWithBufferInput = (args, bufferInput) => {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpegPath, args);

    let buffer = Buffer.alloc(0);

    ffmpegProcess.stdout.on("data", (data) => {
      buffer = Buffer.concat([buffer, data]);
    });

    let stderr = "";
    ffmpegProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffmpegProcess.on("close", (code) => {
      //if (debugMode) console.warn(stderr);
      if (code === 0) {
        resolve(buffer);
      } else {
        reject(new Error(stderr));
      }
    });

    ffmpegProcess.stdin.write(bufferInput);
    ffmpegProcess.stdin.end();
  });
};
