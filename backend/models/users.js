const mongoose = require("mongoose");

const usersSchema = mongoose.Schema({
  email: String,
  token: String,
  password: String,
  nickname: String,
  avatar: String,
  scenesId: { type: mongoose.Schema.Types.ObjectId, ref: 'scenes' },
  gamesId: { type: mongoose.Schema.Types.ObjectId, ref: 'games' },
});

const Users = mongoose.model("users", usersSchema);

module.exports = Users;
