import { access, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { z } from "zod";

const configSchema = z.object({
  version: z.literal(1).default(1),
  timezone: z.string().min(1).default("Asia/Shanghai"),
  dayBoundaryHour: z.number().int().min(0).max(12).default(2),
  dataDir: z.string().min(1).default("."),
  sources: z.object({
    branchTimeline: z.object({
      stateFile: z.string().min(1),
      settingsFile: z.string().min(1).optional()
    }).optional(),
    obsidian: z.object({
      vaultPath: z.string().min(1),
      selfRoots: z.array(z.string()).default([]),
      projectTypes: z.array(z.string()).default([])
    }).optional()
  }).default({})
});

export type LifeConfig = z.infer<typeof configSchema> & {
  configFile: string;
  rootDir: string;
  resolvedDataDir: string;
};

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}
function expandHome(value: string): string {
  if (value === "~") return homedir();
  if (value.startsWith("~/")) return path.join(homedir(), value.slice(2));
  return value;
}

export function resolveFrom(base: string, value: string): string {
  const expanded = expandHome(value);
  return path.isAbsolute(expanded) ? path.normalize(expanded) : path.resolve(base, expanded);
}

export async function loadConfig(explicitPath?: string): Promise<LifeConfig> {
  const candidates = [
    explicitPath,
    process.env.AI_LIFE_CONFIG,
    "life.config.local.json",
    "life.config.json"
  ].filter((value): value is string => Boolean(value));

  let configFile: string | null = null;
  for (const candidate of candidates) {
    const resolved = resolveFrom(process.cwd(), candidate);
    if (await exists(resolved)) {
      configFile = resolved;
      break;
    }
  }
  if (!configFile) {
    throw new Error("找不到配置。复制 life.config.example.json 为 life.config.local.json 后填写本地路径。");
  }

  const rootDir = path.dirname(configFile);
  const parsed = configSchema.parse(JSON.parse(await readFile(configFile, "utf8")));
  if (parsed.sources.branchTimeline) {
    parsed.sources.branchTimeline.stateFile = resolveFrom(rootDir, parsed.sources.branchTimeline.stateFile);
    if (parsed.sources.branchTimeline.settingsFile) {
      parsed.sources.branchTimeline.settingsFile = resolveFrom(rootDir, parsed.sources.branchTimeline.settingsFile);
    }
  }
  if (parsed.sources.obsidian) {
    parsed.sources.obsidian.vaultPath = resolveFrom(rootDir, parsed.sources.obsidian.vaultPath);
  }

  return {
    ...parsed,
    configFile,
    rootDir,
    resolvedDataDir: resolveFrom(rootDir, parsed.dataDir)
  };
}
