import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import {
  DEFAULT_ODIN_CONFIG,
  getOdinEnvConfig,
  normalizeOdinConfig,
  type OdinConfig,
} from "./odin";

const ODIN_CONFIG_PATH = "/www/wwwroot/gerar.suafontee.com/hug-buddy/.odin-config.json";

function readPersistedOdinConfig(): Partial<OdinConfig> {
  try {
    if (!existsSync(ODIN_CONFIG_PATH)) return {};
    const raw = readFileSync(ODIN_CONFIG_PATH, "utf8");
    if (!raw.trim()) return {};
    const parsed = JSON.parse(raw) as Partial<OdinConfig>;
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch (error) {
    console.error("[OdinRuntime] Failed to read persisted config:", error);
    return {};
  }
}

function writePersistedOdinConfig(config: OdinConfig): void {
  const targetDir = dirname(ODIN_CONFIG_PATH);
  mkdirSync(targetDir, { recursive: true });

  const tmpPath = `${ODIN_CONFIG_PATH}.tmp`;
  writeFileSync(tmpPath, `${JSON.stringify(config, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  renameSync(tmpPath, ODIN_CONFIG_PATH);
}

export function getOdinRuntimeConfig(): OdinConfig {
  return normalizeOdinConfig({
    ...DEFAULT_ODIN_CONFIG,
    ...getOdinEnvConfig(),
    ...readPersistedOdinConfig(),
  });
}

export function saveOdinRuntimeConfig(partial: Partial<OdinConfig>): OdinConfig {
  const merged = normalizeOdinConfig({
    ...getOdinRuntimeConfig(),
    ...partial,
  });

  writePersistedOdinConfig(merged);
  return merged;
}

export function resetOdinRuntimeConfig(): OdinConfig {
  const cfg = normalizeOdinConfig({
    ...DEFAULT_ODIN_CONFIG,
    ...getOdinEnvConfig(),
  });

  try {
    if (existsSync(ODIN_CONFIG_PATH)) {
      writePersistedOdinConfig(cfg);
    }
  } catch (error) {
    console.error("[OdinRuntime] Failed to reset config:", error);
  }

  return cfg;
}
