import type { CurrentState } from "../domain/current-state.js";
import type { LifeEvent, SourceDocument } from "../domain/event.js";

const RHYTHM_LABELS: Record<NonNullable<CurrentState["nextRhythm"]>["key"], string> = {
  wake: "起床",
  napStart: "午休开始",
  napEnd: "午休结束",
  sleepPrep: "睡眠准备",
  sleep: "入睡"
};

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function inlineCode(value: string): string {
  return `\`${compact(value).replace(/`/g, "ˋ")}\``;
}

function clock(minute: number): string {
  const dayOffset = Math.floor(minute / 1440);
  const normalized = ((minute % 1440) + 1440) % 1440;
  const time = `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
  return dayOffset > 0 ? `次日 ${time}` : time;
}

function eventLine(event: LifeEvent): string {
  const parts = [event.occurredAt.slice(11, 16)];
  if (event.endedAt) parts[0] = `${parts[0]}–${event.endedAt.slice(11, 16)}`;
  const duration = event.attributes.durationMinutes;
  if (typeof duration === "number") parts.push(`${duration} 分钟`);
  const project = event.refs.projectPath;
  if (project) parts.push(`项目 ${inlineCode(project)}`);
  const tag = typeof event.attributes.tag === "string" ? event.attributes.tag : undefined;
  if (tag) parts.push(`#${compact(tag)}`);
  return `- ${compact(event.title ?? event.kind)}（${parts.join("；")}）`;
}

function projectLine(project: SourceDocument): string {
  const details = [project.status, project.type].filter((value): value is string => Boolean(value));
  return `- ${compact(project.title)}${details.length ? `（${details.map(compact).join("；")}）` : ""}：${inlineCode(project.path)}`;
}

function section(title: string, lines: string[]): string {
  return [`## ${title}`, "", ...(lines.length ? lines : ["- 无"]), ""].join("\n");
}

export function renderContextBrief(state: CurrentState): string {
  const rhythm = state.nextRhythm
    ? `${RHYTHM_LABELS[state.nextRhythm.key]} ${clock(state.nextRhythm.minute)}`
    : "无";
  const phase = state.currentEnergyPhase?.name ?? "未记录";
  const lines = [
    "# 当前个人状态",
    "",
    `> ${state.generatedAt} 生成。它是可重建快照，不是长期记忆。`,
    "",
    "## 此刻",
    "",
    `- 逻辑日期：${state.logicalDate}`,
    `- 当前时间：${clock(state.currentMinute)}`,
    `- 当前节律：${compact(phase)}`,
    `- 下一时间锚点：${rhythm}`,
    "",
    section("正在进行", state.currentActivities.map(eventLine)),
    section("今日计划", state.plannedTodos.map(eventLine)),
    section("最近事实", state.recentFacts.slice(0, 8).map(eventLine)),
    section("活跃项目", state.activeProjects.map(projectLine)),
    "## 继续读取",
    "",
    `- 结构化状态：${inlineCode("derived/current-state.json")}`,
    `- self 索引：${inlineCode("sources/obsidian/self-index.jsonl")}`,
    `- 项目索引：${inlineCode("sources/obsidian/project-index.jsonl")}`,
    `- 当日事件：${inlineCode(`sources/branch-timeline/${state.logicalDate}.jsonl`)}`,
    "- 需要正文时，根据索引路径读取原始 Obsidian 文件。不要把缺失信息补写成事实。",
    ""
  ];
  return lines.join("\n");
}
