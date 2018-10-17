const express = require("express");
const router = express.Router();
const passport = require("passport");
const multer = require("multer");
const path = require("path");
const randToken = require("rand-token");
const conf = require("config");

const User = require("../models/user");
const Account = require("../models/account");
const Exchanger = require("../models/exchanger");
const Admin = require("../models/admin");
const Receipt = require("../models/receipt");
const Price = require("../models/price");
const ForgottenPasswordToken = require("../models/forgotPassword");
const BurnRequest = require("../models/burnRequest");
const TransferRequest = require("../models/transferRequest");

const Log = require("../middlewares/log");
const Email = require("../middlewares/email");
const authorize = require("../middlewares/authorize");
const i18n = require("../middlewares/i18n");
const config = require("../config/setting");

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: function(req, file, cb) {
    raw = randToken.generate(16);
    cb(null, raw.toString("hex") + Date.now() + path.extname(file.originalname));
  }
});
var upload = multer({ storage: storage });

// Register Exchanger
router.post(
  "/register-exchanger",
  [passport.authenticate("jwt", { session: false }), i18n, authorize, upload.single("image")],
  async (req, res, next) => {
    const enabled = req.body.enabled;
    var newExchanger = new Exchanger({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      address: req.body.address,
      telephone: req.body.telephone
    });
    if (req.file) {
      newExchanger.imageAddress = req.file.filename;
    }
    account = await Exchanger.addExchanger(newExchanger, enabled);
    var passwordToken = new ForgottenPasswordToken({
      email: req.body.email
    });
    passwordToken = await ForgottenPasswordToken.forgotPassword(passwordToken);

    var locals = { server: config.serverAddr, email: account.email, passwordToken: passwordToken.token };
    await Email.sendMail(account.email, "register-other", locals);
    Log(req, "Exchanger registered successfuly", account.email);
    return res.json({
      success: true,
      msg: __("Exchanger registered successfuly")
    });
  }
);

// Register Admin
router.post(
  "/register-admin",
  [passport.authenticate("jwt", { session: false }), i18n, authorize, upload.single("image")],
  async (req, res, next) => {
    const enabled = req.body.enabled;
    roles = [];
    JSON.parse(req.body.roles).forEach(async role => {
      roles.push({ roleTitle: role });
    });
    var newAdmin = new Admin({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      roles: roles,
      superAdmin: false
    });
    if (req.file) {
      newAdmin.imageAddress = req.file.filename;
    }
    account = await Admin.addAdmin(newAdmin, enabled);
    var passwordToken = new ForgottenPasswordToken({
      email: req.body.email
    });
    passwordToken = await ForgottenPasswordToken.forgotPassword(passwordToken);

    var locals = { server: config.serverAddr, email: account.email, passwordToken: passwordToken.token };
    await Email.sendMail(account.email, "register-other", locals);
    Log(req, "Admin registered successfuly", account.email);
    return res.json({
      success: true,
      msg: __("Admin registered successfuly")
    });
  }
);

// list All admins
router.get("/admins", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  admins = await Admin.getAdminsList();
  Log(req, "All admins list returned", req.user.email);
  res.json({ success: true, admins: admins });
});

// list All exchangers
router.get("/exchangers", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  exchangers = await Exchanger.getExchangersList();
  Log(req, "All exchangers list returned", req.user.email);
  res.json({ success: true, exchangers: exchangers });
});

// list All users
router.get("/users", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  users = await User.getUsersList();
  Log(req, "All users list returned", req.user.email);
  res.json({ success: true, users: users });
});

// list admin's own roles
router.get("/roles", [passport.authenticate("jwt", { session: false }), i18n], async (req, res, next) => {
  const email = req.user.email;
  roles = await Admin.getRoles(email);
  Log(req, "Roles returned", req.user.email);
  res.json({ success: true, roles: roles });
});
// list admin's own roles
router.get("/all-roles", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  roles = await Admin.getAllRoles();
  Log(req, "All Roles returned", req.user.email);
  res.json({ success: true, roles: roles });
});

