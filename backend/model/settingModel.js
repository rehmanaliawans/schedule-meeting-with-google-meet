const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      unique: true,
    },
    tokenExpire: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const setting = mongoose.model("setting", settingSchema);
module.exports = setting;
