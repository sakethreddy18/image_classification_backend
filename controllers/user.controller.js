const { to, ReE, ReS } = require("../services/util.service");
const { authUser, verifyRefreshToken } = require("../services/auth.service");
const User = require("../models/user.model");
const UserRole = require("../models/userrole.model");

var log = require("../config/winston");


const register = async (req, res) => {
    const body = req.body; // get body data
    let err, user; // declare variables
    let toResponse = [null, null]; // declare response array
    body.createdBy = body.updatedBy = req.user.id; // set createdBy to current user

    // check if user already exists
    toResponse = await to(User.findOne({email: body.email}).exec());
    err = toResponse[0];
    user = toResponse[1];
    if (err){
        console.log("Error: while finding user.");
        console.log(err);
        log.error("Error: while finding user.");
        log.error(err);
        return ReE(res, err, 422);
    }
    if (user){ // if user exists
        console.log("User already exists");
        log.info("User already exists");
        return ReE(res, "User already exists", 422);
    }else{ // if user does not exist
        // check if role exists
        toResponse = await to(UserRole.findOne({name: body.role}).exec());
        err = toResponse[0];
        userRole = toResponse[1];
        if (err){
            console.log("Error: while finding role.");
            console.log(err);
            log.error("Error: while finding role.");
            log.error(err);
            return ReE(res, err, 422);
        }
        if (!userRole){ // if role does not exist
            console.log("Role does not exist");
            log.info("Role does not exist");
            return ReE(res, "Role does not exist", 422);
        }
        body.role = userRole.id; // set role to role id
        
        // create user
        toResponse = await to(User.create(body));
        err = toResponse[0];
        user = toResponse[1];
        if (err){
            console.log("Error: while creating user.");
            console.log(err);
            log.error("Error: while creating user.");
            log.error(err);
            return ReE(res, err, 422);
        }
    }

    return ReS(res, user.toWeb(), 201, "Successfully created new user.");
};
module.exports.register = register;


const login = async (req, res) => {
    const { email, password } = req.body; // get email and password from request body
    let err, user; // declare variables
    let toResponse = [null, null]; // declare await to response array

    // authenticate user
    toResponse = await to(authUser(email, password));
    err = toResponse[0];
    user = toResponse[1];
    if (err){
        console.log("Error: while authenticating user.");
        console.log(err);
        log.error("Error: while authenticating user.");
        log.error(err);
        return ReE(res, err, 422);
    }
    
    // update last login
    user.lastLogin = Date.now();
    toResponse = await to(user.save());
    err = toResponse[0];
    user = toResponse[1];
    if (err){
        console.log("Error: while updating last login.");
        console.log(err);
        log.error("Error: while updating last login.");
        log.error(err);
        return ReE(res, err, 422);
    }

    // generate tokens
    tokens = user.getAuthToken();

    toResponse = await to(User.findById(user.id)
        .select("-password -updatedAt -createdAt -createdBy -updatedBy")
        .populate("role", "-description")
        .exec()
    );
    err = toResponse[0];
    user = toResponse[1];
    if (err){
        console.log("Error: while getting user.");
        console.log(err);
    }
    
    return ReS(res, { accessToken: tokens.access, refreshToken: tokens.refresh, user: user.toWeb() }, 200, "Successfully logged in.");
};
module.exports.login = login;


const getAccessToken = async (req, res) => {
    const refreshToken = req.body.refreshToken;  // get refresh token from request body
    let err, payload, user; // declare variables
    let toResponse = [null, null]; // declare await to response array

    // verify refresh token
    toResponse = await to(verifyRefreshToken(refreshToken));
    err = toResponse[0];
    payload = toResponse[1];
    if (err){
        console.log("Error: while verifying refresh token.");
        console.log(err);
        log.error("Error: while verifying refresh token.");
        log.error(err);
        return ReE(res, err, 422);
    }

    // get user
    toResponse = await to(User.findById(payload.userId));
    err = toResponse[0];
    user = toResponse[1];
    if (err){
        console.log("Error: while getting user.");
        console.log(err);
        log.error("Error: while getting user.");
        log.error(err);
        return ReE(res, err, 422);
    }
    if (!user){ // if user not found
        console.log("User not found.");
        log.error("User not found.");
        return ReE(res, "User not found.", 404);
    }
    if (!user.status){ // if user is inactive
        console.log("User is inactive.");
        log.error("User is inactive.");
        return ReE(res, "User is inactive.", 404);
    }

    return ReS(res, { accessToken: user.getAccessAuthToken() }, 200, "Successfully retrieved access token.");
};
module.exports.getAccessToken = getAccessToken;


