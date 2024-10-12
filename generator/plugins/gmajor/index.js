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
    "-filter_complex",
    `[0:a]asetrate=22050,aresample=44100,atempo=2[lowc];[0:a]asetrate=33037.671045130824,aresample=44100,atempo=1.3348398541700344[lowg];[0:a]asetrate=55562.51830036391,aresample=44100,atempo=.7937005259840998[e];[0:a]asetrate=66075.34209026165,aresample=44100,atempo=.6674199270850172[g];[0:a]asetrate=88200,aresample=44100,atempo=.5[mainc];[0:a][lowc][lowg][e][g][mainc]amix=inputs=6[aud]`,
    "-map",
    "0:v",
    "-map",
    "[aud]",
    "-vf",
    `negate,drawtext=textfile='${source.textOverlay}':x=10:y=h-th-10:fontsize=h/30:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2`,
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
    "pipe:1",
  ];
  return await ffmpeg(args);
}
