/**
 * Analyze API — versioned under /api/v1/analyze
 */

import request from "supertest";
import app from "../../src/app.js";

describe("GET /api/v1/analyze/history", () => {
  test("without auth → 401", async () => {
    const res = await request(app).get("/api/v1/analyze/history");
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /api/v1/analyze/match", () => {
  test("without auth → 401", async () => {
    const res = await request(app)
      .post("/api/v1/analyze/match")
      .send({ jobId: "507f1f77bcf86cd799439011" });
    expect(res.statusCode).toBe(401);
  });
});
