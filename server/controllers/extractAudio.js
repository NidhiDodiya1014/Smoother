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
  
  const pipPath = "/usr/local/bin/yt-dlp";
  if (fs.existsSync(pipPath)) {
    return pipPath;
  }
  
  return "yt-dlp";
};

const YTDLP_PATH = getYtDlpPath();

const ensureFfmpegBinaries = () => {
  const isDocker = fs.existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER === 'true';
  const useSystemFfmpeg = isDocker || process.env.USE_SYSTEM_FFMPEG === 'true';
  
  if (useSystemFfmpeg) {
    console.log("Using system-installed ffmpeg");
    return "/usr/bin";
  }
  
  const ffmpegBinDir = path.join(__dirname, "..", ".ffmpeg-bin");
  
  if (!fs.existsSync(ffmpegBinDir)) {
    fs.mkdirSync(ffmpegBinDir, { recursive: true });
  }
  
  const ffmpegPath = path.join(ffmpegBinDir, "ffmpeg");
  const ffprobePath = path.join(ffmpegBinDir, "ffprobe");
  
  if (!fs.existsSync(ffmpegPath)) {
    try {
      fs.copyFileSync(ffmpegStatic, ffmpegPath);
      fs.chmodSync(ffmpegPath, 0o755);
    } catch (err) {
      console.warn("Failed to copy static ffmpeg, trying system ffmpeg:", err.message);
      return "/usr/bin";
    }
  }
  
  if (!fs.existsSync(ffprobePath)) {
    try {
      fs.copyFileSync(ffprobeStatic.path, ffprobePath);
      fs.chmodSync(ffprobePath, 0o755);
    } catch (err) {
      console.warn("Failed to copy static ffprobe, trying system ffprobe:", err.message);
      return "/usr/bin";
    }
  }
  
  return ffmpegBinDir;
};

const extractAudio = (youtubeUrl, outputBasePath) => {
  return new Promise((resolve, reject) => {
    const ffmpegBinDir = ensureFfmpegBinaries();
    
    let stderrOutput = '';
    let stdoutOutput = '';
    
    const args = [
      "-x",
      "--audio-format", "mp3",
      "--no-playlist",
      "--ffmpeg-location", ffmpegBinDir,
      "--verbose",
      "-o", `${outputBasePath}.%(ext)s`,
      youtubeUrl
    ];

    console.log("Running:", YTDLP_PATH, args.join(" "));
    console.log("FFmpeg location:", ffmpegBinDir);
    console.log("Output path:", `${outputBasePath}.%(ext)s`);

    const spawnOptions = os.platform() === "win32" ? { windowsHide: true } : {
      env: { ...process.env, PATH: `${ffmpegBinDir}:${process.env.PATH}` }
    };

    const yt = spawn(YTDLP_PATH, args, spawnOptions);

    yt.stdout.on("data", (data) => {
      const output = data.toString();
      stdoutOutput += output;
      console.log(`yt-dlp stdout: ${output}`);
    });

    yt.stderr.on("data", (data) => {
      const output = data.toString();
      stderrOutput += output;
      console.error(`yt-dlp stderr: ${output}`);
    });

    yt.on("error", (err) => {
      console.error("Spawn error:", err);
      if (err.code === "ENOENT") {
        reject(new Error(`yt-dlp not found at ${YTDLP_PATH}. Please install yt-dlp: https://github.com/yt-dlp/yt-dlp`));
      } else {
        reject(new Error(`Failed to spawn yt-dlp: ${err.message}`));
      }
    });

    yt.on("close", (code) => {
      console.log(`yt-dlp exited with code ${code}`);
      if (code === 0) {
        resolve();
      } else {
        const errorMsg = `yt-dlp exited with code ${code}. Stderr: ${stderrOutput.slice(-500)}`;
        console.error(errorMsg);
        reject(new Error(errorMsg));
      }
    });
  });
};

module.exports = extractAudio;
