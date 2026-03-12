const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

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

const PLAYER_CLIENTS = ["android", "ios", "android_music", "mweb", "web", "tv_embedded", "web_safari"];

const COOKIES_FILE = path.join(__dirname, "../cookies.txt");

const BASE_YTDLP_ARGS = [
  "--no-update",
  "--force-ipv4",
  "--no-cache-dir",
  "--geo-bypass",
  "--socket-timeout", "15",
  "--playlist-items", "1",
  "--extractor-retries", "3",
  "--fragment-retries", "3",
  "--file-access-retries", "3",
  "--concurrent-fragments", "5",
  "--sleep-requests", "1",
  "--sleep-interval", "1",
  "--max-sleep-interval", "3",
  "--js-runtimes", "node"
];

const getClientArgs = (client) => {
  const args = [];
  if (client === "none") return args;

  args.push("--extractor-args", `youtube:player_client=${client}`);

  if (client === "android") {
    args.push(
      "--add-header", "User-Agent:com.google.android.youtube/19.16.39",
      "--add-header", "X-YouTube-Client-Name:3",
      "--add-header", "X-YouTube-Client-Version:19.16.39"
    );
  } else if (client === "ios") {
    args.push(
      "--add-header", "User-Agent:com.google.ios.youtube/19.16.3",
      "--add-header", "X-YouTube-Client-Name:5",
      "--add-header", "X-YouTube-Client-Version:19.16.3"
    );
  }
  return args;
};

const spawnYt = (args) => {
  return spawn(YTDLP_PATH, args, {
    stdio: ["ignore", "pipe", "pipe"]
  });
};

const tryExtractAudio = (youtubeUrl, outputBasePath, clientIndex = 0) => {
  return new Promise((resolve, reject) => {

    const clientsToTry = [...PLAYER_CLIENTS, "none"];

    if (clientIndex >= clientsToTry.length) {
      return reject(new Error("All player clients failed. YouTube may be blocking this server IP."));
    }

    const client = clientsToTry[clientIndex];
    let stderrOutput = "";

    const args = [
      "-x",
      "--audio-format", "mp3",
      "--no-playlist",
      ...BASE_YTDLP_ARGS,
      "-o", `${outputBasePath}.%(ext)s`,
      ...getClientArgs(client),
      (fs.existsSync(COOKIES_FILE) ? ["--cookies", COOKIES_FILE] : []),
      youtubeUrl
    ].flat();

    console.log(`Running (client=${client}):`, YTDLP_PATH, args.join(" "));

    const yt = spawnYt(args);

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
        if (clientIndex + 1 < clientsToTry.length) {
          console.log(`Client "${client}" failed. Retrying with "${clientsToTry[clientIndex + 1]}"...`);
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

    const args = [
      "--flat-playlist",
      "--dump-json",
      ...BASE_YTDLP_ARGS,
      (fs.existsSync(COOKIES_FILE) ? ["--cookies", COOKIES_FILE] : []),
      playlistUrl
    ].flat();

    console.log("Running:", YTDLP_PATH, args.join(" "));

    const yt = spawnYt(args);

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
        } catch {
          return null;
        }
      }).filter(item => item && item.id);

      resolve(items);
    });
  });
};

const extractVideoInfo = (videoUrl, clientIndex = 0) => {
  return new Promise((resolve, reject) => {

    const clientsToTry = [...PLAYER_CLIENTS, "none"];

    if (clientIndex >= clientsToTry.length) {
      return reject(new Error("All player clients failed during video info extraction."));
    }

    const client = clientsToTry[clientIndex];
    let stdoutData = "";
    let stderrData = "";

    const args = [
      "--dump-json",
      "--no-playlist",
      ...BASE_YTDLP_ARGS,
      ...getClientArgs(client),
      (fs.existsSync(COOKIES_FILE) ? ["--cookies", COOKIES_FILE] : []),
      videoUrl
    ].flat();

    const yt = spawnYt(args);

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
        if (clientIndex + 1 < clientsToTry.length) {
          console.log(`extractVideoInfo: client "${client}" failed. Retrying with "${clientsToTry[clientIndex + 1]}"...`);
          return extractVideoInfo(videoUrl, clientIndex + 1).then(resolve).catch(reject);
        }
        return reject(new Error(stderrData.slice(-500)));
      }

      try {
        const info = JSON.parse(stdoutData.trim());
        resolve({ title: info.title, id: info.id });
      } catch {
        reject(new Error("Failed to parse video info"));
      }
    });
  });
};

module.exports = { extractAudio, extractPlaylistItems, extractVideoInfo };