<template>
  <el-card shadow="never" class="content-card">
    <template #header>
      <div class="card-header">
        <div>
          <strong>任务列表</strong>
          <p>查看导出任务状态；任务完成后可在此下载文件。</p>
        </div>
        <el-button :loading="loading" @click="loadTasks">刷新</el-button>
      </div>
    </template>

    <el-form :model="query" inline class="query-form">
      <el-form-item label="订阅人">
        <el-input v-model="creator" placeholder="创建人" clearable class="query-input" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable class="query-input">
          <el-option label="初始" :value="0" />
          <el-option label="进行中" :value="1" />
          <el-option label="完成" :value="2" />
          <el-option label="失败" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input v-model="query.keyword" placeholder="任务名/编号" clearable class="query-input" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="searchTasks">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tasks" border stripe row-key="id" class="task-table">
      <el-table-column prop="taskNo" label="任务编号" min-width="150">
        <template #default="{ row }">{{ row.taskNo || row.id || '-' }}</template>
      </el-table-column>
      <el-table-column prop="taskName" label="任务名称" min-width="180">
        <template #default="{ row }">{{ row.taskName || row.fileName || '-' }}</template>
      </el-table-column>
      <el-table-column prop="creator" label="创建人" min-width="110">
        <template #default="{ row }">{{ row.creator || '-' }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <TaskStatusTag :status="row.status" />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="170">
        <template #default="{ row }">{{ row.createTime || row.createdAt || '-' }}</template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新时间" min-width="170">
        <template #default="{ row }">{{ row.updateTime || row.updatedAt || '-' }}</template>
      </el-table-column>
      <el-table-column prop="errorMsg" label="结果" min-width="180">
        <template #default="{ row }">
          <span v-if="Number(row.status) === 3" class="error-text">{{ row.errorMsg || row.failReason || '导出失败' }}</span>
          <span v-else-if="Number(row.status) === 2" class="success-text">导出完成</span>
          <span v-else>等待处理</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right" align="center">
        <template #default="{ row }">
          <el-link v-if="Number(row.status) === 2 && row.fileUrl" type="primary" :href="row.fileUrl" target="_blank">
            下载
          </el-link>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadTasks"
        @current-change="loadTasks"
      />
    </div>
  </el-card>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { pageExportTask } from '../api/exportTask'
import { useExportTaskState } from '../composables/useExportTaskState'
import TaskStatusTag from '../components/TaskStatusTag.vue'

const { creator, latestTask } = useExportTaskState()
const loading = ref(false)
const tasks = ref([])
const query = reactive({
  status: '',
  keyword: ''
})
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})
let pollTimer = null

function normalizePage(data) {
  if (Array.isArray(data)) {
    return { records: data, total: data.length, current: pagination.current, size: pagination.size }
  }

  const records = data?.records || data?.list || data?.content || data?.items || []
  return {
    records,
    total: Number(data?.total ?? data?.totalElements ?? records.length),
    current: Number(data?.current ?? data?.pageNum ?? data?.pageNo ?? pagination.current),
    size: Number(data?.size ?? data?.pageSize ?? pagination.size)
  }
}

function buildParams() {
  return {
    creator: creator.value,
    status: query.status === '' ? undefined : query.status,
    keyword: query.keyword || undefined,
    current: pagination.current,
    pageNum: pagination.current,
    pageNo: pagination.current,
    size: pagination.size,
    pageSize: pagination.size
  }
}

async function loadTasks() {
  loading.value = true
  try {
    const page = normalizePage(await pageExportTask(buildParams()))
    tasks.value = page.records
    pagination.total = page.total
  } catch (error) {
    ElMessage.error('任务列表加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

function searchTasks() {
  pagination.current = 1
  loadTasks()
}

function resetQuery() {
  query.status = ''
  query.keyword = ''
  searchTasks()
}

function startPolling() {
  stopPolling()
  pollTimer = window.setInterval(loadTasks, 3000)
}

function stopPolling() {
  if (pollTimer) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
}

watch(latestTask, task => {
  if (!task || (creator.value && task.creator && task.creator !== creator.value)) return
  loadTasks()
})

watch(creator, () => {
  searchTasks()
})

onMounted(() => {
  loadTasks()
  startPolling()
})

onUnmounted(stopPolling)
</script>

<style scoped>
.content-card {
  border-radius: 10px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.card-header p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.query-form {
  margin-bottom: 12px;
}

.query-input {
  width: 180px;
}

.task-table {
  width: 100%;
}

.success-text {
  color: #16a34a;
}

.error-text {
  color: #dc2626;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>

