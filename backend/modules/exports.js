const fetch = require("node-fetch");
const fs = require("fs");
const PDFDocument = require("pdfkit");

// Fonction pour générer le fichier audio depuis ElevenLabs
async function generateVoice(text) {
  const API_KEY = process.env.ELEVEN_API_KEY;
  const VOICE_ID = process.env.VOICE_ID;

  if (!API_KEY || !VOICE_ID) {
    throw new Error("Clé API ou Voice ID manquant");
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("Erreur ElevenLabs : " + errorText);
  }

  return response.body; // flux audio
}

// Fonction pour générer un fichier PDF depuis le texte
async function generatePDF(text, res) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=texte.pdf");

      doc.pipe(res);
      doc.fontSize(16).text(text, { align: "left" });
      doc.end();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateVoice, generatePDF };
