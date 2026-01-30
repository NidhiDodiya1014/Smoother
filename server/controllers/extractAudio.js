const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const getYtDlpPath = () => {

  // Windows Local Dev
  if (process.platform === "win32") {
    return "C:\\Windows\\yt-dlp.exe";
  }

  // Production / Linux / Docker
  return "yt-dlp";
};

const YTDLP_PATH = getYtDlpPath();

const extractAudio = (youtubeUrl, outputBasePath) => {
  return new Promise((resolve, reject) => {

    let stderrOutput = "";
    let stdoutOutput = "";

    const args = [
      "-x",
      "--audio-format", "mp3",
      "--no-playlist",

      // 🔥 Helps avoid 403 sometimes
      "--extractor-args", "youtube:player_client=android",

      // 🔥 JS challenge solving
      "--js-runtimes", "deno",

      "--verbose",
      "-o", `${outputBasePath}.%(ext)s`,
      youtubeUrl
    ];

    console.log("Running:", YTDLP_PATH, args.join(" "));

    const yt = spawn(YTDLP_PATH, args);

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
      reject(new Error(`yt-dlp spawn failed: ${err.message}`));
    });

    yt.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderrOutput.slice(-500)));
      }
    });

  });
};

module.exports = extractAudio;
