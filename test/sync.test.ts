import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { loadConfig } from "../src/config.js";
import type { CurrentState } from "../src/domain/current-state.js";
import { syncLifeData } from "../src/services/sync.js";

test("同步生成事件、Obsidian 索引和当前状态", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ai-life-sync-"));
  const vault = path.join(root, "vault");
  const selfDir = path.join(vault, "20_self");
  const projectDir = path.join(vault, "21_project");
  const timelineDir = path.join(vault, "99_assets", "branch-timeline");
  const pluginDir = path.join(vault, ".obsidian", "plugins", "branch-timeline-hz");
  await Promise.all([
    mkdir(selfDir, { recursive: true }),
    mkdir(projectDir, { recursive: true }),
    mkdir(timelineDir, { recursive: true }),
    mkdir(pluginDir, { recursive: true })
  ]);

  await writeFile(path.join(selfDir, "偏好.md"), "---\ntype: profile\naliases: [我]\n---\n正文不进入索引。\n", "utf8");
  await writeFile(path.join(projectDir, "实验.md"), "---\ntype: project\nstatus: active\ncolor: '#6b5cff'\n---\n项目正文。\n", "utf8");
  await writeFile(path.join(pluginDir, "data.json"), JSON.stringify({
    projectTypes: [{ type: "project", color: "#6b5cff" }]
  }), "utf8");
  await writeFile(path.join(timelineDir, "state.json"), JSON.stringify({
    version: 1,
    days: {
      "2026-08-31": {
        sleepPrep: 1380,
        sleep: 1440,
        energyPhases: [
          { id: "morning", name: "输入", at: 0, color: "#69a7ff", side: -1 },
          { id: "afternoon", name: "输出", at: 720, color: "#8b6cff", side: 1 }
        ],
        items: [
          { id: "running-1", title: "实现适配器", kind: "fact", startMin: 720, factTiming: true, projectPath: "21_project/实验.md" },
          { id: "todo-1", title: "写测试", kind: "todo", plannedMin: 900 }
        ]
      }
    }
  }), "utf8");

  const configFile = path.join(root, "life.config.json");
  await writeFile(configFile, JSON.stringify({
    version: 1,
    timezone: "Asia/Shanghai",
    dayBoundaryHour: 2,
    dataDir: "./output",
    sources: {
      branchTimeline: {
        stateFile: path.join(timelineDir, "state.json"),
        settingsFile: path.join(pluginDir, "data.json")
      },
      obsidian: {
        vaultPath: vault,
        selfRoots: ["20_self"],
        projectTypes: []
      }
    }
  }), "utf8");

  const config = await loadConfig(configFile);
  const result = await syncLifeData(config, new Date("2026-08-31T05:00:00.000Z"));
  assert.equal(result.branchTimelineEvents, 2);
  assert.equal(result.selfDocuments, 1);
  assert.equal(result.projectDocuments, 1);

  const state = JSON.parse(await readFile(result.currentStateFile, "utf8")) as CurrentState;
  assert.equal(state.logicalDate, "2026-08-31");
  assert.equal(state.currentActivities[0]?.title, "实现适配器");
  assert.equal(state.plannedTodos[0]?.title, "写测试");
  assert.equal(state.activeProjects[0]?.path, "21_project/实验.md");
  assert.equal(state.currentEnergyPhase?.name, "输出");
  assert.equal(state.nextRhythm?.key, "sleepPrep");

  const eventFile = path.join(root, "output", "sources", "branch-timeline", "2026-08-31.jsonl");
  const eventLines = (await readFile(eventFile, "utf8")).trim().split("\n");
  assert.equal(eventLines.length, 2);
  const selfIndex = await readFile(path.join(root, "output", "sources", "obsidian", "self-index.jsonl"), "utf8");
  assert.ok(!selfIndex.includes("正文不进入索引"));
  const context = await readFile(result.currentContextFile, "utf8");
  assert.match(context, /# 当前个人状态/);
  assert.match(context, /实现适配器/);
  assert.match(context, /21_project\/实验\.md/);
  assert.ok(!context.includes("正文不进入索引"));
});
