var express = require("express");
var router = express.Router();

const Games = require("../models/games");

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

//module.exports = router;