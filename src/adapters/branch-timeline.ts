import { readFile } from "node:fs/promises";
import { z } from "zod";
import type { LifeConfig } from "../config.js";
import { lifeEventSchema, type LifeEvent } from "../domain/event.js";
import { localDateTime } from "../utils/time.js";

const timelineItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(["todo", "fact"]),
  plannedMin: z.number().optional(),
  startedMin: z.number().optional(),
  startMin: z.number().optional(),
  endMin: z.number().optional(),
  factTiming: z.boolean().optional(),
  projectPath: z.string().optional(),
  projectTaskId: z.string().optional(),
  tagId: z.string().optional(),
  tag: z.string().optional(),
  note: z.string().optional(),
  branchId: z.string().nullable().optional(),
  projectBranchId: z.string().nullable().optional(),
  milestone: z.boolean().optional()
}).passthrough();

const energyPhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  at: z.number(),
  color: z.string(),
  side: z.union([z.literal(-1), z.literal(1)])
});

const timelineDaySchema = z.object({
  wake: z.number().optional(),
  napStart: z.number().optional(),
  napEnd: z.number().optional(),
  sleepPrep: z.number().optional(),
  sleep: z.number().optional(),
  wakeReal: z.boolean().optional(),
  napStartReal: z.boolean().optional(),
  napEndReal: z.boolean().optional(),
  sleepPrepReal: z.boolean().optional(),
  sleepReal: z.boolean().optional(),
  items: z.array(timelineItemSchema).default([]),
  energyPhases: z.array(energyPhaseSchema).optional()
}).passthrough();

const branchTimelineStateSchema = z.object({
  version: z.number().optional(),
  days: z.record(z.string(), timelineDaySchema).default({})
}).passthrough();

const branchTimelineSettingsSchema = z.object({
  projectTypes: z.array(z.object({ type: z.string(), color: z.string().optional() })).optional(),
  tags: z.array(z.object({ id: z.string(), name: z.string(), category: z.string().optional(), color: z.string().optional() })).optional()
}).passthrough();

export type BranchTimelineState = z.infer<typeof branchTimelineStateSchema>;
export type BranchTimelineSettings = z.infer<typeof branchTimelineSettingsSchema>;
export type BranchTimelineDay = z.infer<typeof timelineDaySchema>;
export type EnergyPhase = z.infer<typeof energyPhaseSchema>;

export interface BranchTimelineSnapshot {
  state: BranchTimelineState;
  settings: BranchTimelineSettings | null;
  events: LifeEvent[];
}

function definedRefs(values: Record<string, string | null | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter((entry): entry is [string, string] => Boolean(entry[1])));
}

function definedAttributes(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}

function itemEvent(date: string, item: z.infer<typeof timelineItemSchema>, timezone: string): LifeEvent {
  const running = item.kind === "fact" ? item.factTiming === true : item.startedMin != null;
  const startMinute = item.kind === "fact"
    ? item.startMin ?? item.endMin ?? item.plannedMin ?? 0
    : item.startedMin ?? item.plannedMin ?? item.startMin ?? 0;
  const endedAt = item.kind === "fact" && !running && item.endMin != null
    ? localDateTime(date, item.endMin)
    : undefined;
  const state = running ? "running" : item.kind === "fact" ? "completed" : "planned";
  const kind = `timeline.${item.kind}.${state}`;
  const candidate = {
    version: 1 as const,
    id: `branch-timeline:${date}:${item.id}`,
    source: "branch-timeline",
    kind,
    state,
    occurredAt: localDateTime(date, startMinute),
    ...(endedAt ? { endedAt } : {}),
    timezone,
    title: item.title,
    refs: definedRefs({
      projectPath: item.projectPath,
      projectTaskId: item.projectTaskId,
      tagId: item.tagId,
      branchId: item.branchId,
      projectBranchId: item.projectBranchId
    }),
    attributes: definedAttributes({
      logicalDate: date,
      plannedAt: item.plannedMin == null ? undefined : localDateTime(date, item.plannedMin),
      durationMinutes: item.kind === "fact" && item.startMin != null && item.endMin != null
        ? Math.max(0, item.endMin - item.startMin)
        : undefined,
      tag: item.tag,
      note: item.note,
      milestone: item.milestone
    }),
    provenance: {
      sourceFile: "branch-timeline/state.json",
      sourceRecordId: item.id,
      confidence: "explicit" as const
    }
  };
  return lifeEventSchema.parse(candidate);
}

export async function readBranchTimeline(config: LifeConfig): Promise<BranchTimelineSnapshot | null> {
  const source = config.sources.branchTimeline;
  if (!source) return null;
  const state = branchTimelineStateSchema.parse(JSON.parse(await readFile(source.stateFile, "utf8")));
  let settings: BranchTimelineSettings | null = null;
  if (source.settingsFile) {
    try {
      settings = branchTimelineSettingsSchema.parse(JSON.parse(await readFile(source.settingsFile, "utf8")));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  const events = Object.entries(state.days).flatMap(([date, day]) =>
    day.items.map(item => itemEvent(date, item, config.timezone))
  );
  events.sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id));
  return { state, settings, events };
}
