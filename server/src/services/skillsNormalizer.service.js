/**
 * Skills Normalizer Service
 * Normalizes skill names to standard format and removes duplicates.
 * Maps variations to canonical skill names.
 */

const SKILL_MAPPINGS = {
  // JavaScript/TypeScript
  "js": "JavaScript",
  "javascript": "JavaScript",
  "ts": "TypeScript",
  "typescript": "TypeScript",
  "tsjs": "TypeScript",

  // Node.js
  "nodejs": "Node.js",
  "node": "Node.js",
  "node js": "Node.js",
  "expressjs": "Express.js",
  "express": "Express.js",
  "express js": "Express.js",

  // Frontend
  "reactjs": "React",
  "react": "React",
  "react.js": "React",
  "vuejs": "Vue.js",
  "vue": "Vue.js",
  "angularjs": "Angular",
  "angular": "Angular",

  // Python
  "python": "Python",
  "python3": "Python",
  "py": "Python",
  "django": "Django",
  "flask": "Flask",
  "fastapi": "FastAPI",

  // Data Science
  "ml": "Machine Learning",
  "machine learning": "Machine Learning",
  "ai": "Artificial Intelligence",
  "artificial intelligence": "Artificial Intelligence",
  "deep learning": "Deep Learning",
  "dl": "Deep Learning",
  "nlp": "NLP",
  "natural language processing": "NLP",
  "data science": "Data Science",
  "data analysis": "Data Analysis",
  "pandas": "Pandas",
  "numpy": "NumPy",
  "tensorflow": "TensorFlow",
  "pytorch": "PyTorch",
  "scikit-learn": "scikit-learn",
  "sklearn": "scikit-learn",

  // Databases
  "sql": "SQL",
  "mysql": "MySQL",
  "postgresql": "PostgreSQL",
  "postgres": "PostgreSQL",
  "mongodb": "MongoDB",
  "mongo": "MongoDB",
  "redis": "Redis",
  "oracle": "Oracle",

  // Cloud/DevOps
  "aws": "AWS",
  "amazon web services": "AWS",
  "azure": "Azure",
  "gcp": "Google Cloud Platform",
  "google cloud": "Google Cloud Platform",
  "docker": "Docker",
  "kubernetes": "Kubernetes",
  "k8s": "Kubernetes",
  "jenkins": "Jenkins",
  "ci/cd": "CI/CD",
  "cicd": "CI/CD",
  "terraform": "Terraform",

  // Tools
  "git": "Git",
  "github": "GitHub",
  "gitlab": "GitLab",
  "jira": "Jira",
  "rest": "REST API",
  "rest api": "REST API",
  "graphql": "GraphQL",
  "gql": "GraphQL",
  "grpc": "gRPC",
  "websockets": "WebSockets",
  "socket.io": "Socket.io",

  // Testing
  "jest": "Jest",
  "mocha": "Mocha",
  "cypress": "Cypress",
  "selenium": "Selenium",
  "pytest": "pytest",
  "unittest": "unittest",
  "junit": "JUnit",

  // Other programming
  "java": "Java",
  "c++": "C++",
  "cpp": "C++",
  "c#": "C#",
  "csharp": "C#",
  "go": "Go",
  "golang": "Go",
  "rust": "Rust",
  "php": "PHP",
  "ruby": "Ruby",
  "ruby on rails": "Ruby on Rails",
  "swift": "Swift",
  "kotlin": "Kotlin",
  "scala": "Scala",
  "r": "R",
  "matlab": "MATLAB",

  // Soft skills / Methods
  "agile": "Agile",
  "scrum": "Scrum",
  "kanban": "Kanban",
  "tdd": "TDD",
  "test driven development": "TDD",
  "bdd": "BDD",
  "ood": "OOP",
  "oops": "OOP",
};

/**
 * Normalize a skill name to its canonical form.
 * @param {string} skill 
 * @returns {string}
 */
export function normalizeSkill(skill) {
  if (!skill || typeof skill !== "string") return "";
  
  const normalized = skill.toLowerCase().trim();
  return SKILL_MAPPINGS[normalized] || capitalizeFirst(skill);
}

/**
 * Normalize an array of skills.
 * @param {string[]} skills 
 * @returns {string[]}
 */
export function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  
  const normalized = skills
    .map(s => normalizeSkill(s))
    .filter(s => s.length > 0);
  
  return removeDuplicates(normalized);
}

/**
 * Remove duplicates while preserving order.
 * @param {string[]} arr 
 * @returns {string[]}
 */
function removeDuplicates(arr) {
  const seen = new Set();
  return arr.filter(item => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Capitalize first letter of each word.
 * @param {string} text 
 * @returns {string}
 */
function capitalizeFirst(text) {
  return text
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Extract potential skills from text (e.g., resume text).
 * @param {string} text 
 * @returns {string[]}
 */
export function extractSkillsFromText(text) {
  if (!text || typeof text !== "string") return [];
  
  const foundSkills = [];
  const lowerText = text.toLowerCase();
  
  // Check each known skill
  for (const [key, canonical] of Object.entries(SKILL_MAPPINGS)) {
    // Find whole word matches
    const regex = new RegExp(`\\b${escapeRegex(key)}\\b`, 'i');
    if (regex.test(lowerText)) {
      foundSkills.push(canonical);
    }
  }
  
  return removeDuplicates(foundSkills);
}

/**
 * Escape regex special characters.
 * @param {string} str 
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default {
  normalizeSkill,
  normalizeSkills,
  extractSkillsFromText,
};
