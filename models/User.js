const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      default: "subscriber",
    },
    //   pockets: [{ type: ObjectId, ref: "Pocket" }],
    address: String,
    DoB: Date,
    phoneNumber: String,
    Occupation: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
