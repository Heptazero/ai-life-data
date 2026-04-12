#!/bin/bash
cd /root/my-ai-backup

# 检查是否是 git 仓库，如果不是则初始化（需要你后续手动关联 remote）
if [ ! -d .git ]; then
    git init
    git checkout -b main
fi

# 添加所有变化
git add -L .
# 提交，备注带上当前时间
git commit -m "Auto backup: $(date '+%Y-%m-%d %H:%M:%S')"

# 推送到 GitHub (假设你已经配置好了 remote origin)
# git push origin main
