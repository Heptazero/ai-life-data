#!/bin/bash
cd /root/my-ai-backup

# 同步最新的数据内容到当前目录
cp -r /root/.cyberboss/applogs/* ./applogs/ 2>/dev/null
cp -r /root/.cyberboss/diary/* ./diary/ 2>/dev/null
cp /root/.cyberboss/weixin-instructions.md ./persona.md 2>/dev/null
cp -r /root/.timeline-for-agent/timeline/* ./timeline_data/ 2>/dev/null

# Git 操作
git config user.name "Heptazero AI"
git config user.email "bot@server.local"
git add .

# 如果没有变化就退出
if git diff --cached --quiet; then
    exit 0
fi

git commit -m "Automated Backup: $(date '+%Y-%m-%d %H:%M:%S')"
# 确保分支名为 main 并强制推送到 origin
git branch -M main
git push -u origin main -f
