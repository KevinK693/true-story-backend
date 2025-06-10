var express = require("express");
var router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

require("../models/connection");
const Scenes = require("../models/scenes");
const Games = require("../models/games");
const Users = require("../models/users");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Fonction pour générer du texte à l'aide de l'API Gemini
async function generateText(prompt) {
  try {
    // Utiliser le nouveau nom de modèle
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("No text generate by API.");
    }

    return text;
  } catch (error) {
    console.error("Error with API :", error.message);
    throw error;
  }
}

// Fonction pour créer le prompt de la première scène
function createFirstPrompt(title, genre, nbScene, public) {
  let prompt = `Écris le début pour les ${public} d'une histoire interactive en français dans le genre ${genre}, qui donnera le ton et la direction de l'histoire.

**Contexte et Protagonistes :**
- Décris plus en détail le contexte de l'histoire. Qui sont les personnages principaux ? Donne-leur des **prénoms originaux et variés** (pas de répétition d'une histoire à l'autre)
- Intègre l'idée ou le thème principal du "${title}" de manière organique dans le récit initial.

**Contraintes techniques :**
- Longueur : 400-600 caractères maximum
- Rythme narratif : adapte la progression de l'intrigue selon ${nbScene} scènes prévues mais ne génère qu'une seule scène.
- Le titre de l'histoire à prendre en compte pour l'inspiration est : "${title}".

**Style et ton :**
- Adopte les codes du genre ${genre} (atmosphère, vocabulaire, références). Pour la comédie, privilégie l'humour situationnel et des enjeux clairs plutôt que l'absurde pur.
Pour la comédie, privilégie l'humour situationnel et des enjeux clairs plutôt que l'absurde pur.
+ Si le genre est "comédie", privilégie l'humour **logique et contextuel** (quiproquos, maladresses, dialogues amusants), évite les situations incohérentes, les non-sens ou les blagues absurdes.
- Style immersif et captivant, sans surcharge descriptive.
- Narration à la 3e personne (le lecteur suit l'histoire, il n'est pas protagoniste).
- Assure la variété entre les générations successives.
- **Début aléatoire : Commence l'histoire de manière inattendue, sans préambule classique ni description environnementale habituelle. Surprends le lecteur dès la première phrase.**

**Structure narrative :**
- Établis rapidement le contexte, les personnages principaux et leurs enjeux.
- Termine par un cliffhanger marquant : tension, conflit, révélation ou question cruciale.
- Crée un momentum qui donne envie de connaître la suite.

**Important :** Ne propose AUCUN choix à la fin. L'histoire doit s'arrêter sur la tension narrative.`;

  // Ajout de la spécificité pour le public "enfant"
  if (public === "enfant") {
    prompt += `
  **Adaptation public "enfant" (6 ans) :**
  - Vocabulaire simple et phrases courtes.
  - Thèmes et concepts adaptés à l'âge (pas de peur intense, sujets compréhensibles).
  - Ambiance positive ou aventureuse pour la conclusion.`;
  }
  return prompt;
}

// Fonction pour créer le prompt pour les scènes suivantes
function createNextPrompt(text, history, remainingScenes, public, genre,) {
  let prompt = `Écris en français la suite de l'histoire interactive pour les ${public}.

**Contexte narratif :**
- Historique des scènes : ${history}
- Action choisie par les joueurs : "${text}"
- Scènes restantes : ${remainingScenes}

**Intégration de l'action :**
- Incorpore naturellement l'action "${text}" dans la continuité narrative
- Évite la répétition littérale : transforme, interprète ou développe l'idée
- Assure une transition fluide avec les événements précédents en gardant la cohérence de l'intrigue des scènes précédentes: ${history}.
- Maintiens la progression de l'histoire en tenant compte des choix précédents
- SURTOUT garde en tête le genre ${genre} pour adapter le ton et les enjeux.
Pour la comédie, privilégie l'humour situationnel et des enjeux clairs plutôt que l'absurde pur.
- Si le genre est "comédie", privilégie l'humour **logique et contextuel** (quiproquos, maladresses, dialogues amusants), évite les situations incohérentes, les non-sens ou les blagues absurdes.

**Contraintes techniques :**
- Longueur : 400-600 caractères maximum
- Rythme : calibre l'avancement selon les ${remainingScenes} scènes restantes mais ne génère qu'une seule scène
- Si peu de scènes restantes : accélère vers le dénouement
- Si nombreuses scènes : développe progressivement les enjeux

**Style narratif :**
- Maintiens la cohérence stylistique avec l'historique
- Style immersif et captivant, sans lourdeur descriptive
- Narration à la 3e personne (le lecteur suit l'histoire, il n'est pas protagoniste)
- **Variété des rebondissements : Propose des développements inattendus, des révélations ou des obstacles qui ne ressemblent pas aux précédents. Évite les schémas narratifs répétitifs.**
- Termine par un nouveau cliffhanger : tension, révélation ou dilemme

**Important :** Ne propose AUCUN choix. L'histoire s'arrête sur la tension narrative.`;
  // Ajout de la spécificité pour le public "enfant"
  if (public === "enfant") {
    prompt += `
  **Adaptation public "enfant" (6 ans) :**
  - Vocabulaire simple et phrases courtes.
  - Thèmes et concepts adaptés à l'âge (pas de peur intense, sujets compréhensibles).
  - Ambiance positive ou aventureuse pour la conclusion.`;
  }

  return prompt;
}

