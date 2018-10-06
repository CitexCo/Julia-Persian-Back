const mongoose = require("mongoose");
var Schema = mongoose.Schema;

// TransferRequest Schema
const TransferRequestSchema = mongoose.Schema({
  amount: { type: Number, required: true },
  tokenPrice: { type: Number, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userEmail: { type: String, required: true },
  userComment: { type: String },
  userSubmitDate: { type: Date },
  admin: { type: Schema.Types.ObjectId, ref: "User" },
  adminEmail: { type: String },
  adminComment: { type: String },
  adminSubmitDate: { type: Date },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Canceled"],
    default: "Pending"
  }
});

TransferRequestSchema.plugin(autoIncrement.plugin, {
  model: "TransferRequest",
  field: "transferRequestNumber",
  startAt: 10000
});

const TransferRequest = (module.exports = mongoose.model("TransferRequest", TransferRequestSchema));

module.exports.getTransferRequestByNumber = async function(transferRequestNumber) {
  const query = { transferRequestNumber: transferRequestNumber };

  TransferRequest = await TransferRequest.findOne(query);
  if (!TransferRequest) {
    throw new Error("TransferRequest not found");
  }
  return TransferRequest;
};

module.exports.getUserTransferRequests = async function(userId, reqStatus) {
  const query = { user: userId };
  if (reqStatus) {
    query["status"] = reqStatus;
  }

  return await TransferRequest.find(query, { _id: 0, verificationToken: 0, verificationTokenExpire: 0 })
    .sort("-date")
    .exec();
};

module.exports.getAllTransferRequests = async function(reqStatus) {
  var query = {};

  if (reqStatus) {
    query["status"] = reqStatus;
  }

  return await TransferRequest.find(query, { _id: 0, verificationToken: 0, verificationTokenExpire: 0 })
    .sort("-date")
    .exec();
};
