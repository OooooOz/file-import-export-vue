# Vue3 大文件 Excel 异步导出示例

## 启动

```powershell
npm install
npm run dev
```

默认后端地址为 `http://localhost:8091`。如需修改：

```powershell
$env:VITE_API_BASE_URL='http://localhost:8091'
npm run dev
```

## 流程

1. 页面采用 Element Plus 侧边菜单布局。
2. “业务功能导出”菜单负责创建导出任务，调用 `POST /api/export/task/create`。
3. “任务列表”菜单负责分页查询任务，调用 `GET /api/export/task/page`，并每 3 秒轮询兜底刷新。
4. 根组件全局订阅 `GET /api/export/task/subscribe`，切换菜单后仍可收到导出成功通知。
5. 任务状态为完成时展示 `fileUrl` 下载。

