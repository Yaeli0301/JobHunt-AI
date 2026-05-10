/**
 * User persistence helpers (refresh tokens, lookup).
 */

import User from "../models/User.model.js";
import {
  isUsingMongoDB,
  findUserByRefreshHash as findMemoryUserByRefreshHash,
  updateUser as updateMemoryUser,
} from "../db/mongo.js";

export async function findUserByRefreshTokenHash(hash) {
  if (!hash) return null;
  if (isUsingMongoDB()) {
    return User.findOne({
      refreshTokenHash: hash,
      refreshTokenExpiresAt: { $gt: new Date() },
    })
      .select("+refreshTokenHash +refreshTokenExpiresAt")
      .lean();
  }
  return findMemoryUserByRefreshHash(hash);
}

export async function setUserRefreshCredentials(userId, hash, expiresAt) {
  if (isUsingMongoDB()) {
    await User.findByIdAndUpdate(userId, {
      $set: {
        refreshTokenHash: hash,
        refreshTokenExpiresAt: expiresAt,
      },
    });
    return;
  }
  updateMemoryUser(String(userId), {
    refreshTokenHash: hash,
    refreshTokenExpiresAt: expiresAt instanceof Date
      ? expiresAt.toISOString()
      : expiresAt,
  });
}

export async function clearUserRefreshCredentials(userId) {
  if (isUsingMongoDB()) {
    await User.findByIdAndUpdate(userId, {
      $unset: { refreshTokenHash: 1, refreshTokenExpiresAt: 1 },
    });
    return;
  }
  updateMemoryUser(String(userId), {
    refreshTokenHash: null,
    refreshTokenExpiresAt: null,
  });
}
