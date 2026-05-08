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

    <el-form :model="query" inline class="query-form"><el-form-item label="创建人">
        <el-input v-model="query.creator" placeholder="请输入创建人" clearable class="query-input" />
      </el-form-item>
      <el-form-item label="业务系统">
        <el-select v-model="query.businessSystem" placeholder="全部" clearable class="query-input">
          <el-option v-for="item in businessSystemOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="业务类型">
        <el-select v-model="query.businessType" placeholder="全部" clearable class="query-input">
          <el-option v-for="item in businessTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable class="query-input">
          <el-option label="初始" :value="0" />
          <el-option label="进行中" :value="1" />
          <el-option label="完成" :value="2" />
          <el-option label="失败" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="searchTasks">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tasks" border stripe row-key="id" class="task-table" @sort-change="handleSortChange">
      <el-table-column prop="taskNo" label="任务编号" min-width="150" sortable="custom">
        <template #default="{ row }">{{ row.taskNo || row.id || '-' }}</template>
      </el-table-column>
      <el-table-column prop="taskName" label="任务名称" min-width="180" sortable="custom">
        <template #default="{ row }">{{ row.taskName || row.fileName || '-' }}</template>
      </el-table-column>
      <el-table-column prop="businessSystem" label="业务系统" min-width="140" sortable="custom">
        <template #default="{ row }">{{ row.businessSystem || '-' }}</template>
      </el-table-column>
      <el-table-column prop="businessType" label="业务类型" min-width="140" sortable="custom">
        <template #default="{ row }">{{ row.businessType || '-' }}</template>
      </el-table-column>
      <el-table-column prop="creator" label="创建人" min-width="110">
        <template #default="{ row }">{{ row.creator || '-' }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center" sortable="custom">
        <template #default="{ row }">
          <TaskStatusTag :status="row.status" />
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="开始时间" min-width="170" sortable="custom">
        <template #default="{ row }">{{ formatDateTime(row.startTime) }}</template>
      </el-table-column>
      <el-table-column prop="endTime" label="结束时间" min-width="170" sortable="custom">
        <template #default="{ row }">{{ formatDateTime(row.endTime) }}</template>
      </el-table-column>
      <el-table-column prop="message" label="结果" min-width="220">
        <template #default="{ row }">
          <span v-if="Number(row.status) === 3" class="error-text">{{ row.message || '导出失败' }}</span>
          <span v-else-if="Number(row.status) === 2" class="success-text">{{ row.message || '导出完成' }}</span>
          <span v-else>{{ row.message || '等待处理' }}</span>
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { listBusinessConfigOptions } from '../api/businessConfig'
import { pageExportTask } from '../api/exportTask'
import { useExportTaskState } from '../composables/useExportTaskState'
import TaskStatusTag from '../components/TaskStatusTag.vue'
import { BUSINESS_CONFIG_TYPE, buildBusinessSystemOptions, buildBusinessTypeOptions } from '../utils/businessConfigOptions'

const { latestTask } = useExportTaskState()
const loading = ref(false)
const tasks = ref([])
const businessConfigs = ref([])
const query = reactive({
  creator: '',
  businessSystem: '',
  businessType: '',
  status: ''
})
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})
const sorting = reactive({
  sort: 'id',
  order: 'desc'
})
const businessSystemOptions = computed(() => buildBusinessSystemOptions(businessConfigs.value))
const businessTypeOptions = computed(() => buildBusinessTypeOptions(businessConfigs.value, query.businessSystem))

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

function formatDateTime(value) {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  const pad = num => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function buildParams() {
  return {
    creator: query.creator || undefined,
    businessSystem: query.businessSystem || undefined,
    businessType: query.businessType || undefined,
    status: query.status === '' ? undefined : query.status,
    page: pagination.current,
    size: pagination.size,
    sort: sorting.sort || undefined,
    order: sorting.order || undefined
  }
}

async function loadBusinessConfigs() {
  try {
    businessConfigs.value = await listBusinessConfigOptions({ configType: BUSINESS_CONFIG_TYPE.EXPORT })
  } catch (error) {
    businessConfigs.value = []
    ElMessage.error(error?.message || '业务配置选项加载失败')
  }
}

async function loadTasks() {
  loading.value = true
  try {
    const page = normalizePage(await pageExportTask(buildParams()))
    tasks.value = page.records
    pagination.total = page.total
    pagination.current = page.current
    pagination.size = page.size
  } catch (error) {
    ElMessage.error(error?.message || '任务列表加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

function handleSortChange({ prop, order }) {
  if (!order) {
    sorting.sort = 'id'
    sorting.order = 'desc'
  } else {
    sorting.sort = prop
    sorting.order = order === 'ascending' ? 'asc' : 'desc'
  }
  pagination.current = 1
  loadTasks()
}

function searchTasks() {
  pagination.current = 1
  loadTasks()
}

function resetQuery() {
  query.creator = ''
  query.businessSystem = ''
  query.businessType = ''
  query.status = ''
  sorting.sort = 'id'
  sorting.order = 'desc'
  searchTasks()
}

watch(latestTask, task => {
  if (!task) return
  loadTasks()
})

watch(
  () => query.businessSystem,
  () => {
    if (!businessTypeOptions.value.some(item => item.value === query.businessType)) {
      query.businessType = ''
    }
  }
)

onMounted(() => {
  loadBusinessConfigs()
  loadTasks()
})
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