const getUsers = async (req, res) => {
    let err, users; // declare variables
    let toResponse = [null, null]; // declare await to response array

    // get users
    toResponse = await to(User.find()
        .select("-password -updatedAt -createdAt -createdBy -updatedBy")
        .populate("role", "-description")
        .exec()
    );
    err = toResponse[0];
    users = toResponse[1];
    if (err){
        console.log("Error: while getting users.");
        console.log(err);
        log.error("Error: while getting users.");
        log.error(err);
        return ReE(res, err, 422);
    }

    return ReS(res, users.map(user => user.toWeb()), 200, "Successfully retrieved users.");
};
module.exports.getUsers = getUsers;


const getUser = async (req, res) => {
    const id = req.body.id;  // get id from request body
    let err, user; // declare variables
    let toResponse = [null, null]; // declare await to response array

    // get user
    toResponse = await to(User.findById(id)
        .select("-password -updatedAt -createdAt -createdBy -updatedBy")
        .populate("role", "-description")
        .exec()
    );
    err = toResponse[0];
    user = toResponse[1];
    if (err){
        console.log("Error: while getting user.");
        console.log(err);
        log.error("Error: while getting user.");
        log.error(err);
        return ReE(res, err, 422);
    }
    
    return ReS(res, user.toWeb(), 200, "Successfully retrieved user.");
}
module.exports.getUser = getUser;


const getCurrentUser = async (req, res) => {
    let err, user; // declare variables
    let toResponse = [null, null]; // declare await to response array

    // get user
    toResponse = await to(User.findById(req.user.id)
        .select("-password -updatedAt -createdBy -updatedBy")
        .populate("role", "-description")
        .exec()
    );
    err = toResponse[0];
    user = toResponse[1];
    if (err){
        console.log("Error: while getting user.");
        console.log(err);
        log.error("Error: while getting user.");
        log.error(err);
        return ReE(res, err, 422);
    }

    return ReS(res, user.toWeb(), 200, "Successfully retrieved current user.");
}
module.exports.getCurrentUser = getCurrentUser;


const updateCurrentUser = async (req, res) => {
    const body = req.body; // get body data
    let err, user; // declare variables
    let toResponse = [null, null]; // declare await to response array

    // check for restricted fields
    let restrictedFields = [
        "_id",
        "id",
        "createdBy",
        "createdAt",
        "updatedAt",
        "updatedBy",
        "role",
        "status",
        "lastLogin",
        "password"
    ];
    for (let field of restrictedFields){
        if (body[field]){
            console.log("Error: restricted field found.");
            log.info("Restricted field found.");
            return ReE(res, field + " can not be updated.", 403);
        }
    }

    // update user
    toResponse = await to(User.findById(req.user.id));
    err = toResponse[0];
    user = toResponse[1];
    if (err){
        console.log("Error: while finding user.");
        console.log(err);
        log.error("Error: while finding user.");
        log.error(err);
        return ReE(res, err, 422);
    }
    if (!user){ // if user not found
        console.log("User not found.");
        log.error("User not found.");
        return ReE(res, "User not found.", 404);
    }
    user.password = body.newPassword;
    user.updatedBy = req.user.id;
    toResponse = await to(user.save());
    err = toResponse[0];
    if (err){
        console.log("Error: while updating user.");
        console.log(err);
        log.error("Error: while updating user.");
        log.error(err);
        return ReE(res, err, 422);
    }

    // get user
    toResponse = await to(User.findById(req.user.id)
        .select("-password -updatedAt -createdAt -createdBy -updatedBy")
        .populate("role", "-description")
        .exec()
    );
    err = toResponse[0];
    user = toResponse[1];
    if (err){
        console.log("Error: while updating user.");
        console.log(err);
        log.error("Error: while updating user.");
        log.error(err);
        return ReE(res, err, 422);
    }

    return ReS(res, user.toWeb(), 200, "Successfully updated current user.");
}
module.exports.updateCurrentUser = updateCurrentUser;


