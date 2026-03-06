const mongoose = require("mongoose");

const userSongSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  song: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Song",
    required: true
  },

  customTitle: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("UserSong", userSongSchema);