# ai-life-data

本地、文件优先的个人上下文中枢。它把 Branch Timeline 与 Obsidian 元数据转换成稳定的 JSON/JSONL，供 Codex 或其他能读文件的模型随时接手。

它不是聊天服务，也不要求常驻服务器。来源文件保持原样，`life sync` 只写可重新生成的镜像和摘要。

## 数据流

```text
Branch Timeline state.json ─┐
                            ├─ life sync ─ sources/*.jsonl ─ derived/current-state.json
Obsidian Markdown 元数据 ───┘
```

- `sources/branch-timeline/YYYY-MM-DD.jsonl`：统一事件。
- `sources/obsidian/self-index.jsonl`：self 文件索引，不复制正文。
- `sources/obsidian/project-index.jsonl`：项目文件索引，不复制正文。
- `derived/current-state.json`：当前活动、今日待办、最近事实、活跃项目、节律与下一个固定时间。
- `derived/current-context.md`：新模型或新对话的首读入口。
- `schemas/`：与具体模型无关的数据契约。

`sources/` 与 `derived/` 是本机派生产物，默认不提交 Git；换模型不受影响，只要模型能读取这个目录即可。

## 本地使用

需要 Node.js 22 或更高版本。

```bash
npm install
cp life.config.example.json life.config.local.json
```

在 `life.config.local.json` 填写本机 Vault 路径。该文件已被 Git 忽略。

```bash
npm run life -- doctor
npm run life -- sync
npm run life -- status
npm run life -- context
npm run life -- brief
```

任何模型接手时，优先读取：

1. `derived/current-context.md`
2. `derived/current-state.json`
3. 当前任务涉及的 `sources/` 记录
4. 索引指向的原始 Obsidian 文件

不要把某个聊天线程当作唯一记忆。可持久化事实应落到来源文件，派生文件随时可以重建。

## 设计边界

- Branch Timeline 和 Obsidian 适配器只读。
- 不保存 Token、Cookie、微信会话数据库或完整聊天日志。
- `occurredAt` 使用无偏移本地时间，时区单独记录，避免凌晨 2 点逻辑日被误解。
- 旧版 Cyberboss/微信恢复说明保存在 [docs/legacy-recovery.md](docs/legacy-recovery.md)，不再是当前默认架构。

详见 [数据契约](docs/data-contract.md)。