// Verify KYC
router.post("/verifykyc", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  const verifyFirstName = req.body.verifyFirstName;
  const verifyLastName = req.body.verifyLastName;
  const verifyBirthDate = req.body.verifyBirthDate;
  const verifyAddress = req.body.verifyAddress;
  const verifyPassportImage = req.body.verifyPassportImage;
  const verifyImage = req.body.verifyImage;
  const verifyTelephone = req.body.verifyTelephone;
  const email = req.body.email;
  var verifyWallet = false;
  user = await User.getUserByEmail(email);
  if (user.hasWallet) {
    verifyWallet = req.body.verifyWallet;
  } else {
    verifyWallet = true;
  }
  if (
    verifyFirstName &&
    verifyLastName &&
    verifyBirthDate &&
    verifyWallet &&
    verifyAddress &&
    verifyPassportImage &&
    verifyTelephone &&
    verifyImage
  ) {
    await Email.sendMail(user.email, "KYCVerified", req.body);

    user.KYCUpdated = false;
    user.KYCVerified = true;
    user.enabled = true;

    await user.save();
    Log(req, user.email + " KYC verified", req.user.email);
    return res.json({ success: true, msg: "User KYC verified" });
  } else {
    await Email.sendMail(user.email, "KYCNotVerified", req.body);

    user.KYCVerified = false;
    user.KYCUpdated = false;
    await user.save();
    Log(req, user.email + " KYC not verified", req.user.email);
    return res.json({ success: true, msg: "User KYC not verified" });
  }
});

// Disable User
router.post("/disable", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  const email = req.body.email;
  account = await Account.getAccountByEmail(email);
  account.enabled = false;
  await account.save();
  Log(req, email + " disabled successfuly", req.user.email);
  return res.json({ success: true, msg: __("Account %s disabled successfuly", email) });
});

// Enable User
router.post("/enable", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  const email = req.body.email;
  account = await Account.getAccountByEmail(email);
  account.enabled = true;
  await account.save();
  Log(req, email + " enabled successfuly", req.user.email);
  return res.json({ success: true, msg: __("Account %s enabled successfuly", email) });
});

// user, verifyKYC, changeRoles, answerTicket, userManager, RPCManager
// Change Roles
router.post("/changeroles", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  const email = req.body.email;
  if (req.body.email == req.user.email) {
    throw new Error("You can not change own role");
  } else {
    admin = await Admin.getAdminByEmail(email);
    if (admin.superAdmin) {
      throw new Error("You can not change superAdmin roles");
    } else {
      roles = [];
      JSON.parse(req.body.roles).forEach(async role => {
        roles.push({ roleTitle: role });
      });

      user.roles = roles;
      var roleStr = "";
      roles.forEach(function(role, index, array) {
        roleStr = roleStr + role.roleTitle + ",";
      });
      roleStr = roleStr.slice(0, -1);
      await user.save();
      Log(req, "Roles(" + roleStr + ") of User(" + email + ") changed successfuly", req.user.email);
      return res.json({ success: true, msg: "Roles change successfuly" });
    }
  }
});

// Get Users List for KYC
router.get("/listkyc", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  users = await User.getUsersListKYC();
  Log(req, "Get users list successfuly", req.user.email);
  return res.json({ success: true, users: users });
});

// Get KYC informations of a user
router.post("/get-kyc", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  const email = req.body.email;

  user = await User.getUserKYC(email);
  Log(req, "Get user KYC info successfuly", req.user.email);
  return res.json({ success: true, user: user });
});

// list all Receipt submited
router.get("/list-receipt", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  receipts = await Receipt.getAllReceipts();
  Log(req, "Receipts list returned", req.user.email);
  res.json({ success: true, receipts: receipts });
});

