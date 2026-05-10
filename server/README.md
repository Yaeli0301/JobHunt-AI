# AI Job Matching System

Production-grade full-stack AI-powered job-candidate matching platform.

## Architecture

```
React Client (Dark SaaS UI)
   ↓
Express API (routes/analyze.route.js)
   ↓
Controller (controllers/analyze.controller.js)
   ↓
Service Layer (scoring.service.js, ai.service.js, recommendation.service.js)
   ↓
Core Engine (core/jobMatcher.engine.js) — deterministic rules
   ↓
AI Service (services/ai.service.js) — OpenAI enhancement
   ↓
MongoDB (models/Analysis.model.js)
   ↓
Response Aggregator (controller)
```

## Project Structure

```
ai-job-agent/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Dashboard, NewAnalysis, History
│   │   ├── services/       # API client
│   │   ├── App.js          # Router setup
│   │   └── App.css         # Dark SaaS theme
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Environment config
│   │   ├── controllers/    # Request handlers
│   │   ├── core/           # Deterministic scoring engine
│   │   ├── db/             # MongoDB connection
│   │   ├── middleware/     # Error & validation middleware
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic layer
│   │   └── utils/          # Text utilities
│   ├── tests/
│   │   ├── unit/           # Engine unit tests
│   │   └── integration/    # API integration tests
│   ├── package.json
│   └── jest.config.js
└── .env.example
```

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
# Server
PORT=3001
MONGODB_URI=mongodb://localhost:27017/ai-job-agent
OPENAI_API_KEY=sk-your-openai-key-here

# Client
REACT_APP_API_URL=http://localhost:3001
```

### 2. Install & Run Backend

```bash
cd server
npm install
npm start
```

Server starts on `http://localhost:3001`.

### 3. Install & Run Frontend

```bash
cd client
npm install
npm start
```

Client starts on `http://localhost:3000`.

### 4. Run Tests

```bash
cd server
npm test
```

## API Endpoints

### POST /analyze

Analyzes a job against a candidate profile.

**Request:**

```json
{
  "job": {
    "title": "Full Stack Developer",
    "description": "We need a React and Node.js expert.",
    "requiredSkills": ["React", "Node.js", "TypeScript"],
    "experienceYears": 3
  },
  "profile": {
    "bio": "Frontend developer with backend experience.",
    "skills": ["React", "Node.js", "TypeScript"],
    "experienceYears": 5
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "64f8a2b3c9d8e7f6a5b4c3d2",
    "matchScore": 100,
    "matchedSkills": ["react", "node.js", "typescript"],
    "missingSkills": [],
    "strengths": ["Strong React skills"],
    "weaknesses": ["Limited backend depth"],
    "messageToRecruiter": "Good frontend fit.",
    "careerAdvice": "Deepen Node.js knowledge.",
    "recommendations": [
      "No gaps detected. Consider deepening expertise in existing skills."
    ]
  }
}
```

### GET /analyze/history

Returns past analyses (newest first).

**Query Params:**
- `limit` — max results (default: 50)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "job": { "title": "...", "requiredSkills": [...] },
      "profile": { "skills": [...] },
      "matchScore": 85,
      "matchedSkills": [...],
      "missingSkills": [...],
      "messageToRecruiter": "...",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Scoring Logic

| Component | Max Points | Logic |
|-----------|-----------|-------|
| Skill Overlap | 70 | `matched / required * 70` |
| Experience Match | 30 | Tiered by ratio (150%→30, 100%→25, 80%→20, 50%→10, <50%→5, 0→0) |

## Tech Stack

- **Frontend:** React 19, React Router, Axios, CSS3
- **Backend:** Node.js, Express (ES Modules), Mongoose
- **Database:** MongoDB (with mongodb-memory-server for tests)
- **AI:** OpenAI API (`gpt-4o-mini`)
- **Testing:** Jest, Supertest, Babel

