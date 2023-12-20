const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema({
  name: { type: String },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "RaffleEntry" }],
});

module.exports = mongoose.model("TeamSchema", TeamSchema);
