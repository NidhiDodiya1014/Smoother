const { spawn } = require("child_process");
const fs = require("fs");

/*
  Determine yt-dlp path safely for:
  - Local Windows dev
  - Linux / Azure / Docker
  - Optional ENV override
*/
const getYtDlpPath = () => {
  if (process.env.YTDLP_PATH) {
    return process.env.YTDLP_PATH;
  }
  if (process.platform === "win32") {
    return "C:\\Windows\\yt-dlp.exe";
  }
  return "yt-dlp";
};

const YTDLP_PATH = getYtDlpPath();

// Fallback chain: tv_embedded works on server IPs without login,
// ios and web are fallbacks if tv_embedded is also blocked.
const PLAYER_CLIENTS = ["ios", "mweb", "web", "tv_embedded"];

const tryExtractAudio = (youtubeUrl, outputBasePath, clientIndex = 0) => {
  return new Promise((resolve, reject) => {
    if (clientIndex >= PLAYER_CLIENTS.length) {
      return reject(new Error("All player clients failed. YouTube may be blocking this server IP."));
    }

    const client = PLAYER_CLIENTS[clientIndex];
    let stderrOutput = "";

    const args = [
      "-x",
      "--audio-format", "mp3",
      "--no-playlist",
      "--no-update",
      "--extractor-args", `youtube:player_client=${client}`,
      "-o", `${outputBasePath}.%(ext)s`,
      youtubeUrl
    ];

    console.log(`Running (client=${client}):`, YTDLP_PATH, args.join(" "));

    const yt = spawn(YTDLP_PATH, args);

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
        if (clientIndex + 1 < PLAYER_CLIENTS.length) {
          console.log(`Client "${client}" failed. Retrying with "${PLAYER_CLIENTS[clientIndex + 1]}"...`);
          return tryExtractAudio(youtubeUrl, outputBasePath, clientIndex + 1)
            .then(resolve)
            .catch(reject);
        }
        return reject(new Error(stderrOutput.slice(-500)));
      }

      const expectedFile = `${outputBasePath}.mp3`;
      if (!fs.existsSync(expectedFile)) {
        return reject(new Error("yt-dlp finished but audio file not found"));
      }

      resolve();
    });
  });
};

const extractAudio = (youtubeUrl, outputBasePath) =>
  tryExtractAudio(youtubeUrl, outputBasePath, 0);

const extractPlaylistItems = (playlistUrl) => {
  return new Promise((resolve, reject) => {
    let stdoutData = "";
    let stderrData = "";

    const args = ["--flat-playlist", "--dump-json", "--no-update", playlistUrl];
    console.log("Running:", YTDLP_PATH, args.join(" "));

    const yt = spawn(YTDLP_PATH, args);

    const timeout = setTimeout(() => {
      yt.kill("SIGKILL");
      reject(new Error("yt-dlp playlist extraction timeout"));
    }, 2 * 60 * 1000);

    yt.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    yt.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    yt.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`yt-dlp spawn failed: ${err.message}`));
    });

    yt.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        return reject(new Error(stderrData.slice(-500)));
      }

      const items = stdoutData.trim().split(/\r?\n/).map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      }).filter(item => item && item.id);

      resolve(items);
    });
  });
};

const extractVideoInfo = (videoUrl) => {
  return new Promise((resolve, reject) => {
    let stdoutData = "";
    let stderrData = "";

    const args = ["--dump-json", "--no-playlist", "--no-update", videoUrl];

    const yt = spawn(YTDLP_PATH, args);

    const timeout = setTimeout(() => {
      yt.kill("SIGKILL");
      reject(new Error("yt-dlp video info timeout"));
    }, 60 * 1000);

    yt.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    yt.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    yt.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`yt-dlp spawn failed: ${err.message}`));
    });

    yt.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        return reject(new Error(stderrData.slice(-500)));
      }

      try {
        const info = JSON.parse(stdoutData.trim());
        resolve({ title: info.title, id: info.id });
      } catch (e) {
        reject(new Error("Failed to parse video info"));
      }
    });
  });
};

module.exports = { extractAudio, extractPlaylistItems, extractVideoInfo };
