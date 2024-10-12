import { spawn } from "child_process";

const ffprobePath =
  process.platform === "win32" ? "ffprobe" : "/usr/lib/jellyfin-ffmpeg/ffprobe";

const ffprobe = (args) => {
  const p = spawn(ffprobePath, args);
  let stdout = "";
  let stderr = "";

  return new Promise((resolve, reject) => {
    p.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    p.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    p.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr));
      }
    });
  });
};

export default ffprobe;
