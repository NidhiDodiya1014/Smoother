const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
  addSong,
  getSongs,
  deleteSong,
  updateSong,
  getActiveDownloads
} = require("../controllers/songsController");

router.post("/addSong", authMiddleware, addSong);

router.get("/songs", authMiddleware, getSongs);

router.delete("/songs/:id", authMiddleware, deleteSong);

router.post("/updateSong", authMiddleware, updateSong);

router.get("/downloads/active", authMiddleware, getActiveDownloads);

module.exports = router;