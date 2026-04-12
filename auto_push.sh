#!/bin/bash
cd /root/my-ai-backup

# 1. 同步【灵魂数据】 (Personal State)
mkdir -p ./diary ./applogs
cp -r /root/.cyberboss/diary/* ./diary/ 2>/dev/null
cp -r /root/.cyberboss/applogs/* ./applogs/ 2>/dev/null
cp /root/.cyberboss/weixin-instructions.md ./persona.md 2>/dev/null

# 2. 同步【面子数据】 (Timeline Site)
mkdir -p ./timeline_site
cp -r /root/.timeline-for-agent/timeline/site/* ./timeline_site/ 2>/dev/null

# 3. 同步【核心配置快照】
cp /srv/cyberboss/data/.env ./cyberboss_env_example 2>/dev/null

# Git 推送
git config user.name "Heptazero AI"
git config user.email "bot@server.local"
git add .
if git diff --cached --quiet; then
    exit 0
fi
git commit -m "Full system state backup: $(date '+%Y-%m-%d %H:%M:%S')"
git branch -M main
git push -u origin main -f
