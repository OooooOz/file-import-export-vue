# Vue3 大文件 Excel 异步导出示例

## 启动

```powershell
npm install
npm run dev
```

开发模式默认通过 Vite 代理将 `/api` 转发到 `http://10.39.11.156:8091`。

如需修改代理目标：

```powershell
$env:VITE_PROXY_TARGET='http://10.39.11.156:8091'
npm run dev
```

如果前端与后端不是同域部署，也可以直接指定后端地址：

```powershell
$env:VITE_API_BASE_URL='http://10.39.11.156:8091'
npm run dev
```

## 流程

1. 页面采用 Element Plus 侧边菜单布局。
2. “业务功能导出”菜单负责创建导出任务，调用 `POST /api/export/task/create`。
3. “任务列表”菜单负责分页查询任务，调用 `GET /api/export/task/page`，使用后端支持的 `page`/`size`/`sort`/`order` 参数，并每 3 秒轮询兜底刷新。
4. 根组件全局订阅 `GET /api/export/task/subscribe`，切换菜单后仍可收到导出成功通知。
5. 任务状态为完成时展示 `fileUrl` 下载。

