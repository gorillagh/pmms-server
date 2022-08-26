const User = require("../models/User");

exports.user = (req, res) => {
  res.json({
    data: "Hey you hit user API endpoint",
  });
};

exports.getUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findOne({ _id: id }).exec();
    res.json(user);
  } catch (error) {
    console.log(error);
  }
};
