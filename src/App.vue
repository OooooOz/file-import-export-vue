<template>
  <main class="page">
    <h2>大文件 Excel 异步导出</h2>

    <section class="card">
      <label>操作人 creator：<input v-model="creator" /></label>
      <label>导出总行数：<input v-model.number="total" type="number" min="0" /></label>
      <button :disabled="loading" @click="submitTask">{{ loading ? '提交中...' : '创建导出任务' }}</button>
    </section>

    <section class="card" v-if="task">
      <h3>当前任务</h3>
      <p>任务ID：{{ task.id }}</p>
      <p>任务编号：{{ task.taskNo }}</p>
      <p>状态：{{ statusText(task.status) }}</p>
      <p>消息：{{ task.message }}</p>
      <p v-if="task.fileUrl">
        下载地址：<a :href="task.fileUrl" target="_blank" rel="noopener">下载 Excel</a>
      </p>
    </section>

    <section class="card">
      <h3>最近任务</h3>
      <button @click="loadTasks">刷新列表</button>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>任务名</th>
            <th>状态</th>
            <th>消息</th>
            <th>下载</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in tasks" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.taskName || item.fileName }}</td>
            <td>{{ statusText(item.status) }}</td>
            <td>{{ item.message }}</td>
            <td><a v-if="item.fileUrl" :href="item.fileUrl" target="_blank" rel="noopener">下载</a></td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { createExportTask, getExportTask, pageExportTask, subscribeExportTask } from './api/exportTask'

const creator = ref('demoUser')
const total = ref(10000)
const loading = ref(false)
const task = ref(null)
const tasks = ref([])
let eventSource = null
let pollTimer = null

function statusText(status) {
  return ({ 0: '初始', 1: '进行中', 2: '完成', 3: '失败' })[status] || '未知'
}

async function submitTask() {
  loading.value = true
  try {
    task.value = await createExportTask({
      businessSystem: 'demo-system',
      businessType: 'sample_user',
      taskName: '用户导出任务',
      fileName: `用户导出-${Date.now()}.xlsx`,
      creator: creator.value,
      extMap: { total: total.value }
    })
    startPolling(task.value.id)
    await loadTasks()
  } finally {
    loading.value = false
  }
}

function startPolling(taskId) {
  clearInterval(pollTimer)
  pollTimer = setInterval(async () => {
    const latest = await getExportTask(taskId)
    task.value = latest
    if (latest && (latest.status === 2 || latest.status === 3)) {
      clearInterval(pollTimer)
      await loadTasks()
    }
  }, 3000)
}

async function loadTasks() {
  const page = await pageExportTask({ creator: creator.value, pageNo: 1, pageSize: 20 })
  tasks.value = page.records || []
}

onMounted(async () => {
  eventSource = subscribeExportTask(creator.value, async latest => {
    if (!task.value || latest.id === task.value.id) {
      task.value = latest
    }
    if (latest.status === 2 || latest.status === 3) {
      clearInterval(pollTimer)
      await loadTasks()
    }
  })
  await loadTasks()
})

onUnmounted(() => {
  if (eventSource) eventSource.close()
  clearInterval(pollTimer)
})
</script>

<style scoped>
.page { max-width: 960px; margin: 32px auto; font-family: Arial, sans-serif; }
.card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 16px 0; }
label { display: inline-flex; gap: 8px; align-items: center; margin-right: 16px; }
input { padding: 6px 8px; }
button { padding: 7px 12px; cursor: pointer; }
table { width: 100%; border-collapse: collapse; margin-top: 12px; }
th, td { border: 1px solid #eee; padding: 8px; text-align: left; }
</style>

