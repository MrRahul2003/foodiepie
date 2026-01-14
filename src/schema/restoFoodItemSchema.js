import { z } from "zod/v4";

/* ---------------- RESTAURANT FOOD SCHEMA ---------------- */
export const addFoodItemSchema = z
  .object({
    name: z
      .string()
      .min(2, "Food name must be at least 2 characters")
      .max(100, "Food name cannot exceed 100 characters"),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description cannot exceed 500 characters"),

    category: z.string().min(1, "Category is required"),

    foodType: z.enum(["Veg", "Non-Veg", "Vegan", "Egg"], {
      message: "Invalid food type",
    }),

    variants: z.array(
      z.object({
        label: z.string().min(1, "Variant label is required"),
        price: z.coerce.number().positive("Price must be greater than 0"),

        isAvailable: z.coerce.boolean().optional().default(true),
      })
    ),

    tags: z.array(z.string()).optional().default([]),

    imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),

    isAvailable: z.coerce.boolean().optional().default(true),

    restaurantId: z.string().min(1, "Restaurant ID is required"),
  })
  .passthrough(); // 🔥 allows extra fields (FormData, files, etc.)


  /* ---------------- EDIT FOOD ITEM SCHEMA ---------------- */
export const editFoodItemSchema = addFoodItemSchema
  .partial() // 🔥 make all fields optional
  .extend({
    _id: z.string().min(1, "Food item ID is required"),
  });