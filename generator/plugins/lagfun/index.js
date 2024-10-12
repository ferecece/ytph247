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

  const decay = RNG.float(0.85, 1);
  const planes = RNG.int(1, 7);
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
    `format=gbrp,lagfun=decay=${decay}:planes=${planes},drawtext=textfile='${source.textOverlay}':x=10:y=h-th-10:fontsize=h/30:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2`,
    "-s",
    renderResolution,
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
    "-pix_fmt",
    "yuv420p",
    "-f",
    "mpegts",
    "pipe:1",
  ];

  return await ffmpeg(args);
}
