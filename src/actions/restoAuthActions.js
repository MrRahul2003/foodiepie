"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { connectDB } from "@/app/lib/connectDB";
import { signCookie } from "@/app/lib/auth";

import RestaurantAuth from "@/app/models/RestaurantAuthModel";
import Session from "@/app/models/RestaurantSessionModel";
import { registerSchema, loginSchema } from "@/app/schema/restoAuthSchema";

/* ---------------- GET CURRENT RESTAURANT ---------------- */
export async function getCurrentRestaurant() {
  try {
    await connectDB();
    
    const cookieStore = await cookies();
    const signed = cookieStore.get("sid")?.value;
    
    if (!signed) {
      return { error: "UNAUTHORIZED" };
    }
    
    const { verifyCookie } = await import("@/app/lib/auth");
    const sessionId = verifyCookie(signed);
    
    if (!sessionId) {
      return { error: "UNAUTHORIZED" };
    }
    
    const session = await Session.findById(sessionId).lean();
    if (!session) {
      return { error: "UNAUTHORIZED" };
    }
    
    const resto = await RestaurantAuth.findById(session.restoId)
      .select("-password -__v")
      .lean();
    
    if (!resto) {
      return { error: "UNAUTHORIZED" };
    }
    
    return serializePlain(resto);
  } catch (error) {
    console.error("Get Current User Error:", error);
    return { error: "UNAUTHORIZED" };
  }
}

/* ---------------- HELPERS ---------------- */

function serializePlain(value) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(serializePlain);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if (typeof value.toHexString === "function") {
      return value.toHexString();
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = serializePlain(v);
    }
    return out;
  }
  return value;
}

/* ---------------- GET RESTAURANTS ---------------- */
export async function getAllRestaurants() {
  try {
    await connectDB();
    const data = await RestaurantAuth.find().lean();

    return {
      success: true,
      result: serializePlain(data),
    };
  } catch (error) {
    console.error("GET Restaurant Error:", error);

    return {
      success: false,
      errors: { general: "Failed to fetch restaurants" },
    };
  }
}

/* ---------------- LOGIN / SIGNUP ---------------- */
export async function authRestaurant(_, formData) {
  try {
    await connectDB();

    /* ================= LOGIN ================= */
    if (formData.login) {
      const parsed = loginSchema.safeParse(formData);

      if (!parsed.success) {
        return {
          success: false,
          errors: parsed.error.flatten().fieldErrors,
        };
      }
      console.log("Parsed Data:", parsed);

      const { email, password } = parsed.data;

      const restaurant = await RestaurantAuth.findOne({ email }).select(
        "+password"
      );

      if (!restaurant) {
        return {
          success: false,
          errors: { general: "Invalid email or password" },
        };
      }
      console.log("Found Restaurant:", restaurant.password);

      const isMatch = await bcrypt.compare(password, restaurant.password);

      if (!isMatch) {
        return {
          success: false,
          errors: { general: "Invalid email or password" },
        };
      }

      // Create session
      const session = await Session.create({
        restoId: restaurant._id,
      });

      const cookieStore = await cookies();

      // Set signed session cookie
      cookieStore.set("sid", signCookie(session._id.toString()), {
        httpOnly: true,
        maxAge: 60 * 60 * 24, // 1 day
        sameSite: "lax",
        path: "/",
      });

      const result = serializePlain(restaurant.toObject());
      delete result.password;

      return { success: true, result };
    }

    /* ================= SIGNUP ================= */
    const parsed = registerSchema.safeParse(formData);
    console.log("Parsed Data:", parsed);

    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { password, ...rest } = parsed.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newRestaurant = await RestaurantAuth.create({
      ...rest,
      password: hashedPassword,
    });

    const result = serializePlain(newRestaurant.toObject());
    delete result.password;

    return { success: true, result };
  } catch (error) {
    console.error("Restaurant Auth Error:", error);

    if (error.code === 11000) {
      return {
        success: false,
        errors: { email: "Email already exists" },
      };
    }

    return {
      success: false,
      errors: { general: "Authentication failed. Please try again." },
    };
  }
}

export async function logoutUser() {
  await connectDB(); // ✅ MUST come first

  const sessionId = await getCurrentRestaurant();
  if (!sessionId) {
    return { success: true };
  }

  // ✅ correct deletion
  await Session.findByIdAndDelete(sessionId);

  const cookieStore = await cookies();
  cookieStore.delete("sid");

  return { success: true };
}