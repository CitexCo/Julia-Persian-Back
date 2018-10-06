const config = require("config");

module.exports = async function() {
  if (!config.get("etherscanAPIKey")) {
    throw new Error("FATAL ERROR: etherscanAPIKey is not defined");
  }
};
