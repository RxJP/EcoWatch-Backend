# EcoWatch Backend API

Backend API for the EcoWatch environmental intelligence platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (see `.env.example`)

3. Add `serviceAccountKey.json` from Firebase Console

4. Seed the database:
```bash
npm run seed
```

5. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Petitions
- `GET /api/petitions` - Get all petitions
- `GET /api/petitions/:id` - Get petition by ID
- `POST /api/petitions` - Create petition (protected)
- `POST /api/petitions/:id/sign` - Sign petition (protected)

### Zones
- `GET /api/zones` - Get all zones
- `GET /api/zones/:id` - Get zone by ID

### AI
- `POST /api/ai/analyze` - Analyze environmental impact
- `POST /api/ai/ask` - Ask environmental question

### News
- `GET /api/news` - Get latest environmental news

## Deployment

See deployment guide for Render setup instructions.