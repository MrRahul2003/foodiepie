"use server";
import { connectDB } from "@/src/lib/db";
import CustomerProfile from "@/src/models/CustomerProfileModel";
import CustomerSession from "@/src/models/CustomerSessionModel";

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

/* ---------------- CHECK EXISTING SESSION ---------------- */
export async function checkCustomerSession(phone, restoId) {
  try {
    await connectDB();

    // Find existing session for this phone and restaurant
    const session = await CustomerSession.findOne({
      phone,
      restoId,
      expiresAt: { $gt: new Date() }, // Not expired
    }).lean();

    if (!session) {
      return { success: false, session: null };
    }

    // Get user profile as well
    const userProfile = await CustomerProfile.findById(session.profileId).lean();

    return {
      success: true,
      session: serializePlain(session),
      userProfile: userProfile ? serializePlain(userProfile) : null,
    };
  } catch (error) {
    console.error("Check Session Error:", error);
    return { success: false, error: error.message };
  }
}

/* ---------------- CREATE OR GET USER PROFILE ---------------- */
export async function createOrGetCustomerProfile(phone, restoId, tableNo) {
  try {
    await connectDB();

    // Check if profile already exists
    let userProfile = await CustomerProfile.findOne({ phone, restoId }).lean();

    if (userProfile) {
      // Update table number if different
      if (userProfile.tableNo !== tableNo) {
        userProfile = await CustomerProfile.findByIdAndUpdate(
          userProfile._id,
          { tableNo, updatedAt: new Date() },
          { new: true }
        ).lean();
      }
      return {
        success: true,
        userProfile: serializePlain(userProfile),
        isNew: false,
      };
    }

    // Create new profile
    const newProfile = await CustomerProfile.create({
      phone,
      restoId,
      tableNo,
      orders: [],
    });

    return {
      success: true,
      userProfile: serializePlain(newProfile.toObject()),
      isNew: true,
    };
  } catch (error) {
    console.error("Create Profile Error:", error);
    return { success: false, error: error.message };
  }
}

/* ---------------- CREATE SESSION ---------------- */
export async function createCustomerSession(profileId, phone, restoId, tableNo) {
  try {
    await connectDB();

    // Delete any existing sessions for this phone and restaurant
    await CustomerSession.deleteMany({ phone, restoId });

    // Create new session
    const newSession = await CustomerSession.create({
      profileId,
      phone,
      restoId,
      tableNo,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    return {
      success: true,
      session: serializePlain(newSession.toObject()),
    };
  } catch (error) {
    console.error("Create Session Error:", error);
    return { success: false, error: error.message };
  }
}

/* ---------------- LOGOUT / DESTROY SESSION ---------------- */
export async function destroyCustomerSession(phone, restoId) {
  try {
    await connectDB();

    await CustomerSession.deleteMany({ phone, restoId });

    return { success: true };
  } catch (error) {
    console.error("Destroy Session Error:", error);
    return { success: false, error: error.message };
  }
}
