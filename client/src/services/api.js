/**
 * API client — base URL `{REACT_APP_API_URL}/api/v1` with Axios + JWT.
 */

import axios from "axios";

const TOKEN_KEY = "ai_job_token";
const REFRESH_KEY = "ai_job_refresh";
const USER_KEY = "ai_job_user";

const API_ORIGIN =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:3001";

/** Use REACT_APP_API_URL as server origin only (e.g. http://localhost:3001), not including /api/v1. */
export const API_BASE = `${API_ORIGIN}/api/v1`;

export const http = axios.create({
  baseURL: API_BASE,
  timeout: 90000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else if (!config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "Request failed";
    return Promise.reject(new Error(msg));
  }
);

const analysisCache = new Map();

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

function storeAuth(token, user, refreshToken) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (refreshToken !== undefined) {
    if (refreshToken) {
      localStorage.setItem(REFRESH_KEY, refreshToken);
    } else {
      localStorage.removeItem(REFRESH_KEY);
    }
  }
}

function clearLocalAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  analysisCache.clear();
}

export function logout() {
  const refresh = localStorage.getItem(REFRESH_KEY);
  const token = getToken();
  if (refresh || token) {
    axios
      .post(
        `${API_BASE}/auth/logout`,
        refresh ? { refreshToken: refresh } : {},
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          timeout: 15000,
        }
      )
      .catch(() => {});
  }
  clearLocalAuth();
}

export function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function register(email, password, name, title, role = "candidate") {
  const { data: body } = await http.post("/auth/register", {
    email,
    password,
    name,
    title,
    role,
  });
  storeAuth(body.data.token, body.data.user, body.data.refreshToken);
  return body.data;
}

export async function login(email, password) {
  const { data: body } = await http.post("/auth/login", { email, password });
  storeAuth(body.data.token, body.data.user, body.data.refreshToken);
  return body.data;
}

export async function fetchProfile() {
  const { data: body } = await http.get("/users/profile");
  return body.data;
}

export async function updateProfile(profileData) {
  const { data: body } = await http.put("/users/profile", profileData);
  if (body.data) {
    localStorage.setItem(USER_KEY, JSON.stringify(body.data));
  }
  return body.data;
}

export async function uploadCV(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data: body } = await http.post("/users/upload-cv", formData);
  return body.data.profile;
}

export async function generateBio(profile, targetRole = "") {
  const { data: body } = await http.post("/users/generate-bio", {
    profile,
    targetRole,
  });
  return body.data;
}

export async function analyzeJob(payload, useCache = false) {
  const cacheKey = JSON.stringify(payload);
  if (useCache && analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey);
  }
  const { data: body } = await http.post("/analyze/match", payload);
  if (useCache) analysisCache.set(cacheKey, body.data);
  return body.data;
}

export async function fetchHistory(options = {}) {
  const { limit = 50 } = options;
  const { data: body } = await http.get("/analyze/history", {
    params: { limit },
  });
  return body.data;
}

export async function generateCoverLetter(job, profile) {
  const { data: body } = await http.post("/analyze/cover-letter", {
    job,
    profile,
  });
  return body.data.coverLetter;
}

export async function fetchRecommendations() {
  const { data: body } = await http.get("/analyze/recommendations");
  return body.data;
}

export async function exportAnalysis(id) {
  const { data: body } = await http.get(`/analyze/export/${id}`);
  return body.data;
}

export async function simulateCareer(payload) {
  const { data: body } = await http.post("/analyze/simulate", payload);
  return body.data;
}

export function clearCache() {
  analysisCache.clear();
}

export async function fetchJobs(options = {}) {
  const {
    page = 1,
    limit = 20,
    role,
    salaryMin,
    salaryMax,
    experience,
    workType,
    location,
  } = options;
  const params = { page, limit };
  if (role) params.role = role;
  if (salaryMin) params.salaryMin = salaryMin;
  if (salaryMax) params.salaryMax = salaryMax;
  if (experience) params.experience = experience;
  if (workType) params.workType = workType;
  if (location) params.location = location;

  const { data: body } = await http.get("/jobs", { params });
  return body.data;
}

export async function fetchJob(id) {
  const { data: body } = await http.get(`/jobs/${id}`);
  return body.data;
}

export async function matchJob(jobId) {
  const { data: body } = await http.post("/analyze/match", { jobId });
  return body.data;
}

export async function applyJob(jobId, messageOrOpts) {
  const payload =
    messageOrOpts && typeof messageOrOpts === "object"
      ? { jobId, ...messageOrOpts }
      : { jobId, message: messageOrOpts };
  const { data: body } = await http.post("/applications", payload);
  return body.data;
}

export async function fetchMyApplications(options = {}) {
  const { jobId, status, page = 1, limit = 20 } = options;
  const params = { page, limit };
  if (jobId) params.jobId = jobId;
  if (status) params.status = status;
  const { data: body } = await http.get("/applications", { params });
  return body.data;
}

export async function fetchMyJobs(options = {}) {
  const { page = 1, limit = 10 } = options;
  const { data: body } = await http.get("/jobs", {
    params: { owner: "me", page, limit },
  });
  return body.data;
}

export async function createJob(payload) {
  const { data: body } = await http.post("/jobs", payload);
  return body.data;
}

export async function fetchJobApplicants(jobId, options = {}) {
  const { minScore, status, sort = "matchScore" } = options;
  const params = {};
  if (minScore !== undefined && minScore !== "") params.minScore = minScore;
  if (status) params.status = status;
  if (sort) params.sort = sort;
  const { data: body } = await http.get(`/jobs/${jobId}/applicants`, {
    params,
  });
  return body.data;
}
