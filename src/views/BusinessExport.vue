<template>
  <div class="page-grid">
    <el-card shadow="never" class="content-card">
      <template #header>
        <div class="card-header">
          <div>
            <strong>手动DEMO</strong>
            <p>填写导出条件后创建异步导出任务，完成后会在任意菜单页面弹出通知。</p>
          </div>
          <el-button type="primary" :loading="submitting" @click="submitExport">
            创建导出任务
          </el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="108px">
        <el-form-item label="订阅人" required>
          <el-input v-model="creator" placeholder="请输入任务创建人/通知订阅人" clearable />
        </el-form-item>

        <el-form-item label="业务系统" prop="businessSystem">
          <el-select v-model="form.businessSystem" placeholder="请选择业务系统" class="full-width" clearable>
            <el-option v-for="item in businessSystemOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="任务名称" prop="taskName">
          <el-input v-model="form.taskName" placeholder="例如：订单明细导出" clearable />
        </el-form-item>

        <el-form-item label="业务类型" prop="businessType">
          <el-select v-model="form.businessType" placeholder="请选择业务类型" class="full-width" clearable>
            <el-option v-for="item in businessTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="导出条数" prop="total">
          <el-input-number v-model="form.total" :min="1" :max="1000000" :step="1000" class="full-width" />
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker
            v-model="form.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="full-width"
          />
        </el-form-item>

        <el-form-item label="关键词">
          <el-input v-model="form.keyword" placeholder="可选：业务单号、客户名称等" clearable />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="可选：补充导出说明" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="content-card">
      <template #header>
             <strong>最近任务</strong>
      </template>

      <el-empty v-if="!latestTask" description="暂无任务，请先创建导出任务" />
      <el-descriptions v-else :column="1" border>
        <el-descriptions-item label="任务标识">
          {{ latestTask.taskNo || latestTask.id || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="任务名称">
          {{ latestTask.taskName || latestTask.fileName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="任务状态">
          <TaskStatusTag :status="latestTask.status" />
        </el-descriptions-item>
        <el-descriptions-item label="下载地址">
          <el-link v-if="latestTask.fileUrl" type="primary" :href="latestTask.fileUrl" target="_blank">
            下载文件
          </el-link>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="处理结果">
          {{ latestTask.message || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { listBusinessConfigOptions } from '../api/businessConfig'
import { createExportTask } from '../api/exportTask'
import { useExportTaskState } from '../composables/useExportTaskState'
import TaskStatusTag from '../components/TaskStatusTag.vue'
import { BUSINESS_CONFIG_TYPE, buildBusinessSystemOptions, buildBusinessTypeOptions } from '../utils/businessConfigOptions'

const { creator, latestTask, publishExportTask } = useExportTaskState()
const formRef = ref(null)
const submitting = ref(false)
const businessConfigs = ref([])

const form = reactive({
  businessSystem: '',
  taskName: '手动DEMO导出任务',
  businessType: '',
  total: 10000,
  dateRange: [],
  keyword: '',
  remark: ''
})

const businessSystemOptions = computed(() => buildBusinessSystemOptions(businessConfigs.value))
const businessTypeOptions = computed(() => buildBusinessTypeOptions(businessConfigs.value, form.businessSystem))

const rules = {
  businessSystem: [{ required: true, message: '请输入业务系统', trigger: 'blur' }],
  taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  businessType: [{ required: true, message: '请选择业务类型', trigger: 'change' }],
  total: [{ required: true, message: '请输入导出条数', trigger: 'change' }]
}

function toIsoDateTime(date, endOfDay = false) {
  if (!date) {
    return undefined
  }
  const time = endOfDay ? '23:59:59' : '00:00:00'
  return `${date}T${time}`
}

function syncBusinessSelection() {
  const systemExists = businessSystemOptions.value.some(item => item.value === form.businessSystem)
  if (!systemExists) {
    form.businessSystem = businessSystemOptions.value[0]?.value || ''
  }

  const availableTypes = buildBusinessTypeOptions(businessConfigs.value, form.businessSystem)
  const typeExists = availableTypes.some(item => item.value === form.businessType)
  if (!typeExists) {
    form.businessType = availableTypes[0]?.value || ''
  }
}

async function loadBusinessConfigs() {
  try {
    businessConfigs.value = await listBusinessConfigOptions({ configType: BUSINESS_CONFIG_TYPE.EXPORT })
    syncBusinessSelection()
  } catch (error) {
    businessConfigs.value = []
    form.businessSystem = ''
    form.businessType = ''
    ElMessage.error(error?.message || '业务配置加载失败')
  }
}

function buildPayload() {
  const [startDate, endDate] = form.dateRange || []
  return {
    creator: creator.value,
    taskName: form.taskName,
    businessSystem: form.businessSystem,
    businessType: form.businessType,
    fileName: '用户导出.xlsx',
    startTime: toIsoDateTime(startDate),
    endTime: toIsoDateTime(endDate, true),
    extMap: {
      total: form.total,
      startDate,
      endDate,
      keyword: form.keyword,
      remark: form.remark
    }
  }
}

async function submitExport() {
  await formRef.value?.validate()
  if (!creator.value) {
    ElMessage.warning('请输入订阅人/任务创建人')
    return
  }
  if (!form.businessSystem || !form.businessType) {
    ElMessage.warning('请先在业务配置中维护业务系统和业务类型')
    return
  }
  submitting.value = true
  try {
    const task = await createExportTask(buildPayload())
    publishExportTask(task)
    ElMessage.success('导出任务已创建，任务完成后将自动弹出通知')
  } catch (error) {
    ElMessage.error(error?.message || '导出任务创建失败')
  } finally {
    submitting.value = false
  }
}

watch(
  () => form.businessSystem,
  () => {
    const availableTypes = buildBusinessTypeOptions(businessConfigs.value, form.businessSystem)
    if (!availableTypes.some(item => item.value === form.businessType)) {
      form.businessType = availableTypes[0]?.value || ''
    }
  }
)

onMounted(() => {
  loadBusinessConfigs()
})
</script>

<style scoped>
.page-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
}

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

.full-width {
  width: 100%;
}

@media (max-width: 1080px) {
  .page-grid {
    grid-template-columns: 1fr;
  }
}
</style>

