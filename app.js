const express = require("express");
const path = require("path");
const errors = require("./middlewares/errors");
const config = require("config");

var app = express();
require("./startup/logging")();
require("./startup/config")();
require("./startup/db");
require("./startup/events")();
require("./startup/i18n");
require("./startup/routs")(app);

const port = config.get("port");

process.env.NODE_CONFIG_DIR = path.join(__dirname, "./config");

app.use(errors);

const Admin = require("./models/admin");
Admin.addAdministrator();

app.listen(port, () => {
  console.log("Server started on " + port);
});
