/**
 * Sequential auth E2E: register → refresh → protected route → logout
 */

import request from "supertest";
import app from "../../src/app.js";

describe("Auth flow (in-memory store)", () => {
  test("register returns refreshToken; refresh issues new pair; profile is authorized", async () => {
    const email = `flow-${Date.now()}@example.com`;
    const reg = await request(app).post("/api/v1/auth/register").send({
      email,
      password: "secret12",
      name: "Flow",
      role: "candidate",
    });
    expect(reg.statusCode).toBe(201);
    expect(reg.body.success).toBe(true);
    expect(reg.body.data.token).toBeDefined();
    expect(reg.body.data.refreshToken).toBeDefined();

    const { refreshToken } = reg.body.data;

    const refr = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken });
    expect(refr.statusCode).toBe(200);
    expect(refr.body.data.token).toBeDefined();
    expect(refr.body.data.refreshToken).toBeDefined();

    const prof = await request(app)
      .get("/api/v1/users/profile")
      .set("Authorization", `Bearer ${refr.body.data.token}`);
    expect(prof.statusCode).toBe(200);
    expect(prof.body.data.email).toBe(email.toLowerCase());

    const out = await request(app)
      .post("/api/v1/auth/logout")
      .send({ refreshToken: refr.body.data.refreshToken });
    expect(out.statusCode).toBe(200);
  });

  test("invalid refresh token → 401", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "0".repeat(64) });
    expect(res.statusCode).toBe(401);
  });
});
