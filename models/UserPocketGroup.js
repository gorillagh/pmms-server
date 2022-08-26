const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const UserPocketGroupSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true,
    },

    // pockets: [{ type: ObjectId, ref: "Pocket" }],
    pockets: [
      {
        title: {
          type: String,
          required: true,
          maxlength: [21, "Too long"],
        },
        slug: {
          type: String,
          required: true,
          // unique: true,
          lowercase: true,
          index: true,
        },
        percentage: {
          type: Number,
          required: true,
        },
        amount: {
          type: Number,
        },
        status: {
          type: String,
          enum: ["active", "frozen", "deactivated"],
          default: "active",
        },
        icon: String,
        color: String,
        description: String,
        primary: { type: Boolean, default: true },
        time: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserPocketGroup", UserPocketGroupSchema);