const updateCurrentUserPassword = async (req, res) => {
    const body = req.body; // get body data
    let err, user; // declare variables
    let toResponse = [null, null]; // declare await to response array

    // check for required fields
    let requiredFields = [
        "currentPassword",
        "newPassword",
        "confirmPassword"
    ];
    for (let field of requiredFields){
        if (!body[field]){
            console.log("Error: " + field + " not found.");
            log.info(field + " not found.");
            return ReE(res, field + " not found.", 422);
        }
    }

    // check if password and confirm password match
    if (body.newPassword !== body.confirmPassword){
        console.log("Error: password and confirm password do not match.");
        log.info("Password and confirm password do not match.");
        return ReE(res, "Password and confirm password do not match.", 422);
    }

    // check if old password is correct
    toResponse = await to(req.user.comparePassword(body.currentPassword));
    err = toResponse[0];
    if (err){
        console.log("Error: old password is incorrect.");
        log.info("Old password is incorrect.");
        return ReE(res, "Old password is incorrect.", 403);
    }

    // update password
    toResponse = await to(User.findOneAndUpdate({_id: req.user.id}, {password: body.newPassword}, {new: true})
        .select("-password -updatedAt -createdAt -createdBy -updatedBy")
        .populate("role", "-description")
        .exec()
    );
    err = toResponse[0];
    user = toResponse[1];
    if (err){
        console.log("Error: while updating password.");
        console.log(err);
        log.error("Error: while updating password.");
        log.error(err);
        return ReE(res, err, 422);
    }

    return ReS(res, user.toWeb(), 200, "Successfully updated current user password.");
}
module.exports.updateCurrentUserPassword = updateCurrentUserPassword;


const editUser = async (req, res) => {
    const body = req.body; // get body data
    let err, user; // declare variables
    let toResponse = [null, null]; // declare await to response array

    // check for restricted fields
    let restrictedFields = [
        "createdBy",
        "createdAt",
        "updatedAt",
        "updatedBy",
        "lastLogin",
    ];
    for (let field of restrictedFields){
        if (body[field]){
            console.log("Error: restricted field found.");
            log.info("Restricted field found.");
            return ReE(res, field + " can not be updated.", 403);
        }
    }

    // check if user exists
    toResponse = await to(User.findOne({_id:body.id}).exec());
    err = toResponse[0];
    user = toResponse[1];
    if (err){
        console.log("Error: while finding user.");
        console.log(err);
        log.error("Error: while finding user.");
        log.error(err);
        return ReE(res, err, 422);
    }
    if (!user){ // if user does not exist
        console.log("User does not exist");
        log.info("User does not exist");
        return ReE(res, "User does not exist", 422);
    }

    // check if email is provided
    if (body.email){
        // check if email is already used if it is different from current email
        if (body.email !== user.email){
            toResponse = await to(User.findOne({email: body.email}).exec());
            err = toResponse[0];
            user = toResponse[1];
            if (err){
                console.log("Error: while finding user.");
                console.log(err);
                log.error("Error: while finding user.");
                log.error(err);
                return ReE(res, err, 422);
            }
            if (user){ // if user exists
                console.log("Email already used");
                log.info("Email already used");
                return ReE(res, "Email already used", 422);
            }
        }
    }

    // check if password is provided
    if (body.password){
        // check if password and confirm password match
        if (body.password !== body.confirmPassword){
            console.log("Error: password and confirm password do not match.");
            log.info("Password and confirm password do not match.");
            return ReE(res, "Password and confirm password do not match.", 422);
        }
    }

    // check if role exists, if role is provided
    if (body.role){
        toResponse = await to(UserRole.findOne({name: body.role}).exec());
        err = toResponse[0];
        userRole = toResponse[1];
        if (err){
            console.log("Error: while finding role.");
            console.log(err);
            log.error("Error: while finding role.");
            log.error(err);
            return ReE(res, err, 422);
        }
        if (!userRole){ // if role does not exist
            console.log("Role does not exist");
            log.info("Role does not exist");
            return ReE(res, "Role does not exist", 422);
        }
        body.role = userRole.id; // set role to role id
    }

    body.updatedBy = req.user.id; // set updatedBy to current user

    // update user
    toResponse = await to(User.findOneAndUpdate({_id: body.id}, body, {new: true})
        .select("-password -updatedAt -createdAt -createdBy -updatedBy")
        .populate("role", "-description")
        .exec()
    );
    err = toResponse[0];
    user = toResponse[1];
    if (err){
        console.log("Error: while updating user.");
        console.log(err);
        log.error("Error: while updating user.");
        log.error(err);
        return ReE(res, err, 422);
    }

    return ReS(res, user.toWeb(), 200, "Successfully updated user.");
}
module.exports.editUser = editUser;