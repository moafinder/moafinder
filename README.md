# Moabit Finder

## Environment Variables

Maintain every environment from a single file under `env/targets`:

1. Copy `env/targets/local.example.envset` to `env/targets/local.envset` (or create another `<name>.envset`).
2. Fill out the `[backend]`, `[frontend]`, optional `[apprunner]`, and `[common]` sections with the credentials you want to use.
3. Run `node scripts/apply-env.mjs <name>` from the repo root.

The script renders `backend/.env`, `backend/.env.local`, `frontend/.env.local`, and `env/out/<name>-apprunner.env` so local development mirrors production (CORS restrictions included) while keeping secrets outside of git. Rerun it whenever you swap targets. See `env/README.md` for a quick reference.

If you prefer to manage the files manually, create a `.env` file in `backend/` or configure these variables in your deployment environment:

```
DATABASE_URI=<mongo_connection_string>
PAYLOAD_SECRET=<jwt_secret>
PORT=3000
HEALTHCHECK_WARMUP_MS=120000 # optional: milliseconds to treat the app as "starting"
HEALTHCHECK_PING_TIMEOUT_MS=1500 # optional: Mongo ping timeout for /api/health

# For development
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:5173

# Email config (for later)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Moabit Finder Team
CONTACT_RECIPIENT_EMAILS=info@moafinder.de
EVENT_APPROVAL_NOTIFICATION_EMAILS=team@moafinder.de
```

`DATABASE_URI` should point to the MongoDB instance you want to use. Any operations run against the backend will write directly to this database, so consider using a test database for local development.

For the frontend, create a `frontend/.env` file or configure the variable in your hosting provider:

```
VITE_API_BASE_URL=<https://your-api-domain>
```

When running the Vite dev server without a dedicated backend domain you can leave this empty (`VITE_API_BASE_URL=`) so requests continue to target the relative `/api/...` paths proxied by the development server.

## Production Architecture
- **Frontend:** React single-page app hosted on AWS Amplify (`https://main.dgfhrurhtm4pa.amplifyapp.com`). Amplify rewrites `/api/*` calls to the backend.
- **Backend:** Payload CMS + Next.js running on AWS App Runner (container image in Amazon ECR). The current service URL can be found in the App Runner console (e.g. `https://<service-id>.<region>.awsapprunner.com`).
- **Database:** MongoDB Atlas cluster (MongoDB Atlas UI → Database → Connect for the latest connection string). Both local development and App Runner use this URI.

Traffic flow: Browser → Amplify (static assets) → App Runner (`/api` rewrites) → MongoDB Atlas.

## Local Development

### One-command setup
Run everything (env files, MongoDB, backend, frontend) with:
```
node scripts/local-stack.mjs up [target]
```
- `target` defaults to `local`; pass another envset name or `--target=production` when needed.
- Add `--skip-install` to reuse existing `node_modules`, or `--keep-mongo` to keep the Mongo container running after shutdown. Add `--seed` to preload demo data and a default admin user.
- Stop the stack with `Ctrl+C` (the script tears everything down) or `node scripts/local-stack.mjs down`.

### Troubleshooting & FAQ

#### “Functions cannot be passed directly to Client Components …” on `/admin`

Symptom:
- Visiting `http://localhost:3000/admin` shows a 500 with the message “Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with 'use server'.” Sometimes only in dev (HMR), sometimes intermittently.

Why this happens:
- Next 15/React 19 are strict about passing functions from Server Components to Client Components. If a function crosses a package boundary or HMR leaves stale code around, it may no longer be recognized as a server action and will error.

What we changed to fix it (and why it now works):
- Avoid passing a function prop across the boundary entirely. The admin layout now renders a local server wrapper that hands a simple HTTP bridge to the Client UI:
  - `backend/src/app/(payload)/layout.tsx` renders `CustomRootLayout` (no function props passed).
  - `backend/src/app/(payload)/CustomRootLayout.tsx` builds the client config and renders a client bridge.
  - `backend/src/app/(payload)/AdminClientBridge.tsx` (client) renders `RootProvider` and implements `serverFunction` as a POST to our local endpoint.
  - `backend/src/app/(payload)/api/server-functions/route.ts` receives those POSTs and executes Payload’s server functions.

