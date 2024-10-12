import path from "path";
import fs from 'fs';
import { v4 as uuidv4 } from "uuid";

import {
  renderResolution,
  streamFramerate,
  minClipLength,
  maxClipLength,
} from "../../../config/streamConfig.js";
import { getVideoDuration, trimVideo } from "../../utils/media.js";
import { createCanvas, loadImage, registerFont } from "canvas";
import { ffmpeg, ffmpegWithBufferInput } from "../../utils/ffmpeg.js";
import { tempPath } from '../../../config/pathConfig.js'
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

registerFont(path.join(__dirname, "font", "Times.ttf"), {
  family: "Times New Roman",
});

registerFont(path.join(__dirname, "font", "Trebuchet.ttf"), {
  family: "Trebuchet MS",
});

export async function execute(source, resources, RNG) {
  const [quotes, sounds, musics] = resources;
  const videoDuration = await getVideoDuration(source.path);
  const clipDuration = RNG.float(minClipLength, maxClipLength);
  const startTime = RNG.float(0, videoDuration - clipDuration);

  const randomMusic = musics[RNG.int(0, musics.length - 1)];
  const wavFile = path.join(tempPath, `${uuidv4()}.wav`);
  await ffmpeg([
    "-i",
    randomMusic,
    "-acodec",
    "pcm_s16le",
    "-channel_layout",
    "stereo",
    "-ac",
    "2",
    "-ar",
    "44100",
    "-f",
    "wav",
    "-y",
    wavFile,
  ]);

  const beforeDemotivationalBuffer = await trimVideo(
    source,
    startTime,
    clipDuration
  );
  const lastFrameBuffer = await ffmpegWithBufferInput(
    [
      "-f",
      "mpegts",
      "-sseof",
      "-3",
      "-i",
      "pipe:0",
      "-update",
      "1",
      "-q:v",
      "1",
      "-f",
      "image2pipe",
      "pipe:1",
    ],
    beforeDemotivationalBuffer
  );

  const repeat = RNG.int(1, 10);

  let currentImageBuffer = lastFrameBuffer;
  let buffers = [beforeDemotivationalBuffer];
  for (let i = 0; i <= repeat; i++) {
    const topText = quotes[RNG.int(0, quotes.length - 1)].quote;
    const bottomText = quotes[RNG.int(0, quotes.length - 1)].quote;
    currentImageBuffer = await createDemotivationalBuffer(
      currentImageBuffer,
      topText,
      bottomText
    );
    const imageToVideoBuffer = await ffmpegWithBufferInput(
      [
        "-loop",
        "1",
        "-f",
        "image2pipe",
        "-framerate",
        streamFramerate,
        "-i",
        "pipe:0",
        "-i",
        wavFile,
        "-t",
        i === 0 ? RNG.float(0.8, 1.3) : RNG.float(0.03, 0.5),
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
        "-channel_layout",
        "stereo",
        "-ac",
        "2",
        "-ar",
        "44100",
        "-c:a",
        "libfdk_aac",
        "-profile:a",
        "aac_low",
        "-sample_fmt",
        "s16",
        "-shortest",
        "-async",
        "1", 
        "-f",
        "mpegts",
        "pipe:1",
      ],
      currentImageBuffer
    );
    buffers.push(imageToVideoBuffer);
  }
  await fs.promises.unlink(wavFile);
  return Buffer.concat(buffers);
}

const createDemotivationalBuffer = async (imageBuffer, topText, bottomText) => {
  const image = await loadImage(imageBuffer);
  const canvas = createCanvas(
    parseInt(renderResolution.split("x")[0]),
    parseInt(renderResolution.split("x")[1])
  );
  const context = canvas.getContext("2d");

  context.fillStyle = "#000000";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const x = 20;
  const y = 20;
  const width = image.width - 40;
  const height = image.height - 100;

  context.drawImage(image, x, y, width, height);

  context.fillStyle = "#FFFFFF";
  context.textAlign = "center";
  context.font = `24px "Times New Roman"`;
  context.fillText(topText, canvas.width / 2, height + 24 + 20);

  context.font = `12px "Trebuchet MS"`;
  context.fillText(bottomText, canvas.width / 2, height + 24 + 12 + 25);

  context.lineWidth = 1;
  context.strokeStyle = "white";
  context.strokeRect(x - 2, y - 2, width + 4, height + 4);

  return canvas.toBuffer("image/png");
};
