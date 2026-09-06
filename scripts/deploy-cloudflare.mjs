#!/usr/bin/env node
/**
 * Build + deploy Atlas to Cloudflare Workers (static assets) and attach 3iatlasgame.xyz.
 *
 * Required env:
 *   CLOUDFLARE_API_TOKEN   (Workers Scripts Edit; Zone DNS Edit to attach the domain)
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

const WRONG_ACCOUNT = `This GitHub token still belongs to the wrong Cloudflare account.
${DOMAIN} is not visible to it.

I cannot change GitHub secrets from here. On the account that lists ${DOMAIN} under Websites:
  dash.cloudflare.com → switch account (top left) → 3iatlasgame.xyz must appear
  Create Token (Edit Cloudflare Workers + Zone DNS Edit + Zone Read, All zones)
  GitHub → Settings → Secrets → replace CLOUDFLARE_API_TOKEN
  You can delete CLOUDFLARE_ACCOUNT_ID; deploy follows the zone's account automatically.
Then: Actions → Deploy Cloudflare Workers → Run workflow`;

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
  let domainZones = [];
  try {
    domainZones = (await cf(`/zones?name=${encodeURIComponent(DOMAIN)}`)) || [];
  } catch (err) {
    console.warn(`Zone lookup for ${DOMAIN} failed: ${err.message}`);
  }
  if (domainZones.length) {
    const zone = domainZones[0];
    const id = zone.account?.id;
    const name = zone.account?.name || zone.account?.id;
    if (!id) die(`Zone ${DOMAIN} has no account id on it.`);
    if (accountId && accountId !== id) {
      console.warn(
        `Ignoring stale CLOUDFLARE_ACCOUNT_ID=${accountId}; ${DOMAIN} is on ${name} (${id}).`,
      );
    }
    console.log(`Deploy target: ${name} (${id}) because it owns ${DOMAIN}`);
    return id;
  }

  let accounts;
  try {
    accounts = (await cf('/accounts')) || [];
  } catch (err) {
    die(`Could not list Cloudflare accounts with this token.\n${err.message}\n\n${WRONG_ACCOUNT}`);
  }
  console.log('Token can access accounts:');
  for (const a of accounts) console.log(`  ${a.name}  ${a.id}`);
  die(WRONG_ACCOUNT);
}

async function listVisibleZones() {
  try {
    const zones = (await cf(`/zones?per_page=50&account.id=${accountId}`)) || [];
    console.log(`Zones this token can see (${zones.length}):`);
    for (const z of zones) console.log(`  ${z.name}  ${z.status}`);
    return zones;
  } catch (err) {
    console.warn(`Could not list zones: ${err.message}`);
    return [];
  }
}

async function attachCustomDomain(hostname) {
  let existing = [];
  try {
    existing = (await cf(`/accounts/${accountId}/workers/domains`)) || [];
  } catch (err) {
    console.warn(`Could not list Worker domains: ${err.message}`);
  }
  const already = existing.find((d) => d.hostname === hostname && d.service === PROJECT);
  if (already) {
    console.log(`Custom domain already attached: ${hostname}`);
    return already;
  }

  console.log(`Attaching custom domain ${hostname} → Worker ${PROJECT}…`);
  try {
    const attached = await cf(`/accounts/${accountId}/workers/domains`, {
      method: 'PUT',
      body: { hostname, service: PROJECT },
    });
    console.log(`Attached: ${hostname} (${attached.id || attached.hostname})`);
    return attached;
  } catch (err) {
    console.warn(`API attach failed: ${err.message}`);
  }

  try {
    sh(`npx wrangler deploy --domain ${hostname}`, {
      env: {
        ...process.env,
        CLOUDFLARE_ACCOUNT_ID: accountId,
        CLOUDFLARE_API_TOKEN: TOKEN,
      },
    });
    return { hostname };
  } catch (err) {
    console.warn(`wrangler --domain ${hostname} failed`);
    return null;
  }
}

async function main() {
  if (!TOKEN) die('CLOUDFLARE_API_TOKEN is required.');

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

  const zones = await listVisibleZones();
  if (!zones.some((z) => z.name === DOMAIN)) {
    die(WRONG_ACCOUNT);
  }

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
    die('wrangler deploy failed. Token needs Account → Workers Scripts → Edit.');
  }

  await listVisibleZones();
  const apex = await attachCustomDomain(DOMAIN);
  const www = await attachCustomDomain(WWW);

  console.log(`
────────────────────────────────────────
  Apex:    ${apex ? `https://${DOMAIN}` : 'NOT ATTACHED'}
  WWW:     ${www ? `https://${WWW}` : 'NOT ATTACHED'}
────────────────────────────────────────
`);

  if (!apex) {
    die(`Game is deployed, but ${DOMAIN} could not be attached.\n\n${WRONG_ACCOUNT}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
