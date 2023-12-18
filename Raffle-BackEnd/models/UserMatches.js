const mongoose = require("mongoose");

const UserMatchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "RaffleEntry" },
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: "Match" },
});

const UserMatch = mongoose.model("UserMatch", UserMatchSchema);

module.exports = UserMatch;
