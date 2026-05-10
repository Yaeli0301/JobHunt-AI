/**
 * CV Parser Service
 * Parses PDF and DOCX CVs to extract candidate information.
 * Uses AI for intelligent extraction when available.
 */

import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { parseCVText } from './ai.service.js';
import { normalizeSkills } from './skillsNormalizer.service.js';

/**
 * Parse CV from buffer
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @returns {Promise<object>} Parsed CV data
 */
export async function parseCV(buffer, filename) {
  try {
    // Extract text from file
    let text = '';
    if (filename.toLowerCase().endsWith('.pdf')) {
      const data = await pdf(buffer);
      text = data.text;
    } else if (filename.toLowerCase().endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      throw new Error('Unsupported file type. Only PDF and DOCX are supported.');
    }

    if (!text || text.trim().length < 50) {
      throw new Error('CV text is too short or could not be extracted.');
    }

    // Use AI to parse CV text
    const parsedData = await parseCVText(text);

    // Extract skills from text (simple approach - can be enhanced)
    const extractedSkills = extractSkillsFromText(text);

    // Normalize skills
    const normalizedSkills = normalizeSkills(extractedSkills);

    return {
      extractedSkills: normalizedSkills,
      resumeText: text,
      detectedRole: parsedData.detectedRole || '',
      headline: parsedData.headline || '',
      summary: parsedData.summary || '',
      summaryShort: parsedData.summary || '',
      summaryMedium: parsedData.summary || '',
      summaryDetailed: parsedData.summary || '',
      skillsClassification: { core: [], secondary: [], tools: [] },
      experienceYears: parsedData.experienceYears || 0,
      location: parsedData.location || '',
      education: parsedData.education || [],
    };
  } catch (error) {
    console.error('[CVParser] Parse failed:', error.message);
    // Return minimal data on failure
    return {
      extractedSkills: [],
      resumeText: '',
      detectedRole: '',
      headline: '',
      summary: '',
      summaryShort: '',
      summaryMedium: '',
      summaryDetailed: '',
      skillsClassification: { core: [], secondary: [], tools: [] },
    };
  }
}

/**
 * Update profile with parsed CV data
 * @param {object} currentProfile - Current user profile
 * @param {object} parsedData - Parsed CV data
 * @returns {object} Updated profile
 */
export function updateProfileWithCV(currentProfile = {}, parsedData) {
  const updated = { ...currentProfile };

  // Update basic fields if not already set
  if (!updated.headline && parsedData.headline) {
    updated.headline = parsedData.headline;
  }
  if (!updated.summary && parsedData.summary) {
    updated.summary = parsedData.summary;
  }
  if (!updated.summaryShort && parsedData.summaryShort) {
    updated.summaryShort = parsedData.summaryShort;
  }
  if (!updated.summaryMedium && parsedData.summaryMedium) {
    updated.summaryMedium = parsedData.summaryMedium;
  }
  if (!updated.summaryDetailed && parsedData.summaryDetailed) {
    updated.summaryDetailed = parsedData.summaryDetailed;
  }
  if (!updated.detectedRole && parsedData.detectedRole) {
    updated.detectedRole = parsedData.detectedRole;
  }
  if (!updated.resumeText && parsedData.resumeText) {
    updated.resumeText = parsedData.resumeText;
  }

  // Merge skills
  const existingSkills = updated.skills || [];
  const newSkills = parsedData.extractedSkills || [];

  // Avoid duplicates
  const skillNames = new Set(existingSkills.map(s => s.name.toLowerCase()));
  const uniqueNewSkills = newSkills.filter(s => !skillNames.has(s.toLowerCase()));

  updated.skills = [
    ...existingSkills,
    ...uniqueNewSkills.map(name => ({
      name,
      level: 'intermediate',
      category: 'core'
    }))
  ];

  // Update skills classification if available
  if (parsedData.skillsClassification) {
    updated.skillsClassification = parsedData.skillsClassification;
  }

  return updated;
}

/**
 * Simple skill extraction from text
 * @param {string} text - CV text
 * @returns {string[]} Extracted skills
 */
function extractSkillsFromText(text) {
  // Simple regex-based extraction - can be enhanced with AI
  const skillPatterns = [
    /\b(javascript|python|java|c\+\+|ruby|php|go|rust|typescript|swift|kotlin)\b/gi,
    /\b(react|angular|vue|node\.js|express|django|flask|spring|laravel)\b/gi,
    /\b(html|css|sass|scss|bootstrap|tailwind)\b/gi,
    /\b(mongodb|mysql|postgresql|redis|elasticsearch)\b/gi,
    /\b(aws|azure|gcp|docker|kubernetes|jenkins|git)\b/gi,
    /\b(machine learning|ai|data science|nlp|computer vision)\b/gi,
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