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

const WRONG_ACCOUNT = `${DOMAIN} is not in the Cloudflare account this token belongs to.
The previous deploy went to Andrewgray@youneek.xyz's Account — that is the wrong one.

Fix:
1. https://dash.cloudflare.com — top-left, switch accounts until Websites lists ${DOMAIN}
2. Stay on that account. Copy Account ID from the right sidebar.
3. Profile → API Tokens → Create Token → Edit Cloudflare Workers
   Then add Zone → DNS → Edit and Zone → Zone → Read (Zone resources: All zones)
4. GitHub → Settings → Secrets:
   CLOUDFLARE_API_TOKEN  = the new token (from the domain's account)
   CLOUDFLARE_ACCOUNT_ID = that account's ID (not 6b8b358d7780d34a3f941be39b4b28d6)
5. Actions → Deploy Cloudflare Workers → Run workflow`;

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
    die(`Could not list Cloudflare accounts with this token.\n${err.message}`);
  }
  if (!accounts.length) die('This API token cannot see any Cloudflare accounts.');

  console.log('Token can access:');
  for (const a of accounts) console.log(`  ${a.name}  ${a.id}`);

  if (accountId && accounts.some((a) => a.id === accountId)) return accountId;
  if (accountId) {
    die(
      `CLOUDFLARE_ACCOUNT_ID=${accountId} is not visible to this token. The token is for a different Cloudflare account.\n\n${WRONG_ACCOUNT}`,
    );
  }
  if (accounts.length === 1) return accounts[0].id;
  die(
    `Token sees multiple accounts. Set CLOUDFLARE_ACCOUNT_ID to the account that owns ${DOMAIN}:\n${accounts
      .map((a) => `  ${a.id}  ${a.name}`)
      .join('\n')}`,
  );
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

  const workerUrl = 'https://3i-atlas-the-game.andrewgray-6b8.workers.dev';
  console.log(`
────────────────────────────────────────
Worker is live: ${workerUrl}

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
