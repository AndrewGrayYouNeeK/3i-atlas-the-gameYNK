#!/usr/bin/env node
/**
 * Build + deploy Atlas to Cloudflare Pages and attach 3iatlasgame.xyz.
 *
 * Required env:
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_API_TOKEN   (Pages Edit + Zone DNS Edit + Zone Read)
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

async function ensureProject() {
  try {
    const project = await cf(`/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}`);
    console.log(`Pages project exists: ${PROJECT} → ${project.subdomain}`);
    return project;
  } catch (err) {
    if (!String(err.message).includes('404') && !String(err.message).includes('8000007')) {
      // fall through — create may still work
      console.warn(String(err.message));
    }
    console.log(`Creating Pages project ${PROJECT}…`);
    const project = await cf(`/accounts/${ACCOUNT_ID}/pages/projects`, {
      method: 'POST',
      body: {
        name: PROJECT,
        production_branch: 'main',
        deployment_configs: {
          production: {
            env_vars: {},
          },
        },
      },
    });
    console.log(`Created: ${project.subdomain}`);
    return project;
  }
}

async function ensureDomain(projectName, hostname) {
  const base = `/accounts/${ACCOUNT_ID}/pages/projects/${projectName}/domains`;
  try {
    const existing = await cf(`${base}/${hostname}`);
    console.log(`Custom domain already attached: ${hostname} (${existing.status})`);
    return existing;
  } catch {
    console.log(`Attaching custom domain ${hostname}…`);
    const created = await cf(base, { method: 'POST', body: { name: hostname } });
    console.log(`Attached: ${hostname} (${created.status})`);
    return created;
  }
}

async function findZoneId(hostname) {
  const zones = await cf(`/zones?name=${encodeURIComponent(hostname)}`);
  if (!zones?.length) die(`No Cloudflare zone found for ${hostname}. Is DNS on Cloudflare?`);
  return zones[0].id;
}

async function ensureDns(zoneId, name, targetHost, type = 'CNAME') {
  const list = await cf(`/zones/${zoneId}/dns_records?name=${encodeURIComponent(name)}`);
  const wanted = type === 'CNAME' ? targetHost : targetHost;
  const match = (list || []).find((r) => r.type === type && (r.content === wanted || r.content === `${wanted}.`));
  if (match) {
    if (!match.proxied) {
      console.log(`Updating ${name} to proxied…`);
      await cf(`/zones/${zoneId}/dns_records/${match.id}`, {
        method: 'PATCH',
        body: { proxied: true },
      });
    } else {
      console.log(`DNS OK: ${name} ${type} → ${match.content} (proxied)`);
    }
    return;
  }

  // Replace conflicting apex/www records that don't point at Pages
  for (const rec of list || []) {
    if (['A', 'AAAA', 'CNAME'].includes(rec.type)) {
      console.log(`Deleting conflicting DNS ${rec.type} ${rec.name} → ${rec.content}`);
      await cf(`/zones/${zoneId}/dns_records/${rec.id}`, { method: 'DELETE' });
    }
  }

  console.log(`Creating DNS ${type} ${name} → ${wanted} (proxied)`);
  await cf(`/zones/${zoneId}/dns_records`, {
    method: 'POST',
    body: {
      type,
      name,
      content: wanted,
      proxied: true,
      ttl: 1,
    },
  });
}

async function main() {
  if (!ACCOUNT_ID) die('CLOUDFLARE_ACCOUNT_ID is required');
  if (!TOKEN) die('CLOUDFLARE_API_TOKEN is required (Pages Edit + Zone DNS Edit)');

  if (process.env.SKIP_BUILD !== '1') {
    if (!existsSync('.env.production') && existsSync('.env.example')) {
      sh('cp .env.example .env.production');
    }
    sh('npm ci');
    sh('npm run build');
  }
  if (!existsSync('dist/index.html')) die('dist/index.html missing — build failed?');

  const project = await ensureProject();
  const pagesHost = project.subdomain; // e.g. 3i-atlas-the-game.pages.dev

  console.log(`\nDeploying dist/ to Pages project ${PROJECT}…`);
  sh(
    `npx wrangler pages deploy dist --project-name=${PROJECT} --branch=main --commit-dirty=true`,
    {
      env: {
        ...process.env,
        CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID,
        CLOUDFLARE_API_TOKEN: TOKEN,
      },
    },
  );

  await ensureDomain(PROJECT, DOMAIN);
  await ensureDomain(PROJECT, WWW);

  const zoneId = await findZoneId(DOMAIN);
  // Apex uses CNAME flattening on Cloudflare
  await ensureDns(zoneId, DOMAIN, pagesHost, 'CNAME');
  await ensureDns(zoneId, WWW, pagesHost, 'CNAME');

  console.log(`
────────────────────────────────────────
Deployed.

  Pages:   https://${pagesHost}
  Apex:    https://${DOMAIN}
  WWW:     https://${WWW}

IMPORTANT — if the apex still shows a Cloudflare challenge / “Just a moment…”:
  Cloudflare dashboard → ${DOMAIN} → Security → Settings
  → Security Level = Medium (not “I’m Under Attack”)
  → turn off Bot Fight Mode if needed
────────────────────────────────────────
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
