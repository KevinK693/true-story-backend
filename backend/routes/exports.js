const express = require("express");
const router = express.Router();
const { generateVoice, generatePDF } = require("../modules/exports");

// 🎧 Génération audio
router.post("/generate", async (req, res) => {
  const { text } = req.body;

  if (!text) return res.status(400).send("Texte requis");

  try {
    const audioStream = await generateVoice(text);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", "attachment; filename=audio.mp3");
    audioStream.pipe(res);
  } catch (err) {
    console.error("Erreur ElevenLabs :", err.message);
    res.status(500).send("Erreur audio");
  }
});

// 📄 Génération PDF (version avec le module propre)
router.post("/pdf", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).send("Texte requis");

  try {
    await generatePDF(text, res);
  } catch (err) {
    console.error("Erreur PDF :", err.message);
    res.status(500).send("Erreur PDF");
  }
});

module.exports = router;