const path = require("path");
const fs = require("fs");

const Song = require("../models/Song");
const UserSong = require("../models/UserSong");

const { extractAudio, extractPlaylistItems, extractVideoInfo } = require("./extractAudio");
const uploadToCloudinary = require("./uploadToCloudinary");

const cloudinary = require("cloudinary").v2;

const activeDownloads = {};
const isProcessingQueue = {};

const PALETTE = [
  "#de677c", "#9463ae", "#4d7acd", "#2cb8e9", "#4ef4f5", "#a6fed5", "#fedbaa", "#d85b7e",
  "#fc7575", "#df56c8", "#b952c4", "#8b18a2", "#ec13b0", "#8e16cc", "#fea2f0", "#d1f6ff",
  "#708cfd", "#11ccfa", "#3fead7", "#c4e6db", "#ebc1ef", "#e38cfe", "#cc72fd", "#ae5cfc",
  "#061350", "#0c3b88", "#0b7190", "#10a56e", "#35d487", "#c1cbab", "#87abdf", "#0cf1f5",
  "#c9d0ff", "#aeb8fc", "#f0d5fd", "#d7beff", "#affcf5", "#92d5ef", "#ffadcf", "#cd8cfe"
];

function getRandomNeonColor() {
  const hex = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  return hex + "2E";
}

