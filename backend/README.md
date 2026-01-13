# Payload Blank Template

This template comes configured with the bare minimum to get started on anything you need.

## Data Model & Permissions Overview

MoaFinder uses a multi-organization architecture where **Users**, **Locations**, and **Events** are linked through **Organizations**.

### User Roles

| Role | Description |
|------|-------------|
| **admin** | Full access. Can manage all users, orgs, locations, events, approve orgs, and delete anything. |
| **editor** | Can approve organizations and events. Similar to admin but cannot delete organizations or change user roles. |
| **organizer** | Default role for new users. Can create/manage events and locations only within their own organizations. |

### Organizations

- **All authenticated users** can *create* a new organization, but it starts as **unapproved**.
- Only **admin** or **editor** can flip the `approved` flag to `true`.
- Once approved, the organization's members can create events and manage locations linked to it.
- Users can **request membership** to an existing organization; admin/editor then approves or rejects.
- The **owner** (the user who created the org) is automatically added to its member list.
- An organization can have any number of members, and a user can belong to multiple organizations.

### Locations

- Locations are **shared resources** that can belong to **multiple organizations**.
- **admin** can CRUD all locations.
- **organizer/editor** can create locations only if they belong to at least one organization, and can update/delete only locations linked to one of their organizations.
- When creating an event, the location dropdown is **filtered** to show only locations from the user's organizations (except for admins, who see all).

### Events

| Action | Who can do it |
|--------|---------------|
| Create event (draft/pending) | Any authenticated organizer (if they have an org) |
| Create event (approved) | admin, editor only |
| Update/Delete own org events | organizer, editor, admin |
| Approve events | editor, admin |
| Read approved & non-expired | Everyone (public) |

- Events have a `status` field: `draft`, `pending`, `approved`.
- Non-admin users submit as `draft` or `pending`; only editor/admin may set `approved`.
- The **organizer** field on an event is a relationship to the Organization (not the user). This links events to the org whose members may manage it.
- **Organizer auto-assignment**: When creating an event:
  - Users with **1 organization**: organizer is auto-assigned silently (no dropdown shown)
  - Users with **multiple organizations**: a "Veranstalter" dropdown appears to choose which org hosts the event
  - Backend fallback: if no organizer is provided, the first organization is auto-assigned

### Internal Data Flow

```
User ──┬──< organizations (hasMany) >──┬── Organization
       │                               │
       │  ┌────────────────────────────┘
       │  │
       │  └── owner ──> User (who created it)
       │
Location ──< organizations (hasMany) >── Organization
       │
Event ──< organizer >── Organization
       ├──< location >── Location
       └── status (draft | pending | approved)
```

**Key points**:
1. A user's `organizations` array determines what locations/events they can manage.
2. Locations require at least one organization; they become available to all members of those orgs.
3. Events tie to an organizer org; the location dropdown filters by that user's orgs.
4. Organizations must be approved before their events can be approved.

### Session & Authentication

- **Token expiration**: 30 minutes (server-side, configured in `Users.ts`)
- **Inactivity timeout**: 30 minutes of no user activity (mouse, keyboard, touch, scroll) triggers automatic logout on the frontend
- **Auto-logout on 401/403**: If the server returns a 401 or 403 response (e.g., expired token), the frontend automatically clears the session and redirects to `/login?expired=1`
- **Session expired notice**: The login page displays a yellow warning banner when redirected due to session expiration

---

## Quick start

This template can be deployed directly from our Cloud hosting and it will setup MongoDB and cloud S3 object storage for media.

## Quick Start - local setup

To spin up this template locally, follow these steps:

### Clone

