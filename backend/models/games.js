const mongoose = require("mongoose");

const gamesSchema = mongoose.Schema({
  status: Boolean,
  started: Boolean,
  code: String,
  title: String,
  image: String,
  public: String,
  genre: String,
  nbPlayers: Number,
  nbScenes: Number,
  fullstory: String,
  winner: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  totalVotes: Number,
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  usersId: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
});

const Games = mongoose.model("games", gamesSchema);

module.exports = Games;
