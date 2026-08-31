import path from "node:path";
import { readBranchTimeline } from "../adapters/branch-timeline.js";
import { readObsidian } from "../adapters/obsidian.js";
import type { LifeConfig } from "../config.js";
import type { LifeEvent } from "../domain/event.js";
import { readJsonIfExists, removeFile, writeJson, writeJsonl } from "../utils/files.js";
import { buildCurrentState } from "./current-state.js";

interface SourceManifest {
  version: 1;
  generatedAt: string;
  files: string[];
}

export interface SyncResult {
  generatedAt: string;
  branchTimelineEvents: number;
  selfDocuments: number;
  projectDocuments: number;
  currentStateFile: string;
}

function eventLogicalDate(event: LifeEvent): string {
  const value = event.attributes.logicalDate;
  return typeof value === "string" ? value : event.occurredAt.slice(0, 10);
}

function groupEvents(events: LifeEvent[]): Map<string, LifeEvent[]> {
  const groups = new Map<string, LifeEvent[]>();
  for (const event of events) {
    const date = eventLogicalDate(event);
    const group = groups.get(date) ?? [];
    group.push(event);
    groups.set(date, group);
  }
  return groups;
}

function safeGeneratedEventFile(relative: string): boolean {
  return /^sources\/branch-timeline\/\d{4}-\d{2}-\d{2}\.jsonl$/.test(relative);
}

export async function syncLifeData(config: LifeConfig, now = new Date()): Promise<SyncResult> {
  const timeline = await readBranchTimeline(config);
  const obsidian = await readObsidian(config, timeline?.settings ?? null);
  const generatedAt = now.toISOString();

  const manifestFile = path.join(config.resolvedDataDir, "sources", "branch-timeline", "manifest.json");
  const previousManifest = await readJsonIfExists<SourceManifest>(manifestFile);
  const eventFiles: string[] = [];
  for (const [date, events] of groupEvents(timeline?.events ?? [])) {
    const relative = `sources/branch-timeline/${date}.jsonl`;
    await writeJsonl(path.join(config.resolvedDataDir, relative), events);
    eventFiles.push(relative);
  }
  eventFiles.sort();

  const currentFiles = new Set(eventFiles);
  for (const relative of previousManifest?.files ?? []) {
    if (safeGeneratedEventFile(relative) && !currentFiles.has(relative)) {
      await removeFile(path.join(config.resolvedDataDir, relative));
    }
  }
  await writeJson(manifestFile, { version: 1, generatedAt, files: eventFiles } satisfies SourceManifest);

  await writeJsonl(
    path.join(config.resolvedDataDir, "sources", "obsidian", "self-index.jsonl"),
    obsidian?.selfDocuments ?? []
  );
  await writeJsonl(
    path.join(config.resolvedDataDir, "sources", "obsidian", "project-index.jsonl"),
    obsidian?.projectDocuments ?? []
  );

  const currentState = buildCurrentState(config, now, timeline, obsidian);
  const currentStateFile = path.join(config.resolvedDataDir, "derived", "current-state.json");
  await writeJson(currentStateFile, currentState);

  return {
    generatedAt,
    branchTimelineEvents: timeline?.events.length ?? 0,
    selfDocuments: obsidian?.selfDocuments.length ?? 0,
    projectDocuments: obsidian?.projectDocuments.length ?? 0,
    currentStateFile
  };
}