This completely sidesteps the “server action serialization” path, so the error goes away even under HMR.

If you ever need to clear a bad HMR state:
- Stop dev, delete Next cache, and start fresh:
  - `rm -rf backend/.next`
  - `pnpm -C backend devsafe`

#### Dev without MongoDB keeps crashing or health check fails

Problem:
- Without a running Mongo, some endpoints attempted to connect and crashed.

Changes made and how to use them:
- Health endpoint can be tolerant in dev: set either of these in `backend/.env.local` and restart dev:
  - `HEALTHCHECK_SKIP_DB=true` (skip DB checks and return `status: degraded`)
  - `HEALTHCHECK_TOLERATE_DB_FAILURE=true` (treat DB failures as degraded, not 503)
- Admin wrapper skips DB auth when allowed in dev: set `PAYLOAD_SKIP_DB_AUTH=true` to avoid DB calls for “who am I”.
- A dev-friendly override for `GET /api/users/me` returns `{ user: null }` when the DB is intentionally disabled.

Recommended: for full admin functionality, use the local-stack script to run Mongo alongside the backend:
```bash
node scripts/local-stack.mjs up --seed
```
This will:
- Render env files, start Mongo via Docker, wait for it to be ready, start backend (`devsafe`) and frontend, and (optionally) seed demo data.

#### TypeScript shows only one error during `next build`

Use TypeScript directly to see all errors at once:
```bash
pnpm -C backend exec tsc -p tsconfig.json --noEmit --pretty false
```

#### Where did the Express preMiddleware go?

In a Next-based Payload app the Express server is not used. We moved the CORS header to Next config:
- `backend/next.config.mjs` → `headers()` sets `Access-Control-Allow-Headers` globally.

#### Seeded admin credentials

- Email: `admin@moafinder.local`
- Password: `ChangeMe123!`

Also seeded for organizer testing:
- Email: `organizer@moafinder.local`
- Password: `ChangeMe123!`

They’re created by the seed script (e.g. `node scripts/local-stack.mjs up --seed` or `pnpm -C backend run seed`).

### Manual steps
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

## Deploying to AWS

### 0. Prerequisites checklist
- **AWS account & permissions:** IAM user/role with access to Amplify, App Runner, ECR, Secrets Manager (optional), and CloudWatch Logs.
- **AWS CLI v2:** install from <https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html>. macOS example:
  ```bash
  curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
  sudo installer -pkg AWSCLIV2.pkg -target /
  aws --version
  ```
  Configure credentials with `aws configure` (AWS access key ID, secret, default region `eu-central-1`).
- **Docker:** <https://docs.docker.com/get-docker/>. Required for building the App Runner image locally.
- **Node.js & pnpm:** Node 20.x (or >=18.20) and pnpm 9/10. Enable corepack: `corepack enable && corepack prepare pnpm@latest --activate`.
- **MongoDB Atlas admin access:** ability to add/remove database users and IP access list entries.
- **Domain references:**
  - Amplify app domain: **AWS Console → Amplify → <App Name> → App details**. Copies to README above.
  - App Runner service URL & outbound IP list: **App Runner → Services → moabit-backend → Default domain** (step 2 below) and **Networking → Outbound traffic** for egress IPs. Add these IPs to MongoDB Atlas **Network Access** (whitelist) so App Runner can reach the database.
- **Secrets:**
  - `PAYLOAD_SECRET` (generate with `openssl rand -hex 32`).
  - `DATABASE_URI` (Atlas connection string with username/password; include `?retryWrites=true&w=majority` etc.).
  - Optional SMTP credentials.

Add local machine IP and App Runner egress IPs to the Atlas access list before deploying (`Network Access → Add IP Address`).

### 1. Frontend (AWS Amplify)
The Amplify app is already connected to your repository and available at <https://main.dgfhrurhtm4pa.amplifyapp.com/>.

