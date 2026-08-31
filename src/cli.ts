#!/usr/bin/env node

import path from "node:path";
import { loadConfig } from "./config.js";
import type { CurrentState } from "./domain/current-state.js";
import { doctor } from "./services/doctor.js";
import { syncLifeData } from "./services/sync.js";
import { readJsonIfExists } from "./utils/files.js";

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function help(): void {
  console.log(`life — 本地个人上下文工具

用法：
  life doctor [--config PATH]  检查数据源路径
  life sync [--config PATH]    读取数据源并刷新标准文件
  life status [--config PATH]  查看当前状态摘要
  life context [--config PATH] 输出当前状态 JSON

配置文件默认读取 life.config.local.json，也可设置 AI_LIFE_CONFIG。`);
}

function summary(state: CurrentState): string {
  const phase = state.currentEnergyPhase?.name ?? "未记录";
  const rhythm = state.nextRhythm
    ? `${state.nextRhythm.key} @ ${String(Math.floor(state.nextRhythm.minute / 60) % 24).padStart(2, "0")}:${String(state.nextRhythm.minute % 60).padStart(2, "0")}`
    : "无";
  return [
    `逻辑日期：${state.logicalDate}`,
    `正在进行：${state.currentActivities.length}`,
    `今日待办：${state.plannedTodos.length}`,
    `最近事实：${state.recentFacts.length}`,
    `活跃项目：${state.activeProjects.length}`,
    `当前节律：${phase}`,
    `下一锚点：${rhythm}`
  ].join("\n");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] ?? "help";
  if (["help", "--help", "-h"].includes(command)) {
    help();
    return;
  }

  const config = await loadConfig(option(args, "--config"));
  if (command === "doctor") {
    const checks = await doctor(config);
    if (!checks.length) console.log("未配置数据源。");
    for (const check of checks) console.log(`${check.ok ? "✓" : "✗"} ${check.name}：${check.path}`);
    if (checks.some(check => !check.ok)) process.exitCode = 1;
    return;
  }
  if (command === "sync") {
    const result = await syncLifeData(config);
    console.log(`已同步 ${result.branchTimelineEvents} 条时间线事件、${result.selfDocuments} 份 self 索引、${result.projectDocuments} 份项目索引。`);
    console.log(`当前状态：${result.currentStateFile}`);
    return;
  }

  const stateFile = path.join(config.resolvedDataDir, "derived", "current-state.json");
  const state = await readJsonIfExists<CurrentState>(stateFile);
  if (!state) throw new Error("还没有当前状态。先运行 life sync。");
  if (command === "status") {
    console.log(summary(state));
    return;
  }
  if (command === "context") {
    console.log(JSON.stringify(state, null, 2));
    return;
  }
  throw new Error(`未知命令：${command}`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
