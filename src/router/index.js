import { createRouter, createWebHashHistory } from 'vue-router'
import BusinessExport from '../views/BusinessExport.vue'
import ExportTaskList from '../views/ExportTaskList.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/business-export' },
    {
      path: '/business-export',
      name: 'BusinessExport',
      component: BusinessExport,
      meta: { title: '业务功能导出' }
    },
    {
      path: '/export-tasks',
      name: 'ExportTaskList',
      component: ExportTaskList,
      meta: { title: '任务列表' }
    }
  ]
})

export default router
