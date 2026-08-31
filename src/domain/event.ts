import { z } from "zod";

const localDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

export const lifeEventSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  source: z.string().min(1),
  kind: z.string().min(1),
  state: z.enum(["planned", "running", "completed", "observed"]),
  occurredAt: z.string().regex(localDateTime),
  endedAt: z.string().regex(localDateTime).optional(),
  timezone: z.string().min(1),
  title: z.string().min(1).optional(),
  refs: z.record(z.string(), z.string()).default({}),
  attributes: z.record(z.string(), z.unknown()).default({}),
  provenance: z.object({
    sourceFile: z.string().min(1),
    sourceRecordId: z.string().min(1),
    confidence: z.enum(["explicit", "observed", "inferred"])
  })
});

export type LifeEvent = z.infer<typeof lifeEventSchema>;

export const sourceDocumentSchema = z.object({
  version: z.literal(1),
  source: z.enum(["obsidian-self", "obsidian-project"]),
  path: z.string().min(1),
  title: z.string().min(1),
  modifiedAt: z.string().datetime(),
  type: z.string().optional(),
  status: z.string().optional(),
  started: z.string().optional(),
  color: z.string().optional(),
  aliases: z.array(z.string()).default([])
});

export type SourceDocument = z.infer<typeof sourceDocumentSchema>;
