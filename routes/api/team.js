const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const auth = require("../../middleware/auth");

const Team = require("../../models/Team");
const User = require("../../models/User");

const sgMail = require("@sendgrid/mail");
const { default: mongoose, mongo } = require("mongoose");

const secretToken =
  process.env.NODE_ENV === "production"
    ? process.env.JWT_SECRET
    : config.get("jwtSecret");

const mailAPIKey = process.env.mail_API;

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findOne({ _id: userId });

    const matchCondition = {};

    // if the user is not a medical rep or senior medical rep, then the team._id should be in the array of user.teams

    if (user.role !== "Medical Rep" || user.role !== "Senior Medical Rep") {
      matchCondition._id = {
        $in: user.teams,
      };
    } else {
      matchCondition._id = user.team;
    }

    const team = await Team.aggregate([
      {
        $match: matchCondition,
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
            team: 1,
          },
        },
      },
    ]);

    const userTeam = team || [];

    return res.status(200).send({
      team: userTeam,
    });
  } catch (error) {
    return res.status(500).send({
      error: "ERROR !",
      message: error.message,
    });
  }
});

router.get("/memberData/:memberId", auth, async (req, res) => {
  const { memberId } = req.params;

  try {
    const member = await User.findOne({ _id: memberId });

    return res.status(200).send({
      member,
    });
  } catch (error) {
    return res.status(500).send({
      error: "ERROR !",
      message: error.message,
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
        $addToSet: {
          teams: newTeam._id,
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

    const team = await Team.findOne({ _id: teamId });

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
      managerId: team.managerId,
    });

    // sgMail.setApiKey(mailAPIKey);

    // const msg = {
    //   to: email,
    //   from: "info@orderly_sales.com",
    //   templateId: "d-716eb488afa0459e88a34c6d6473a79c",
    //   dynamic_template_data: {
    //     subject: "Thank you for registering",
    //     firstName: firstName,
    //     lastName: lastName,
    //   },
    // };

    // sgMail.send(msg);

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
        managerId: newUser.managerId,
      },
    });
  } catch (error) {
    return res.status(500).send({
      error: "ERROR !",
      message: error.message,
    });
  }
});

// country manager only sending an invitation for the supervisors to join the team
router.post("/inviteSupervisor/:userId", auth, async (req, res) => {
  const { userId } = req.params;
  const { userEmail } = req.body;

  try {
    const user = await User.findOne({ _id: userId });

    const userRole = user.role;

    if (userRole !== "Country Manager") {
      return res.status(401).send({
        error: "Unauthorized",
        message: "You are not authorized to perform this action",
      });
    }

    const team = await Team.findOne({ managerId: userId });

    const teamId = team._id;

    const selectedUser = await User.findOne({ email: userEmail });

    if (!selectedUser) {
      return res.status(400).send({
        error: "ERROR !",
        message: "User not found",
      });
    }

    await User.updateOne(
      { email: userEmail },
      {
        $set: {
          parentTeam: teamId,
          managerId: userId,
        },
      }
    );

    await Team.updateOne(
      { _id: teamId },
      {
        $addToSet: {
          employees: selectedUser._id,
        },
      }
    );

    // notification should be sent to the user to join the team

    return res.status(200).send({
      message: "Invitation sent successfully",
    });
  } catch (error) {
    return res.status(500).send({
      error: "ERROR !",
      message: error.message,
    });
  }
});

// removing supervisor or medical rep from the team by using member ID

router.put("/removeMember/:memberId", auth, async (req, res) => {
  const { memberId } = req.params;
  const { teamId } = req.body;

  try {
    const user = await User.findOne({ _id: memberId });

    if (!user) {
      return res.status(500).send({
        error: "ERROR !",
        message: "User not found",
      });
    }

    await Team.updateOne(
      { _id: teamId },
      {
        $pull: {
          employees: memberId,
        },
      }
    );

    await User.updateOne(
      { _id: memberId },
      {
        $set: {
          team: null,
          managerId: null,
        },
      }
    );

    return res.status(200).send({
      message: `User ${user.firstName} ${user.lastName} removed successfully, his/her data remains the same until he delete his account or join another team`,
    });
  } catch (error) {
    return res.status(500).send({
      error: "ERROR !",
      message: "Something went wrong, please try again later",
    });
  }
});

module.exports = router;