After you click the `Deploy` button above, you'll want to have standalone copy of this repo on your machine. If you've already cloned this repo, skip to [Development](#development).

### Development

1. First [clone the repo](#clone) if you have not done so already
2. From the repository root run `node scripts/apply-env.mjs local` after copying `env/targets/local.example.envset` to `env/targets/local.envset` and filling in your credentials. This renders `backend/.env` with a local MongoDB URI, Payload secret, and the correct CORS origins. Alternatively, you can create `backend/.env` manually following the template in the main README. For an everything-at-once experience (env files, MongoDB, backend, frontend), use `node scripts/local-stack.mjs up`.

3. `pnpm install && pnpm dev` to install dependencies and start the dev server
4. open `http://localhost:3000` to open the app in your browser

That's it! Changes made in `./src` will be reflected in your app. Follow the on-screen instructions to login and create your first admin user. Then check out [Production](#production) once you're ready to build and serve your app, and [Deployment](#deployment) when you're ready to go live.

## Testing

### ⚠️ CRITICAL: Never Test Against Production ⚠️

**Integration tests MUST run against a local MongoDB instance, NEVER against production.**

The test suite creates, modifies, and deletes data. Running tests against production will corrupt or destroy real user data.

#### Safe Testing Setup

1. **Start a local MongoDB** (Docker recommended):
   ```bash
   docker run -d -p 27017:27017 --name mongo-test mongo:7
   ```

2. **Run tests with local database**:
   ```bash
   DATABASE_URI=mongodb://localhost:27017/moafinder-test pnpm vitest run
   ```

3. **Or use the test.env file**:
   ```bash
   # Create backend/test.env with:
   DATABASE_URI=mongodb://localhost:27017/moafinder-test
   
   # Then run:
   pnpm vitest run
   ```

The test setup (`vitest.setup.ts`) includes a safety check that will **abort tests** if it detects a production database URI. This is a last line of defense—always configure your environment correctly.

#### Docker (Optional)

If you prefer to use Docker for local development instead of a local MongoDB instance, the provided docker-compose.yml file can be used.

To do so, follow these steps:

- Modify the `MONGODB_URI` in your `.env` file to `mongodb://127.0.0.1/<dbname>`
- Modify the `docker-compose.yml` file's `MONGODB_URI` to match the above `<dbname>`
- Run `docker-compose up` to start the database, optionally pass `-d` to run in the background.

## How it works

The Payload config is tailored specifically to the needs of most websites. It is pre-configured in the following ways:

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend this functionality.

- #### Users (Authentication)

  Users are auth-enabled collections that have access to the admin panel.

  For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/main/examples/auth) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Media

  This is the uploads enabled collection. It features pre-configured sizes, focal point and manual resizing to help you manage your pictures.
  
  **Storage Configuration:**
  - **Development**: Files stored locally in `./uploads` directory
  - **Production**: Files stored in AWS S3 (see [S3 Media Storage](#s3-media-storage-required-for-production))
  
  **Security Features:**
  - Only authenticated users with organization membership can upload
  - Uploads restricted to image MIME types (`image/*`)
  - File size validation (max 5MB on frontend)
  - Each image is linked to an organization—only members can modify/delete
  - Images auto-processed into multiple sizes: thumbnail (400x300), card (768x1024), tablet (1024px wide)
  - Alt text required for accessibility compliance

### Docker

Alternatively, you can use [Docker](https://www.docker.com) to spin up this template locally. To do so, follow these steps:

1. Follow [steps 1 and 2 from above](#development), the docker-compose file will automatically use the `.env` file in your project root
1. Next run `docker-compose up`
1. Follow [steps 4 and 5 from above](#development) to login and create your first admin user

That's it! The Docker instance will help you get up and running quickly while also standardizing the development environment across your teams.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).

## Pre-deployment verification

Before pushing a new container image to App Runner, run the automated checks to confirm the MongoDB URI and health endpoint behave as expected:

```bash
cd backend
pnpm predeploy:check
```

The script loads variables from `.env` (or a custom file via `--env-file`), verifies that the MongoDB instance accepts TLS connections, and optionally polls your configured `PAYLOAD_PUBLIC_SERVER_URL` health path. Use the flags below to tailor the run:

| Flag | Description |
| --- | --- |
| `--database-uri <uri>` | Temporarily override `DATABASE_URI` without editing `.env`. |
| `--server-url <url>` | Check a different base URL—for example, a freshly issued App Runner domain. |
| `--write-env` | Persist the `--server-url` override back into the selected env file. |
| `--skip-mongo` / `--skip-health` | Bypass individual checks when the target service is intentionally offline. |

Example: update the cached App Runner domain and verify both checks in one go:

```bash
pnpm predeploy:check --server-url https://new-id.awsapprunner.com --write-env
```

## Deployment to AWS App Runner

To deploy the backend to AWS App Runner:

```bash
cd backend
./deploy_apprunner.sh
```

### S3 Media Storage (Required for Production)

AWS App Runner containers are ephemeral—uploaded files stored on the local filesystem are **lost** when the container restarts, scales, or redeploys. To persist media files, configure S3 storage:

#### 1. Create an S3 Bucket

```bash
aws s3 mb s3://your-bucket-name --region eu-central-1
```

#### 2. Configure Bucket Policy for Public Read

Media files need to be publicly accessible. Add this bucket policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

#### 3. Configure CORS on the Bucket

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["https://your-app.apprunner.aws", "https://your-domain.com"],
        "ExposeHeaders": ["ETag"]
    }
]
```

#### 4. Create IAM User with S3 Permissions

Create an IAM policy with these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
            "Resource": ["arn:aws:s3:::your-bucket-name", "arn:aws:s3:::your-bucket-name/*"]
        }
    ]
}
```

#### 5. Set Environment Variables

Add these to your App Runner service configuration:

| Variable | Description |
| --- | --- |
| `S3_BUCKET` | Your S3 bucket name |
| `S3_ACCESS_KEY_ID` | IAM user access key |
| `S3_SECRET_ACCESS_KEY` | IAM user secret key |
| `S3_REGION` | AWS region (default: `eu-central-1`) |

When these variables are set, the backend automatically uses S3 for media storage. Without them, files are stored locally (suitable for development only).

### AWS Profile Configuration

The deployment script uses the **`moafinder-prod`** AWS profile by default. This profile must be configured in your `~/.aws/credentials` file:

```ini
[moafinder-prod]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
region = eu-central-1
```

To use a different profile, pass the `--profile` flag:

```bash
./deploy_apprunner.sh --profile my-other-profile
```

### Deployment Options

| Flag | Description |
| --- | --- |
| `--target, -t <name>` | Target environment (default: `production`) |
| `--profile, -p <name>` | AWS profile to use (default: `moafinder-prod`) |
| `--skip-apply` | Skip regenerating env files |
| `--env-file, -f <path>` | Use a specific env file |

## Utility Scripts

The `scripts/` directory contains utility scripts for managing data and users:

### User Management

| Script | Description | Usage |
| --- | --- | --- |
| `create-user.mjs` | Create or update a user | `node scripts/create-user.mjs <email> <password> [--role admin\|organizer\|user]` |
| `list-users.mjs` | List all users | `node scripts/list-users.mjs` |
| `promote-user.mjs` | Promote a user to admin | `node scripts/promote-user.mjs <email>` |
| `cleanup-test-users.mjs` | Delete all @example.com test users | `node scripts/cleanup-test-users.mjs` |

### Location & Data Management

| Script | Description | Usage |
| --- | --- | --- |
| `import-locations.ts` | Import locations from CSV | `pnpm tsx scripts/import-locations.ts <file.csv> [--apply] [--org-id <id>]` |
| `geocode-locations.ts` | Geocode addresses to GPS coordinates | `pnpm tsx scripts/geocode-locations.ts [--apply]` |
| `list-orgs.ts` | List all organizations | `pnpm tsx scripts/list-orgs.ts` |
| `create-import-org.ts` | Create the default import organization | `pnpm tsx scripts/create-import-org.ts` |

### Diagnostics

| Script | Description | Usage |
| --- | --- | --- |
| `check-coords.ts` | Check location coordinates and map bounds | `pnpm tsx scripts/check-coords.ts` |
| `group-coords.ts` | Show locations grouped by coordinates | `pnpm tsx scripts/group-coords.ts` |

### Examples

**Import locations from CSV:**
```bash
pnpm tsx scripts/import-locations.ts ../file_repository/locations.csv --apply --org-id 6939c4de538f2faf1750504c
```

**Geocode all locations using their street addresses:**
```bash
# Dry run first
pnpm tsx scripts/geocode-locations.ts

# Apply changes to database
pnpm tsx scripts/geocode-locations.ts --apply
```

**Create an admin user:**
```bash
node scripts/create-user.mjs admin@example.com SecurePass123! --role admin
```

