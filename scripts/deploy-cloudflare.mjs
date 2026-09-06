#!/usr/bin/env node
/**
 * Build + deploy Atlas to Cloudflare Workers (static assets) and attach 3iatlasgame.xyz.
 *
 * Required env:
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_API_TOKEN   (Workers Scripts Write + Zone DNS Edit + Zone Read)
 *
 * Optional:
 *   CLOUDFLARE_PROJECT_NAME  (default: 3i-atlas-the-game)
 *   SITE_DOMAIN              (default: 3iatlasgame.xyz)
 *   SKIP_BUILD=1             (deploy existing dist/)
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const PROJECT = process.env.CLOUDFLARE_PROJECT_NAME || '3i-atlas-the-game';
const DOMAIN = process.env.SITE_DOMAIN || '3iatlasgame.xyz';
const WWW = `www.${DOMAIN}`;
const API = 'https://api.cloudflare.com/client/v4';

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

async function findZoneId(hostname) {
  const zones = await cf(`/zones?name=${encodeURIComponent(hostname)}`);
  if (!zones?.length) die(`No Cloudflare zone found for ${hostname}. Is DNS on Cloudflare?`);
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
    return (await cf(`/accounts/${ACCOUNT_ID}/workers/domains`)) || [];
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

  // Custom domains cannot be created while a CNAME/A already exists on the hostname.
  await clearConflictingDns(zoneId, hostname);

  console.log(`Attaching custom domain ${hostname} → Worker ${PROJECT}…`);
  const attached = await cf(`/accounts/${ACCOUNT_ID}/workers/domains`, {
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
  if (!ACCOUNT_ID) die('CLOUDFLARE_ACCOUNT_ID is required');
  if (!TOKEN) die('CLOUDFLARE_API_TOKEN is required (Workers Scripts Write + Zone DNS Edit)');

  if (process.env.SKIP_BUILD !== '1') {
    if (!existsSync('.env.production') && existsSync('.env.example')) {
      sh('cp .env.example .env.production');
    }
    sh('npm ci');
    sh('npm run build');
  }
  if (!existsSync('dist/index.html')) die('dist/index.html missing — build failed?');

  console.log(`\nDeploying dist/ to Worker ${PROJECT}…`);
  sh('npx wrangler deploy --commit-dirty=true', {
    env: {
      ...process.env,
      CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID,
      CLOUDFLARE_API_TOKEN: TOKEN,
    },
  });

  const zoneId = await findZoneId(DOMAIN);
  await ensureCustomDomain(DOMAIN, zoneId);
  await ensureCustomDomain(WWW, zoneId);

  console.log(`
────────────────────────────────────────
Deployed.

  Worker:  https://${PROJECT}.<account>.workers.dev
  Apex:    https://${DOMAIN}
  WWW:     https://${WWW}

If the apex still shows Cloudflare Error 1000 or “Just a moment…”:
  1. Confirm Workers → ${PROJECT} → Settings → Domains lists ${DOMAIN}
  2. Cloudflare dashboard → ${DOMAIN} → Security → Settings
     → Security Level = Medium (not “I’m Under Attack”)
────────────────────────────────────────
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
