import mongoose from "mongoose";

const RestaurantAuthSchema = new mongoose.Schema(
  {
    restoId: {
      type: String,
      unique: true,
      required: true,
    },

    restaurantName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    state: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // 👈 IMPORTANT (won’t return by default)
    }
  },
  {
    timestamps: true, // 👈 createdAt, updatedAt
  }
);

const RestaurantAuth =
  mongoose.models.RestaurantAuth ||
  mongoose.model("RestaurantAuth", RestaurantAuthSchema);

export default RestaurantAuth;