// Fonction pour créer le prompt de la dernière scène
function createLastPrompt(text, history, public,genre) {
  let prompt = `Écris en français la conclusion définitive de l'histoire interactive pour les ${public}.

**Contexte narratif :**
- Historique des scènes : ${history}
- Type de fin souhaitée : "${text}"
- SURTOUT garde en tête le genre ${genre} pour adapter le ton et les enjeux.
Pour la comédie, privilégie l'humour situationnel et des enjeux clairs plutôt que l'absurde pur.
- Si le genre est "comédie", privilégie l'humour **logique et contextuel** (quiproquos, maladresses, dialogues amusants), évite les situations incohérentes, les non-sens ou les blagues absurdes.

**Résolution narrative :**
- Intègre l'orientation de fin "${text}" de manière organique et narrative
- Ne reproduis pas directement le texte : interprète-le comme une direction créative
- Résous les conflits et tensions établis dans les scènes précédentes
- Assure une conclusion cohérente avec l'ensemble de l'histoire
- Fin **obligatoire** : l'histoire doit être totalement terminée, pas de cliffhanger ni d'ouverture.

**Contraintes techniques :**
- Longueur : 400-600 caractères maximum
- Structure : développement du climax + résolution + chute finale
- Rythme : conclusion satisfaisante sans précipitation

**Style narratif :**
- Maintiens la cohérence stylistique avec l'historique complet
- Style immersif et captivant, adapté au dénouement
- Ton approprié selon le type de fin (tragique, héroïque, mystérieux, etc.)
- Narration à la 3e personne (le lecteur suit l'histoire, il n'est pas protagoniste)
- Évite les fins abruptes : apporte une vraie conclusion

**Objectif :** Créer une fin mémorable avec une vraie conclusion. Tous les conflits doivent être résolus, les personnages doivent atteindre une forme de stabilité ou de transformation. Il ne doit rester **aucune question ouverte**. Le lecteur doit ressentir que **l'histoire est réellement terminée**.`;
  // Ajout de la spécificité pour le public "enfant"
    if (public === "enfant") {
      prompt += `
    **Adaptation public "enfant" (6 ans) :**
    - Vocabulaire simple et phrases courtes.
    - Thèmes et concepts adaptés à l'âge (pas de peur intense, sujets compréhensibles).
    - Ambiance positive ou aventureuse pour la conclusion.`;
    }

  return prompt;
}

//Route pour récupérer toutes les scènes d'une partie
router.get("/all/:code", (req, res) => {
  const { code } = req.params;
  Games.findOne({ code }).then((game) => {
    if (!game) {
      return res.json({ result: false, error: "Game not found" });
    }
    Scenes.find({ game: game._id }).then((scenes) => {
      if (scenes.length === 0) {
        return res.json({ result: false, error: "No scenes found" });
      } else {
        return res.json({ result: true, scenes });
      }
    });
  });
});

// Route pour générer la première scène
router.post("/firstScene", (req, res) => {
  const { code } = req.body;

  Games.findOne({ code: code })
    .then((game) => {
      if (!game) {
        return res.json({ result: false, error: "Game not found" });
      }

      const gameId = game._id;
      const title = game.title;
      const genre = game.genre;
      const nbScene = game.nbScenes;
      const isPublic = game.public;

      // Vérification si la scène 1 existe déjà
      Scenes.findOne({ game: gameId, sceneNumber: 1 }).then((existingScene) => {
        if (existingScene) {
          return res.json({
            result: false,
            error: "Scene 1 already exists",
          });
        }

        const prompt = createFirstPrompt(title, genre, nbScene, isPublic);

        generateText(prompt).then((generatedText) => {
          if (!generatedText || generatedText.length === 0) {
            return res.json({
              result: false,
              error: "L'API do not generate text",
            });
          }

          const firstScene = new Scenes({
            game: gameId,
            status: true, // si la scène est en cours
            sceneNumber: 1,
            voteWinner: null,
            propositions: [],
            text: generatedText,
          });

          firstScene.save().then((savedScene) => {
            res.json({ result: true, data: savedScene });
          });
        });
      });
    })
    .catch((error) => {
      console.error("Erreur dans /firstScene:", error);
      res.json({
        result: false,
        error: "Error while generating the first scene",
      });
    });
});

