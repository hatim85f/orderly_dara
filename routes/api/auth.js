const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const auth = require("../../middleware/auth");

const { check, validationResult } = require("express-validator");

const User = require("../../models/User");

const sgMail = require("@sendgrid/mail");

const secretToken =
  process.env.NODE_ENV === "production"
    ? process.env.JWT_SECRET
    : config.get("jwtSecret");

const mailAPIKey = process.env.mail_API;

// get all users

// @route   GET api/auth
// @desc    Get user by token
// @access  Private

// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public
router.post(
  "/login",
  [
    check("email", "Username must be a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          error: "Error",
          message: "Invalid Credentials",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          error: "Error",
          message: "Invalid Username or Password",
        });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(payload, secretToken, (error, token) => {
        if (error) throw error;
        res.json({
          token,
          user: user,
        });
      });
    } catch (error) {
      return res
        .status(500)
        .send({ error: "ERROR", message: "Invalid Username or Password" });
    }
  }
);

// @route   POST create user
// @desc    Register user
// @access Public
router.post("/register", async (req, res) => {
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
      profilePicture,
      area,
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

    let sanitizedUser = { ...newUser.toObject() };
    delete sanitizedUser.password;

    jwt.sign(payload, secretToken, (error, token) => {
      if (error) throw error;
      res.json({
        token,
        user: sanitizedUser,
        message: "User created successfully",
      });
    });
  } catch (error) {
    return res
      .status(500)
      .send({ error: "Error in saving user", message: error.message });
  }
});

// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public

// @route   POST api/auth/forgot-password
// @desc    Send reset password link to user email
// @access  Public

// @route   PUT api/auth
// @desc    Update user
// @access Private

// @route   DELETE api/auth
// @desc    Delete user
// @access Private

module.exports = router;
