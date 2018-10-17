const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const path = require("path");
const passport = require("passport");
require("express-async-errors");

const users = require("../routes/users");
const accounts = require("../routes/accounts");
const admins = require("../routes/admins");
const exchangers = require("../routes/exchangers");
const tickets = require("../routes/tickets");
const rpc = require("../routes/rpc");

module.exports = async function(app) {
  // CORS Middleware
  app.use(cors());

  // Set Static Folder
  app.use(express.static(path.join(__dirname, "/../public")));
  app.use(express.static(path.join(__dirname, "/../uploads")));

  // Body Parser Middleware
  app.use(bodyParser.json());

  // Passport Middleware
  app.use(passport.initialize());
  app.use(passport.session());

  require("../middlewares/passport")(passport);

  app.use("/users", users);
  app.use("/accounts", accounts);
  app.use("/admins", admins);
  app.use("/exchangers", exchangers);
  app.use("/tickets", tickets);
  app.use("/rpc", rpc);
};
