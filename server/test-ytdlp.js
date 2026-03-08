const { spawn } = require("child_process");

const getYtDlpPath = () => {
  if (process.platform === "win32") {
    return "C:\\Windows\\yt-dlp.exe";
  }
  return "yt-dlp";
};

const YTDLP_PATH = getYtDlpPath();

const getPlaylistItems = (url) => {
  return new Promise((resolve, reject) => {
    let stdoutData = "";
    let stderrData = "";

    const args = ["--flat-playlist", "--dump-json", url];
    console.log("Running:", YTDLP_PATH, args.join(" "));

    const yt = spawn(YTDLP_PATH, args);

    yt.stdout.on("data", (data) => { stdoutData += data.toString(); });
    yt.stderr.on("data", (data) => { stderrData += data.toString(); });

    yt.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(stderrData));
      }

      const lines = stdoutData.trim().split("\n");
      const items = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      resolve(items);
    });
  });
};

getPlaylistItems("https://www.youtube.com/playlist?list=PLSkcgzeLNmcU1JoQZXByXcpdj8qwTh9yE")
  .then(items => {
    console.log(`Found ${items.length} items.`);
    console.log(items[0]);
  })
  .catch(console.error);
