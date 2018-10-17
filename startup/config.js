const config = require("config");
const Admin = require("../models/admin");

module.exports = async function() {
  if (!config.get("etherscanAPIKey")) {
    throw new Error("FATAL ERROR: etherscanAPIKey is not defined");
  }
  if (process.env.NODE_ENV !== "production") {
    Admin.addAdministrator();
  }
};
