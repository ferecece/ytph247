import {
  renderResolution,
  streamFramerate,
  minClipLength,
  maxClipLength,
} from "../../../config/streamConfig.js";
import { getVideoDuration } from "../../utils/media.js";

import { ffmpeg } from "../../utils/ffmpeg.js";

export async function execute(source, resources, RNG) {
  const videoDuration = await getVideoDuration(source.path);
  const clipDuration = RNG.float(minClipLength, maxClipLength);
  const startTime = RNG.float(0, videoDuration - clipDuration);
  const variant = RNG.int(1, 2);

  let audioFilter = "";
  if (variant === 1) {
    audioFilter = "asetrate=22050,aresample=44100,atempo=2";
  } else {
    audioFilter = "asetrate=88200,aresample=44100,atempo=.5";
  }
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
    "-af",
    audioFilter,
    "-f",
    "mpegts",
    "pipe:1",
  ];

  return await ffmpeg(args);
}
