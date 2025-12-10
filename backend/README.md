# Payload Blank Template

This template comes configured with the bare minimum to get started on anything you need.

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
