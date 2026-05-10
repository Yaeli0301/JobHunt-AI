/**
 * Unit Tests — Job Matcher Engine
 */

import { calculateMatch } from "../../src/core/jobMatcher.engine.js";

describe("jobMatcher.engine", () => {
  const baseJob = {
    requiredSkills: ["React", "Node.js", "TypeScript"],
    experienceYears: 3,
  };

  const baseProfile = {
    skills: ["React", "Node.js", "TypeScript"],
    experienceYears: 5,
  };

  test("full skill match + strong experience -> score 100", () => {
    const result = calculateMatch(baseJob, baseProfile);
    expect(result.score).toBe(100);
    expect(result.matchedSkills).toEqual(
      expect.arrayContaining(["react", "node.js", "typescript"])
    );
    expect(result.missingSkills).toEqual([]);
  });

  test("no overlapping skills -> low score", () => {
    const job = { requiredSkills: ["Python", "Django"], experienceYears: 2 };
    const profile = { skills: ["Java", "Spring"], experienceYears: 1 };
    const result = calculateMatch(job, profile);
    expect(result.score).toBeLessThan(20);
    expect(result.matchedSkills).toEqual([]);
  });

  test("partial skill match -> proportional score", () => {
    const job = { requiredSkills: ["React", "Node.js", "TypeScript"], experienceYears: 2 };
    const profile = { skills: ["React"], experienceYears: 2 };
    const result = calculateMatch(job, profile);
    expect(result.score).toBeGreaterThanOrEqual(45);
    expect(result.score).toBeLessThan(55);
    expect(result.matchedSkills).toContain("react");
    expect(result.missingSkills).toContain("node.js");
  });

  test("empty job -> score 0", () => {
    const result = calculateMatch(null, baseProfile);
    expect(result.score).toBe(0);
  });

  test("empty profile -> score 0", () => {
    const result = calculateMatch(baseJob, null);
    expect(result.score).toBe(0);
  });

  test("experience 150%+ -> 30 pts", () => {
    const job = { requiredSkills: ["React"], experienceYears: 2 };
    const profile = { skills: ["React"], experienceYears: 5 };
    const result = calculateMatch(job, profile);
    expect(result.score).toBe(100);
  });

  test("experience 50% -> 10 pts", () => {
    const job = { requiredSkills: ["React"], experienceYears: 4 };
    const profile = { skills: ["React"], experienceYears: 2 };
    const result = calculateMatch(job, profile);
    expect(result.score).toBe(80); // 70 + 10
  });
});
