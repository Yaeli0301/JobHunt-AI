/**
 * Unit Tests — Auth Middleware
 * Tests for JWT verification and protection
 */

import jwt from "jsonwebtoken";
import { authenticate } from "../../src/middleware/auth.middleware.js";
import { JWT_SECRET } from "../../src/config/env.js";

// Mock request/response
const mockReq = (token) => ({
  headers: token ? { authorization: `Bearer ${token}` } : {},
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe("auth.middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authenticate", () => {
    test("no token → 401", async () => {
      const req = mockReq(null);
      const res = mockRes();
      
      await authenticate(req, res, mockNext);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Access denied. No token provided.",
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("invalid token format → 401", async () => {
      const req = mockReq("invalid-token");
      const res = mockRes();
      
      await authenticate(req, res, mockNext);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("malformed token → 401", async () => {
      const req = mockReq("Bearer something.wrong");
      const res = mockRes();
      
      await authenticate(req, res, mockNext);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("expired token → 401", async () => {
      const expiredToken = jwt.sign(
        { id: "123", email: "test@test.com" },
        JWT_SECRET,
        { expiresIn: "-1s" }
      );
      
      const req = mockReq(expiredToken);
      const res = mockRes();
      
      await authenticate(req, res, mockNext);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("valid token → sets req.user and calls next", async () => {
      const payload = { id: "user123", email: "test@test.com" };
      const token = jwt.sign(payload, JWT_SECRET);
      
      const req = mockReq(token);
      const res = mockRes();
      
      await authenticate(req, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(req.user).toMatchObject({
        id: payload.id,
        email: payload.email,
      });
    });

    test("valid token with extra claims → preserves all claims", async () => {
      const payload = { 
        id: "user123", 
        email: "test@test.com",
        role: "admin",
        permissions: ["read", "write"]
      };
      const token = jwt.sign(payload, JWT_SECRET);
      
      const req = mockReq(token);
      const res = mockRes();
      
      await authenticate(req, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(req.user.role).toBe("admin");
    });
  });
});

describe("JWT handling edge cases", () => {
  test("handles token with unicode characters", () => {
    const payload = { id: "user123", name: "José García" };
    const token = jwt.sign(payload, JWT_SECRET);
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    expect(decoded.name).toBe("José García");
  });

  test("handles empty payload", () => {
    const token = jwt.sign({}, JWT_SECRET);
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    expect(decoded).toHaveProperty("iat");
  });

  test("handles special characters in payload", () => {
    const payload = { 
      id: "user123", 
      bio: "Developer & Architect | Tech Lead <3",
      tags: ["full-stack", "react", "node.js"]
    };
    const token = jwt.sign(payload, JWT_SECRET);
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    expect(decoded.bio).toBe(payload.bio);
    expect(decoded.tags).toEqual(payload.tags);
  });
});
