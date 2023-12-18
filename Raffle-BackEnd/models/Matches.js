const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: "RaffleEntry" },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: "RaffleEntry" },
});

const Match = mongoose.model("Match", MatchSchema);

module.exports = Match;
