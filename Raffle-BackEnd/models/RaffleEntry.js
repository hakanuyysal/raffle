const mongoose = require("mongoose");

const RaffleEntrySchema = new mongoose.Schema(
  {
    name: { type: String, require: true },
    team: { type: String },
    matchedWith: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RaffleEntry", RaffleEntrySchema);
