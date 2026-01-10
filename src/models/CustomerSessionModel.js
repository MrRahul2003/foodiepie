import mongoose, { Schema } from "mongoose";

const CustomerSessionSchema = new Schema({
  profileId: {
    type: Schema.Types.ObjectId,
    ref: "CustomerProfile",
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  restoId: {
    type: String,
    required: true,
  },
  tableNo: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiry
    expires: 0, // TTL index based on expiresAt field
  },
});

// Index for quick session lookup
CustomerSessionSchema.index({ phone: 1, restoId: 1 });

const CustomerSession =
  mongoose.models.CustomerSession ||
  mongoose.model("CustomerSession", CustomerSessionSchema);

export default CustomerSession;
