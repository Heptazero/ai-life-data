#!/bin/bash
# 确保在正确的目录
cd /root/my-ai-backup

# 如果还没初始化 Git，就初始化
if [ ! -d .git ]; then
    git init
    git checkout -b main
    # 这里的地址你需要替换成你真实的私有仓库地址
    # git remote add origin git@github.com:Heptazero/ai-life-data.git
fi

# 配置 Git 用户名
git config user.name "AI Backup Bot"
git config user.email "backup@server.local"

# 添加所有变更
git add .

# 如果没有变化就退出
if git diff --cached --quiet; then
    exit 0
fi

# 提交
git commit -m "Automated Backup: $(date '+%Y-%m-%d %H:%M:%S')"

# 推送（静默模式）
git push -u origin main -f
