const mongoose = require("mongoose");

const propositionsSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  text: String,
  votes: Number,
});

const scenesSchema = mongoose.Schema({
  game: { type: mongoose.Schema.Types.ObjectId, ref: "games" },
  status: Boolean,
  sceneNumber: Number,
  text: String,
  voteWinner: String,
  propositions: [propositionsSchema],
});

const Scenes = mongoose.model("scenes", scenesSchema);

module.exports = Scenes;