1. In the Amplify console open **App settings → Environment variables** and set `VITE_API_BASE_URL` to the App Runner domain you noted earlier (e.g. `https://<service-id>.eu-central-1.awsapprunner.com`). The change triggers a redeploy.

2. Add rewrites so the static site can talk to the backend and serve client-side routes: **App settings → Rewrites and redirects** → add

   | Source | Target | Type |
   |--------|--------|------|
   | `/api/<*>` | `https://<app-runner-domain>/api/<*>` | 200 (Rewrite) |
   | `</^[^.]+$/>` | `/index.html` | 200 (Rewrite) |

   Keep the `/api/<*>` row above the SPA fallback rule so API traffic reaches App Runner.

   Alternatively, you can paste this JSON via **Import from JSON** in the Amplify UI (replace `<app-runner-domain>`):

   ```json
   [
     {
       "source": "/api/<*>",
       "target": "https://<app-runner-domain>/api/<*>",
       "status": "200",
       "condition": null
     },
     {
       "source": "/<*>",
       "target": "/index.html",
       "status": "200",
       "condition": null
     }
   ]
   ```
3. After saving, Amplify redeploys automatically. When it finishes, open the site, trigger registration/login, and confirm via DevTools that `https://<app-runner-domain>/api/...` responds with `200`/`201`.

Amplify rebuilds automatically whenever you push to the connected Git branch.

### 2. Backend (AWS App Runner)

#### 2.1 Prepare the environment set
1. Copy `env/targets/production.example.envset` to `env/targets/production.envset`.
2. Fill the placeholders with production credentials:
   - `[backend]` → `DATABASE_URI`, `PAYLOAD_SECRET`, `CORS_ORIGINS=https://main.dgfhrurhtm4pa.amplifyapp.com`, and Gmail SMTP settings (`SMTP_ENABLE=true`, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `CONTACT_RECIPIENT_EMAILS`, `EVENT_APPROVAL_NOTIFICATION_EMAILS`).
   - `[frontend]` → `VITE_API_BASE_URL` (temporary value such as `https://placeholder/api`; the deploy script overwrites it with the live domain).
   - `[apprunner]` → `PAYLOAD_PUBLIC_SERVER_URL` and `CORS_ORIGINS` (usually the same as in `[backend]`).
3. Keep the envset file out of git; the deploy script regenerates `backend/.env`, `frontend/.env.production`, and `env/out/production-apprunner.env` from it.

#### 2.2 First-time setup (one-time)
If the App Runner service already exists, skip to the next section.

1. Create (or reuse) the ECR repository for backend images:
   ```bash
   aws ecr create-repository \
     --repository-name moabit-backend \
     --image-scanning-configuration scanOnPush=true \
     --region eu-central-1
   ```
2. Build and push an initial image so App Runner has something to deploy:
   ```bash
   cd backend
   docker build -t moabit-backend .
   docker tag moabit-backend:latest 311288365091.dkr.ecr.eu-central-1.amazonaws.com/moabit-backend:latest
   aws ecr get-login-password --region eu-central-1 \
     | docker login --username AWS --password-stdin 311288365091.dkr.ecr.eu-central-1.amazonaws.com
   docker push 311288365091.dkr.ecr.eu-central-1.amazonaws.com/moabit-backend:latest
   ```
3. Create the App Runner service in the AWS console: pick the ECR image above, set **Port** to `3000`, choose your instance size, and paste the contents of `env/out/production-apprunner.env` into **Environment variables**. Record the resulting service ARN for future deployments.

#### 2.3 Automated deployments & environment updates
Once the service exists, redeploy with a single command:

```bash
export AWS_PROFILE=moafinder
export AWS_REGION=eu-central-1
export ACCOUNT_ID=311288365091
export SERVICE_ARN=arn:aws:apprunner:eu-central-1:311288365091:service/moafinder-apprunner/730d43995c2d4084a187c806e6ed55b7

cd backend
./deploy_apprunner.sh --target production
```

The script will regenerate the env files (unless you pass `--skip-apply`), build and push the Docker image, merge `env/out/production-apprunner.env` into the App Runner runtime variables, toggle the health check from TCP → HTTP, update `PAYLOAD_PUBLIC_SERVER_URL`, and wait until the service returns to `RUNNING`.