// Route pour générer la scène suivante
router.post("/nextScene", (req, res) => {
  const { code, text, history, remainingScenes, sceneNumber } = req.body;

  if (!code || !text) {
    return res.json({ result: false, error: "Code and text required" });
  }

  Games.findOne({ code }).then((game) => {
    if (!game) {
      return res.json({ result: false, error: "Game not found" });
    }

    const isPublic = game.public;

    // Vérification si la scène existe déjà
    Scenes.findOne({ game: game._id, sceneNumber }).then((existingScene) => {
      if (existingScene) {
        return res.json({
          result: false,
          error: `Scene ${sceneNumber} already exists`,
        });
      }

      const prompt = createNextPrompt(text, history, remainingScenes, isPublic);

      generateText(prompt).then((generatedText) => {
        if (!generatedText || generatedText.length === 0) {
          return res.json({
            result: false,
            error: "Api do not generate text",
          });
        }

        const newScene = new Scenes({
          game: game._id,
          status: true,
          sceneNumber: sceneNumber,
          text: generatedText,
          voteWinner: null,
          propositions: [],
        });

        newScene.save().then((savedScene) => {
          res.json({ result: true, data: savedScene });
        });
      });
    });
  });
});

// Route pour générer la dernière scène
router.post("/lastScene", (req, res) => {
  const { code, text, history, sceneNumber } = req.body;

  if (!code || !text) {
    return res.json({ result: false, error: "Code and text required" });
  }

  Games.findOne({ code }).then((game) => {
    if (!game) {
      return res.json({ result: false, error: "Game not found" });
    }

    const isPublic = game.public;

    // Vérification si la scène existe déjà
    Scenes.findOne({ game: game._id, sceneNumber }).then((existingScene) => {
      if (existingScene) {
        return res.json({
          result: false,
          error: `Scene ${sceneNumber} already exists`,
        });
      }

      const prompt = createLastPrompt(text, history, isPublic);

      generateText(prompt).then((generatedText) => {
        if (!generatedText || generatedText.length === 0) {
          return res.json({
            result: false,
            error: "Api do not generate text",
          });
        }

        const newScene = new Scenes({
          game: game._id,
          status: true,
          sceneNumber: sceneNumber,
          text: generatedText,
          voteWinner: null,
          propositions: [],
        });

        newScene
          .save()
          .then((savedScene) => {
            res.json({ result: true, data: savedScene });
          })
          .catch((err) => {
            console.error("Error", err);
            res.json({
              result: false,
              error: "Error",
            });
          });
      });
    });
  });
});

router.put("/status/:code/:sceneNumber", async (req, res) => {
  const { code, sceneNumber } = req.params;

  try {
    if (!code || !sceneNumber) {
      return res.json({
        result: false,
        error: "Code and sceneNumber required",
      });
    }

    const game = await Games.findOne({ code });
    if (!game) {
      return res.json({ result: false, error: "Game not found" });
    }

    const updateResult = await Scenes.updateOne(
      {
        game: game._id,
        sceneNumber: Number(sceneNumber),
      },
      {
        $set: { status: false },
      }
    );

    if (updateResult.modifiedCount === 0) {
      const existingScene = await Scenes.findOne({
        game: game._id,
        sceneNumber: Number(sceneNumber),
      });

      if (!existingScene) {
        return res.json({ result: false, error: "Scene not found" });
      } else {
        return res.json({
          result: true,
          message: "Scene status already false",
        });
      }
    }
    return res.json({ result: true, message: "Scene status updated to false" });
  } catch (error) {
    console.error("Erreur PUT status:", error);
    return res.json({ result: false, error: "Internal server error" });
  }
});

//Route pour récupérer le statut d'une scène
router.get("/status/:code/:sceneNumber", async (req, res) => {
  const { code, sceneNumber } = req.params;

  try {
    if (!code || !sceneNumber) {
      return res.json({
        result: false,
        error: "Code and sceneNumber required",
      });
    }

    const game = await Games.findOne({ code });
    if (!game) {
      return res.json({ result: false, error: "Game not found" });
    }

    const scene = await Scenes.findOne({
      game: game._id,
      sceneNumber: Number(sceneNumber),
    });

    if (!scene) {
      return res.json({ result: false, error: "Scene not found" });
    }
    return res.json({
      result: true,
      data: {
        status: scene.status,
        sceneNumber: scene.sceneNumber,
      },
    });
  } catch (error) {
    console.error("Erreur GET status:", error);
    return res.json({ result: false, error: "Internal server error" });
  }
});

