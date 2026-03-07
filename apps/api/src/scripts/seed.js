import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { ensureSeedData } from "../services/restaurantService.js";

async function run() {
  await connectDatabase();
  await ensureSeedData();
  console.log("Seed complete");
  await mongoose.connection.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
