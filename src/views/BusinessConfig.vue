<template>
  <el-card shadow="never" class="content-card">
    <template #header>
      <div class="card-header">
        <div>
          <strong>业务配置</strong>
          <p>维护业务系统与业务类型配置，供任务筛选与手动 DEMO 页面使用。</p>
        </div>
        <el-button type="primary" @click="openCreateDialog">新增配置</el-button>
      </div>
    </template>

    <el-tabs v-model="activeTab" class="config-tabs" @tab-change="handleTabChange">
      <el-tab-pane v-for="item in BUSINESS_CONFIG_TABS" :key="item.value" :label="item.label" :name="item.value" />
    </el-tabs>

    <el-form :model="query" inline class="query-form">
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
      <el-form-item>
        <el-button type="primary" @click="searchConfigs">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="configs" border stripe row-key="id">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="configType" label="配置类型" width="120">
        <template #default="{ row }">{{ row.configType === BUSINESS_CONFIG_TYPE.IMPORT ? '导入' : '导出' }}</template>
      </el-table-column>
      <el-table-column prop="businessSystem" label="业务系统" min-width="180" />
      <el-table-column prop="businessType" label="业务类型" min-width="180" />
      <el-table-column prop="createTime" label="创建时间" min-width="180">
        <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新时间" min-width="180">
        <template #default="{ row }">{{ formatDateTime(row.updateTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="removeConfig(row)">删除</el-button>
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
        @size-change="loadConfigs"
        @current-change="loadConfigs"
      />
    </div>
  </el-card>

  <el-dialog v-model="dialog.visible" :title="dialog.mode === 'create' ? '新增业务配置' : '编辑业务配置'" width="520px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
      <el-form-item label="业务系统" prop="businessSystem">
        <el-input v-model="form.businessSystem" maxlength="64" show-word-limit placeholder="请输入业务系统" />
      </el-form-item>
      <el-form-item label="业务类型" prop="businessType">
        <el-input v-model="form.businessType" maxlength="64" show-word-limit placeholder="请输入业务类型" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialog.visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createBusinessConfig,
  deleteBusinessConfig,
  getBusinessConfig,
  listBusinessConfigOptions,
  pageBusinessConfig,
  updateBusinessConfig
} from '../api/businessConfig'
import {
  BUSINESS_CONFIG_TABS,
  BUSINESS_CONFIG_TYPE,
  buildBusinessSystemOptions,
  buildBusinessTypeOptions
} from '../utils/businessConfigOptions'

const loading = ref(false)
const submitting = ref(false)
const configs = ref([])
const businessConfigs = ref([])
const formRef = ref(null)
const activeTab = ref(BUSINESS_CONFIG_TYPE.EXPORT)
const query = reactive({
  businessSystem: '',
  businessType: ''
})
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})
const dialog = reactive({
  visible: false,
  mode: 'create'
})
const form = reactive({
  id: undefined,
  configType: BUSINESS_CONFIG_TYPE.EXPORT,
  businessSystem: '',
  businessType: ''
})
const rules = {
  businessSystem: [{ required: true, message: '请输入业务系统', trigger: 'blur' }],
  businessType: [{ required: true, message: '请输入业务类型', trigger: 'blur' }]
}
const businessSystemOptions = computed(() => buildBusinessSystemOptions(businessConfigs.value))
const businessTypeOptions = computed(() => buildBusinessTypeOptions(businessConfigs.value, query.businessSystem))

function normalizePage(data) {
  const records = data?.records || []
  return {
    records,
    total: Number(data?.total ?? records.length),
    current: Number(data?.current ?? pagination.current),
    size: Number(data?.size ?? pagination.size)
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
    configType: activeTab.value,
    businessSystem: query.businessSystem || undefined,
    businessType: query.businessType || undefined,
    page: pagination.current,
    size: pagination.size
  }
}

function resetForm() {
  form.id = undefined
  form.configType = activeTab.value
  form.businessSystem = ''
  form.businessType = ''
}

function syncQuerySelection() {
  if (!businessSystemOptions.value.some(item => item.value === query.businessSystem)) {
    query.businessSystem = ''
  }
  if (!businessTypeOptions.value.some(item => item.value === query.businessType)) {
    query.businessType = ''
  }
}

async function loadBusinessConfigOptions() {
  try {
    businessConfigs.value = await listBusinessConfigOptions({ configType: activeTab.value })
    syncQuerySelection()
  } catch (error) {
    businessConfigs.value = []
    syncQuerySelection()
    ElMessage.error(error?.message || '业务配置筛选项加载失败')
  }
}

async function loadConfigs() {
  loading.value = true
  try {
    const page = normalizePage(await pageBusinessConfig(buildParams()))
    configs.value = page.records
    pagination.total = page.total
    pagination.current = page.current
    pagination.size = page.size
  } catch (error) {
    ElMessage.error(error?.message || '业务配置加载失败')
  } finally {
    loading.value = false
  }
}

function searchConfigs() {
  pagination.current = 1
  loadConfigs()
}

function resetQuery() {
  query.businessSystem = ''
  query.businessType = ''
  pagination.current = 1
  loadConfigs()
}

function openCreateDialog() {
  dialog.mode = 'create'
  dialog.visible = true
  resetForm()
}

async function openEditDialog(row) {
  dialog.mode = 'edit'
  dialog.visible = true
  resetForm()
  try {
    const data = await getBusinessConfig(row.id)
    form.id = data.id
    form.configType = data.configType || activeTab.value
    form.businessSystem = data.businessSystem || ''
    form.businessType = data.businessType || ''
  } catch (error) {
    dialog.visible = false
    ElMessage.error(error?.message || '业务配置详情获取失败')
  }
}

async function submitForm() {
  await formRef.value?.validate()
  submitting.value = true
  try {
    if (dialog.mode === 'create') {
      await createBusinessConfig({
        configType: activeTab.value,
        businessSystem: form.businessSystem,
        businessType: form.businessType
      })
      ElMessage.success('业务配置创建成功')
    } else {
      await updateBusinessConfig({
        id: form.id,
        configType: form.configType || activeTab.value,
        businessSystem: form.businessSystem,
        businessType: form.businessType
      })
      ElMessage.success('业务配置更新成功')
    }
    dialog.visible = false
    await loadBusinessConfigOptions()
    loadConfigs()
  } catch (error) {
    ElMessage.error(error?.message || '业务配置保存失败')
  } finally {
    submitting.value = false
  }
}

async function removeConfig(row) {
  try {
    await ElMessageBox.confirm(`确定删除配置【${row.businessSystem} / ${row.businessType}】吗？`, '删除确认', {
      type: 'warning'
    })
    await deleteBusinessConfig(row.id)
    ElMessage.success('业务配置删除成功')
    if (configs.value.length === 1 && pagination.current > 1) {
      pagination.current -= 1
    }
    await loadBusinessConfigOptions()
    loadConfigs()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '业务配置删除失败')
    }
  }
}

async function handleTabChange() {
  dialog.visible = false
  query.businessSystem = ''
  query.businessType = ''
  pagination.current = 1
  await loadBusinessConfigOptions()
  loadConfigs()
}

watch(
  () => query.businessSystem,
  () => {
    if (!businessTypeOptions.value.some(item => item.value === query.businessType)) {
      query.businessType = ''
    }
  }
)

onMounted(async () => {
  await loadBusinessConfigOptions()
  loadConfigs()
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

.config-tabs {
  margin-bottom: 12px;
}

.query-form {
  margin-bottom: 12px;
}

.query-input {
  width: 220px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>

