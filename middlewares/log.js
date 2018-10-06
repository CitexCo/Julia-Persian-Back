const winston = require("winston");

module.exports = function(req, message, actionBy) {
  if (req) {
    winston.info(message + " by " + actionBy + " on " + req.originalUrl);
  } else {
    winston.info(message + " by " + actionBy);
  }
};
