import mongoose from "mongoose";

const DB_URI = process.env.MONGODB_URI;

if (!DB_URI) {
  throw new Error("❌ DB_URL is not defined in .env.local");
}

export const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("Already connected!");
      return;
    }

    await mongoose.connect(DB_URI, {
      dbName: "foodiePie",
    });

    console.log("✅ Database connected!");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
};
