const Log = require("./log");
const winston = require("winston");

module.exports = function(err, req, res, next) {
  email = "NOUSER";
  if (req.user) {
    email = req.user.email;
  } else if (req.body.email) {
    email = req.body.email;
  }
  winston.error({ message: err.message + " by " + email + " on " + req.originalUrl, stack: err.stack });
  if (err instanceof ReferenceError || err instanceof SyntaxError || err instanceof TypeError) {
    res.json({ success: false, msg: __("Server error occurred") });
  } else {
    res.json({ success: false, msg: __(err.message) });
  }
};
