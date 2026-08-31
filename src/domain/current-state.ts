import { z } from "zod";
import { lifeEventSchema, sourceDocumentSchema } from "./event.js";

export const currentStateSchema = z.object({
  version: z.literal(1),
  generatedAt: z.string().datetime(),
  logicalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().min(1),
  currentMinute: z.number().int().nonnegative(),
  currentActivities: z.array(lifeEventSchema),
  recentFacts: z.array(lifeEventSchema),
  plannedTodos: z.array(lifeEventSchema),
  activeProjects: z.array(sourceDocumentSchema),
  currentEnergyPhase: z.object({
    id: z.string(),
    name: z.string(),
    at: z.number(),
    color: z.string(),
    side: z.union([z.literal(-1), z.literal(1)])
  }).nullable(),
  nextRhythm: z.object({
    key: z.enum(["wake", "napStart", "napEnd", "sleepPrep", "sleep"]),
    minute: z.number().int(),
    completed: z.boolean()
  }).nullable(),
  sourceSummary: z.object({
    branchTimelineEvents: z.number().int().nonnegative(),
    selfDocuments: z.number().int().nonnegative(),
    projectDocuments: z.number().int().nonnegative()
  })
});

export type CurrentState = z.infer<typeof currentStateSchema>;
