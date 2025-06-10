const mongoose = require("mongoose");
const Scenes = require("../models/scenes"); 
const Games = require("../models/games"); 

// Fonction pour calculer le gagnant de la partie
async function calculateGameWinnerByCode(gameCode) {
  try {
    // Recherche du jeu correspondant au code fourni
    const game = await Games.findOne({ code: gameCode });
    if (!game) {
      console.log("Aucun jeu trouvé avec ce code");
      return null;
    }

    const gameId = game._id; // On extrait l'ID MongoDB du jeu trouvé

    // Agrégation des votes par utilisateur à travers les scènes du jeu
    const result = await Scenes.aggregate([
      {
        // On filtre les scènes associées à ce jeu
        $match: { game: new mongoose.Types.ObjectId(gameId) },
      },
      {
        // On "déplie" les propositions pour pouvoir les analyser individuellement
        $unwind: "$propositions",
      },
      {
        // On groupe les propositions par `userId` et on somme les votes
        $group: {
          _id: "$propositions.userId",
          totalVotes: { $sum: "$propositions.votes" },
        },
      },
      {
        // On trie les utilisateurs par nombre de votes décroissant
        $sort: { totalVotes: -1 },
      },
      {
        // On ne garde que le premier : celui qui a le plus de votes
        $limit: 1,
      },
    ]);

    // Récupération des données du gagnant
    const winnerUserId = result[0]?._id;
    const totalVotes = result[0]?.totalVotes;

    if (!winnerUserId) {
      console.log("Aucun gagnant trouvé");
      return null;
    }

    // Mise à jour du document `Game` avec l'ID du gagnant et le nombre de votes
    await Games.findByIdAndUpdate(gameId, {
      winner: winnerUserId.toString(),
      totalVotes: totalVotes,
    });

    console.log(`Gagnant défini pour le jeu ${gameCode} : ${winnerUserId}`);

    // Retourne les infos du gagnant
    return { winnerUserId, totalVotes };
  } catch (error) {
    // Gestion des erreurs
    console.error("Erreur lors du calcul du gagnant :", error);
    return null;
  }
}

module.exports = { calculateGameWinnerByCode };
