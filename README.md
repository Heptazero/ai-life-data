# 🤖 Heptazero AI 终极恢复手册

本仓库 (`ai-life-data`) 是您 AI 系统的**完整灵魂备份**。它不仅包含你的日记和习惯，还包含了恢复整个系统所需的全部配置。

---

## 🔥 灾难恢复指南 (如何在新服务器完全复原)

如果你的服务器挂了，请在新服务器上按以下顺序操作：

### 1. 找回灵魂 (克隆本仓库)
```bash
git clone git@github.com:Heptazero/ai-life-data.git /root/my-ai-data
```

### 2. 重塑肉体 (部署程序)
你需要克隆核心程序仓库。虽然本备份包含数据，但程序逻辑在主仓库：
```bash
# 克隆核心桥接程序
git clone https://github.com/WenXiaoWendy/cyberboss.git /srv/cyberboss/app
# 克隆时间线显示程序
git clone https://github.com/WenXiaoWendy/timeline-for-agent.git /srv/timeline-for-agent/app
```

### 3. 数据回填 (核心步骤)
将你克隆下来的备份数据，软链接回系统预期的位置：
```bash
mkdir -p /root/.cyberboss
ln -s /root/my-ai-data/diary /root/.cyberboss/diary
ln -s /root/my-ai-data/applogs /root/.cyberboss/applogs
cp /root/my-ai-data/persona.md /root/.cyberboss/weixin-instructions.md

# 恢复时间线网页数据
mkdir -p /root/.timeline-for-agent/timeline/site
cp -r /root/my-ai-data/timeline_site/* /root/.timeline-for-agent/timeline/site/
```

### 4. 恢复配置与启动
```bash
# 恢复环境变量
cp /root/my-ai-data/cyberboss_env_example /srv/cyberboss/data/.env

# 启动容器化 Webhook
cd /srv/cyberboss/app && docker compose up -d

# 启动微信桥接 (需要扫码)
npm run login
systemctl restart cyberboss-shared
```

---

## 📅 日记系统说明
*   **归档周期**：已升级为**月度归档**。
*   **文件路径**：`diary/YYYY-MM.md`。
*   **特性**：每天第一条日记会自动生成 `# YYYY-MM-DD` 标题，方便 AI 跨天检索和分析。

---

## ⚙️ 自动化机制
*   **同步频率**：系统每 15 分钟会自动将最新日记、App 流水和时间线数据推送到本仓库。
*   **去重逻辑**：微信端已开启消息去重锁，避免重复回复。
*   **YOLO 模式**：Gemini 已开启全自动终端执行权限，可以直接在微信里让它帮你干活。

---
*保持备份，你的 AI 记忆永不消逝。*
