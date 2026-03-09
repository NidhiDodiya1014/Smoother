const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
  addSong,
  getSongs,
  deleteSong,
  updateSong,
  getActiveDownloads,
  cancelDownload,
  cancelAllDownloads
} = require("../controllers/songsController");

router.post("/addSong", authMiddleware, addSong);

router.get("/songs", authMiddleware, getSongs);

router.delete("/songs/:id", authMiddleware, deleteSong);

router.post("/updateSong", authMiddleware, updateSong);

router.get("/downloads/active", authMiddleware, getActiveDownloads);

router.delete("/downloads/all", authMiddleware, cancelAllDownloads);

router.delete("/downloads/:youtubeId", authMiddleware, cancelDownload);

module.exports = router;