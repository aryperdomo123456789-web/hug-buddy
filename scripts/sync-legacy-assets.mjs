import { cpSync, existsSync, readdirSync, statSync } from "node:fs";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const assetsDir = join(process.cwd(), ".output", "public", "assets");
const siteAssetsDir = "/www/wwwroot/gerar.suafontee.com/assets";
const serverIndexPath = join(process.cwd(), ".output", "server", "index.mjs");

const legacyMap = [
  {
    legacy: "index-CrDPA1md.js",
    prefix: "index-",
    suffix: ".js",
  },
  {
    legacy: "auth-BHbh4lYE.js",
    prefix: "auth-",
    suffix: ".js",
  },
  {
    legacy: "shield-alert-JTY8bwcF.js",
    prefix: "shield-alert-",
    suffix: ".js",
  },
  {
    legacy: "index-DH0HoCLT.js",
    prefix: "index-",
    suffix: ".js",
  },
  {
    legacy: "routes-BKJAVR7L.js",
    prefix: "routes-",
    suffix: ".js",
  },
  {
    legacy: "shield-alert-DB9zb1Ie.js",
    prefix: "shield-alert-",
    suffix: ".js",
  },
  {
    legacy: "auth-mGiIDYOT.js",
    prefix: "auth-",
    suffix: ".js",
  },
];

function findLatestAsset(prefix, suffix) {
  if (!existsSync(assetsDir)) return null;
  const candidates = readdirSync(assetsDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith(suffix))
    .map((name) => ({
      name,
      mtimeMs: statSync(join(assetsDir, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return candidates[0]?.name || null;
}

for (const entry of legacyMap) {
  const target = findLatestAsset(entry.prefix, entry.suffix);
  if (!target) {
    console.warn(`[sync-legacy-assets] No target found for ${entry.legacy}`);
    continue;
  }

  if (target === entry.legacy) {
    continue;
  }

  const from = join(assetsDir, target);
  const to = join(assetsDir, entry.legacy);
  cpSync(from, to);
  console.log(`[sync-legacy-assets] ${entry.legacy} -> ${target}`);
}

if (existsSync(assetsDir)) {
  cpSync(assetsDir, siteAssetsDir, { recursive: true });
  console.log(`[sync-legacy-assets] mirrored ${assetsDir} -> ${siteAssetsDir}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function duplicateServerAssetAliases() {
  if (!existsSync(serverIndexPath)) return;

  let source = readFileSync(serverIndexPath, "utf8");
  let updated = false;

  const aliases = [
    { legacy: "/assets/index-DH0HoCLT.js", target: "/assets/index-CgzBBL-3.js" },
    { legacy: "/assets/index-CrDPA1md.js", target: "/assets/index-CgzBBL-3.js" },
    { legacy: "/assets/routes-BKJAVR7L.js", target: "/assets/routes-C0xH3diB.js" },
    { legacy: "/assets/shield-alert-DB9zb1Ie.js", target: "/assets/shield-alert-BID6hsR1.js" },
    { legacy: "/assets/shield-alert-JTY8bwcF.js", target: "/assets/shield-alert-BID6hsR1.js" },
    { legacy: "/assets/auth-mGiIDYOT.js", target: "/assets/auth-2KSmy2fy.js" },
    { legacy: "/assets/auth-BHbh4lYE.js", target: "/assets/auth-2KSmy2fy.js" },
  ];

  for (const { legacy, target } of aliases) {
    if (source.includes(`"${legacy}"`)) continue;

    const targetPattern = new RegExp(`("${escapeRegExp(target)}": \\{[\\s\\S]*?\\n\\t\\},)`, "m");
    const match = source.match(targetPattern);
    if (!match) {
      console.warn(`[sync-legacy-assets] Could not find server manifest entry for ${target}`);
      continue;
    }

    const aliasEntry = match[1].replace(`"${target}"`, `"${legacy}"`);
    source = source.replace(match[1], `${aliasEntry}\n${match[1]}`);
    updated = true;
    console.log(`[sync-legacy-assets] aliased server asset ${legacy} -> ${target}`);
  }

  if (updated) {
    writeFileSync(serverIndexPath, source, "utf8");
    console.log(`[sync-legacy-assets] patched ${serverIndexPath}`);
  }
}

duplicateServerAssetAliases();
