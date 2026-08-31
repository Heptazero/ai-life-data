# 旧版 Cyberboss / 微信系统恢复说明

以下内容来自仓库原 README，仅用于恢复旧系统。它依赖服务器、Cyberboss、timeline-for-agent 与微信桥接，不是当前 `life` CLI 的运行条件。

## 旧版恢复流程

```bash
git clone git@github.com:Heptazero/ai-life-data.git /root/my-ai-data
git clone https://github.com/WenXiaoWendy/cyberboss.git /srv/cyberboss/app
git clone https://github.com/WenXiaoWendy/timeline-for-agent.git /srv/timeline-for-agent/app
mkdir -p /root/.cyberboss
ln -s /root/my-ai-data/diary /root/.cyberboss/diary
ln -s /root/my-ai-data/applogs /root/.cyberboss/applogs
cp /root/my-ai-data/persona.md /root/.cyberboss/weixin-instructions.md
mkdir -p /root/.timeline-for-agent/timeline/site
cp -r /root/my-ai-data/timeline_site/* /root/.timeline-for-agent/timeline/site/
cp /root/my-ai-data/cyberboss_env_example /srv/cyberboss/data/.env
cd /srv/cyberboss/app
docker compose up -d
npm run login
systemctl restart cyberboss-shared
```

旧系统按月归档 `diary/YYYY-MM.md` 和 `applogs/YYYY-MM.md`，曾通过定时同步推送到本仓库。仓库中的 `cyberboss_env_example` 只能作为字段示例，真实密钥不得提交。
