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

  const variant = RNG.int(1, 4);

  let audioFilter = "";
  // Chorus
  if (variant === 1) {
    audioFilter = "chorus=0.7:0.9:55:0.4:0.25:2";
  }
  // Tremolo
  else if (variant === 2) {
    audioFilter = "tremolo=f=10:d=.7";
  }
  // Vibrato
  else if (variant === 3) {
    audioFilter = "vibrato=f=6.5:d=0.5";
  }
  // Robot Delay
  else if (variant === 4) {
    audioFilter =
      "aecho=1:1:10|20|30|40|50|60|70|80|90|100|110|120|130|140|150|160|170|180|190|200:1|0.95|0.9|0.85|0.8|0.75|0.7|0.65|0.6|0.55|0.5|0.45|0.4|0.35|0.3|0.25|0.2|0.15|0.1|0.05";
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