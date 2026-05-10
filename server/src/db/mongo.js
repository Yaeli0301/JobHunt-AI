/**
 * MongoDB Connection
 * Single reusable connection using Mongoose.
 * Falls back to in-memory store if MongoDB unavailable.
 */

import mongoose from "mongoose";
import { MONGODB_URI, NODE_ENV } from "../config/env.js";
import memoryStore from "./memoryStore.js";

let isConnected = false;
let useMemoryStore = false;

// Re-export memory store functions for unified interface
export const createUser = memoryStore.createUser;
export const findUserByEmail = memoryStore.findUserByEmail;
export const findUserById = memoryStore.findUserById;
export const findUserByRefreshHash = memoryStore.findUserByRefreshHash;
export const updateUser = memoryStore.updateUser;
export const createAnalysis = memoryStore.createAnalysis;
export const findAnalysesByUserId = memoryStore.findAnalysesByUserId;
export const findAnalysisById = memoryStore.findAnalysisById;

export async function connectDB() {
  if (isConnected) {
    console.log("[MongoDB] Using existing connection");
    return;
  }

  if (NODE_ENV === "production" && !MONGODB_URI) {
    throw new Error("MongoDB required in production (set MONGODB_URI).");
  }

  if (!MONGODB_URI) {
    console.warn("[MongoDB] MONGODB_URI not set. Using in-memory store.");
    useMemoryStore = true;
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    useMemoryStore = false;
    console.log("[MongoDB] Connected successfully");
  } catch (err) {
    if (NODE_ENV === "production") {
      console.error("[MongoDB] Connection failed in production:", err.message);
      throw new Error("MongoDB connection failed in production.");
    }
    console.warn("[MongoDB] Connection failed:", err.message, "- Using in-memory store");
    useMemoryStore = true;
  }
}

export async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log("[MongoDB] Disconnected");
}

/**
 * Check if using MongoDB or memory store.
 */
export function isUsingMongoDB() {
  return isConnected && !useMemoryStore;
}

/**
 * Get the data storage mode.
 */
export function getStorageMode() {
  return useMemoryStore ? "memory" : "mongodb";
}
