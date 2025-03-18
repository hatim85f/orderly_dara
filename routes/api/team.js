const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const auth = require("../../middleware/auth");

const Team = require("../../models/Team");
const User = require("../../models/User");

const sgMail = require("@sendgrid/mail");
const { default: mongoose } = require("mongoose");

const secretToken =
  process.env.NODE_ENV === "production"
    ? process.env.JWT_SECRET
    : config.get("jwtSecret");

const mailAPIKey = process.env.mail_API;

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findOne({
      _id: userId,
    });

    const team = await Team.aggregate([
      {
        $match: { _id: user.team },
      },
      {
        $lookup: {
          from: "users",
          localField: "employees",
          foreignField: "_id",
          as: "employees",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          managerId: 1,
          teamLogo: 1,
          employees: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            phone: 1,
            role: 1,
            profilePicture: 1,
            area: 1,
            monthlyAchievement: 1,
            monthlySales: 1,
            expenses: 1,
            forecast: 1,
            tasks: 1,
            expoPushTokens: 1,
          },
        },
      },
    ]);

    const userTeam = team[0] || [];

    return res.status(200).send({
      team: userTeam,
    });
  } catch (error) {
    return res.status(500).send({
      error: "ERROR !",
      message: "Server Error, please try again later or contact support",
    });
  }
});

router.post("/create/:userId", auth, async (req, res) => {
  const { userId } = req.params;
  const { name, teamLogo } = req.body;

  try {
    const isTeamAvailable = await Team.findOne({
      name: name,
    });

    if (isTeamAvailable) {
      return res.status(400).send({
        error: "Team name already exists",
      });
    }

    const newTeam = new Team({
      name: name,
      managerId: userId,
      teamLogo: teamLogo,
    });

    await newTeam.save();

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          team: newTeam._id,
        },
      }
    );

    return res.status(200).send({
      message: `Team ${name} created successfully`,
    });
  } catch (error) {
    return res.status(500).send({
      error: "Server Error, please try again later or contact support",
      message: error.message,
    });
  }
});

router.post("/addEmployee/:teamId", auth, async (req, res) => {
  const { teamId } = req.params;
  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    role,
    profilePicture,
    area,
  } = req.body;

  try {
    const isUser = await User.findOne({ email });

    if (isUser) {
      return res
        .status(500)
        .send({ error: "Error", message: "User already exists" });
    }

    const newUser = await new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      profilePicture: profilePicture
        ? profilePicture
        : "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541",
      area,
      team: teamId,
    });

    sgMail.setApiKey(mailAPIKey);

    const msg = {
      to: email,
      from: "info@orderly_sales.com",
      templateId: "d-716eb488afa0459e88a34c6d6473a79c",
      dynamic_template_data: {
        subject: "Thank you for registering",
        firstName: firstName,
        lastName: lastName,
      },
    };

    sgMail.send(msg);

    const payload = {
      user: {
        id: newUser.id,
      },
    };

    const salt = await bcrypt.genSalt(10);

    newUser.password = await bcrypt.hash(password, salt);

    await newUser.save();

    await Team.updateOne(
      { _id: new mongoose.Types.ObjectId(teamId) },
      {
        $push: {
          employees: newUser._id,
        },
      }
    );

    return res.status(200).send({
      message: "User created successfully",

      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        profilePicture: newUser.profilePicture,
        area: newUser.area,
        team: newUser.team,
      },
    });
  } catch (error) {
    return res.status(500).send({
      error: "ERROR !",
      message: error.message,
    });
  }
});

module.exports = router;
