"use server";

import bcrypt from "bcryptjs";
import { connectDB } from "@/src/lib/db";
import RestaurantAuth from "@/src/models/AdminAuthModel";
import Session from "@/src/models/AdminSessionModel";

/* ---------------- HELPERS ---------------- */
function serializePlain(value) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(serializePlain);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if (typeof value.toHexString === "function") {
      return value.toHexString();
    }
    const result = {};
    for (const key of Object.keys(value)) {
      result[key] = serializePlain(value[key]);
    }
    return result;
  }
  return value;
}

// Generate unique 6-character restoId
function generateRestoId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/* ---------------- VERIFY RESTO ID ---------------- */
export async function verifyRestoIdAction(restoId) {
  try {
    await connectDB();

    const restaurant = await RestaurantAuth.findOne({ restoId: restoId.toUpperCase() }).lean();

    if (!restaurant) {
      return {
        success: false,
        error: "Invalid Restaurant ID. Please check and try again.",
      };
    }

    return {
      success: true,
      restaurantName: restaurant.restaurantName || "Restaurant",
      restaurantId: restaurant._id.toString(),
    };
  } catch (error) {
    console.error("Verify RestoId Error:", error);
    return {
      success: false,
      error: "Verification failed. Please try again.",
    };
  }
}

/* ---------------- LOGIN ---------------- */
export async function loginRestaurantAction(restoId, phone, password) {
  try {
    await connectDB();

    // Find restaurant by restoId and phone
    const restaurant = await RestaurantAuth.findOne({
      restoId: restoId.toUpperCase(),
      phone: phone,
    }).select("+password");

    if (!restaurant) {
      return {
        success: false,
        error: "Invalid credentials. Please check your phone number and password.",
      };
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, restaurant.password);

    if (!isMatch) {
      return {
        success: false,
        error: "Invalid credentials. Please check your phone number and password.",
      };
    }

    // Create session
    const session = await Session.create({
      restoId: restaurant._id,
    });

    const result = serializePlain(restaurant.toObject());
    delete result.password;

    return {
      success: true,
      restaurant: result,
      sessionId: session._id.toString(),
    };
  } catch (error) {
    console.error("Login Error:", error);
    return {
      success: false,
      error: "Login failed. Please try again.",
    };
  }
}

/* ---------------- SIGNUP ---------------- */
export async function signupRestaurantAction(data) {
  try {
    await connectDB();

    const { restaurantName, phone, state, city, password } = data;

    // Check if phone already exists
    const existingRestaurant = await RestaurantAuth.findOne({ phone });
    if (existingRestaurant) {
      return {
        success: false,
        error: "Phone number already registered. Please login instead.",
      };
    }

    // Generate unique restoId
    let restoId = generateRestoId();
    let existingRestoId = await RestaurantAuth.findOne({ restoId });
    while (existingRestoId) {
      restoId = generateRestoId();
      existingRestoId = await RestaurantAuth.findOne({ restoId });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create restaurant
    const newRestaurant = await RestaurantAuth.create({
      restoId,
      restaurantName,
      phone,
      state,
      city,
      password: hashedPassword,
    });

    const result = serializePlain(newRestaurant.toObject());
    delete result.password;

    return {
      success: true,
      restaurant: result,
      restoId: restoId,
    };
  } catch (error) {
    console.error("Signup Error:", error);

    if (error.code === 11000) {
      return {
        success: false,
        error: "Phone number already registered.",
      };
    }

    return {
      success: false,
      error: "Registration failed. Please try again.",
    };
  }
}

/* ---------------- GET RESTAURANT BY SESSION ---------------- */
export async function getRestaurantByIdAction(restaurantId) {
  try {
    await connectDB();

    const restaurant = await RestaurantAuth.findById(restaurantId)
      .select("-password")
      .lean();

    if (!restaurant) {
      return {
        success: false,
        error: "Restaurant not found",
      };
    }

    return {
      success: true,
      restaurant: serializePlain(restaurant),
    };
  } catch (error) {
    console.error("Get Restaurant Error:", error);
    return {
      success: false,
      error: "Failed to fetch restaurant",
    };
  }
}
