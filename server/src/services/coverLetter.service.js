/**
 * Cover Letter Service
 * Generates cover letters and auto-messages
 */

export async function generateAutoMessage(job, profile) {
  const skillsList = profile.skills?.slice(0, 3).join(', ') || 'relevant skills';
  return `Hi, I'm interested in the ${job.title} position. I have ${profile.experienceYears || 0}+ years of experience and skills in ${skillsList}. Looking forward to discussing how I can contribute to your team!`;
}

export async function generateCoverLetter(job, profile) {
  return generateAutoMessage(job, profile); // Same logic for now
}

