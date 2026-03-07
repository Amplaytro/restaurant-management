import mongoose from "mongoose";
import { env } from "./env.js";

let hasConnected = false;

export async function connectDatabase() {
  if (hasConnected) {
    return mongoose.connection;
  }

  await mongoose.connect(env.mongoUri);
  hasConnected = true;
  return mongoose.connection;
}
