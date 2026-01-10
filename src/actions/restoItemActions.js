"use server";

import { cookies } from "next/headers";
import { connectDB } from "@/src/lib/db";
import { addFoodItemSchema, editFoodItemSchema } from "@/src/schema/restoFoodItemSchema";
import RestaurantFood from "@/src/models/AdminFoodModel";
import RestaurantAuth from "@/src/models/AdminAuthModel";

function formDataToObject(formData) {
  // If it's already a plain object, return it directly
  if (!(formData instanceof FormData)) {
    return formData;
  }
  const obj = {};
  for (const [key, value] of formData.entries()) {
    obj[key] = value;
  }
  return obj;
}

/* ----- GET ALL RESTAURANT FOOD ITEMS BY RESTO CODE (6-char code) ------- */
export async function getAllFoodItemsByRestoCode(restoCode) {
  try {
    console.log("=== getAllFoodItemsByRestoCode called ===");
    console.log("Input restoCode:", restoCode);
    
    await connectDB();

    // First, find the restaurant by restoId (6-char code)
    const restaurant = await RestaurantAuth.findOne({
      restoId: restoCode.toUpperCase(),
    }).lean();

    console.log("Restaurant found:", restaurant ? restaurant._id : "NOT FOUND");

    if (!restaurant) {
      return {
        success: false,
        error: "RESTAURANT_NOT_FOUND",
      };
    }

    // Now fetch food items using the restaurant's MongoDB _id
    const foodItems = await RestaurantFood.find({
      restaurantId: restaurant._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log("Food items found:", foodItems.length);

    // Serialize MongoDB documents to plain objects
    const serializedItems = foodItems.map((item) => ({
      ...item,
      _id: item._id.toString(),
      restaurantId: item.restaurantId.toString(),
      createdAt: item.createdAt?.toISOString(),
      updatedAt: item.updatedAt?.toISOString(),
      tags: item.tags || [],
      variants: item.variants?.map((v) => ({
        ...v,
        _id: v._id?.toString(),
      })),
    }));

    return {
      success: true,
      data: serializedItems,
    };
  } catch (error) {
    console.error("Get Food Items By Resto Code Error:", error);
    return {
      success: false,
      error: "SERVER_ERROR",
    };
  }
}

/* ----- GET ALL RESTAURANT FOOD ITEMS CORRESPONDING TO RESTAURANT ID------- */
export async function getAllFoodItemsCorrespondingToRestaurantId(restaurantId) {
  try {
    await connectDB();

    // ✅ Validate ObjectId
    // if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    //   return {
    //     success: false,
    //     error: "INVALID_RESTAURANT_ID",
    //   };
    // }

    const foodItems = await RestaurantFood.find({
      restaurantId: restaurantId,
    })
      .sort({ createdAt: -1 })
      .lean();

    // ✅ Serialize MongoDB documents to plain objects
    const serializedItems = foodItems.map((item) => ({
      ...item,
      _id: item._id.toString(),
      restaurantId: item.restaurantId.toString(),
      createdAt: item.createdAt?.toISOString(),
      updatedAt: item.updatedAt?.toISOString(),
      tags: item.tags || [],
      variants: item.variants?.map((v) => ({
        ...v,
        _id: v._id?.toString(),
      })),
    }));

    return {
      success: true,
      data: serializedItems,
    };
  } catch (error) {
    console.error("Get Food Items Error:", error);
    return {
      success: false,
      error: "SERVER_ERROR",
    };
  }
}

/* ================= GET RESTAURANT ID FROM RESTO CODE ================= */
export async function getRestaurantIdByRestoCode(restoCode) {
  try {
    await connectDB();
    
    const restaurant = await RestaurantAuth.findOne({
      restoId: restoCode.toUpperCase(),
    }).lean();
    
    if (!restaurant) {
      return { success: false, error: "RESTAURANT_NOT_FOUND" };
    }
    
    return { 
      success: true, 
      restaurantId: restaurant._id.toString() 
    };
  } catch (error) {
    console.error("Get Restaurant ID Error:", error);
    return { success: false, error: "SERVER_ERROR" };
  }
}

/* ================= ADD FOOD ITEM - POST================= */
export async function addFoodItemAction(_, rawData) {
  try {
    await connectDB();

    // ✅ Convert FormData to normal object
    const data = formDataToObject(rawData);

    const parsed = addFoodItemSchema.safeParse(data);
    console.log("Parsed data:", parsed.data);

    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    await RestaurantFood.create(parsed.data);

    return { success: true };
  } catch (err) {
    console.error("addFoodItemAction error:", err);
    return { success: false, error: "SERVER_ERROR" };
  }
}

/* ================= DELETE FOOD ITEM - DELETE================= */

export async function deleteFoodItemAction(foodItemId) {
  try {
    await connectDB();

    const deleted = await RestaurantFood.findOneAndDelete({
      _id: foodItemId,
    });

    if (!deleted) {
      return { success: false, error: "NOT_FOUND" };
    }

    return { success: true, id: foodItemId };
  } catch (err) {
    console.error("deleteFoodItemAction error:", err);
    return { success: false, error: "SERVER_ERROR" };
  }
}

/* ================= UPDATE FOOD ITEM - PATCH ================= */
export async function updateFoodItemAction(_, rawData) {
  try {
    await connectDB();

    // ✅ Convert FormData to normal object
    const data = formDataToObject(rawData);
    console.log("Raw data received for update:", data);

    const parsed = editFoodItemSchema.safeParse(data);
    console.log("Parsed data:", parsed.data);

    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    // -------- UPDATE --------
    const updatedFood = await RestaurantFood.findOneAndUpdate(
      {
        _id: rawData._id,
      },
      parsed.data,
      { new: true }
    );

    if (!updatedFood) {
      return { error: "FOOD_NOT_FOUND" };
    }

    return { success: true };
  } catch (err) {
    console.error("updateFoodItemAction error:", err);
    return { error: "SERVER_ERROR" };
  }
}
