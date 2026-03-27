# TenacitOS 任务总控台

TenacitOS 是一个面向 [OpenClaw](https://openclaw.ai) 的实时控制台与可视化工作台。项目基于 Next.js、React 19 和 Tailwind CSS v4 构建，直接读取宿主机上的 OpenClaw 配置、工作区、会话、日志与状态数据。

当前版本已经加入一套更完整的 Mii 风格角色系统，可将角色与多个 openclaw Docker 实例进行绑定，并在界面中展示主控实例、协作实例和实时状态。

---

## 功能概览

- 系统监控：查看 CPU、内存、磁盘、网络与服务状态
- Agent 看板：自动发现 OpenClaw agent，展示模型、工作区、活跃状态
- 会话与成本：读取会话历史、消耗与统计信息
- Cron 管理：查看定时任务、时间线、历史记录与手动触发
- 活动流：追踪 agent 的动作与日志事件
- Memory 浏览：浏览、搜索和编辑工作区内记忆文件
- 文件管理：工作区文件树、预览与在线编辑
- 3D 办公室：通过 3D 场景展示 agent 工位
- Mii 角色系统：
  - Mii 风格角色定制
  - 角色能力值与性格标签
  - 主实例与多职责实例绑定
  - openclaw Docker / 实例实时状态联动
  - 实例分配看板

---

## 项目结构

TenacitOS 默认运行在 OpenClaw 工作区内，并直接读取如下目录：

```text
/root/.openclaw/              ← OPENCLAW_DIR（可配置）
├── openclaw.json             ← agents、模型、channel、运行配置
├── workspace/                ← 主工作区
├── workspace-studio/         ← 子实例工作区
├── workspace-infra/
└── workspace/mission-control ← TenacitOS 项目目录
```

应用通过 `OPENCLAW_DIR` 自动定位 `openclaw.json` 与各实例工作区，不需要在 TenacitOS 内手工重复配置 agent。

---

## 环境要求

- Node.js 18 及以上
- npm 10 及以上
- OpenClaw 已安装并运行在同一台主机
- 建议配合 PM2 或 systemd 做生产部署
- 生产环境建议配合 Caddy 或 Nginx 做反向代理

---

## 安装步骤

### 1. 克隆项目

```bash
cd /root/.openclaw/workspace
git clone https://github.com/carlosazaustre/tenacitOS.git mission-control
cd mission-control
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# 登录密码
ADMIN_PASSWORD=your-secure-password

# Cookie 签名密钥
AUTH_SECRET=your-random-secret

# OpenClaw 根目录，默认是 /root/.openclaw
# OPENCLAW_DIR=/root/.openclaw

# 品牌配置
NEXT_PUBLIC_AGENT_NAME=Mission Control
NEXT_PUBLIC_AGENT_EMOJI=🤖
NEXT_PUBLIC_AGENT_DESCRIPTION=Your AI co-pilot, powered by OpenClaw
NEXT_PUBLIC_OWNER_USERNAME=your-username
NEXT_PUBLIC_OWNER_EMAIL=you@example.com
NEXT_PUBLIC_APP_TITLE=Mission Control
```

### 4. 初始化示例数据

```bash
cp data/cron-jobs.example.json data/cron-jobs.json
cp data/activities.example.json data/activities.json
cp data/notifications.example.json data/notifications.json
cp data/configured-skills.example.json data/configured-skills.json
cp data/tasks.example.json data/tasks.json
```

如果你准备使用 Mii 角色系统，也可以让应用在首次保存角色时自动生成：

```text
data/mii-characters.json
```

### 5. 启动开发环境

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:3000
```

---

## Mii 角色系统说明

`/mii` 页面用于管理角色与实例绑定。当前实现支持：

- 自定义脸型、发型、眼睛、服装、配件与能力值
- 为角色绑定一个主控实例
- 为同一角色追加多个协作实例
- 为每个协作实例指定职责，例如开发、测试、部署、监控、研究、支援
- 从 `openclaw.json` 自动发现实例
- 从控制平面实时读取实例状态
- 在角色大厅和实例看板中同步显示绑定关系

### 数据模型

角色数据保存在：

```text
data/mii-characters.json
```

新模型支持：

- `primaryInstanceId`：主控实例 ID
- `instanceBindings[]`：多实例职责绑定
- `dockerInstanceId`：旧字段，保留兼容

旧版只有 `dockerInstanceId` 的数据会在读取时自动兼容迁移。

---

## openclaw Docker / 多实例适配

接口 `/api/mii/docker-instances` 会读取 `openclaw.json` 中的 agent 列表，并为前端补充：

- 实例名称
- 运行状态
- 模型信息
- 工作区路径
- 容器名 / compose service / image（若配置中存在）
- 已分配的角色名称与职责

如果本机存在 openclaw 控制平面，前端会通过 REST 轮询与 WebSocket 消息同步实例运行状态。

---

## 常用命令

```bash
# 开发
npm run dev

# 生产构建
npm run build

# 生产启动
npm start

# 代码检查
npm run lint
```

---

## 生产部署

### 使用 PM2

```bash
npm run build
pm2 start npm --name "mission-control" -- start
pm2 save
pm2 startup
```

### 使用 systemd

创建 `/etc/systemd/system/mission-control.service`：

```ini
[Unit]
Description=TenacitOS Mission Control
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/.openclaw/workspace/mission-control
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

然后执行：

```bash
sudo systemctl daemon-reload
sudo systemctl enable mission-control
sudo systemctl start mission-control
```

---

## 反向代理示例

### Caddy

```caddy
mission-control.yourdomain.com {
    reverse_proxy localhost:3000
}
```

---

## 开发说明

- `src/app/api/mii/route.ts`：Mii 角色 CRUD
- `src/app/api/mii/docker-instances/route.ts`：读取 openclaw 实例并映射为角色绑定数据
- `src/components/mii/MiiEditor.tsx`：Mii 风格角色编辑器
- `src/components/mii/MiiHall.tsx`：角色大厅与实例分配看板
- `src/hooks/useDockerInstances.ts`：前端轮询与 WebSocket 状态同步
- `src/lib/mii-utils.ts`：角色归一化、兼容迁移与主实例绑定辅助逻辑

---

## 注意事项

- 当前仓库本身已经存在若干历史 lint 问题，与本次 Mii 改造无直接关系
- 若 `npm install` 网络不稳定，可能导致 `next build` 或 `npm run lint` 在依赖未完整落盘前失败
- 若你的 OpenClaw 安装路径不是 `/root/.openclaw`，请务必设置 `OPENCLAW_DIR`

---

## 许可证

本项目使用仓库内的 `LICENSE` 许可证文件。
