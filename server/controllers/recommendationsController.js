const Groq = require("groq-sdk");
const UserSong = require("../models/UserSong");

const getRecommendations = async (req, res) => {
  try {
    const userSongs = await UserSong.find({ user: req.userId })
      .select("customTitle")
      .sort({ createdAt: -1 })
      .limit(50);

    if (userSongs.length === 0) {
      return res.json({ recommendations: [] });
    }

    const songTitles = userSongs.map(s => s.customTitle).filter(Boolean);

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Based on this music library, recommend 8 songs the user would likely enjoy. Return ONLY a valid JSON array of objects with "title" and "artist" fields. No markdown, no explanation, no extra text.

Library:
${songTitles.join("\n")}

Return exactly this format:
[{"title":"Song Name","artist":"Artist Name"},...]`
        }
      ]
    });

    const text = completion.choices[0]?.message?.content?.trim() || "[]";
    let recommendations;

    try {
      recommendations = JSON.parse(text);
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      recommendations = match ? JSON.parse(match[0]) : [];
    }

    if (!Array.isArray(recommendations)) recommendations = [];

    res.json({ recommendations });
  } catch (err) {
    console.error("RECOMMENDATIONS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getRecommendations };
