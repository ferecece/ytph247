import {
  renderResolution,
  streamFramerate,
  minClipLength,
  maxClipLength,
} from "../../../config/streamConfig.js";

import { ffmpeg } from "../../utils/ffmpeg.js";
import { getAudioDuration, getVideoDuration } from "../../utils/media.js";

export async function execute(source, resources, RNG) {
  const [quotes, sounds, musics, overlays] = resources;
  const randomSound = sounds[RNG.int(0, sounds.length - 1)];

  const videoDuration = await getVideoDuration(source.path);
  const clipDuration = RNG.float(minClipLength, maxClipLength);
  const startTime = RNG.float(0, videoDuration - clipDuration);

  const variant = RNG.int(1, 2);
  const soundDuration = await getAudioDuration(randomSound);

  let filterComplex;
  if (variant === 1) {
    filterComplex = `[0:v]drawtext=textfile='${source.textOverlay}':x=10:y=h-th-10:fontsize=h/30:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2[vout];[1:a]apad[A];[0:a][A]amerge[outa]`;
  } else {
    filterComplex = `[0:v]drawtext=textfile='${source.textOverlay}':x=10:y=h-th-10:fontsize=h/30:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2[vout];[1:a]atrim=end=${soundDuration},asetpts=PTS-STARTPTS[a]`;
  }

  const args = [
    "-ss",
    startTime,
    "-i",
    source.path,
    "-i",
    randomSound,
    "-t",
    clipDuration,
    "-filter_complex",
    filterComplex,
    "-map",
    "[vout]",
    "-map",
    variant === 1 ? "[outa]" : "[a]",
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
    "pipe:1",
  ];

  return await ffmpeg(args);
}
