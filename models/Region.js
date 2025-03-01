const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RegionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],

    countryTarget: {
      type: Number,
      default: 0,
    },
    countrySales: {
      type: Number,
      default: 0,
    },
    countryAchievement: {
      type: Number,
      default: 0,
    },
    countryForecast: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Region = mongoose.model("region", RegionSchema);
