const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TeamSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ], // Employees in the team

    teamTarget: {
      type: Number,
      default: 0,
    },
    teamSales: {
      type: Number,
      default: 0,
    },
    teamAchievement: {
      type: Number,
      default: 0,
    },
    teamForecast: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Team = mongoose.model("team", TeamSchema);
