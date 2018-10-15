const express = require("express");
const router = express.Router();
const passport = require("passport");
const randToken = require("rand-token");
const multer = require("multer");
const path = require("path");

const Log = require("../middlewares/log");
const Ticket = require("../models/ticket");
const Email = require("../middlewares/email");
const i18n = require("../middlewares/i18n");
const authorize = require("../middlewares/authorize");

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
// Create new ticket
router.post("/create", [passport.authenticate("jwt", { session: false }), i18n, upload.single("attachment")], async (req, res, next) => {
  const userEmail = req.user.email;
  let newTicket = new Ticket({
    userEmail: userEmail,
    subject: req.body.subject,
    description: req.body.description,
    tokenType: req.body.tokenType,
    recieveEmail: req.body.recieveEmail
  });
  if (req.file) {
    newTicket.attachmentAddress = req.file.filename;
    newTicket.attachmentName = req.file.originalname;
  }
  await newTicket.save();
  Log(req, "Ticket number " + newTicket.ticketNumber + " Created", req.user.email);
  res.json({ success: true, msg: __("Ticket number %i created successfuly", newTicket.ticketNumber) });
});

// Cancel own ticket
router.post("/cancel", [passport.authenticate("jwt", { session: false }), i18n], async (req, res, next) => {
  const userEmail = req.user.email;
  const ticketNumber = req.body.ticketNumber;

  ticket = await Ticket.getTicketByNumber(ticketNumber);
  if (ticket.userEmail != userEmail) {
    throw new Error("You can not cancel others' ticket");
  } else {
    ticket.status = "Canceled";
    await ticket.save();
    Log(req, "Ticket number " + ticketNumber + " Canceled Successfuly", req.user.email);
    res.json({ success: true, msg: __("Ticket number %i canceled successfuly", ticketNumber) });
  }
});

// Resolve own ticket
router.post("/resolve", [passport.authenticate("jwt", { session: false }), i18n], async (req, res, next) => {
  const userEmail = req.user.email;
  const ticketNumber = req.body.ticketNumber;

  ticket = await Ticket.getTicketByNumber(ticketNumber);
  if (ticket.userEmail != userEmail) {
    throw new Error("You can not close others' ticket");
  } else {
    ticket.status = "Closed";
    await ticket.save();
    Log(req, "Ticket number " + ticketNumber + " Closed Successfuly", req.user.email);
    res.json({ success: true, msg: __("Ticket number %i closed successfuly", ticketNumber) });
  }
});

// reply own ticket
router.post("/reply", [passport.authenticate("jwt", { session: false }), i18n], async (req, res, next) => {
  const userEmail = req.user.email;
  const ticketNumber = req.body.ticketNumber;
  const replyDesc = req.body.replyDesc;

  ticket = await Ticket.getTicketByNumber(ticketNumber);
  if (ticket.userEmail != userEmail) {
    throw new Error("You can not reply others' ticket");
  } else {
    let reply = { userEmail: userEmail, description: replyDesc };
    ticket.replys.push(reply);
    ticket.lastreplyDate = new Date();
    ticket.status = "Open";
    ticket.save();
    Log(req, "Ticket number(" + ticketNumber + ") replied Successfuly", req.user.email);
    res.json({ success: true, msg: __("Ticket number %i replied successfuly", ticketNumber) });
  }
});

// Answer ticket by admin
router.post("/answer", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  const userEmail = req.user.email;
  const ticketNumber = req.body.ticketNumber;
  const answerDesc = req.body.answerDesc;
  const isClose = req.body.isClose;

  ticket = await Ticket.getTicketByNumber(ticketNumber);

  let reply = { userEmail: userEmail, description: answerDesc };
  ticket.replys.push(reply);
  ticket.lastreplyDate = new Date();
  ticket.status = "Answered";
  if (isClose) {
    ticket.status = "Closed";
  }
  await ticket.save();
  // if ticket.reciveEmail == true then send email to user and notify about answer ticket
  if (ticket.recieveEmail) {
    var locals = { ticketNumber: ticket.ticketNumber, subject: ticket.subject, answerDesc: answerDesc };
    await Email.sendMail(ticket.userEmail, "ticketAnswer", locals);
  }
  Log(req, "Ticket number(" + ticketNumber + ") answered Successfuly", req.user.email);
  res.json({ success: true, msg: __("Ticket number %i answered successfuly", ticketNumber) });
});

// List All tickets , all Status By Admin
router.get("/listall", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  tickets = await Ticket.getAllTicket("", "");
  Log(req, "Admin Gets All Tickets", req.user.email);
  return res.json({ success: true, tickets: tickets });
});

// List All Open tickets By Admin
router.get("/listallopen", [passport.authenticate("jwt", { session: false }), i18n, authorize], async (req, res, next) => {
  tickets = await Ticket.getAllTicket("", "Open");
  Log(req, "Admin Gets All Tickets", req.user.email);
  return res.json({ success: true, tickets: tickets });
});

// List All tickets , all Status By User
router.get("/listmy", [passport.authenticate("jwt", { session: false }), i18n], async (req, res, next) => {
  const userEmail = req.user.email;

  tickets = await Ticket.getAllTicket(userEmail, "");
  Log(req, "User Gets All Own Tickets", req.user.email);
  return res.json({ success: true, tickets: tickets });
});

// List Open tickets By User
router.get("/listmyopen", [passport.authenticate("jwt", { session: false }), i18n], async (req, res, next) => {
  const userEmail = req.user.email;

  tickets = await Ticket.getAllTicket(userEmail, "Open");
  Log(req, "User Gets Own Open Tickets", req.user.email);
  return res.json({ success: true, tickets: tickets });
});

module.exports = router;
