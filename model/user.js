const mongoose = require("mongoose");

const User = mongoose.model("User", {
  username: {
    type: String,
    required: true,
  },

  password: {
    type: String,
    required: true,
  },
});

// new User({
//   username: "admin",
//   password: "admin",
// }).save();

module.exports = User;