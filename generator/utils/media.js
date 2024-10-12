import {
  renderResolution,
  streamFramerate,
} from "../../config/streamConfig.js";
import ffprobe from "./ffprobe.js";
import { ffmpeg } from "./ffmpeg.js";

export const getVideoDuration = async (video) => {
  const args = [
    "-v",
    "error",
    "-of",
    "flat=s=_",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=duration",
    video,
  ];

  const stdout = await ffprobe(args);

  if (stdout) {
    const duration = /streams_stream_0_duration="([\d.]+)"/.exec(stdout);
    if (!duration) throw new TypeError(`No video length!`);
    return parseFloat(duration[1]);
  }
};

export const getAudioDuration = async (audio) => {
  const args = [
    "-i",
    audio,
    "-show_entries",
    "format=duration",
    "-v",
    "quiet",
    "-of",
    "csv=p=0",
  ];
  const stdout = await ffprobe(args);
  if (stdout) {
    return parseFloat(stdout);
  }
};

export const trimVideo = async (source, startTime, endTime) => {
  const args = [
    "-ss",
    startTime,
    "-i",
    source.path,
    "-t",
    endTime,
    "-map_metadata",
    "-1",
    "-vf",
    `drawtext=textfile='${source.textOverlay}':x=10:y=h-th-10:fontsize=h/30:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2`,
    "-s",
    renderResolution,
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-profile:v",
    "main",
    "-pix_fmt",
    "yuv420p",
    "-level:v",
    "4.1",
    "-r",
    streamFramerate,
    "-c:a",
    "libfdk_aac",
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
    "-f",
    "mpegts",
    "pipe:1",
  ];

  return await ffmpeg(args);
};

export const convertVideo = async (source, output) => {
  const args = [
    "-i",
    source,
    "-map_metadata",
    "-1",
    "-s",
    renderResolution,
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-profile:v",
    "main",
    "-pix_fmt",
    "yuv420p",
    "-level:v",
    "4.1",
    "-r",
    streamFramerate,
    "-g",
    "50",
    "-c:a",
    "libfdk_aac",
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
    "-f",
    "mpegts",
    output,
  ];
  await ffmpeg(args);
};

import { spawn } from "child_process";
import { Writable } from "stream";

export function extractFrames(inputBuffer) {
  return new Promise((resolve, reject) => {
    const frames = [];
    const ffmpegProcess = spawn("/usr/lib/jellyfin-ffmpeg/ffmpeg", [
      "-i",
      "pipe:0",
      "-vf",
      `fps=${streamFramerate}`,
      "-f",
      "image2pipe",
      "-vcodec",
      "png",
      "pipe:1",
    ]);

    ffmpegProcess.stdin.write(inputBuffer);
    ffmpegProcess.stdin.end();

    let currentFrameBuffer = Buffer.alloc(0);

    const writableStream = new Writable({
      write(chunk, encoding, callback) {
        currentFrameBuffer = Buffer.concat([currentFrameBuffer, chunk]);
        const pngEnd = Buffer.from([
          0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
        ]);
        let endIndex;
        while ((endIndex = currentFrameBuffer.indexOf(pngEnd)) !== -1) {
          endIndex += pngEnd.length;
          const frame = currentFrameBuffer.slice(0, endIndex);
          frames.push(frame);
          currentFrameBuffer = currentFrameBuffer.slice(endIndex);
        }
        callback();
      },
    });

    ffmpegProcess.stdout.pipe(writableStream);

    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        resolve(frames);
      } else {
        reject(new Error("Error processing frames"));
      }
    });
  });
}
