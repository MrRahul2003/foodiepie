import mongoose, { Schema } from "mongoose";

const Session =
  mongoose.models.Session ||
  mongoose.model("Session", {
    restoId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 3600 * 24 * 7,
    },
  });

export default Session;
