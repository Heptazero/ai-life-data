import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { readBranchTimeline } from "../src/adapters/branch-timeline.js";
import { loadConfig } from "../src/config.js";

test("Branch Timeline 记录转换为稳定事件", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ai-life-branch-"));
  const stateFile = path.join(root, "state.json");
  const configFile = path.join(root, "life.config.json");
  await writeFile(stateFile, JSON.stringify({
    version: 1,
    days: {
      "2026-08-31": {
        items: [
          { id: "todo-1", title: "写实验", kind: "todo", plannedMin: 600, projectPath: "21_project/实验.md" },
          { id: "fact-1", title: "读论文", kind: "fact", startMin: 540, endMin: 630, tag: "探索" }
        ]
      }
    }
  }), "utf8");
  await writeFile(configFile, JSON.stringify({
    version: 1,
    timezone: "Asia/Shanghai",
    dayBoundaryHour: 2,
    dataDir: "./data",
    sources: { branchTimeline: { stateFile } }
  }), "utf8");

  const snapshot = await readBranchTimeline(await loadConfig(configFile));
  assert.ok(snapshot);
  assert.equal(snapshot.events.length, 2);
  assert.equal(snapshot.events[0]?.id, "branch-timeline:2026-08-31:fact-1");
  assert.equal(snapshot.events[0]?.state, "completed");
  assert.equal(snapshot.events[0]?.endedAt, "2026-08-31T10:30:00");
  assert.equal(snapshot.events[0]?.attributes.durationMinutes, 90);
  assert.equal(snapshot.events[1]?.state, "planned");
  assert.equal(snapshot.events[1]?.refs.projectPath, "21_project/实验.md");
});