// list all Receipt approved by admin
router.get("/list-approved-receipt", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  receipts = await Receipt.getAllReceipts("Approved");
  Log(req, "Approved Receipts list returned", req.user.email);
  res.json({ success: true, receipts: receipts });
});

// list all Receipt rejected by admin
router.get("/list-rejected-receipt", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  receipts = await Receipt.getAllReceipts("Rejected");
  Log(req, "Rejected Receipts list returned", req.user.email);
  res.json({ success: true, receipts: receipts });
});

// list all Receipt submited by user and exchange and ready for admin response
router.get("/list-pending-receipt", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  var hasUser = true;
  receipts = await Receipt.getAllReceipts("Pending", hasUser);
  Log(req, "Pending Receipts list returned", req.user.email);
  res.json({ success: true, receipts: receipts });
});

// modify receipt amount by admin
router.post("/modify-receipt", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  const receiptNumber = Number(req.body.receiptNumber);
  const amount = req.body.amount;

  receipt = await Receipt.getReceiptByNumber(receiptNumber);
  if (receipt.status != "Pending" || receipt.userSubmitDate || receipt.exchangerSubmitDate) {
    throw new Error("You can modify incomplete receipts only");
  }
  receipt.amount = amount;
  await receipt.save();

  Log(req, "Receipt number " + receipt.receiptNumber + " modified", req.user.email);
  res.json({ success: true, msg: __("Receipt number %i modified successfuly", receipt.receiptNumber) });
});

// approve receipt by admin
router.post("/approve-receipt", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  const receiptNumber = Number(req.body.receiptNumber);
  const comment = req.body.comment;

  receipt = await Receipt.getReceiptByNumber(receiptNumber);
  if (receipt.status != "Pending") {
    throw new Error("Admin can approve pending receipts only");
  }
  receipt.admin = req.user._id;
  receipt.adminEmail = req.user.email;
  receipt.adminComment = comment;
  receipt.adminSubmitDate = new Date();
  receipt.status = "Approved";
  price = await Price.getLastPrice(receipt.userSubmitDate);
  user = await User.getUserByEmail(receipt.userEmail);
  user.balance += receipt.amount / price.price;
  await receipt.save();

  await user.save();
  var locals = { amount: receipt.amount, receiptRequestNumber: receipt.receiptNumber, approved: true };
  await Email.sendMail(req.user.email, "responseReceipt", locals);
  Log(req, "Receipt number " + receipt.receiptNumber + " approved", req.user.email);
  res.json({ success: true, msg: __("Receipt number %i approved successfuly", receipt.receiptNumber) });
});

// reject receipt by admin
router.post("/reject-receipt", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  const receiptNumber = Number(req.body.receiptNumber);
  const comment = req.body.comment;

  receipt = await Receipt.getReceiptByNumber(receiptNumber);
  if (receipt.status != "Pending") {
    throw new Error("Admin can reject pending receipts only");
  }
  receipt.admin = req.user._id;
  receipt.adminEmail = req.user.email;
  receipt.adminComment = comment;
  receipt.adminSubmitDate = new Date();
  receipt.status = "Rejected";
  receipt = await receipt.save();
  var locals = { amount: receipt.amount, receiptRequestNumber: receipt.receiptNumber, approved: false };
  await Email.sendMail(req.user.email, "responseReceipt", locals);
  Log(req, "Receipt number " + receipt.receiptNumber + " rejected", req.user.email);
  res.json({ success: true, msg: __("Receipt number %i rejected successfuly", receipt.receiptNumber) });
});

// list all BurnRequest submited
router.get("/list-burn", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  burnRequests = await BurnRequest.getAllBurnRequests();
  Log(req, "BurnRequests list returned", req.user.email);
  res.json({ success: true, burnRequests: burnRequests });
});

