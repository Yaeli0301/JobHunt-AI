/**
 * AI Service - Simplified for Lazy Users
 * 
 * Provides two main functions:
 * 1. generateInsights - For job matching (existing)
 * 2. generateBio - For profile building (new - simplified)
 * 
 * Returns structured JSON. On any failure → graceful fallback (never crashes).
 */

import { OPENAI_API_KEY, OPENAI_MODEL } from "../config/env.js";

// ----- Fallback Responses -----

const FALLBACK_INSIGHTS = {
  strengths: ["Unable to analyze strengths — AI service unavailable."],
  weaknesses: ["Unable to analyze weaknesses — AI service unavailable."],
  messageToRecruiter:
    "Match score was calculated by the rules engine. AI enhancement unavailable.",
  linkedInMessage: "Hi, I came across your job posting and I'm very interested. Would love to discuss this opportunity with you.",
  careerAdvice:
    "Focus on acquiring the missing skills listed above to improve fit.",
};

const FALLBACK_BIO = {
  headline: "Professional seeking new opportunities",
  summary: "Dedicated professional looking to contribute to innovative projects.",
  summaryShort: "Dedicated professional looking to contribute to innovative projects.",
  summaryMedium: "Experienced professional seeking new opportunities to apply skills and grow with a dynamic team.",
  summaryDetailed: "Motivated professional with a passion for delivering quality work. Looking for challenging opportunities to apply expertise and contribute to team success.",
  skillsClassification: { core: [], secondary: [], tools: [] },
  strengthsSummary: [],
  detectedRole: "",
};

/**
 * Generate recruiter insights via OpenAI API.
 * For job matching analysis.
 * 
 * @param {object} job - Job description object
 * @param {object} profile - Candidate profile object
 * @param {number} score - Deterministic match score (0–100)
 * @param {string[]} matchedSkills
 * @param {string[]} missingSkills
 * @returns {Promise<object>} insights object
 */
export async function generateInsights(job, profile, score, matchedSkills, missingSkills) {
  console.log("[AIService] Calling OpenAI for insights...");

  if (!OPENAI_API_KEY) {
    console.warn("[AIService] OPENAI_API_KEY not configured. Returning fallback.");
    return { ...FALLBACK_INSIGHTS };
  }

  try {
    const prompt = buildInsightsPrompt(job, profile, score, matchedSkills, missingSkills);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an expert technical recruiter. Respond ONLY with valid JSON. No markdown formatting. Keys: strengths, weaknesses, messageToRecruiter, careerAdvice.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[AIService] OpenAI HTTP error:", response.status, errText);
      return { ...FALLBACK_INSIGHTS };
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    const parsed = parseInsightsResponse(rawContent);
    console.log("[AIService] Insights received.");
    return parsed;
  } catch (error) {
    console.error("[AIService] AI call failed:", error.message);
    return { ...FALLBACK_INSIGHTS };
  }
}

/**
 * Generate candidate bio (SIMPLIFIED for lazy users).
 * Returns: headline, short bio (max 3 lines), skills classification.
 * 
 * @param {object} profile - Candidate profile { skills, experienceYears, title, experience[] }
 * @param {string} targetRole - Optional target role
 * @returns {Promise<object>} bio object
 */
export async function generateBio(profile, targetRole = "") {
  console.log("[AIService] Generating bio...");

  if (!OPENAI_API_KEY) {
    console.warn("[AIService] OPENAI_API_KEY not configured. Returning fallback.");
    return { ...FALLBACK_BIO };
  }

  try {
    const prompt = buildBioPrompt(profile, targetRole);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a career coach. Create SHORT, punchy profiles. Respond ONLY with valid JSON. Keep responses brief - headline under 60 chars, summary under 150 chars. Keys: headline, summary, summaryShort, summaryMedium, summaryDetailed, skillsClassification (core, secondary, tools arrays), strengthsSummary, detectedRole.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[AIService] OpenAI HTTP error:", response.status, errText);
      return { ...FALLBACK_BIO };
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    const parsed = parseBioResponse(rawContent, profile);
    console.log("[AIService] Bio generated.");
    return parsed;
  } catch (error) {
    console.error("[AIService] Bio generation failed:", error.message);
    return { ...FALLBACK_BIO };
  }
}

// ----- Prompt Builders -----

function buildInsightsPrompt(job, profile, score, matchedSkills, missingSkills) {
  const jobTitle = job?.title || "Unknown";
  const jobDesc = job?.description || "";
  const reqSk = job?.requiredSkills || [];
  const skillsStr = reqSk
    .map((s) => (typeof s === "string" ? s : s?.name))
    .filter(Boolean)
    .join(", ");
  const profileSkills = (profile?.skills || []).join(", ");
  const expYears = profile?.experienceYears || 0;
  const matched = matchedSkills?.join(", ") || "none";
  const missing = missingSkills?.join(", ") || "none";

  return `Analyze candidate for ${jobTitle}.

Job: ${jobDesc}
Required: ${skillsStr}
Candidate: ${profileSkills}, ${expYears} years exp

Score: ${score}/100
Match: ${matched}
Gap: ${missing}

JSON: strengths[], weaknesses[], messageToRecruiter, careerAdvice`;
}

function buildBioPrompt(profile, targetRole) {
  const skills = (profile?.skills || []).join(", ");
  const expYears = profile?.experienceYears || 0;
  const title = profile?.title || profile?.detectedRole || "";
  const expList = profile?.experience?.slice(0, 2).map(e => `${e.title} at ${e.company}`).join("; ") || "";
  const target = targetRole ? `Target: ${targetRole}` : "";

  return `Create profile for: ${title}
Skills: ${skills}
Experience: ${expYears} years
${target}
Recent: ${expList}

JSON with short content`;
}

