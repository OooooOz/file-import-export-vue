import { onUnmounted, watch } from 'vue'
import { ElNotification } from 'element-plus'
import { getExportTask, subscribeExportTask } from '../api/exportTask'
import router from '../router'
import { useExportTaskState } from './useExportTaskState'
import { isTaskFinished } from '../utils/exportTaskStatus'

let eventSource = null
let stopCreatorWatch = null
let stopTaskWatch = null
let activeConsumers = 0
let activeNotification = null
let taskMonitorTimer = null
let monitoringTaskId = null

function closeSubscription() {
  if (eventSource) {
	eventSource.close()
	eventSource = null
  }
}

function closeNotification() {
  if (activeNotification) {
	activeNotification.close()
	activeNotification = null
  }
}

function stopTaskMonitor() {
  if (taskMonitorTimer) {
	window.clearInterval(taskMonitorTimer)
	taskMonitorTimer = null
  }
  monitoringTaskId = null
}

function taskDisplayName(task) {
  return task?.taskName || task?.fileName || task?.taskNo || task?.id || '导出任务'
}

export function useExportTaskNotifier() {
  const {
	creator,
	latestTask,
	publishExportTask,
	hasNotifiedTask,
	markTaskNotified
  } = useExportTaskState()

  function notifyFinishedTask(task) {
	if (!task || Number(task.status) !== 2 || hasNotifiedTask(task)) return

	markTaskNotified(task)
	closeNotification()
	activeNotification = ElNotification({
	  title: '导出完成',
	  message: `${taskDisplayName(task)}已导出完成，请前往下载。`,
	  type: 'success',
	  duration: 6000,
	  position: 'top-right',
	  onClick: () => {
		router.push({ name: 'ExportTaskList' })
		closeNotification()
	  },
	  onClose: () => {
		activeNotification = null
	  }
	})
  }

	function syncTaskMonitor(task) {
	  const taskId = task?.id
	  if (!taskId || isTaskFinished(task?.status)) {
		stopTaskMonitor()
		return
	  }
	  if (monitoringTaskId === taskId && taskMonitorTimer) {
		return
	  }

	  stopTaskMonitor()
	  monitoringTaskId = taskId
	  taskMonitorTimer = window.setInterval(async () => {
		try {
		  const latest = await getExportTask(taskId)
		  publishExportTask(latest)
		  if (isTaskFinished(latest?.status)) {
			stopTaskMonitor()
		  }
		} catch (error) {
		  // 接口暂时异常时保留下一次重试机会。
		}
	  }, 3000)
	}

  function start() {
	activeConsumers += 1
	if (stopCreatorWatch) return

	stopCreatorWatch = watch(
	  creator,
	  currentCreator => {
		closeSubscription()
		eventSource = subscribeExportTask(currentCreator, latest => {
		  publishExportTask(latest)
		  notifyFinishedTask(latest)
		})
	  },
	  { immediate: true }
	)

	stopTaskWatch = watch(
	  latestTask,
	  task => {
		notifyFinishedTask(task)
		syncTaskMonitor(task)
	  },
	  { immediate: false }
	)
  }

  function stop() {
	activeConsumers = Math.max(0, activeConsumers - 1)
	if (activeConsumers > 0) return

	if (stopCreatorWatch) {
	  stopCreatorWatch()
	  stopCreatorWatch = null
	}
	if (stopTaskWatch) {
	  stopTaskWatch()
	  stopTaskWatch = null
	}
	closeSubscription()
	stopTaskMonitor()
	closeNotification()
  }

  start()
  onUnmounted(stop)
}

