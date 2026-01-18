const { spawn } = require("child_process");

const YTDLP_PATH = "C:\\Windows\\yt-dlp.exe";

const extractAudio = (youtubeUrl, outputBasePath) => {
  return new Promise((resolve, reject) => {
    const args = [
      "-x",
      "--audio-format", "mp3",
      "--no-playlist",
      "-o", `${outputBasePath}.%(ext)s`,
      youtubeUrl
    ];

    console.log("Running:", YTDLP_PATH, args.join(" "));

    const yt = spawn(YTDLP_PATH, args, {
      windowsHide: true
    });

    yt.on("error", reject);

    yt.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp exited with code ${code}`));
    });
  });
};

module.exports = extractAudio;
