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

1. 点击“创建导出任务”，调用 `POST /api/export/task/create`。
2. 后端立即返回任务信息，后台线程分页写 Excel。
3. 后端生成文件后上传 OSS；本地开发模式写入 `./data/export-files`。
4. 前端通过 SSE 接收任务完成通知，同时每 3 秒轮询兜底。
5. 任务状态为完成时展示 `fileUrl` 下载。

