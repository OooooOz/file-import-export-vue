<template>
  <el-container class="app-shell">
    <el-aside width="224px" class="app-aside">
      <div class="brand">
        <div class="brand__title">中转站</div>
        <div class="brand__subtitle">异步任务中心</div>
      </div>

      <el-menu :default-active="activeMenu" :default-openeds="defaultOpeneds" router class="side-menu">
        <el-menu-item index="/config/business">
          <span>业务配置</span>
        </el-menu-item>
        <el-sub-menu index="export">
          <template #title>
            <span>导出</span>
          </template>
          <el-menu-item index="/export/business">
            <span>手动DEMO</span>
          </el-menu-item>
          <el-menu-item index="/export/tasks">
            <span>任务列表</span>
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="import">
          <template #title>
            <span>导入</span>
          </template>
          <el-menu-item index="/import/tasks">
            <span>任务列表</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="app-header">
        <div>
          <h2>{{ pageTitle }}</h2>
          <span>当前通知订阅人：{{ creator || '未设置' }}</span>
        </div>
      </el-header>

      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useExportTaskState } from '../composables/useExportTaskState'

const route = useRoute()
const { creator } = useExportTaskState()

const activeMenu = computed(() => route.path)
const defaultOpeneds = ['export']
const pageTitle = computed(() => route.meta.title || '大文件 Excel 异步导出')
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.app-aside {
  background: #1f2937;
  color: #fff;
}

.brand {
  height: 72px;
  padding: 18px 20px;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand__title {
  font-size: 18px;
  font-weight: 700;
}

.brand__subtitle {
  margin-top: 4px;
  color: #9ca3af;
  font-size: 12px;
}

.side-menu {
  border-right: 0;
  background: transparent;
}

.side-menu :deep(.el-sub-menu__title),
.side-menu :deep(.el-menu-item) {
  color: #d1d5db;
}

.side-menu :deep(.el-sub-menu__title:hover),
.side-menu :deep(.el-menu-item.is-active),
.side-menu :deep(.el-menu-item:hover) {
  color: #fff;
  background: #374151;
}

.side-menu :deep(.el-menu) {
  background: transparent;
}

.app-header {
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.app-header h2 {
  margin: 0 0 6px;
  font-size: 20px;
}

.app-header span {
  color: #6b7280;
  font-size: 13px;
}

.app-main {
  min-height: calc(100vh - 60px);
  background: #f5f7fa;
}
</style>

