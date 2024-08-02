const UserRole = require('../models/userrole.model');
const { to, ReE } = require('../services/util.service');

const roleAuthorization = function (roles) {
    return async function (req, res, next) {
        if (!req.user.role) {
            return ReE(res, 'User does not have a role', 401);
        }
        const roleId = req.user.role;
        let err, role;
        let toResponse = [null, null];
        toResponse = await to(UserRole.findById(roleId));
        err = toResponse[0];
        role = toResponse[1];
        if (err) {
            console.log(err);
            return ReE(res, "Role Not Found", 401);
        }
        if (roles.includes(role.name)) {
            return next();
        }
        return ReE(res, 'User role not authorized', 403);
    }
}

module.exports = roleAuthorization;