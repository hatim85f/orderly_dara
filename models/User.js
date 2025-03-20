const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: [
        "Country Manager",
        "Sales Supervisor",
        "Medical Rep",
        "Senior Medical Rep",
        "KAM",
        "Admin",
      ],
      default: "Medical Rep",
    },
    managerId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    parentTeam: {
      type: mongoose.Types.ObjectId,
      ref: "Team",
    },
    profilePicture: {
      type: String,
    },
    team: {
      type: mongoose.Types.ObjectId,
      ref: "Team",
    },
    region: {
      type: mongoose.Types.ObjectId,
      ref: "Region",
    },
    area: {
      type: String,
      required: true,
    },
    target: {
      type: mongoose.Types.ObjectId,
      ref: "target",
    },
    sales: {
      type: mongoose.Types.ObjectId,
      ref: "sales",
    },
    achievement: {
      type: mongoose.Types.ObjectId,
      ref: "achievement",
    },
    monthlyAchievement: {
      type: Array,
    },
    monthlySales: {
      type: Array,
    },
    expenses: [{ type: mongoose.Types.ObjectId, ref: "expenses" }],
    forecast: [
      {
        type: mongoose.Types.ObjectId,
        ref: "forecast",
      },
    ],
    tasks: [
      {
        type: mongoose.Types.ObjectId,
        ref: "task",
      },
    ],
    expoPushTokens: [
      {
        type: String,
      },
    ],
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = User = mongoose.model("user", UserSchema);
