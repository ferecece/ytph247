import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { spawn } from "child_process";
import { tempPath } from "../../../config/pathConfig.js";
import {
  getVideoDuration,
  trimVideo,
  convertVideo,
} from "../../utils/media.js";
import {
  renderResolution,
  streamFramerate,
  minClipLength,
  maxClipLength,
} from "../../../config/streamConfig.js";
import { ffmpeg, ffmpegWithBufferInput } from "../../utils/ffmpeg.js";

export async function execute(source, resources, RNG) {
  const [quotes, sounds, musics, overlays] = resources;

  const convertedOverlay = path.join(
    tempPath,
    `convertedOverlay-${uuidv4()}.ts`
  );

  const overlay = overlays[RNG.int(0, overlays.length - 1)];

  if (path.basename(overlay).startsWith("freeze")) {
    const videoDuration = await getVideoDuration(source.path);
    const clipDuration = RNG.float(minClipLength, maxClipLength);
    const startTime = RNG.float(0, videoDuration - clipDuration);

    const tempBuffer = await trimVideo(source, startTime, clipDuration);

    const frameBuffer = await ffmpegWithBufferInput(
      [
        "-sseof",
        "-3",
        "-i",
        "pipe:0",
        "-update",
        "1",
        "-q:v",
        "1",
        "-f",
        "image2pipe",
        "pipe:1",
      ],
      tempBuffer
    );

    await convertVideo(overlay, convertedOverlay);

    const videoWithOverlay = await ffmpegWithBufferInput(
      [
        "-i",
        "pipe:0",
        "-i",
        convertedOverlay,
        "-filter_complex",
        "[1:v]chromakey=0x00FF00:0.2:0.1[ckout];[0:v][ckout]overlay=0:0[v]",
        "-map",
        "[v]",
        "-map",
        "1:a",
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
        "pipe:1"
      ],
      frameBuffer
    );
    await fs.promises.unlink(convertedOverlay);
    return Buffer.concat([tempBuffer, videoWithOverlay]);
  } else {
    const videoDuration = await getVideoDuration(source.path);
    const overlayDuration = await getVideoDuration(overlay);

    //const clipDuration = RNG.float(minClipLength, maxClipLength);
    const startTime = RNG.float(0, videoDuration - overlayDuration);

    const tempBuffer = await trimVideo(source, startTime, overlayDuration);
    await convertVideo(overlay, convertedOverlay);

    const args = [
      "-i",
      "pipe:0",
      "-i",
      convertedOverlay,
      "-filter_complex",
      "[0:a][1:a]amix=inputs=2[a]",
      "-map",
      "[a]",
      "-filter_complex",
      "[1:v]chromakey=0x00FF00:0.2:0.1[ckout];[0:v][ckout]overlay=0:0[v]",
      "-map",
      "[v]",
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
      "-shortest",
      "-f",
      "mpegts",
      "pipe:1"
    ]
    return await ffmpegWithBufferInput(args, tempBuffer);
  }
}
