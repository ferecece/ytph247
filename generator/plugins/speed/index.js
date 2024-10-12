import {
  renderResolution,
  streamFramerate,
  minClipLength,
  maxClipLength,
} from "../../../config/streamConfig.js";

import { ffmpegWithBufferInput } from "../../utils/ffmpeg.js";
import { getVideoDuration, trimVideo } from "../../utils/media.js";

export async function execute(source, resources, RNG) {
  const videoDuration = await getVideoDuration(source.path);
  const clipDuration = RNG.float(minClipLength, maxClipLength);
  const startTime = RNG.float(0, videoDuration - clipDuration);
  const tempBuffer = await trimVideo(source, startTime, clipDuration);

  const variant = RNG.int(1, 4);

  let args = ["-i", "pipe:0"];

  // Slowdown
  if (variant === 1) {
    args = args.concat(["-vf", "setpts=2*PTS", "-af", "atempo=.5"]);
  }
  // Speedup
  else if (variant === 2) {
    args = args.concat(["-vf", "setpts=.5*PTS", "-af", "atempo=2"]);
  }
  // Slowdown Low Pitch
  else if (variant === 3) {
    args = args.concat([
      "-vf",
      "setpts=2*PTS",
      "-af",
      "asetrate=22050,aresample=44100",
    ]);
  }
  // Speedup main Pitch
  else if (variant === 4) {
    args = args.concat([
      "-vf",
      "setpts=.5*PTS",
      "-af",
      "asetrate=88200,aresample=44100",
    ]);
  }

  args = args.concat([
    "-r",
    streamFramerate,
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
    "pipe:1"
  ]);
  return await ffmpegWithBufferInput(args, tempBuffer);
}