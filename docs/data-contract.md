# 数据契约

## 目录所有权

- `applogs/`、`diary/`、`persona.md`：旧系统留下的用户数据，不由新 CLI 重写。
- `sources/`：适配器生成的标准化镜像，可删除后重建。
- `derived/`：面向模型的摘要，可删除后重建。
- `life.config.local.json`：本机路径，不提交。

## 统一事件

一行一个 JSON 对象，正式约束见 `schemas/life-event.schema.json`。

```json
{
  "version": 1,
  "id": "branch-timeline:2026-08-31:item-1",
  "source": "branch-timeline",
  "kind": "timeline.fact.completed",
  "state": "completed",
  "occurredAt": "2026-08-31T09:00:00",
  "endedAt": "2026-08-31T10:30:00",
  "timezone": "Asia/Shanghai",
  "title": "阅读论文",
  "refs": { "projectPath": "21_project/example.md" },
  "attributes": { "logicalDate": "2026-08-31", "durationMinutes": 90 },
  "provenance": {
    "sourceFile": "branch-timeline/state.json",
    "sourceRecordId": "item-1",
    "confidence": "explicit"
  }
}
```

关键语义：

- `id`：由来源、逻辑日和来源记录 ID 组成；重复同步不会产生新事件。
- `state`：`planned`、`running`、`completed`、`observed`。
- `occurredAt`：本地墙上时间，不带 UTC 偏移。
- `timezone`：解释本地时间的 IANA 时区。
- `attributes.logicalDate`：Branch Timeline 的逻辑日；凌晨 2 点前仍可属于前一天。
- `provenance`：始终能追溯到原始记录，不把模型推断冒充事实。

## Obsidian 索引

索引只保存路径、标题、mtime 与 frontmatter 中少量结构字段。正文仍在 Vault 中，模型需要时再读取，避免生成第二份容易过期的个人资料。

## 当前状态

`derived/current-state.json` 是快速入口，正式约束见 `schemas/current-state.schema.json`。它不是历史真相，只是某次 `life sync` 的可重建快照。
