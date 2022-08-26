const User = require("../models/User");
const UserActivity = require("../models/UserActivity");
const UserPocketGroup = require("../models/UserPocketGroup");
const currency = require("currency.js");

exports.checkEmail = async (req, res) => {
  const { email } = req.headers;
  const user = await User.findOne({ email }).exec();
  if (user) {
    res.json(null);
  } else res.json("ok");
};

exports.createOrUpdateUser = async (req, res) => {
  const { email } = req.user;
  const { phoneNumber, name } = req.body;

  console.log("Firebase userrrr------>", req.user);

  const user = await User.findOneAndUpdate(
    { email },
    { name, phoneNumber: `+233${phoneNumber.slice(-9)}` },
    { new: true }
  );

  if (user) {
    console.log("USER UPDATED", user);
    res.json(user);
  } else {
    const newUser = await new User({
      email,
      name,
      phoneNumber: `+233${phoneNumber.slice(-9)}`,
    }).save();
    await new UserPocketGroup({
      userId: await newUser._id,
      pockets: [
        {
          title: "Unallocated",
          slug: "unallocated",
          percentage: currency(100).value,
          icon: "add_circle",
          color: "#000",
          description: "Unallocated percentage",
        },
      ],
    }).save();
    await new UserActivity({
      userId: await newUser._id,
      events: [
        {
          activityType: "account created",
          details: `Your account was created with the email ${newUser.email}`,
          status: "success",
        },
      ],
    }).save();
    console.log("USER CREATED", newUser);
    res.json(newUser);
  }
};

exports.googleLogin = async (req, res) => {
  const { email } = req.user;

  console.log("Firebase userr at googlelogin------>", req.user);

  const user = await User.findOne({ email }).exec();

  if (user) {
    console.log("google login USER ", user);
    res.json(user);
  } else {
    const newUser = await new User({
      email,
      name: req.user.name,
      phoneNumber: req.user.phoneNumber
        ? `+233${req.user.phoneNumber.slice(-9)}`
        : "",
    }).save();
    await new UserPocketGroup({
      userId: await newUser._id,
      pockets: [
        {
          title: "Unallocated",
          slug: "unallocated",
          percentage: currency(100).value,
          icon: "add_circle",
          color: "#000",
          description: "Unallocated percentage",
        },
      ],
    }).save();
    await new UserActivity({
      userId: await newUser._id,
      events: [
        {
          activityType: "account created",
          details: `Your account was created with the email ${newUser.email}`,
          status: "success",
        },
      ],
    }).save();
    console.log("Google USER CREATED---->", newUser);
    res.json(newUser);
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email } = req.user;
    const user = await User.findOne({ email }).exec();
    res.json(user);
  } catch (error) {
    console.log(error);
    res.json(error);
  }
};

exports.currentUser = async (req, res) => {
  const { email } = await req.user;
  try {
    User.findOne({ email }).exec((err, user) => {
      if (err) throw new Error(err);
      else {
        console.log("Dbuser---->", user);
        res.json(user);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

exports.updateUser = async (req, res) => {
  const _id = req.params.slug;
  try {
    const updatedUser = await User.findOneAndUpdate({ _id }, req.body, {
      new: true,
    }).exec();
    res.json(updatedUser);
  } catch (error) {
    console.log(error);
    res.json(error);
  }
};
