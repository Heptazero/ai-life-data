import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import type { LifeConfig } from "../config.js";
import { sourceDocumentSchema, type SourceDocument } from "../domain/event.js";
import type { BranchTimelineSettings } from "./branch-timeline.js";

const EXCLUDED_DIRECTORIES = new Set([".git", ".obsidian", ".trash", "node_modules"]);

function normalizedRelative(root: string, file: string): string {
  return path.relative(root, file).split(path.sep).join("/").normalize("NFC");
}

async function markdownFiles(root: string): Promise<string[]> {
  const result: string[] = [];
  const queue = [root];
  while (queue.length) {
    const current = queue.pop();
    if (!current) continue;
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw error;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRECTORIES.has(entry.name)) queue.push(path.join(current, entry.name));
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        result.push(path.join(current, entry.name));
      }
    }
  }
  return result;
}

function frontmatter(content: string): Record<string, unknown> {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) return {};
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match?.[1]) return {};
  const value = parseYaml(match[1]);
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function optionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return undefined;
}

function aliases(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(optionalString).filter((item): item is string => Boolean(item));
  const single = optionalString(value);
  return single ? [single] : [];
}

async function documentRef(vault: string, file: string, source: SourceDocument["source"]): Promise<SourceDocument> {
  const metadata = await stat(file);
  const fm = frontmatter(await readFile(file, "utf8"));
  const relative = normalizedRelative(vault, file);
  const title = path.basename(relative, path.extname(relative)).normalize("NFC");
  const candidate = {
    version: 1 as const,
    source,
    path: relative,
    title,
    modifiedAt: metadata.mtime.toISOString(),
    ...(optionalString(fm.type) ? { type: optionalString(fm.type) } : {}),
    ...(optionalString(fm.status) ? { status: optionalString(fm.status) } : {}),
    ...(optionalString(fm.started) ? { started: optionalString(fm.started) } : {}),
    ...(optionalString(fm.color) ? { color: optionalString(fm.color) } : {}),
    aliases: aliases(fm.aliases)
  };
  return sourceDocumentSchema.parse(candidate);
}

export interface ObsidianSnapshot {
  selfDocuments: SourceDocument[];
  projectDocuments: SourceDocument[];
}

export async function readObsidian(
  config: LifeConfig,
  timelineSettings: BranchTimelineSettings | null
): Promise<ObsidianSnapshot | null> {
  const source = config.sources.obsidian;
  if (!source) return null;
  const vault = source.vaultPath;
  const selfFiles = new Set<string>();
  for (const root of source.selfRoots) {
    for (const file of await markdownFiles(path.resolve(vault, root))) selfFiles.add(file);
  }
  const selfDocuments = await Promise.all([...selfFiles].map(file => documentRef(vault, file, "obsidian-self")));

  const configuredTypes = source.projectTypes.length
    ? source.projectTypes
    : timelineSettings?.projectTypes?.map(item => item.type) ?? ["project"];
  const typeSet = new Set(configuredTypes.map(type => type.trim().toLowerCase()).filter(Boolean));
  const projectDocuments: SourceDocument[] = [];
  for (const file of await markdownFiles(vault)) {
    const ref = await documentRef(vault, file, "obsidian-project");
    if (ref.type && typeSet.has(ref.type.toLowerCase())) projectDocuments.push(ref);
  }

  selfDocuments.sort((left, right) => left.path.localeCompare(right.path, "zh-CN"));
  projectDocuments.sort((left, right) => left.path.localeCompare(right.path, "zh-CN"));
  return { selfDocuments, projectDocuments };
}
