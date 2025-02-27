# DevTest Backend

A Node.js service that transforms Scribe documentation into executable Playwright tests.

## Overview

DevTest automatically converts visual documentation from Scribe into structured, executable test cases. It provides APIs for:

- Converting Scribe HTML exports to test cases
- Managing test sequences
- Executing tests against configurable environments
- Viewing test results and screenshots

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- Playwright
- Winston (logging)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your MongoDB URI and other settings
```

3. Start the server:

```bash
# Development
npm run dev

# Production
npm start
```

## API Routes

### Test Management

- `POST /api/tests` - Create test from Scribe HTML
- `GET /api/tests` - List all tests
- `GET /api/tests/:id` - Get test details

### Test Sequences

- `POST /api/sequences` - Create test sequence
- `GET /api/sequences` - List sequences
- `POST /api/run/sequence/:id` - Run sequence

### Environments

- `POST /api/environments` - Create environment
- `GET /api/environments` - List environments

## Documentation

API documentation is available at `/api-docs` when running the server.

## Project Structure

```
src/
  ├── controllers/    # Route handlers
  ├── models/        # Mongoose models
  ├── modules/       # Business logic
  ├── routes/        # API routes
  ├── middleware/    # Express middleware
  └── utils/         # Helper functions
```
