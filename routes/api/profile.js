const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const User = require("../../models/User");

// @route   GET api/profile
// @desc    Get current user profile
// @access  Private
router.get("/", auth, async (req, res) => {
  const { userId } = req.body;

  try {
    const profile = await User.findOne({ _id: userId }).populate("region");
    if (!profile) {
      return res
        .status(400)
        .json({ message: "There is no profile for this user" });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.put("/", auth, async (req, res) => {
  const { userId } = req.body;
  const { firstName, lastName, email, phone, profilePicture } = req.body;

  const profileFields = {};
  if (firstName) profileFields.firstName = firstName;
  if (lastName) profileFields.lastName = lastName;
  if (email) profileFields.email = email;
  if (phone) profileFields.phone = phone;
  if (profilePicture) profileFields.profilePicture = profilePicture;
  try {
    let profile = await User.findOne({ _id: userId });

    if (profile) {
      profile = await User.updateMany(
        { _id: userId },
        { $set: profileFields },
        { new: true }
      );
      return res.json(profile);
    }

    profile = new User(profileFields);
    await profile.save();
    res.json({ user: profile });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
