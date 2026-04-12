# 🤖 Heptazero AI 灵魂同步项目手册

本项目是一个高度定制化的个人 AI 助手系统，集成了微信桥接、ADHD 陪伴人设、App 使用自动化报备、以及基于 GitHub 的全自动数据备份系统。

## 🏗️ 系统架构（数据与代码分离）

为了保证系统的现代性与安全性，我们采用了“骨肉分离”的设计：
*   **肉体（程序）**：存放在 `/srv/` 目录下（如 `cyberboss` 和 `timeline-for-agent`），部分已容器化（Docker）。
*   **灵魂（数据）**：存放在 `/root/.cyberboss` 和本 GitHub 仓库中。
*   **同步机制**：宿主机运行着一个每 15 分钟执行一次的 `systemd timer`，确保本地数据与云端同步。

---

## 🎮 用户交互指令（微信端）

你可以直接在微信聊天框中对 AI 发送以下指令：

### 1. 核心调度
*   `/ai <模型名>`：快速切换 AI 引擎。
    *   例如：`/ai gemini-3-flash-preview` (最强逻辑版)
    *   例如：`/ai gemini-2.5-flash-lite` (极速省钱版)
    *   例如：`/ai gpt-5.4` (切换回 Codex 引擎)
*   `/status`：查看当前 AI 的状态、绑定的项目路径以及上下文消耗。

### 2. 任务与提醒
*   `/app`：统计并显示今日开启 App 的流水记录。
*   `帮我定一个提醒，内容是...`：在 Gemini 模式下，它会通过 YOLO 模式自动执行终端命令。

### 3. 项目管理
*   `/new`：开启一个新的对话线程（清空临时记忆）。
*   `/reread`：强制 AI 重新读取你的最新人设文件 (`persona.md`)。

---

## 🧠 AI 运行逻辑（黑科技说明）

### 1. 跨模型记忆共享
当你从 GPT 切换到 Gemini 时，系统会自动抓取最近 10 轮的对话历史，作为“背景摘要”塞给新模型。这意味着你换了大脑，但它依然记得你上一秒说了什么。

### 2. YOLO 自动执行模式
微信里的 Gemini 已经开启了 **-y (YOLO)** 权限。它不仅仅能聊天，当你下达“读文件”或“改配置”的指令时，它会在服务器后台悄悄帮你敲键盘（运行 Shell 命令）。

### 3. ADHD 陪伴人设
AI 的灵魂由 `/persona.md` 定义。它被设定为一个懂你、不废话、能接住你情绪起伏、并在关键时刻催你动起来的陪伴者。

---

## 🔧 运维与复原手册

### 1. 如何查看系统运行状态
*   **查看 AI 实时日志**：`journalctl -u cyberboss-shared.service -f`
*   **查看 Webhook (Docker) 日志**：`docker logs -f cyberboss-webhook-v2`
*   **查看 GitHub 同步状态**：`systemctl status ai-data-sync.timer`

### 2. 如果服务器挂了，如何在新电脑完全复原？
由于你的数据都在本 GitHub 仓库，复原只需三步：

1.  **找回灵魂**：在新服务器执行 `git clone git@github.com:Heptazero/ai-life-data.git`。
2.  **重塑肉体**：
    *   安装 Docker。
    *   将备份文件夹里的数据重新挂载回新服务器的 `/root/.cyberboss`。
    *   执行 `docker compose up -d` 启动服务。
3.  **重新关联**：执行 `node /srv/cyberboss/app/bin/cyberboss.js login` 重新扫码登录微信。

---

## 📂 仓库文件说明
*   `/diary/`：你每一天的个人日记。
*   `/applogs/`：iOS 快捷指令发回来的 App 使用流水。
*   `/persona.md`：你赋予 AI 的人格定义。
*   `/timeline_data/`：可视化时间轴的底层 JSON 数据。

---
*本项目由 Heptazero 与 Gemini CLI 共同构建于 2026 年 4 月。*
