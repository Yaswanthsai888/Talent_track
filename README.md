# Talent Track

## Prerequisites

- Node.js
- MongoDB (running on port 27017)
- Redis (running on port 6379)
- Judge0 API (running on port 2358)

## Local Development Setup

1. Clone the repository
```bash
git clone [your-repository-url]
cd talent_track
```

2. Install dependencies
```bash
cd Server
npm install
```

3. Configure environment variables
- Copy the `.env.example` file to `.env`
- Update the following variables in `.env`:
  - `JWT_SECRET` and `JWT_REFRESH_SECRET` with secure keys
  - `JUDGE0_TOKEN` with your Judge0 API token
  - Update any other variables as needed

4. Start required services
- Ensure MongoDB is running on port 27017
- Ensure Redis is running on port 6379
- Start the Judge0 API service

5. Start the development server
```bash
npm run dev
```

The server should now be running at http://localhost:5000

## Available Services

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Resume Parser: http://localhost:5001
- Judge0 API: http://localhost:2358
