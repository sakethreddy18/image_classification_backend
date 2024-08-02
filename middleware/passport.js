const { ExtractJwt, Strategy } = require('passport-jwt');
const User = require('../models/user.model');
const { to } = require('../services/util.service');
const CONFIG = require('../config/config');


module.exports = function(passport) {
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = CONFIG.jwt_encryption;

    passport.use('jwt', new Strategy(opts, async function(jwt_payload, done) {
        let err, user;
        [err, user] = await to(User.findById(jwt_payload.userId).exec());
        if (err) return done(err, false);
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    }));
}
