const { spawn } = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs");
const ffmpegStatic = require("ffmpeg-static");
const ffprobeStatic = require("ffprobe-static");

const getYtDlpPath = () => {
  if (os.platform() === "win32") {
    return "C:\\Windows\\yt-dlp.exe";
  }
  
  const localPath = path.join(__dirname, "..", "yt-dlp");
  if (fs.existsSync(localPath)) {
    return localPath;
  }
  
  return "yt-dlp";
};

const YTDLP_PATH = getYtDlpPath();

const ensureFfmpegBinaries = () => {
  const ffmpegBinDir = path.join(__dirname, "..", ".ffmpeg-bin");
  
  if (!fs.existsSync(ffmpegBinDir)) {
    fs.mkdirSync(ffmpegBinDir, { recursive: true });
  }
  
  const ffmpegPath = path.join(ffmpegBinDir, "ffmpeg");
  const ffprobePath = path.join(ffmpegBinDir, "ffprobe");
  
  if (!fs.existsSync(ffmpegPath)) {
    fs.copyFileSync(ffmpegStatic, ffmpegPath);
    fs.chmodSync(ffmpegPath, 0o755);
  }
  
  if (!fs.existsSync(ffprobePath)) {
    fs.copyFileSync(ffprobeStatic.path, ffprobePath);
    fs.chmodSync(ffprobePath, 0o755);
  }
  
  return ffmpegBinDir;
};

const extractAudio = (youtubeUrl, outputBasePath) => {
  return new Promise((resolve, reject) => {
    const ffmpegBinDir = ensureFfmpegBinaries();
    const args = [
      "-x",
      "--audio-format", "mp3",
      "--no-playlist",
      "--ffmpeg-location", ffmpegBinDir,
      "-o", `${outputBasePath}.%(ext)s`,
      youtubeUrl
    ];

    console.log("Running:", YTDLP_PATH, args.join(" "));

    const spawnOptions = os.platform() === "win32" ? { windowsHide: true } : {};

    const yt = spawn(YTDLP_PATH, args, spawnOptions);

    yt.stderr.on("data", (data) => {
      console.error(`yt-dlp stderr: ${data}`);
    });

    yt.on("error", (err) => {
      if (err.code === "ENOENT") {
        reject(new Error("yt-dlp not found. Please install yt-dlp: https://github.com/yt-dlp/yt-dlp"));
      } else {
        reject(err);
      }
    });

    yt.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp exited with code ${code}`));
    });
  });
};

module.exports = extractAudio;
