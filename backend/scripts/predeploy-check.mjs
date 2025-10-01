#!/usr/bin/env node
import { config as loadEnv } from 'dotenv';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { MongoClient } from 'mongodb';

function parseArgs(argv) {
  const flags = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      // ignore positional arguments for now
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      flags.set(arg, next);
      i += 1;
    } else {
      flags.set(arg, true);
    }
  }
  return flags;
}

const argv = process.argv.slice(2);
if (argv.includes('--help')) {
  console.log(`Usage: pnpm predeploy:check [options]\n\n` +
    `Options:\n` +
    `  --env-file <path>        Path to the env file (default: .env)\n` +
    `  --database-uri <uri>     Override DATABASE_URI from the env file\n` +
    `  --server-url <url>       Override PAYLOAD_PUBLIC_SERVER_URL for health checks\n` +
    `  --health-path <path>     Path to query on the server (default: /api/health)\n` +
    `  --health-timeout <ms>    Timeout in milliseconds for the HTTP health check (default: 5000)\n` +
    `  --skip-mongo             Skip the MongoDB connectivity test\n` +
    `  --skip-health            Skip the HTTP health check\n` +
    `  --write-env              Persist the provided --server-url into the env file\n` +
    `  --help                   Show this help text\n`);
  process.exit(0);
}

const flags = parseArgs(argv);
const envFile = flags.get('--env-file') ?? '.env';
const envPath = resolve(process.cwd(), envFile);
if (existsSync(envPath)) {
  loadEnv({ path: envPath, override: false });
  console.log(`Loaded environment variables from ${envFile}`);
} else {
  console.warn(`Env file ${envFile} not found; relying on process environment.`);
}

function maskMongoUri(uri) {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:@/]+:)([^@]+)(@)/i, (_, prefix, _secret, suffix) => `${prefix}****${suffix}`);
}

async function verifyMongo(uri) {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 7000,
  });
  try {
    await client.connect();
    await client.db().command({ ping: 1 });
    console.log('✔ Successfully connected to MongoDB and received ping response.');
  } catch (error) {
    console.error('✖ MongoDB connection failed.');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => {});
  }
}

async function verifyHealth(serverUrl, path, timeoutMs) {
  let url;
  try {
    const base = new URL(serverUrl);
    const relativePath = path.startsWith('/') ? path : `/${path}`;
    url = new URL(relativePath, base);
  } catch (error) {
    console.error('✖ Invalid server URL provided for health check.');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      console.error(`✖ Health check responded with HTTP ${response.status}`);
      process.exitCode = 1;
    } else {
      console.log(`✔ Health check succeeded at ${url.href} (status ${response.status}).`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`✖ Health check timed out after ${timeoutMs}ms.`);
    } else {
      console.error('✖ Health check request failed.');
      console.error(error instanceof Error ? error.message : error);
    }
    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
  }
}

function writeEnvValue(path, key, value) {
  const quotedValue = /\s/.test(value) ? `"${value}"` : value;
  let content = '';
  if (existsSync(path)) {
    content = readFileSync(path, 'utf8');
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    if (pattern.test(content)) {
      content = content.replace(pattern, `${key}=${quotedValue}`);
    } else if (content.trim().length > 0) {
      content = `${content.trimEnd()}\n${key}=${quotedValue}\n`;
    } else {
      content = `${key}=${quotedValue}\n`;
    }
  } else {
    content = `${key}=${quotedValue}\n`;
  }
  writeFileSync(path, content, 'utf8');
  console.log(`Updated ${key} in ${path}`);
}

const databaseUri = flags.get('--database-uri') ?? process.env.DATABASE_URI;
const skipMongo = flags.has('--skip-mongo');
if (!databaseUri && !skipMongo) {
  console.error('✖ DATABASE_URI is not set. Provide it via the env file or --database-uri.');
  process.exit(1);
}

if (databaseUri && !skipMongo) {
  console.log(`Checking MongoDB connectivity using ${maskMongoUri(databaseUri)} ...`);
  await verifyMongo(databaseUri);
}

const serverUrlOverride = flags.get('--server-url');
const serverUrl = serverUrlOverride ?? process.env.PAYLOAD_PUBLIC_SERVER_URL;
const skipHealth = flags.has('--skip-health');
const healthPath = flags.get('--health-path') ?? '/api/health';
const healthTimeout = Number(flags.get('--health-timeout') ?? 5000);

if (Number.isNaN(healthTimeout) || healthTimeout <= 0) {
  console.error('✖ --health-timeout must be a positive number of milliseconds.');
  process.exit(1);
}

if (serverUrl) {
  if (serverUrlOverride && process.env.PAYLOAD_PUBLIC_SERVER_URL && serverUrlOverride !== process.env.PAYLOAD_PUBLIC_SERVER_URL) {
    console.warn('⚠ PAYLOAD_PUBLIC_SERVER_URL in the environment differs from the provided --server-url.');
    if (flags.has('--write-env')) {
      writeEnvValue(envPath, 'PAYLOAD_PUBLIC_SERVER_URL', serverUrlOverride);
    } else {
      console.warn('  Run again with --write-env to persist the override into the env file.');
    }
  }

  if (!skipHealth) {
    console.log(`Checking HTTP health at ${serverUrl} (path ${healthPath}) ...`);
    await verifyHealth(serverUrl, healthPath, healthTimeout);
  }
} else if (!skipHealth) {
  console.warn('PAYLOAD_PUBLIC_SERVER_URL is not set; skipping HTTP health check.');
}

if (process.exitCode && process.exitCode !== 0) {
  console.error('Pre-deployment checks finished with errors.');
  process.exit(process.exitCode);
}

console.log('Pre-deployment checks completed successfully.');
