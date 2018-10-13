const mongoose = require("mongoose");
var Schema = mongoose.Schema;
autoIncrement = require("mongoose-auto-increment");
const DateUtils = require("../middlewares/date-utils");
const conf = require("config");
const User = require("./user");

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
  //Transfered Date to Blockchain
  lastTransferedDate: { type: Date },
  transferedToBlockchain: { type: Boolean, default: false },
  transactionHash: { type: String },
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

  transferRequest = await TransferRequest.findOne(query);
  if (!transferRequest) {
    throw new Error("TransferRequest not found");
  }
  return transferRequest;
};

module.exports.getTransferRequestBytransactionHash = async function(transactionHash) {
  const query = { transactionHash: transactionHash };

  return await TransferRequest.findOne(query);
};

module.exports.getUserTransferRequests = async function(userId, reqStatus) {
  const query = { user: userId };
  if (reqStatus) {
    query["status"] = reqStatus;
  }

  return await TransferRequest.find(query, { _id: 0 })
    .sort("-date")
    .exec();
};

module.exports.getAllTransferRequests = async function(reqStatus) {
  var query = {};

  if (reqStatus) {
    query["status"] = reqStatus;
  }

  return await TransferRequest.find(query, { _id: 0 })
    .sort("-date")
    .exec();
};

module.exports.getAllReadyTransferRequests = async function() {
  var expDate = await DateUtils.subMinutes(new Date(), conf.get("retransferBlockchainMinutes"));

  var query = {
    status: "Approved",
    transferedToBlockchain: false,
    $or: [{ lastTransferedDate: { $exists: false } }, { lastTransferedDate: { $lte: expDate } }]
  };

  transferRequests = await TransferRequest.find(query, { _id: 0 })
    .sort("-date")
    .exec();
  var res = [];
  for (transferRequest of transferRequests) {
    user = await User.getUserByEmail(transferRequest.userEmail);
    var ts = {
      transferRequestNumber: transferRequest.transferRequestNumber,
      transactionHash: transferRequest.transactionHash,
      transferedToBlockchain: transferRequest.transferedToBlockchain,
      lastTransferedDate: transferRequest.lastTransferedDate,
      amount: transferRequest.amount,
      userEmail: transferRequest.userEmail,
      walletAddress: user.walletAddress
    };
    res.push(ts);
  }
  return res;
};
