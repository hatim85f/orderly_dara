const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TransferHistorySchema = Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    fromTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    toTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = TransferHistory = mongoose.model(
  "transferHistory",
  TransferHistorySchema
);
