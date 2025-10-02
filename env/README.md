# Environment targets

This folder lets you drive every service's `.env` files from a single source of truth.

1. Copy one of the `*.example.envset` files in `./targets` to `<name>.envset` (`local`, `production`, etc.).
2. Fill in the credentials for the backend (`[backend]`), frontend (`[frontend]`), optional App Runner overrides (`[apprunner]`), and any shared values (`[common]`).
3. Run `node scripts/apply-env.mjs <name>` from the repository root.

The script renders the following files:
- `backend/.env` and `backend/.env.local` (both receive the same content for convenience).
- `backend/.env.<name>` for non-local targets.
- `frontend/.env.local` and `frontend/.env.<name>`.
- `env/out/<name>-apprunner.env` – handy when updating the App Runner service via CLI/console.

All generated files stay out of git thanks to `.gitignore`. Delete them whenever you want to reset.

Tip: rerun the script after editing the envset file to keep everything in sync.

Need to spin up the full stack? `node scripts/local-stack.mjs up` will regenerate the env files, start MongoDB, and launch the backend/frontend dev servers in one go (it uses the same envset target; default `local`).
