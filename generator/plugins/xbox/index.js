import {
  renderResolution,
  streamFramerate,
  minClipLength,
  maxClipLength,
} from "../../../config/streamConfig.js";

import { ffmpeg, ffmpegWithBufferInput } from "../../utils/ffmpeg.js";
import { getVideoDuration, trimVideo } from "../../utils/media.js";

export async function execute(source, resources, RNG) {
  const videoDuration = await getVideoDuration(source.path);
  const clipDuration = RNG.float(minClipLength, maxClipLength);
  const startTime = RNG.float(0, videoDuration - clipDuration);
  const tempBuffer = await trimVideo(source, startTime, clipDuration);

  const temp2Buffer = await ffmpegWithBufferInput([
    "-i",
    "pipe:0",
    "-c:a",
    "libopus",
    "-ac",
    "1",
    "-ar",
    "8000",
    "-b:a",
    "4K",
    "-vbr",
    "constrained",
    "-f",
    "mpegts",
    "pipe:1",
  ], tempBuffer);

  const temp3Buffer = await ffmpegWithBufferInput([
    "-i",
    "pipe:0",
    "-filter:v",
    "fps=24",
    "-y",
    "-f",
    "mpegts",
    "pipe:1",
  ], temp2Buffer);

  return await ffmpegWithBufferInput([
    "-i",
    "pipe:0",
    "-vf",
    "scale=-1:540",
    "-s",
    renderResolution,
    "-c:v",
    "libx264",
    "-crf",
    "18",
    "-preset",
    "veryfast",
    "-profile:v",
    "main",
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
  ], temp3Buffer);
}
