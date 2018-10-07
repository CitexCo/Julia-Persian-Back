const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const Account = require("../models/account");
const config = require("./setting");

module.exports = function(passport) {
  let opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
  opts.secretOrKey = config.secret;
  passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {
      Account.getAccountById(jwt_payload._id, (err, account) => {
        if (err) {
          return done(err, false);
        }
        if (account) {
          return done(null, account);
        } else {
          return done(null, false);
        }
      });
    })
  );
};
