import { spawn } from "child_process";
import os from "os";
import { twitchStreamKey } from "./config/serverConfig.js";

const startStream = () => {
  // Determina la ruta del ejecutable de ffmpeg según el sistema operativo
  const isWindows = os.platform() === "win32";
  const ffmpegPath = isWindows ? "ffmpeg" : "/usr/lib/jellyfin-ffmpeg/ffmpeg";

  const pipePath = isWindows
    ? "\\\\.\\pipe\\twitch_pipe"
    : `unix:///tmp/twitch_pipe`;

  const stream = spawn(ffmpegPath, [
    "-re",
    "-threads",
    "1",
    "-fflags",
    "+genpts",
    //"-analyzeduration",
    //"2147483647",
    "-probesize",
    "15000000",
    "-i",
    pipePath,
    "-fflags",
    "+discardcorrupt",
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-b:v",
    "1000k",
    "-pix_fmt",
    "nv12",
    "-s",
    "1280x720",
    "-r",
    "30",
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
    "-flvflags",
    "no_duration_filesize",
    "-f",
    "flv",
    `rtmp://scl01.contribute.live-video.net/app/${twitchStreamKey}`,
  ]);

  const handleError = (error) => {
    console.error(`Error: ${error.message}`);
    restartStream();
  };

  const handleExit = (code) => {
    console.log(`FFmpeg terminó con código ${code}`);
    restartStream();
  };

  const restartStream = () => {
    console.log("Reiniciando el proceso de FFmpeg...");
    startStream();
  };

  stream.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  stream.on("error", handleError);
  stream.on("close", handleExit);

  // Iniciar el proceso
  console.log("Iniciando el proceso de FFmpeg...");
};

// Iniciar la transmisión
startStream();
