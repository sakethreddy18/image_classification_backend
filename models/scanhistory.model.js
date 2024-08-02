const mongoose = require('mongoose');


const ScanHistorySchema = new mongoose.Schema({
    sampleId: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    ageGroup: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        required: true,
        default: false
    },
    cloudStatus: {
        type: Boolean,
        required: true,
        default: false
    },
    errorMessage: {
        type: String
    },
    pathToFolder: {
        type: String
    },
    scanType: {
        type: String
    },
    report: {
        type: mongoose.Mixed
    },
    deviceId: {
        type: String,
        required: true
    },
    numberOfReclassifications: {
        type: Number,
        required: true,
        default: 0
    }
    

}, { timestamps: true });

ScanHistorySchema.methods.toWeb = function () {
    let json = this.toJSON();
    delete json.__v;
    return json;
};


const ScanHistory = mongoose.model('scan_history', ScanHistorySchema);
module.exports = ScanHistory;