// list all BurnRequest approved by admin
router.get("/list-approved-burn", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  burnRequests = await BurnRequest.getAllBurnRequests("Approved");
  Log(req, "Approved BurnRequests list returned", req.user.email);
  res.json({ success: true, burnRequests: burnRequests });
});

// list all BurnRequest rejected by admin
router.get("/list-rejected-burn", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  burnRequests = await BurnRequest.getAllBurnRequests("Rejected");
  Log(req, "Rejected BurnRequests list returned", req.user.email);
  res.json({ success: true, burnRequests: burnRequests });
});

// list all BurnRequest submited by user and ready for admin response
router.get("/list-pending-burn", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  burnRequests = await BurnRequest.getAllBurnRequests("Pending");
  Log(req, "Pending BurnRequests list returned", req.user.email);
  res.json({ success: true, burnRequests: burnRequests });
});

// approve burn by admin
router.post("/approve-burn", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  const burnRequestNumber = Number(req.body.burnRequestNumber);

  burnRequest = await BurnRequest.getBurnRequestByNumber(burnRequestNumber);

  if (burnRequest.status != "Pending") {
    throw new Error("Admin can approve pending burnRequests only");
  }
  burnRequest.admin = req.user._id;
  burnRequest.adminEmail = req.user.email;
  burnRequest.adminComment = req.body.comment;
  burnRequest.adminSubmitDate = new Date();
  burnRequest.status = "Approved";
  user = await User.getUserByEmail(burnRequest.userEmail);
  if (burnRequest.amount > user.balance) {
    throw new Error("Requested amount greater than user's balance");
  }
  user.balance = user.balance - burnRequest.amount;
  await user.save();

  await burnRequest.save();
  var locals = { amount: burnRequest.amount, burnRequestNumber: burnRequest.burnRequestNumber, approved: true };
  await Email.sendMail(req.user.email, "responseBurnRequest", locals);
  Log(req, "BurnRequest number (" + burnRequest.burnRequestNumber + ") Approved", req.user.email);

  res.json({ success: true, msg: __("BurnRequest number %i approved", burnRequest.burnRequestNumber) });
});

// reject burn by admin
router.post("/reject-burn", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  const burnRequestNumber = Number(req.body.burnRequestNumber);

  burnRequest = await BurnRequest.getBurnRequestByNumber(burnRequestNumber);
  if (burnRequest.status != "Pending") {
    throw new Error("Admin can reject pending burnRequests only");
  }
  burnRequest.admin = req.user._id;
  burnRequest.adminEmail = req.user.email;
  burnRequest.adminComment = req.body.comment;
  burnRequest.adminSubmitDate = new Date();
  burnRequest.status = "Rejected";
  await burnRequest.save();

  var locals = { amount: burnRequest.amount, burnRequestNumber: burnRequest.burnRequestNumber, approved: false };
  await Email.sendMail(req.user.email, "responseBurnRequest", locals);
  Log(req, "BurnRequest number (" + burnRequest.burnRequestNumber + ") Rejected", req.user.email);
  res.json({ success: true, msg: __("BurnRequest number %i rejected", burnRequest.burnRequestNumber) });
});

// list all TransferRequest submited
router.get("/list-transfer", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  transferRequests = await TransferRequest.getAllTransferRequests();
  Log(req, "TransferRequests list returned", req.user.email);
  res.json({ success: true, transferRequests: transferRequests });
});

// list all TransferRequest approved by admin
router.get("/list-approved-transfer", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  transferRequests = await TransferRequest.getAllTransferRequests("Approved");
  Log(req, "Approved TransferRequests list returned", req.user.email);
  res.json({ success: true, transferRequests: transferRequests });
});

// list all TransferRequest rejected by admin
router.get("/list-rejected-transfer", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  transferRequests = await TransferRequest.getAllTransferRequests("Rejected");
  Log(req, "Rejected TransferRequests list returned", req.user.email);
  res.json({ success: true, transferRequests: transferRequests });
});

