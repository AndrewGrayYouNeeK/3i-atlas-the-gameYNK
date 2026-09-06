#!/usr/bin/env node
/**
 * Build + deploy Atlas to Cloudflare Workers (static assets) and attach 3iatlasgame.xyz.
 *
 * Required env:
 *   CLOUDFLARE_API_TOKEN   (Workers Scripts Edit + Zone DNS Edit + Zone Read)
 *
 * Optional:
 *   CLOUDFLARE_ACCOUNT_ID    (if omitted, uses the sole account the token can see)
 *   CLOUDFLARE_PROJECT_NAME  (default: 3i-atlas-the-game)
 *   SITE_DOMAIN              (default: 3iatlasgame.xyz)
 *   SKIP_BUILD=1             (deploy existing dist/)
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const PROJECT = process.env.CLOUDFLARE_PROJECT_NAME || '3i-atlas-the-game';
const DOMAIN = process.env.SITE_DOMAIN || '3iatlasgame.xyz';
const WWW = `www.${DOMAIN}`;
const API = 'https://api.cloudflare.com/client/v4';

const TOKEN_HELP = `Create a NEW API token (the current one cannot deploy Workers):
  https://dash.cloudflare.com/profile/api-tokens
  Create Token → Create Custom Token

Permissions (all three):
  Account → Workers Scripts → Edit
  Zone    → DNS             → Edit
  Zone    → Zone            → Read

Account resources: Include → Andrewgray@youneek.xyz's Account
Zone resources:    Include → Specific zone → 3iatlasgame.xyz

Then in GitHub → Settings → Secrets and variables → Actions:
  CLOUDFLARE_API_TOKEN     = (the new token)
  CLOUDFLARE_ACCOUNT_ID    = 6b8b358d7780d34a3f941be39b4b28d6

Re-run Actions → Deploy Cloudflare Workers.`;

let accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

function die(msg) {
  console.error(`\nERROR: ${msg}\n`);
  process.exit(1);
}

function sh(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', ...opts });
}

async function cf(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const detail = JSON.stringify(json.errors || json, null, 2);
    throw new Error(`${method} ${path} failed (${res.status}): ${detail}`);
  }
  return json.result;
}

async function resolveAccountId() {
  let accounts;
  try {
    accounts = (await cf('/accounts')) || [];
  } catch (err) {
    die(`Could not list Cloudflare accounts with this token.\n${err.message}\n\n${TOKEN_HELP}`);
  }
  if (!accounts.length) die(`This API token cannot see any Cloudflare accounts.\n\n${TOKEN_HELP}`);

  console.log('Token can access:');
  for (const a of accounts) console.log(`  ${a.name}  ${a.id}`);

  if (accountId && accounts.some((a) => a.id === accountId)) return accountId;
  if (accountId) {
    console.warn(
      `CLOUDFLARE_ACCOUNT_ID=${accountId} is not an account this token can use. Switching to ${accounts[0].id}.`,
    );
  }
  if (accounts.length === 1) return accounts[0].id;
  die(
    `Token sees multiple accounts. Set CLOUDFLARE_ACCOUNT_ID to one of:\n${accounts
      .map((a) => `  ${a.id}  ${a.name}`)
      .join('\n')}`,
  );
}

async function findZoneId(hostname) {
  const zones = await cf(`/zones?name=${encodeURIComponent(hostname)}`);
  if (!zones?.length) {
    die(
      `No Cloudflare zone found for ${hostname} with this token.\nAdd Zone → Zone → Read and Zone → DNS → Edit for ${hostname}.\n\n${TOKEN_HELP}`,
    );
  }
  return zones[0].id;
}

async function clearConflictingDns(zoneId, name) {
  const list = await cf(`/zones/${zoneId}/dns_records?name=${encodeURIComponent(name)}`);
  for (const rec of list || []) {
    if (['A', 'AAAA', 'CNAME'].includes(rec.type)) {
      console.log(`Deleting conflicting DNS ${rec.type} ${rec.name} → ${rec.content}`);
      await cf(`/zones/${zoneId}/dns_records/${rec.id}`, { method: 'DELETE' });
    }
  }
}

async function listWorkerDomains() {
  try {
    return (await cf(`/accounts/${accountId}/workers/domains`)) || [];
  } catch (err) {
    console.warn(`Could not list Worker domains: ${err.message}`);
    return [];
  }
}

async function ensureCustomDomain(hostname, zoneId) {
  const existing = (await listWorkerDomains()).find(
    (d) => d.hostname === hostname && d.service === PROJECT,
  );
  if (existing) {
    console.log(`Custom domain already attached: ${hostname} (${existing.id})`);
    return existing;
  }

  await clearConflictingDns(zoneId, hostname);

  console.log(`Attaching custom domain ${hostname} → Worker ${PROJECT}…`);
  const attached = await cf(`/accounts/${accountId}/workers/domains`, {
    method: 'PUT',
    body: {
      hostname,
      service: PROJECT,
      zone_id: zoneId,
      zone_name: DOMAIN,
    },
  });
  console.log(`Attached: ${hostname} (${attached.id || attached.hostname})`);
  return attached;
}

async function main() {
  if (!TOKEN) die(`CLOUDFLARE_API_TOKEN is required.\n\n${TOKEN_HELP}`);

  if (process.env.SKIP_BUILD !== '1') {
    if (!existsSync('.env.production') && existsSync('.env.example')) {
      sh('cp .env.example .env.production');
    }
    sh('npm ci');
    sh('npm run build');
  }
  if (!existsSync('dist/index.html')) die('dist/index.html missing — build failed?');

  accountId = await resolveAccountId();
  console.log(`Using Cloudflare account ${accountId}`);

  console.log(`\nDeploying dist/ to Worker ${PROJECT}…`);
  try {
    sh('npx wrangler deploy', {
      env: {
        ...process.env,
        CLOUDFLARE_ACCOUNT_ID: accountId,
        CLOUDFLARE_API_TOKEN: TOKEN,
      },
    });
  } catch {
    die(`wrangler deploy failed (Cloudflare code 10000 = token missing Workers Scripts Edit).\n\n${TOKEN_HELP}`);
  }

  const zoneId = await findZoneId(DOMAIN);
  await ensureCustomDomain(DOMAIN, zoneId);
  await ensureCustomDomain(WWW, zoneId);

  console.log(`
────────────────────────────────────────
Deployed.

  Apex:    https://${DOMAIN}
  WWW:     https://${WWW}

If the apex still shows a Cloudflare challenge:
  ${DOMAIN} → Security → Settings → Security Level = Medium
────────────────────────────────────────
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
