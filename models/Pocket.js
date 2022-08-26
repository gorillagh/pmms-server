const mongoose = require("mongoose");

const pocketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: "Pocket name is required",
      required: true,
      maxlength: [32, "Too long"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    userClass: {
      type: String,
      required: true,
      enum: ["student", "worker", "retiree", "all"],
      default: "all",
    },
    icon: String,
    color: String,
    description: String,
    subs: [String],
  },

  { timestamps: true }
);

module.exports = mongoose.model("Pocket", pocketSchema);
