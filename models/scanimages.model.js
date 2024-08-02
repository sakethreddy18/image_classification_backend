const mongoose = require('mongoose');

const ScanImageSchema = new mongoose.Schema({
    report: {
        type: [new mongoose.Schema({
            details: mongoose.Schema.Types.Mixed,
            reclassifiedImages: mongoose.Schema.Types.Mixed
        }, { timestamps: true })]
    },
    images: {
        type: [new mongoose.Schema({
            class: {
                type: String,
                required: true
            },
            path: {
                type: String,
                required: true
            },
            reclassificationHistory: {
                type: [new mongoose.Schema({
                    previousClass: {
                        type: String,
                        required: true
                    },
                    currentClass: {
                        type: String,
                        required: true
                    }
                }, { timestamps: true })]
            },
        }, { timestamps: true })]
    }

}, { timestamps: true });

ScanImageSchema.methods.toWeb = function () {
    let json = this.toJSON();
    delete json.__v;
    return json;
}

const ScanImages = mongoose.model('scan_images', ScanImageSchema);
module.exports = ScanImages;    