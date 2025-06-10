var express = require("express");
var router = express.Router();

const Games = require("../models/games");
const User = require("../models/users");

const { calculateGameWinnerByCode } = require("../modules/calculateGameWinner");

// Route création de partie
router.post("/create/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((user) => {
    if (!user) {
      return res.json({ result: false, error: "Invalid token" });
    }

    // Fonction pour générer un code de jeu aléatoire
    function generateGameCode(length = 5) {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let result = "";
      for (let i = 0; i < length; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      return result;
    }

    const userId = user._id;
    let gameCode = generateGameCode(5);

    // Vérification que le code n'existe pas déjà
    Games.findOne({ code: gameCode }).then((existingGame) => {
      // Si le code existe, on en génère un nouveau
      if (existingGame) {
        // Boucle jusqu'à trouver un code unique
        const checkCode = () => {
          gameCode = generateGameCode(5);
          Games.findOne({ code: gameCode }).then((game) => {
            if (game) {
              checkCode(); // Récursion si le code existe encore
            } else {
              createGame(); // Créer la partie si le code est unique
            }
          });
        };
        checkCode();
      } else {
        createGame(); // Créer la partie si le code est unique
      }
    });

    function createGame() {
      const newGames = new Games({
        status: true, // true si la partie est en cours
        started: false, // false si la partie n'a pas encore commencé
        code: gameCode,
        title: req.body.title,
        image: req.body.image,
        public: req.body.public,
        genre: req.body.genre,
        nbPlayers: req.body.nbPlayers,
        nbScenes: req.body.nbScenes,
        winner: null,
        fullstory: null,
        totalVotes: null,
        hostId: userId,
        usersId: [userId], // Ajout de l'utilisateur créateur de la partie
      });

      newGames.save().then((newDoc) => {
        res.json({
          result: true,
          code: newDoc.code,
          title: newDoc.title,
          genre: newDoc.genre,
        });
      });
    }
  });
});

// Lancement de la partie
router.put("/start/:code", (req, res) => {
  Games.updateOne({ code: req.params.code }, { started: true }).then((data) => {
    if (data.modifiedCount === 0) {
      res.json({ result: false, message: "Game not started" });
    } else {
      res.json({ result: true, message: "Game successfully started" });
    }
  });
});

// Récupération des informations de la partie
router.get("/game/:code", async (req, res) => {
  try {
    const game = await Games.findOne({ code: req.params.code }).populate(
      "winner"
    );

    if (!game) {
      return res.json({ result: false, error: "Game not found" });
    }

    const responseGame = {
      ...game.toObject(),
      winner: game.winner?.nickname || null, 
    };

    res.json({ result: true, game: responseGame });
  } catch (error) {
    console.error("Erreur GET /game/:code", error);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

// Ajout d'un joueur à une partie
router.post("/join", (req, res) => {
  const { code, token } = req.body;

  User.findOne({ token }).then((user) => {
    if (!user) {
      return res.json({ result: false, error: "Invalid token" });
    }

    const userId = user._id;

    Games.findOne({ code })
      .populate("usersId")
      .then((game) => {
        if (!game) {
          return res.json({ result: false, error: "Game not found" });
        }

        if (game.usersId.length >= game.nbPlayers) {
          return res.json({ result: false, error: "Game is full" });
        }

        if (game.usersId.some((u) => u._id.equals(userId))) {
          return res.json({ result: false, error: "User already in game" });
        }

        Games.updateOne({ code }, { $push: { usersId: userId } }).then(() => {
          res.json({ result: true, message: `User added to game`, game });
        });
      });
  });
});

// Récupération des joueurs de la partie
router.get("/players/:gamecode", (req, res) => {
  Games.findOne({ code: req.params.gamecode })
    .populate("usersId")
    .then((data) => {
      if (data) {
        res.json({
          result: true,
          players: data.usersId.map((user) => ({
            id: user._id,
            nickname: user.nickname,
            avatar: user.avatar,
          })),
        });
      } else {
        res.json({ result: false, error: "No players found" });
      }
    });
});

// Route de récupération des parties d'un utilisateur via le token
router.get("/user/:token", (req, res) => {
  Games.find()
    .populate("usersId")
    .then((games) => {
      const userGames = games.filter((game) => {
        return game.usersId.some((user) => user.token === req.params.token);
      });
      res.json({ result: true, games: userGames });
    });
});

// Terminer une partie, ajouter un gagnant et l'histoire complète
router.put("/end/:code", async (req, res) => {
  const { code } = req.params;
  const { fullstory } = req.body;

  try {
    const gameUpdate = await Games.updateOne(
      { code },
      { status: false, fullstory: fullstory }
    );

    if (gameUpdate.modifiedCount === 0) {
      return res.json({
        result: false,
        error: "Game not found or not updated",
      });
    }

    const winnerResult = await calculateGameWinnerByCode(code);

    if (!winnerResult) {
      return res.json({ result: false, error: "Winner not calculated" });
    }

    const { winnerUserId, totalVotes } = winnerResult;

    // Récupération du nickname
    const winnerUser = await User.findById(winnerUserId);
    const nickname = winnerUser?.nickname || "Utilisateur inconnu";

    res.json({
      result: true,
      winner: nickname,
      totalVotes: totalVotes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

module.exports = router;
