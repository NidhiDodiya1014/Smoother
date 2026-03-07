const path = require("path");
const fs = require("fs");

const Song = require("../models/Song");
const UserSong = require("../models/UserSong");

const extractAudio = require("./extractAudio");
const uploadToCloudinary = require("./uploadToCloudinary");

const cloudinary = require("cloudinary").v2;



function extractYoutubeId(url) {

  const regExp =
    /(?:youtube\.com\/(?:.*v=|.*\/)|youtu\.be\/)([^"&?\/\s]{11})/;

  const match = url.match(regExp);

  return match ? match[1] : null;
}


const addSong = async (req, res) => {

  try {

    const { title, youtubeUrl } = req.body;

    if (!title || !youtubeUrl) {
      return res.status(400).json({
        error: "Song title and YouTube URL required"
      });
    }


    const youtubeId = extractYoutubeId(youtubeUrl);

    if (!youtubeId) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }



    const existingSong = await Song.findOne({ youtubeId });



    if (existingSong) {

      await UserSong.create({
        user: req.userId,
        song: existingSong._id,
        customTitle: title
      });

      return res.json({
        message: "Song already downloaded. Added instantly."
      });

    }



    const baseName = Date.now().toString();

    const songsDir = path.join(__dirname, "../songs");

    if (!fs.existsSync(songsDir)) {
      fs.mkdirSync(songsDir, { recursive: true });
    }

    const localBase = path.join(songsDir, baseName);
    const localFile = `${localBase}.mp3`;



    await extractAudio(youtubeUrl, localBase);



    const uploadResult = await uploadToCloudinary(localFile);

    const audioUrl = uploadResult.secure_url;
    const cloudinaryId = uploadResult.public_id;



    fs.promises.unlink(localFile).catch(() => { });



    const song = await Song.create({
      youtubeId,
      audioUrl,
      cloudinaryId
    });



    await UserSong.create({
      user: req.userId,
      song: song._id,
      customTitle: title
    });



    res.json({
      message: "Song downloaded and added successfully"
    });

  }

  catch (err) {

    console.error("ADD SONG ERROR:", err);

    res.status(500).json({
      error: err.message
    });

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
      audioUrl: s.song.audioUrl,
      youtubeId: s.song.youtubeId
    }));

    res.json(formattedSongs);

  }

  catch (err) {

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

  }

  catch (err) {

    console.error("DELETE ERROR:", err);

    res.status(500).json({
      error: err.message
    });

  }

};

const updateSong = async (req, res) => {
  try {
    const { id, title } = req.body;
    console.log(id,title)
    if (!id || !title) {
      return res.status(400).json({ error: "Song id and title are required" });
    }

    const song = await UserSong.findById(id);

    if (!song) {
      return res.status(404).json({ error: "Song not found" });
    }

    song.customTitle = title;
    await song.save();

    res.json({
      message: "Song title updated successfully!",
      song
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  addSong,
  getSongs,
  deleteSong,
  updateSong
};