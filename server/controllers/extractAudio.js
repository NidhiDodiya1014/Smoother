const { spawn } = require("child_process");
const fs = require("fs");

/*
  Determine yt-dlp path safely for:
  - Local Windows dev
  - Linux / Railway / Docker
  - Optional ENV override
*/
const getYtDlpPath = () => {

  // ⭐ Best practice — allow ENV override
  if (process.env.YTDLP_PATH) {
    return process.env.YTDLP_PATH;
  }

  // Windows local development
  if (process.platform === "win32") {
    return "C:\\Windows\\yt-dlp.exe";
  }

  // Linux / Railway / Docker
  return "yt-dlp";
};

const YTDLP_PATH = getYtDlpPath();

const extractAudio = (youtubeUrl, outputBasePath) => {
  return new Promise((resolve, reject) => {

    let stderrOutput = "";

    const args = [
      "-x",
      "--audio-format", "mp3",
      "--no-playlist",

      "--extractor-args", "youtube:player_client=android",

      "--verbose",

      "-o", `${outputBasePath}.%(ext)s`,
      youtubeUrl
    ];

    console.log("Running:", YTDLP_PATH, args.join(" "));

    const yt = spawn(YTDLP_PATH, args);

    /* ⭐ Timeout Safety (10 min) */
    const timeout = setTimeout(() => {
      yt.kill("SIGKILL");
      reject(new Error("yt-dlp timeout exceeded (10 minutes)"));
    }, 10 * 60 * 1000);

    yt.stdout.on("data", (data) => {
      console.log(`yt-dlp stdout: ${data.toString()}`);
    });

    yt.stderr.on("data", (data) => {
      stderrOutput += data.toString();
      console.error(`yt-dlp stderr: ${data.toString()}`);
    });

    yt.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`yt-dlp spawn failed: ${err.message}`));
    });

    yt.on("close", (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        return reject(new Error(stderrOutput.slice(-500)));
      }

      /* ⭐ Validate Output File Exists */
      const expectedFile = `${outputBasePath}.mp3`;

      if (!fs.existsSync(expectedFile)) {
        return reject(new Error("yt-dlp finished but audio file not found"));
      }

      resolve();
    });

  });
};

module.exports = extractAudio;
