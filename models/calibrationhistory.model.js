const mongoose = require("mongoose");

const CalibrationHistorySchema = new mongoose.Schema(
  {
    status: {
      type: Boolean,
      required: true,
      default: false,
    },
    errorMessage: {
      type: String,
    },
    deviceId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const CalibrationHistory = mongoose.model(
  "calibration_history",
  CalibrationHistorySchema
);
module.exports = CalibrationHistory;
