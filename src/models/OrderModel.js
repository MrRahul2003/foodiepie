import mongoose, { Schema } from "mongoose";

const OrderItemSchema = new Schema({
  foodId: {
    type: Schema.Types.ObjectId,
    ref: "RestaurantFood",
  },
  name: {
    type: String,
    required: true,
  },
  foodType: {
    type: String,
    enum: ["Veg", "Non-Veg", "Vegan", "Egg"],
  },
  imageUrl: {
    type: String,
    default: "",
  },
  variant: {
    label: { type: String, required: true },
    price: { type: Number, required: true },
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
});

const OrderSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    // Restaurant details
    restoId: {
      type: String,
      required: true,
    },
    restoCode: {
      type: String,
      required: true,
    },
    restoName: {
      type: String,
      default: "",
    },
    // Customer details
    customerPhone: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      default: "",
    },
    tableNumber: {
      type: String,
      required: true,
    },
    // Order items
    items: {
      type: [OrderItemSchema],
      required: true,
    },
    // Pricing
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    // Payment
    paymentMethod: {
      type: String,
      enum: ["UPI", "Card", "Cash", "Wallet"],
      default: "Cash",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    // Order status
    status: {
      type: String,
      enum: ["Placed", "Accepted", "Preparing", "Served", "Cancelled"],
      default: "Placed",
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
OrderSchema.index({ restoId: 1, status: 1 });
OrderSchema.index({ customerPhone: 1, restoId: 1 });
OrderSchema.index({ orderId: 1 });

const Order =
  mongoose.models.Order || mongoose.model("Order", OrderSchema);

export default Order;
