import {
  renderResolution,
  streamFramerate,
  minClipLength,
  maxClipLength,
} from "../../../config/streamConfig.js";

import { ffmpeg } from "../../utils/ffmpeg.js";
import { getVideoDuration } from "../../utils/media.js";

export async function execute(source, resources, RNG) {
  const videoDuration = await getVideoDuration(source.path);
  const clipDuration = RNG.float(minClipLength, maxClipLength);
  const startTime = RNG.float(0, videoDuration - clipDuration);

  const args = [
    "-ss",
    startTime,
    "-i",
    source.path,
    "-t",
    clipDuration,
    "-map_metadata",
    "-1",
    "-vf",
    `scale=-2:36,scale=${renderResolution},drawtext=textfile='${source.textOverlay}':x=10:y=h-th-10:fontsize=h/30:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2`,
    "-r",
    streamFramerate,
    "-af",
    "aresample=7350,aresample=44100",
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
    "pipe:1",
  ];

  return await ffmpeg(args);
}
