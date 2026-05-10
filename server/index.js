import "dotenv/config";
import app from "./src/app.js";
import { PORT, NODE_ENV } from "./src/config/env.js";
import { connectDB } from "./src/db/mongo.js";

// Connect to MongoDB and start server
async function start() {
  try {
    await connectDB();
  } catch (err) {
    if (
      NODE_ENV === "production" &&
      (String(err.message).includes("MongoDB required") ||
        String(err.message).includes("MongoDB connection failed"))
    ) {
      console.error("[Server] Fatal:", err.message);
      process.exit(1);
    }
    console.warn("[Server] Running without MongoDB connection");
  }

  app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
  });
}

// Start the server
start();
