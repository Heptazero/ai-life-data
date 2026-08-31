import { access } from "node:fs/promises";
import type { LifeConfig } from "../config.js";

export interface DoctorCheck {
  name: string;
  path: string;
  ok: boolean;
}

async function canRead(name: string, file: string): Promise<DoctorCheck> {
  try {
    await access(file);
    return { name, path: file, ok: true };
  } catch {
    return { name, path: file, ok: false };
  }
}

export async function doctor(config: LifeConfig): Promise<DoctorCheck[]> {
  const checks: Array<Promise<DoctorCheck>> = [];
  const timeline = config.sources.branchTimeline;
  if (timeline) {
    checks.push(canRead("Branch Timeline 状态", timeline.stateFile));
    if (timeline.settingsFile) checks.push(canRead("Branch Timeline 设置", timeline.settingsFile));
  }
  const obsidian = config.sources.obsidian;
  if (obsidian) checks.push(canRead("Obsidian Vault", obsidian.vaultPath));
  return Promise.all(checks);
}
