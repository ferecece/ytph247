import {
  renderResolution,
  streamFramerate,
  minClipLength,
  maxClipLength,
} from "../../../config/streamConfig.js";

import { ffmpegWithBufferInput } from "../../utils/ffmpeg.js";
import { extractFrames } from "../../utils/media.js";
import { getVideoDuration, trimVideo } from "../../utils/media.js";
import { spawn } from "child_process";

export async function execute(source, resources, RNG) {
  const [quotes, sounds, musics, overlays] = resources;
  const videoDuration = await getVideoDuration(source.path);
  const clipDuration = RNG.float(minClipLength, maxClipLength);
  const startTime = RNG.float(0, videoDuration - clipDuration);
  const tempBuffer = await trimVideo(source, startTime, clipDuration);

  const frameBuffers = await extractFrames(tempBuffer);
  const randomizedFramesBuffer = shuffle(frameBuffers, RNG);

  const processedFramesBuffer = await applyHueEffectToFrames(
    randomizedFramesBuffer
  );

  const concatenatedVideoBuffer = await assembleFramesIntoVideo(
    processedFramesBuffer
  );

  const randomSong = musics[RNG.int(0, musics.length - 1)];

  const finalVideoBuffer = await applyAudioAndFinalEffects(
    concatenatedVideoBuffer,
    randomSong
  );

  return finalVideoBuffer;
}

function shuffle(frames, RNG) {
  const shuffledFrames = [...frames];

  for (let i = shuffledFrames.length - 1; i > 0; i--) {
    const j = RNG.int(0, i);
    [shuffledFrames[i], shuffledFrames[j]] = [
      shuffledFrames[j],
      shuffledFrames[i],
    ];
  }

  return shuffledFrames;
}

function applyHueEffectToFrames(frames) {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn("/usr/lib/jellyfin-ffmpeg/ffmpeg", [
      "-f",
      "image2pipe",
      "-framerate",
      streamFramerate,
      "-i",
      "pipe:0",
      "-vf",
      "hue='H=PI*t: s=sin(PI*t)+1.5: enable=between(t,0,10)'",
      "-f",
      "image2pipe",
      "-vcodec",
      "png",
      "pipe:1",
    ]);

    let outputBuffer = Buffer.alloc(0);

    // Leer frames procesados desde stdout
    ffmpegProcess.stdout.on("data", (chunk) => {
      outputBuffer = Buffer.concat([outputBuffer, chunk]);
    });

    // Capturar cualquier error de stderr
    ffmpegProcess.stderr.on("data", (data) => {
    });

    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        // Dividir el buffer de salida en los frames individuales
        const frameSize = outputBuffer.length / frames.length;
        const processedFrames = [];
        for (let i = 0; i < frames.length; i++) {
          processedFrames.push(
            outputBuffer.slice(i * frameSize, (i + 1) * frameSize)
          );
        }
        resolve(processedFrames);
      } else {
        reject(new Error("Error processing frames with FFmpeg"));
      }
    });

    // Escribir todos los frames en stdin
    for (const frame of frames) {
      ffmpegProcess.stdin.write(frame);
    }
    ffmpegProcess.stdin.end();
  });
}

async function applyAudioAndFinalEffects(videoBuffer, audioPath) {
  return await ffmpegWithBufferInput([
    "-i",
    "pipe:0",
    "-i",
    audioPath,
    "-filter_complex",
    "[0:v]setpts=0.75*PTS[f];[0:v]setpts=0.5*PTS,reverse[fr];[f][fr]concat=n=2:v=1:a=0,format=nv12[v]",
    "-map",
    "[v]",
    "-map",
    "1:a",
    "-shortest",
    "-r",
    streamFramerate,
    "-c:a",
    "libfdk_aac",
    "-b:a",
    "128k",
    "-profile:a",
    "aac_low",
    "-channel_layout",
    "stereo",
    "-ac",
    "2",
    "-ar",
    "44100",
    "-sample_fmt",
    "s16",
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-profile:v",
    "main",
    "-level:v",
    "4.1",
    "-f",
    "mpegts",
    "-y",
    "pipe:1",
  ], videoBuffer);
}

async function assembleFramesIntoVideo(frames) {
  return await ffmpegWithBufferInput([
    "-f",
    "image2pipe",
    "-framerate",
    streamFramerate,
    "-i",
    "pipe:0",
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-profile:v",
    "main",
    "-level:v",
    "4.1",
    "-pix_fmt",
    "yuv420p",
    "-f",
    "mpegts",
    "-y",
    "pipe:1",
  ], Buffer.concat(frames));
}
