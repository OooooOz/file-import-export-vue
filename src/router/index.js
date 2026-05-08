import { createRouter, createWebHashHistory } from 'vue-router'
import BusinessExport from '../views/BusinessExport.vue'
import BusinessConfig from '../views/BusinessConfig.vue'
import ExportTaskList from '../views/ExportTaskList.vue'
import ImportTaskList from '../views/ImportTaskList.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/export/tasks' },
    { path: '/business-export', redirect: '/export/business' },
    { path: '/export-tasks', redirect: '/export/tasks' },
    {
      path: '/export/business',
      name: 'BusinessExport',
      component: BusinessExport,
      meta: { title: '手动DEMO', group: 'export' }
    },
    {
      path: '/export/tasks',
      name: 'ExportTaskList',
      component: ExportTaskList,
      meta: { title: '导出任务列表', group: 'export' }
    },
    {
      path: '/config/business',
      name: 'BusinessConfig',
      component: BusinessConfig,
      meta: { title: '业务配置', group: 'config' }
    },
    {
      path: '/import/tasks',
      name: 'ImportTaskList',
      component: ImportTaskList,
      meta: { title: '导入任务列表', group: 'import' }
    }
  ]
})

export default router
