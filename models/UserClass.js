const mongoose = require("mongoose");

const userClassSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: "UserClass Name is required",
      minlength: [3, "too short"],
      maxlength: [32, "Too long"],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserClass", userClassSchema);
