# Moabit Finder

## Environment Variables
Create a `.env` file in `backend/` or configure these variables in your deployment environment:

```
DATABASE_URI=<mongo_connection_string>
PAYLOAD_SECRET=<jwt_secret>
PORT=3000

# For development
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:5173

# Email config (for later)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

`DATABASE_URI` should point to the MongoDB instance you want to use. Any operations run against the backend will write directly to this database, so consider using a test database for local development.

## Local Development
1. **Install dependencies**
   ```
   pnpm install
   ```
2. **Run the backend**
   ```
   cd backend
   pnpm dev
   ```
3. **Run the frontend**
   ```
   pnpm --dir frontend dev
   ```

## Testing
Backend tests require a running MongoDB and the env variables above:
```bash
DATABASE_URI=<mongo_connection_string> PAYLOAD_SECRET=<jwt_secret> pnpm test
```

Frontend tests can be run with:
```bash
pnpm --dir frontend test
```

## Code Quality
Generate types and run lint checks:
```bash
pnpm run generate:types
pnpm lint
```
