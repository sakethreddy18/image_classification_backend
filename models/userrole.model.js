const mongoose = require('mongoose');

const UserRoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    }
});

UserRoleSchema.methods.toWeb = function () {
    let json = this.toJSON();
    delete json.__v;
    return json;
};

const UserRole = mongoose.model('user_role', UserRoleSchema);

module.exports = UserRole;