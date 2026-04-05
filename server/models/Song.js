const mongoose = require("mongoose");

const songSchema = new mongoose.Schema({

  youtubeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  originalTitle: {
    type: String,
    default: ""
  },

  audioUrl: {
    type: String,
    required: true
  },

  cloudinaryId: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Song", songSchema);