const User = require('../models/user.model');
const { to, TE } = require('./util.service');
const jwt = require('jsonwebtoken');
const CONFIG = require('../config/config');

const authUser = async (email, password) => {
    let err, user;
    console.log(User);
    // check if the email is registered
    [err, user] = await to(User.findOne({ email: email }).exec());
    if (err) TE(err.message);
    // if the email is not registered, throw error
    if (!user) TE("User not registered");

    // if the email is registered, check if the password is correct
    [err, user] = await to(user.comparePassword(password));
    if (err) TE(err.message);

    return user;
};
module.exports.authUser = authUser;


const verifyRefreshToken = async (refreshToken) => {
    let payload;

    payload = jwt.verify(refreshToken, CONFIG.jwt_refresh_encryption);
    if (!payload) TE("Invalid refresh token");
    
    return payload;
}
module.exports.verifyRefreshToken = verifyRefreshToken;