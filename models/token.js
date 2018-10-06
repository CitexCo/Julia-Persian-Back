const mongoose = require("mongoose");

const tokenValues = new mongoose.Schema({
  to: { type: String, required: false },
  from: { type: String, required: false },
  value: { type: Number, required: false }
});

const tokenSchema = new mongoose.Schema({
  timestamp: { type: String },
  transactionHash: { type: String, required: false },
  blockNumber: { type: String, required: false },
  address: { type: String, required: false },
  type: { type: String, required: false },
  event: { type: String, required: false },
  returnValues: { type: tokenValues, required: false }
});

const Token = mongoose.model("token", tokenSchema);

module.exports = Token;
