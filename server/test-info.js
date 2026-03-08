const { spawn } = require("child_process");

const getYtDlpPath = () => {
  if (process.platform === "win32") {
    return "C:\\Windows\\yt-dlp.exe";
  }
  return "yt-dlp";
};

const YTDLP_PATH = getYtDlpPath();

const getVideoInfo = (url) => {
  return new Promise((resolve, reject) => {
    let stdoutData = "";
    let stderrData = "";

    const args = ["--dump-json", "--no-playlist", url];
    console.log("Running:", YTDLP_PATH, args.join(" "));

    const yt = spawn(YTDLP_PATH, args);

    yt.stdout.on("data", (data) => { stdoutData += data.toString(); });
    yt.stderr.on("data", (data) => { stderrData += data.toString(); });

    yt.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(stderrData));
      }

      try {
        const info = JSON.parse(stdoutData.trim());
        resolve({ title: info.title, id: info.id });
      } catch (e) {
        reject(e);
      }
    });
  });
};

getVideoInfo("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
  .then(info => console.log(info))
  .catch(console.error);
