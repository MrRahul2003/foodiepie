import mongoose, { Schema } from "mongoose";
const RestaurantFoodModel = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    foodType: {
      type: String,
      enum: ["Veg", "Non-Veg", "Vegan", "Egg"],
      required: true,
    },
    variants: [
      {
        label: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        isAvailable: { type: Boolean, default: true },
      },
    ],
    tags: [{ type: String }],
    imageUrl: { type: String, default: "" },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "RestaurantAuth",
      required: true,
    },
  },
  { timestamps: true }
);
const RestaurantFood =
  mongoose.models.RestaurantFood ||
  mongoose.model("RestaurantFood", RestaurantFoodModel);
export default RestaurantFood;