Use `--env-file` to point at another target (e.g. staging) or `--skip-apply` if you already ran `node scripts/apply-env.mjs` elsewhere. For environment-only changes you can run `backend/scripts/update-apprunner-env.sh --service-arn ... --env-file env/out/production-apprunner.env` to avoid rebuilding the image.

App Runner stores runtime environment variables encrypted at rest. Anyone with permission to view or edit the service can read them, so keep IAM permissions tight and avoid committing real secrets to git.

Once the service is live, note the **Default domain** (e.g. `https://xxxxxx.eu-central-1.awsapprunner.com`) so you can update Amplify rewrites and keep it in `env/targets/production.envset`. Also copy the **Networking → Outbound traffic** IP addresses into MongoDB Atlas Network Access so App Runner can reach the database.

#### App Runner health check configuration

App Runner starts health checks as soon as the container is reachable. When the
service is still connecting to MongoDB these probes can fail, which causes App
Runner to roll the deployment back. The backend exposes `/api/health`, which
returns `{"status":"starting"}` during the warm-up window and only flips to an
error after that window elapses. Configure the health check like this:


1. In the **Health check** section choose **HTTP** and set **Path** to
   `/api/health`.
2. Keep the default timing (interval 10s, timeout 5s) and ensure the **Healthy
   threshold** is `1`.
3. Set the environment variables `HEALTHCHECK_WARMUP_MS=180000` (3 minutes) and
   `HEALTHCHECK_PING_TIMEOUT_MS=1500` so the endpoint tolerates MongoDB startup
   latency without failing the deployment. Adjust the warm-up duration if your
   database takes longer or shorter to become reachable.
4. If the first build takes long (for example while Payload warms caches) start
   with a **TCP** health check, wait until the service status is `RUNNING`, and
   then switch back to **HTTP** with the `/api/health` path. The helper script
   `backend/deploy_apprunner.sh` already performs this two-step switch for you.
5. After the service is live, verify with `curl https://<app-runner-domain>/api/health`.

If App Runner reports `Web ACLs are not available ... because the service does
not exist or is in an invalid state`, delete the failed service (or create a new
one) and redeploy using the sequence above. The message appears after repeated
failed deployments leave the service in the `CREATE_FAILED` state.

### 3. Verify routing between frontend and backend
1. Update the Amplify rewrite rule to use the App Runner URL and redeploy if necessary.
2. Visit <https://main.dgfhrurhtm4pa.amplifyapp.com/> and open the browser Network tab.
3. Trigger API calls (e.g. load the events list or submit the contact form). Responses should come from the App Runner domain and set cookies successfully.
4. Check the App Runner logs for any backend errors or missing environment variables.

### 4. Future deployments
- **Frontend:** push to the connected Git branch; Amplify will rebuild automatically.
- **Backend:** rerun the deployment helper (after exporting the AWS variables):
  ```bash
  export AWS_PROFILE=moafinder
  export AWS_REGION=eu-central-1
  export ACCOUNT_ID=311288365091
  export SERVICE_ARN=arn:aws:apprunner:eu-central-1:311288365091:service/moafinder-apprunner/730d43995c2d4084a187c806e6ed55b7

  cd backend
  ./deploy_apprunner.sh --target production
  ```

Regenerate the env files (`node scripts/apply-env.mjs production`) whenever you rotate credentials so the service and your local setup stay in sync.

### 5. Admin tasks (promote/reset users)
- Change a user’s role (and optionally reset the password):
  ```bash
  # Args: <email> [role] [new-password]
  export DATABASE_URI="<mongodb-uri>"
  export PAYLOAD_SECRET="<payload-secret>"
  pnpm --dir backend exec payload run scripts/promote-user.mjs -- \
    lukasz.osipiak@gmail.com admin "NewSecurePassword123!"
  ```
  The helper strips the literal `--`, so the actual arguments are `<email> [role] [password]`. When you supply the third argument the helper resets the password and sets `passwordConfirm` to match. The script runs with `overrideAccess: true`, so it succeeds even if no admin session is available.
