const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
  addSong,
  getSongs,
  deleteSong
} = require("../controllers/songsController");

router.post("/addSong", authMiddleware, addSong);

router.get("/songs", authMiddleware, getSongs);

router.delete("/songs/:id", authMiddleware, deleteSong);

module.exports = router;