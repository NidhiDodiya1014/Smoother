const mongoose = require("mongoose");

const songSchema = new mongoose.Schema({
  title: String,
  youtubeUrl: String,
  audioUrl: String,        
  cloudinaryId: String,   
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Song", songSchema);