// list all TransferRequest submited by user and ready for admin response
router.get("/list-pending-transfer", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  transferRequests = await TransferRequest.getAllTransferRequests("Pending");
  Log(req, "Pending TransferRequests list returned", req.user.email);
  res.json({ success: true, transferRequests: transferRequests });
});

// list all TransferRequest approved by admin
router.get("/list-ready-transfer", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  transferRequests = await TransferRequest.getAllReadyTransferRequests();
  Log(req, "Ready TransferRequests list returned", req.user.email);
  res.json({ success: true, transferRequests: transferRequests });
});

// Transfer to blockchain by admin
router.post("/transfer-blockchain", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  const transferRequestNumber = Number(req.body.transferRequestNumber);
  const transactionHash = req.body.transactionHash;
  transferRequest = await TransferRequest.getTransferRequestByNumber(transferRequestNumber);
  if (transferRequest.transferedToBlockchain) {
    throw new Error("TranferRequest sent to blockchain before");
  }
  if (transferRequest.lastTransferedDate) {
    exp = await DateUtils.addminutes(new Date(), conf.get("retransferBlockchainMinutes")); // 15 minutes
    if (exp > new Date()) {
      throw new Error("You must wait 15 minutes until send again");
    }
  }
  transferRequest.lastTransferedDate = new Date();
  transferRequest.transactionHash = transactionHash;
  transferRequest.save();
  Log(req, "TransferRequest number (" + transferRequest.transferRequestNumber + ") sent to blockchain", req.user.email);

  res.json({ success: true, msg: __("TransferRequest number %i sent to blockchain", transferRequest.transferRequestNumber) });
});

// approve burn by admin
router.post("/approve-transfer", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  const transferRequestNumber = Number(req.body.transferRequestNumber);

  transferRequest = await TransferRequest.getTransferRequestByNumber(transferRequestNumber);

  if (transferRequest.status != "Pending") {
    throw new Error("Admin can approve pending transferRequests only");
  }
  transferRequest.admin = req.user._id;
  transferRequest.adminEmail = req.user.email;
  transferRequest.adminComment = req.body.comment;
  transferRequest.adminSubmitDate = new Date();
  transferRequest.status = "Approved";
  user = await User.getUserByEmail(transferRequest.userEmail);
  if (transferRequest.amount > user.balance) {
    throw new Error("Requested amount greater than user's balance");
  }
  user.balance = user.balance - transferRequest.amount;
  await user.save();

  await transferRequest.save();
  var locals = { amount: transferRequest.amount, transferRequestNumber: transferRequest.transferRequestNumber, approved: true };
  await Email.sendMail(req.user.email, "responseTransferRequest", locals);
  Log(req, "TransferRequest number (" + transferRequest.transferRequestNumber + ") Approved", req.user.email);

  res.json({ success: true, msg: __("TransferRequest number %i approved", transferRequest.transferRequestNumber) });
});

// reject burn by admin
router.post("/reject-transfer", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  const transferRequestNumber = Number(req.body.transferRequestNumber);

  transferRequest = await TransferRequest.getTransferRequestByNumber(transferRequestNumber);
  if (transferRequest.status != "Pending") {
    throw new Error("Admin can reject pending transferRequests only");
  }
  transferRequest.admin = req.user._id;
  transferRequest.adminEmail = req.user.email;
  transferRequest.adminComment = req.body.comment;
  transferRequest.adminSubmitDate = new Date();
  transferRequest.status = "Rejected";
  await transferRequest.save();

  var locals = { amount: transferRequest.amount, transferRequestNumber: transferRequest.transferRequestNumber, approved: false };
  await Email.sendMail(req.user.email, "responseTransferRequest", locals);
  Log(req, "TransferRequest number (" + transferRequest.transferRequestNumber + ") Rejected", req.user.email);
  res.json({ success: true, msg: __("TransferRequest number %i rejected", transferRequest.transferRequestNumber) });
});
module.exports = router;
