const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const extractAudio = require("./controllers/extractAudio");
const uploadToCloudinary = require("./controllers/uploadToCloudinary");
const Song = require("./models/Song");

const cloudinary = require("cloudinary").v2;

const app = express();

/* ⭐ CORS (Production Safe Structure) */
app.use(cors({
  origin: process.env.FRONTEND_URL || "*"
}));

app.use(express.json());

/* ================= HEALTH CHECK ================= */

app.get("/", (req, res) => {
  res.send("Smoother backend is running 🚀");
});

/* ================= ADD SONG ================= */

app.post("/addSong", async (req, res) => {
  try {
    const { title, youtubeUrl } = req.body;

    if (!title || !youtubeUrl) {
      return res.status(400).json({
        error: "Song name and YouTube URL are required"
      });
    }

    const baseName = Date.now().toString();

    const songsDir = path.join(__dirname, "songs");

    // ⭐ Recursive safe folder create
    if (!fs.existsSync(songsDir)) {
      fs.mkdirSync(songsDir, { recursive: true });
    }

    const localBase = path.join(songsDir, baseName);
    const localFile = `${localBase}.mp3`;

    await extractAudio(youtubeUrl, localBase);

    const uploadResult = await uploadToCloudinary(localFile);

    const audioUrl = uploadResult.secure_url;
    const cloudinaryId = uploadResult.public_id;

    // ⭐ Safe async delete
    fs.promises.unlink(localFile).catch(() => {});

    const song = await Song.create({
      title,
      youtubeUrl,
      audioUrl,
      cloudinaryId
    });

    res.json({
      message: "Song stored successfully 🎵",
      song
    });

  } catch (err) {
    console.error("ADD SONG ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= GET SONGS ================= */

app.get("/songs", async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    console.error("GET SONGS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= DELETE SONG ================= */

app.delete("/songs/:id", async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({ error: "Song not found" });
    }

    if (song.cloudinaryId) {
      await cloudinary.uploader.destroy(song.cloudinaryId, {
        resource_type: "video"
      });
    }

    await Song.findByIdAndDelete(req.params.id);

    res.json({ message: "Song deleted successfully 🗑️" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
