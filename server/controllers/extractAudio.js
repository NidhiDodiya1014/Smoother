const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Determines the yt-dlp binary path dynamically.
 * Order of priority:
 * 1. Environment variable YTDLP_PATH (if valid)
 * 2. Local binary in server/ folder (recommended for VPS)
 * 3. System-installed 'yt-dlp'
 */
const getYtDlpPath = () => {
  // 1. Check Env
  if (process.env.YTDLP_PATH && fs.existsSync(process.env.YTDLP_PATH)) {
    return process.env.YTDLP_PATH;
  }
  
  // 2. Check Local Binary in Server Folder
  const localDirBinary = path.join(__dirname, "../yt-dlp");
  const localDirBinaryExe = path.join(__dirname, "../yt-dlp.exe");
  
  if (fs.existsSync(localDirBinary)) return localDirBinary;
  if (fs.existsSync(localDirBinaryExe)) return localDirBinaryExe;

  // 3. Platform Fallbacks
  if (process.platform === "win32") {
    const commonWinPath = "C:\\Windows\\yt-dlp.exe";
    return fs.existsSync(commonWinPath) ? commonWinPath : "yt-dlp";
  }

  return "yt-dlp"; // Linux default
};

const YTDLP_PATH = getYtDlpPath();

const PLAYER_CLIENTS = ["android", "ios", "android_music", "mweb", "web", "tv_embedded", "web_safari"];

const COOKIES_FILE = path.join(__dirname, "../cookies.txt");
const FFMPEG_LOCATION = path.join(__dirname, "../.ffmpeg-bin");

const BASE_YTDLP_ARGS = [
  "--no-update",
  "--force-ipv4",
  "--no-cache-dir",
  "--geo-bypass",
  "--no-check-certificates", // Vital for some VPS setups to avoid SSL handshakes
  "--socket-timeout", "20",   // Slightly longer timeout for server stability
  "--extractor-retries", "5",
  "--fragment-retries", "5",
  "--concurrent-fragments", "5",
  "--js-runtimes", "node",
  // Fallback: Use system FFmpeg if the .ffmpeg-bin is empty/wrong (e.g. windows exes on linux)
  ...(fs.existsSync(FFMPEG_LOCATION) && fs.readdirSync(FFMPEG_LOCATION).length > 0 
      ? ["--ffmpeg-location", FFMPEG_LOCATION] 
      : []),
  // Base User Agent to simulate a real browser request
  "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
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
      return reject(new Error("All player clients failed. YouTube may be blocking this server IP. Check cookies.txt."));
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

    const yt = spawnYt(args);

    const timeout = setTimeout(() => {
      yt.kill("SIGKILL");
      reject(new Error("yt-dlp extract timeout (10 mins)"));
    }, 10 * 60 * 1000);

    yt.stdout.on("data", (data) => {
      console.log(`yt-dlp [${client}]: ${data.toString().trim().split('\n').pop()}`);
    });

    yt.stderr.on("data", (data) => {
      stderrOutput += data.toString();
    });

    yt.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`yt-dlp spawn failed: ${err.message}`));
    });

    yt.on("close", (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        if (clientIndex + 1 < clientsToTry.length) {
          return tryExtractAudio(youtubeUrl, outputBasePath, clientIndex + 1).then(resolve).catch(reject);
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

const extractAudio = (youtubeUrl, outputBasePath) => tryExtractAudio(youtubeUrl, outputBasePath, 0);

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

    const yt = spawnYt(args);

    const timeout = setTimeout(() => {
      yt.kill("SIGKILL");
      reject(new Error("Playlist extraction timeout"));
    }, 3 * 60 * 1000);

    yt.stdout.on("data", (data) => { stdoutData += data.toString(); });
    yt.stderr.on("data", (data) => { stderrData += data.toString(); });

    yt.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`yt-dlp spawn failed: ${err.message}`));
    });

    yt.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) return reject(new Error(stderrData.slice(-500)));

      try {
        const items = stdoutData.trim().split(/\r?\n/).map(line => {
          try { return JSON.parse(line); } catch { return null; }
        }).filter(item => item && item.id);
        resolve(items);
      } catch {
        reject(new Error("Failed to process playlist JSON"));
      }
    });
  });
};

const extractVideoInfo = (videoUrl, clientIndex = 0) => {
  return new Promise((resolve, reject) => {

    const clientsToTry = [...PLAYER_CLIENTS, "none"];

    if (clientIndex >= clientsToTry.length) {
      return reject(new Error("Video info extraction failed across all clients."));
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
      reject(new Error("Video info timeout"));
    }, 60 * 1000);

    yt.stdout.on("data", (data) => { stdoutData += data.toString(); });
    yt.stderr.on("data", (data) => { stderrData += data.toString(); });

    yt.on("close", (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        if (clientIndex + 1 < clientsToTry.length) {
          return extractVideoInfo(videoUrl, clientIndex + 1).then(resolve).catch(reject);
        }
        return reject(new Error(stderrData.slice(-500)));
      }

      try {
        const info = JSON.parse(stdoutData.trim());
        let finalTitle = info.title;
        
        // Smarter Metadata Clean
        if (info.track && info.artist) {
          finalTitle = `${info.artist} - ${info.track}`;
        } else if (info.track) {
          finalTitle = info.track;
        } else {
          finalTitle = finalTitle
            .replace(/\[.*?\]/g, "")
            .replace(/\(Official.*?\)/gi, "")
            .replace(/\(Lyric.*?\)/gi, "")
            .replace(/\(Music Video\)/gi, "")
            .replace(/\(Audio\)/gi, "")
            .replace(/\(feat\..*?\)/gi, "")
            .replace(/\|.*/, "")
            .replace(/\s+/g, " ")
            .trim();
          
          if (finalTitle.endsWith("-")) finalTitle = finalTitle.slice(0, -1).trim();
        }
        
        if (!finalTitle) finalTitle = info.title;

        resolve({ title: finalTitle, id: info.id });
      } catch {
        reject(new Error("Failed to parse video info"));
      }
    });
  });
};

module.exports = { extractAudio, extractPlaylistItems, extractVideoInfo };