import mongoose, { Schema } from "mongoose";

const CustomerProfileSchema = new Schema({
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
    default: "",
  },
  orders: {
    type: [Schema.Types.ObjectId],
    ref: "Order",
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for unique customer per restaurant
CustomerProfileSchema.index({ phone: 1, restoId: 1 }, { unique: true });

const CustomerProfile =
  mongoose.models.CustomerProfile ||
  mongoose.model("CustomerProfile", CustomerProfileSchema);

export default CustomerProfile;
