const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    setting:{
        type: String,
        required: true,
        unique: true
    },
    value:{
        type: mongoose.Schema.Types.Mixed,
    },
    enabled:{
        type: Boolean,
        required: true,
        default: true
    }
}, { timestamps: true });

const Settings = mongoose.model('settings', SettingsSchema);

module.exports = Settings;