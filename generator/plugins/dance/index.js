import { ffmpeg, ffmpegWithBufferInput } from "../../utils/ffmpeg.js";
import { getVideoDuration } from "../../utils/media.js";

import {
  renderResolution,
  streamFramerate,
  minClipLength,
  maxClipLength,
} from "../../../config/streamConfig.js";

export async function execute(source, resources, RNG) {
  const videoDuration = await getVideoDuration(source.path);
  const clipLength = RNG.float(minClipLength, maxClipLength);
  const startTime = RNG.float(0, videoDuration - clipLength);
  const randomTime = RNG.float(0.05, 0.5);
  const repeat = RNG.int(2, 4);

  //const tempBuffer = await trimVideo(source, startTime, clipLength);

  const forwardBuffer = await ffmpeg([
    "-ss",
    startTime,
    "-i",
    source.path,
    "-t",
    randomTime,
    "-map_metadata",
    "-1",
    "-filter_complex",
    `[0:v]drawtext=textfile='${source.textOverlay}':x=10:y=h-th-10:fontsize=h/30:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2,setpts=0.5*PTS[v];[0:a]atempo=2.0[a]`,
    "-map",
    "[v]",
    "-map",
    "[a]",
    "-c:v",
    "libx264",
    "-profile:v",
    "main",
    "-level:v",
    "4.1",
    "-s",
    renderResolution,
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
  ]);
  const backwardBuffer = await ffmpegWithBufferInput([
    "-i",
    "pipe:0",
    "-vf",
    "reverse",
    "-af",
    "areverse",
    "-s",
    renderResolution,
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
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
  ], forwardBuffer);
  let buffers = [];

  for (let i = 1; i <= repeat; i++) {
    buffers.push(forwardBuffer, backwardBuffer);
  }
  return Buffer.concat(buffers);
}
