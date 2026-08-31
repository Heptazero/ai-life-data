import type { LifeConfig } from "../config.js";
import { currentStateSchema, type CurrentState } from "../domain/current-state.js";
import type { LifeEvent, SourceDocument } from "../domain/event.js";
import type {
  BranchTimelineDay,
  BranchTimelineSnapshot,
  EnergyPhase
} from "../adapters/branch-timeline.js";
import type { ObsidianSnapshot } from "../adapters/obsidian.js";
import { logicalClock } from "../utils/time.js";

const ACTIVE_PROJECT_STATUSES = new Set([
  "active",
  "doing",
  "in-progress",
  "in progress",
  "进行中"
]);

function eventLogicalDate(event: LifeEvent): string {
  const date = event.attributes.logicalDate;
  return typeof date === "string" ? date : event.occurredAt.slice(0, 10);
}

function eventSort(left: LifeEvent, right: LifeEvent): number {
  return left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id);
}

function latestEnergyPhases(
  snapshot: BranchTimelineSnapshot | null,
  logicalDate: string
): EnergyPhase[] {
  if (!snapshot) return [];
  const dates = Object.keys(snapshot.state.days)
    .filter(date => date <= logicalDate && snapshot.state.days[date]?.energyPhases !== undefined)
    .sort()
    .reverse();
  if (!dates.length) return [];
  return [...(snapshot.state.days[dates[0]!]?.energyPhases ?? [])].sort((a, b) => a.at - b.at);
}

function currentEnergyPhase(
  snapshot: BranchTimelineSnapshot | null,
  logicalDate: string,
  minute: number
): EnergyPhase | null {
  const phases = latestEnergyPhases(snapshot, logicalDate);
  let current: EnergyPhase | null = null;
  for (const phase of phases) {
    if (phase.at > minute) break;
    current = phase;
  }
  return current;
}

type RhythmKey = "wake" | "napStart" | "napEnd" | "sleepPrep" | "sleep";

const RHYTHMS: Array<{ key: RhythmKey; realKey: keyof BranchTimelineDay }> = [
  { key: "wake", realKey: "wakeReal" },
  { key: "napStart", realKey: "napStartReal" },
  { key: "napEnd", realKey: "napEndReal" },
  { key: "sleepPrep", realKey: "sleepPrepReal" },
  { key: "sleep", realKey: "sleepReal" }
];

function nextRhythm(
  snapshot: BranchTimelineSnapshot | null,
  logicalDate: string,
  minute: number
): CurrentState["nextRhythm"] {
  const day = snapshot?.state.days[logicalDate];
  if (!day) return null;
  for (const rhythm of RHYTHMS) {
    const targetMinute = day[rhythm.key];
    if (typeof targetMinute !== "number") continue;
    const completed = day[rhythm.realKey] === true;
    if (!completed && targetMinute >= minute) {
      return { key: rhythm.key, minute: targetMinute, completed };
    }
  }
  return null;
}

function activeProjects(snapshot: ObsidianSnapshot | null): SourceDocument[] {
  if (!snapshot) return [];
  return snapshot.projectDocuments.filter(document => {
    if (!document.status) return false;
    return ACTIVE_PROJECT_STATUSES.has(document.status.trim().toLowerCase());
  });
}

export function buildCurrentState(
  config: LifeConfig,
  now: Date,
  timeline: BranchTimelineSnapshot | null,
  obsidian: ObsidianSnapshot | null
): CurrentState {
  const clock = logicalClock(now, config.timezone, config.dayBoundaryHour);
  const events = timeline?.events ?? [];
  const today = events.filter(event => eventLogicalDate(event) === clock.logicalDate);
  const currentActivities = today.filter(event => event.state === "running").sort(eventSort);
  const plannedTodos = today.filter(event => event.state === "planned").sort(eventSort);
  const recentFacts = events
    .filter(event => event.state === "completed" && eventLogicalDate(event) <= clock.logicalDate)
    .sort((left, right) => eventSort(right, left))
    .slice(0, 20);

  return currentStateSchema.parse({
    version: 1,
    generatedAt: now.toISOString(),
    logicalDate: clock.logicalDate,
    timezone: config.timezone,
    currentMinute: clock.minute,
    currentActivities,
    recentFacts,
    plannedTodos,
    activeProjects: activeProjects(obsidian),
    currentEnergyPhase: currentEnergyPhase(timeline, clock.logicalDate, clock.minute),
    nextRhythm: nextRhythm(timeline, clock.logicalDate, clock.minute),
    sourceSummary: {
      branchTimelineEvents: events.length,
      selfDocuments: obsidian?.selfDocuments.length ?? 0,
      projectDocuments: obsidian?.projectDocuments.length ?? 0
    }
  });
}
