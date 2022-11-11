const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const UserActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true,
    },
    events: [
      {
        pocket: { type: String, maxlength: [32, "Too long"], default: "all" },
        time: { type: Date, default: Date.now },
        activityType: {
          type: String,
          maxlength: [32, "Too long"],
        },
        details: String,
        status: { type: String, enum: ["success", "error", "warning"] },
      },
    ],

    transactions: [
      {
        reference: String,
        id: String,
        pocket: { type: String, maxlength: [32, "Too long"], default: "all" },
        time: { type: Date, default: Date.now },
        activityType: {
          type: String,
          enum: ["money added", "cashout", "peer to peer", "pocket to pocket"],
        },
        details: String,
        status: { type: String, enum: ["success", "error", "warning"] },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserActivity", UserActivitySchema);