// ----- Response Parsers -----

function parseInsightsResponse(rawContent) {
  try {
    const cleaned = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      messageToRecruiter: String(parsed.messageToRecruiter || FALLBACK_INSIGHTS.messageToRecruiter),
      linkedInMessage: String(parsed.linkedInMessage || generateLinkedInMessage(parsed.messageToRecruiter)),
      careerAdvice: String(parsed.careerAdvice || FALLBACK_INSIGHTS.careerAdvice),
    };
  } catch (err) {
    console.error("[AIService] Parse insights failed:", err.message);
    return { ...FALLBACK_INSIGHTS };
  }
}

function parseBioResponse(rawContent, profile) {
  try {
    const cleaned = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // Use profile skills if AI didn't classify
    const coreSkills = parsed.skillsClassification?.core || profile?.skills?.slice(0, 5) || [];
    const secSkills = parsed.skillsClassification?.secondary || profile?.skills?.slice(5) || [];
    const toolSkills = parsed.skillsClassification?.tools || [];

    return {
      headline: parsed.headline || FALLBACK_BIO.headline,
      summary: parsed.summary || parsed.summaryShort || FALLBACK_BIO.summary,
      summaryShort: parsed.summaryShort || parsed.summary || FALLBACK_BIO.summaryShort,
      summaryMedium: parsed.summaryMedium || parsed.summaryMedium || FALLBACK_BIO.summaryMedium,
      summaryDetailed: parsed.summaryDetailed || FALLBACK_BIO.summaryDetailed,
      skillsClassification: {
        core: Array.isArray(coreSkills) ? coreSkills : [],
        secondary: Array.isArray(secSkills) ? secSkills : [],
        tools: Array.isArray(toolSkills) ? toolSkills : [],
      },
      strengthsSummary: Array.isArray(parsed.strengthsSummary) ? parsed.strengthsSummary : [],
      detectedRole: parsed.detectedRole || profile?.detectedRole || profile?.title || "",
    };
  } catch (err) {
    console.error("[AIService] Parse bio failed:", err.message);
    return { ...FALLBACK_BIO };
  }
}

function generateLinkedInMessage(msg) {
  if (!msg || msg.length < 10) {
    return "Hi, I came across your job posting and I'm very interested. Would love to discuss this opportunity.";
  }
  const lines = msg.split('\n').filter(l => l.trim());
  const short = lines.slice(0, 2).join(' ');
  return short.length > 200 ? short.substring(0, 197) + "..." : short || FALLBACK_INSIGHTS.linkedInMessage;
}

/**
 * Parse CV text to extract candidate information
 * @param {string} cvText - Raw CV text
 * @returns {Promise<object>} Parsed data
 */
export async function parseCVText(cvText) {
  console.log("[AIService] Parsing CV text...");

  if (!OPENAI_API_KEY) {
    console.warn("[AIService] OPENAI_API_KEY not configured. Returning basic extraction.");
    return extractBasicInfo(cvText);
  }

  try {
    const prompt = `Extract information from this CV/resume text. Respond ONLY with valid JSON.

Keys: headline (short title), summary (brief overview), detectedRole (job title/role), extractedSkills (array of skill names), experienceYears (number), location (city/country), education (array of degree strings).

Keep it concise. Skills should be technical skills mentioned.

CV Text:
${cvText.substring(0, 2000)}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a CV parser. Extract structured information from resume text. Respond ONLY with valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[AIService] CV parse HTTP error:", response.status, errText);
      return extractBasicInfo(cvText);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    const parsed = parseCVResponse(rawContent);
    console.log("[AIService] CV parsed.");
    return parsed;
  } catch (error) {
    console.error("[AIService] CV parse failed:", error.message);
    return extractBasicInfo(cvText);
  }
}

// Fallback basic extraction
function extractBasicInfo(cvText) {
  const skills = extractSkillsFromText(cvText);
  return {
    headline: "Professional",
    summary: "Experienced professional",
    detectedRole: "",
    extractedSkills: skills,
    experienceYears: 0,
    location: "",
    education: [],
  };
}

// Simple skill extraction
function extractSkillsFromText(text) {
  const skillPatterns = [
    /\b(javascript|python|java|c\+\+|ruby|php|go|rust|typescript|swift|kotlin)\b/gi,
    /\b(react|angular|vue|node\.js|express|django|flask|spring|laravel)\b/gi,
    /\b(html|css|sass|scss|bootstrap|tailwind)\b/gi,
    /\b(mongodb|mysql|postgresql|redis|elasticsearch)\b/gi,
    /\b(aws|azure|gcp|docker|kubernetes|jenkins|git)\b/gi,
  ];

  const skills = new Set();
  skillPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => skills.add(match.toLowerCase()));
    }
  });

  return Array.from(skills);
}

function parseCVResponse(rawContent) {
  try {
    const cleaned = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      headline: parsed.headline || "",
      summary: parsed.summary || "",
      detectedRole: parsed.detectedRole || "",
      extractedSkills: parsed.extractedSkills || [],
      experienceYears: parsed.experienceYears || 0,
      location: parsed.location || "",
      education: parsed.education || [],
    };
  } catch (err) {
    console.error("[AIService] Parse CV response failed:", err.message);
    return extractBasicInfo("");
  }
}

export default {
  generateInsights,
  generateBio,
  parseCVText,
};