//Route pour récupérer une scène et ses propositions
router.get("/code/:code/scene/:sceneNumber", (req, res) => {
  const { code, sceneNumber } = req.params;
  if (!code || !sceneNumber) {
    return res.json({ result: false, error: "Code and sceneNumber required" });
  }

  Games.findOne({ code })
    .then((game) => {
      if (!game) {
        return res.json({ result: false, error: "Game not found" });
      }
      
      return Scenes.findOne({
        game: game._id,
        sceneNumber: Number(sceneNumber),
      });
    })
    .then((scene) => {
      if (!scene) {
        return res.json({ result: false, error: "Scene not found" });
      }

      res.json({ result: true, data: scene });
    });
});

//Route pour envoyer une proposition d'un joueur donné à une scène donnée
router.put("/proposition/:code/:sceneNumber/:token", async (req, res) => {
  const { code, sceneNumber, token } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.json({ result: false, error: "gameId and text required" });
  }

  const game = await Games.findOne({ code });
  if (!game) {
    return res.json({ result: false, error: "Game not found" });
  }

  const user = await Users.findOne({ token });
  if (!user) {
    return res.json({ result: false, error: "User not found" });
  }

  const addProposition = await Scenes.updateOne(
    { game: game._id, sceneNumber: Number(sceneNumber) },
    { $push: { propositions: { userId: user._id, text: text, votes: 0 } } }
  );
  if (addProposition.modifiedCount === 0) {
    return res.json({ result: false, error: "Scene not updated" });
  }
  return res.json({ result: true, message: "Scene updated successfully" });
});

//Route pour ajouter un vote à une scène
router.put("/vote/:sceneId/:propositionId", async (req, res) => {
  const { sceneId, propositionId } = req.params;
  const result = await Scenes.updateOne(
    {
      _id: sceneId,
      "propositions._id": propositionId,
    },
    {
      $inc: { "propositions.$.votes": 1 },
    }
  );

  if (result.modifiedCount === 0) {
    return res.json({
      result: false,
      error: "Proposition not found or no update made",
    });
  }

  return res.json({ result: true, message: "Vote added" });
});

//Route pour ajouter le gagnant du vote à une scène
router.put("/voteWinner/:code/:sceneNumber", async (req, res) => {
  const { code, sceneNumber } = req.params;

  //Cherche le jeu via son code
  const game = await Games.findOne({ code });
  if (!game) {
    return res.json({ result: false, error: "Game not found" });
  }

  //Cherche la scène via son numéro et l'id du jeu
  const scene = await Scenes.findOne({
    game: game._id,
    sceneNumber: Number(sceneNumber),
  });
  if (!scene) {
    return res.json({ result: false, error: "Scene not found" });
  }

  //Cherche le gagnant des votes parmi les propositions
  const winner = scene.propositions.reduce(
    (max, prop) => (prop.votes > max.votes ? prop : max),
    scene.propositions[0]
  );
  if (!winner) {
    return res.json({ result: false, error: "No winner found" });
  }

  //Cherche l'utilisateur via son userId
  const user = await Users.findOne({ _id: winner.userId });
  if (!user) return res.json({ result: false, error: "User not found" });

  //Met à jour la scène avec le pseudo du gagnant
  const updateScene = await Scenes.updateOne(
    { _id: scene._id },
    { $set: { voteWinner: user.nickname } }
  );
  if (updateScene.modifiedCount === 0) {
    return res.json({ result: false, error: "Scene not updated" });
  }
  return res.json({
    result: true,
    message: "Winner updated successfully",
  });
});

//Route pour récupérer le gagnant du vote d'une scène
router.get("/voteWinner/:code/:sceneNumber", async (req, res) => {
  const { code, sceneNumber } = req.params;

  const game = await Games.findOne({ code });
  if (!game) {
    return res.json({ result: false, error: "Game not found" });
  }

  const scene = await Scenes.findOne({
    game: game._id,
    sceneNumber: Number(sceneNumber),
  });
  if (!scene || !scene.voteWinner) {
    return res.json({ result: false, error: "Winner not yet defined" });
  }

  // Trouver la proposition gagnante
  const maxVotes = scene.propositions.reduce(
    (max, prop) => (prop.votes > max.votes ? prop : max),
    scene.propositions[0]
  );

  const winnersWithMaxVotes = scene.propositions.filter(
    (prop) => prop.votes === maxVotes.votes
  );

  const winner = winnersWithMaxVotes[0];

  const user = await Users.findOne({ _id: winner.userId });
  if (!user) return res.json({ result: false, error: "User not found" });

  return res.json({
    result: true,
    data: {
      nickname: user.nickname,
      text: winner.text,
      votes: winner.votes,
      avatar: user.avatar,
      status: scene.status,
    },
  });
});

module.exports = router;