function formatYoutubeTitle(rawTitle) {
  if (!rawTitle) return "Unknown Track";

  let title = rawTitle.replace(/[\[\(\<].*?[\]\)\>]/g, "");
  const delimiters = /\||-|\/\/|•|·|~/;
  const parts = title.split(delimiters);

  let bestPart = parts[0];
  for (let part of parts) {
    if (part.trim().length > 0) {
      bestPart = part;
      break;
    }
  }

  title = bestPart.replace(/^["',]+|["',]+$/g, "").trim();

  if (!title) {
    title = rawTitle.replace(/[\[\(\<].*?[\]\)\>]/g, "").trim() || "Unknown Track";
  }

  return title;
}

function extractYoutubeId(url) {
  const regExp = /(?:youtube\.com\/(?:.*v=|.*\/)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

const processUserQueue = async (userId) => {
  if (isProcessingQueue[userId]) return;
  isProcessingQueue[userId] = true;

  try {
    while (activeDownloads[userId] && activeDownloads[userId].length > 0) {
      const taskIndex = activeDownloads[userId].findIndex(t => t.status === "queued");
      if (taskIndex === -1) break;

      const task = activeDownloads[userId][taskIndex];
      task.status = "downloading";

      try {
        const { id: youtubeId, title, url: youtubeUrl, color } = task;

        const existingSong = await Song.findOne({ youtubeId });

        if (existingSong) {
          const userSongExists = await UserSong.findOne({ user: userId, song: existingSong._id });

          if (!userSongExists) {
            await UserSong.create({
              user: userId,
              song: existingSong._id,
              customTitle: title,
              color: color || ""
            });
          }

          task.status = "done";

          setTimeout(() => {
            if (activeDownloads[userId]) {
              activeDownloads[userId] = activeDownloads[userId].filter(t => t.id !== youtubeId);
            }
          }, 3000);

          continue;
        }

        const baseName = Date.now().toString() + "-" + Math.random().toString(36).substring(7);
        const songsDir = path.join(__dirname, "../songs");

        if (!fs.existsSync(songsDir)) {
          fs.mkdirSync(songsDir, { recursive: true });
        }

        const localBase = path.join(songsDir, baseName);
        const localFile = `${localBase}.mp3`;

        await extractAudio(youtubeUrl, localBase);

        task.status = "uploading";

        const uploadResult = await uploadToCloudinary(localFile);
        const audioUrl = uploadResult.secure_url;
        const cloudinaryId = uploadResult.public_id;

        fs.promises.unlink(localFile).catch(() => {});

        const song = await Song.create({
          youtubeId,
          audioUrl,
          cloudinaryId
        });

        await UserSong.create({
          user: userId,
          song: song._id,
          customTitle: title,
          color: color || ""
        });

        task.status = "done";

        setTimeout(() => {
          if (activeDownloads[userId]) {
            activeDownloads[userId] = activeDownloads[userId].filter(t => t.id !== task.id);
          }
        }, 3000);

      } catch (err) {
        console.error(`Failed to process queued song ${task.id}:`, err);

        task.status = "failed";

        setTimeout(() => {
          if (activeDownloads[userId]) {
            activeDownloads[userId] = activeDownloads[userId].filter(t => t.id !== task.id);
          }
        }, 5000);

        continue;
      }
    }
  } finally {
    isProcessingQueue[userId] = false;
  }
};

const enqueueDownload = (userId, youtubeId, title, url, color) => {
  if (!activeDownloads[userId]) activeDownloads[userId] = [];

  if (!activeDownloads[userId].find(t => t.id === youtubeId)) {
    activeDownloads[userId].push({
      id: youtubeId,
      title: title || "Unknown Track",
      url,
      color,
      status: "queued"
    });
  }

  processUserQueue(userId);
};

const addSong = async (req, res) => {
  try {
    const { title, youtubeUrl, colorMode, color } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({ error: "YouTube URL required" });
    }

    const isPlaylist = youtubeUrl.includes("list=");

    if (isPlaylist) {
      const items = await extractPlaylistItems(youtubeUrl);

      if (!items || items.length === 0) {
        return res.status(400).json({ error: "Could not extract data from the playlist. Is it private or invalid?" });
      }

      res.json({
        message: `Playlist processing started! ${items.length} songs are being downloaded in the background.`
      });

      (async () => {
        for (const item of items) {
          if (!item.id || !item.title) continue;

          const songTitle = formatYoutubeTitle(item.title);
          const songUrl = `https://www.youtube.com/watch?v=${item.id}`;

          let songColor = color;
          if (colorMode === "random_all" || !color) {
            songColor = getRandomNeonColor();
          }

          enqueueDownload(req.userId, item.id, songTitle, songUrl, songColor);
        }
      })();

      return;
    }

    const youtubeId = extractYoutubeId(youtubeUrl);

    if (!youtubeId) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    let finalTitle = title ? title.trim() : null;

    res.json({
      message: "Song processing started! It is downloading and adding to your library in the background."
    });

    (async () => {
      if (!finalTitle) {
        try {
          const info = await extractVideoInfo(youtubeUrl);
          finalTitle = formatYoutubeTitle(info.title);
        } catch (err) {
          console.error("Failed to extract video info:", err);
          finalTitle = "Unknown Track";
        }
      }

      let songColor = color;
      if (colorMode === "random" || !color) {
        songColor = getRandomNeonColor();
      }

      enqueueDownload(req.userId, youtubeId, finalTitle, youtubeUrl, songColor);
    })();

  } catch (err) {
    console.error("ADD SONG ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

const getSongs = async (req, res) => {
  try {
    const songs = await UserSong
      .find({ user: req.userId })
      .populate("song")
      .sort({ createdAt: -1 });

    const formattedSongs = songs.map(s => ({
      id: s._id,
      title: s.customTitle,
      color: s.color || "",
      audioUrl: s.song.audioUrl,
      youtubeId: s.song.youtubeId
    }));

    res.json(formattedSongs);

  } catch (err) {
    console.error("GET SONGS ERROR:", err);

    res.status(500).json({
      error: err.message
    });
  }
};

const deleteSong = async (req, res) => {
  try {
    const userSong = await UserSong.findById(req.params.id);

    if (!userSong) {
      return res.status(404).json({ error: "Song not found" });
    }

    if (userSong.user.toString() !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const songId = userSong.song;

    await UserSong.findByIdAndDelete(req.params.id);

    const remaining = await UserSong.countDocuments({
      song: songId
    });

    if (remaining === 0) {
      const song = await Song.findById(songId);

      if (song) {
        await cloudinary.uploader.destroy(song.cloudinaryId, {
          resource_type: "video"
        });

        await Song.findByIdAndDelete(songId);
      }
    }

    res.json({ message: "Song removed from your library" });

  } catch (err) {
    console.error("DELETE ERROR:", err);

    res.status(500).json({
      error: err.message
    });
  }
};

const updateSong = async (req, res) => {
  try {
    const { id, title, color } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Song id is required" });
    }

    const song = await UserSong.findById(id);

    if (!song) {
      return res.status(404).json({ error: "Song not found" });
    }

    if (song.user.toString() !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (title !== undefined) song.customTitle = title;
    if (color !== undefined) song.color = color;

    await song.save();

    res.json({
      message: "Song updated successfully!",
      song
    });

  } catch (err) {
    console.error("UPDATE SONG ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

const getActiveDownloads = (req, res) => {
  const userDownloads = activeDownloads[req.userId] || [];
  res.json(userDownloads);
};

const cancelDownload = (req, res) => {
  const { youtubeId } = req.params;
  const userId = req.userId;

  if (!activeDownloads[userId]) {
    return res.json({ message: "No active downloads" });
  }

  const task = activeDownloads[userId].find(t => t.id === youtubeId);

  if (!task) {
    return res.status(404).json({ error: "Download not found" });
  }

  if (task.status !== "queued") {
    return res.status(400).json({ error: "Cannot cancel a download that is already in progress" });
  }

  activeDownloads[userId] = activeDownloads[userId].filter(t => t.id !== youtubeId);
  res.json({ message: "Download removed from queue" });
};

const cancelAllDownloads = (req, res) => {
  const userId = req.userId;

  if (!activeDownloads[userId] || activeDownloads[userId].length === 0) {
    return res.json({ message: "No active downloads", removed: 0 });
  }

  const before = activeDownloads[userId].length;

  activeDownloads[userId] = activeDownloads[userId].filter(t => t.status !== "queued");

  const removed = before - activeDownloads[userId].length;

  res.json({ message: `Removed ${removed} queued download(s)`, removed });
};

module.exports = {
  addSong,
  getSongs,
  deleteSong,
  updateSong,
  getActiveDownloads,
  cancelDownload,
  cancelAllDownloads
};