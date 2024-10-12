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

  const options = RNG.int(1, 3);

  let args = ["-i", "pipe:0"];
  // Reverse
  if (options === 1) {
    args = args.concat(["-vf", "reverse", "-af", "areverse"]);
  }
  // Reverse Forward
  else if (options === 2) {
    args = args.concat([
      "-filter_complex",
      "[0:v]reverse[vid];[0:a]areverse[aud];[vid][aud][0:v][0:a]concat=n=2:v=1:a=1[outv][outa]",
      "-map",
      "[outv]",
      "-map",
      "[outa]",
    ]);
  }
  // Forward Reverse
  else if (options === 3) {
    args = args.concat([
      "-filter_complex",
      "[0:v]reverse[vid];[0:a]areverse[aud];[0:v][0:a][vid][aud]concat=n=2:v=1:a=1[outv][outa]",
      "-map",
      "[outv]",
      "-map",
      "[outa]",
    ]);
  }

  args = args.concat([
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
