const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const bcrypt_p = require('bcrypt-promise');
const jwt = require("jsonwebtoken");
const CONFIG = require("../config/config");
const { to, TE } = require("../services/util.service");

const saltRounds = 10;

let UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true},
    lastName: { type: String },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true},
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'user_role', required: true},
    status: { type: Boolean, default: true },
    lastLogin: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
    if (this.isModified('password') || this.isNew) {
        let err, salt, hash;
        [err, salt] = await to(bcrypt.genSalt(saltRounds));
        if (err) TE(err.message, true);

        [err, hash] = await to(bcrypt.hash(this.password, salt));
        if (err) TE(err.message, true);
        console.log('password', this.password);
        console.log('hash', hash);
        this.password = hash;
        return next();
    } else {
        return next();
    }
});

UserSchema.pre(['findOneAndUpdate'], async function (next) {
    let password = this.getUpdate().password;
    if (!password) return next();

    let err, salt, hash;
    [err, salt] = await to(bcrypt.genSalt(saltRounds));
    if (err) TE(err.message, true);

    [err, hash] = await to(bcrypt.hash(password, salt));
    if (err) TE(err.message, true);

    this.getUpdate().password = hash;

    return next();
});

UserSchema.methods.comparePassword = async function (pw) {
    let err, pass;
    if (!this.password) TE('password not set');

    [err, pass] = await to(bcrypt_p.compare(pw, this.password));
    if (err) TE(err);

    // return null if password is invalid instead throwing error // CHANGE
    if (!pass) TE('Invalid credentials');

    return this;
}

UserSchema.methods.getAuthToken = function () {
    let access_expiration_time = CONFIG.jwt_access_expiration;
    let refresh_expiration_time = CONFIG.jwt_refresh_expiration;

    access_payload = {
        userId: this.id,
        roleId: this.roleId,
        email: this.email
    };

    refresh_payload = {
        userId: this.id
    };

    let access_token = jwt.sign(access_payload, CONFIG.jwt_encryption, {expiresIn: access_expiration_time});

    let refresh_token = jwt.sign(refresh_payload, CONFIG.jwt_refresh_encryption, {expiresIn: refresh_expiration_time});

    return {
        access: access_token,
        refresh: refresh_token
    };
};

UserSchema.methods.getAccessAuthToken = function () {
    let access_expiration_time = CONFIG.jwt_access_expiration;

    access_payload = {
        userId: this.id,
        roleId: this.roleId,
        email: this.email
    };

    let access_token = jwt.sign(access_payload, CONFIG.jwt_encryption, {expiresIn: access_expiration_time});

    return access_token;
}

UserSchema.methods.toWeb = function () {
    let json = this.toJSON();
    delete json.password;
    delete json.__v;
    return json;
};

const User = mongoose.model('user', UserSchema);

module.exports = User;
