import { onUnmounted, watch } from 'vue'
import { ElNotification } from 'element-plus'
import { subscribeExportTask } from '../api/exportTask'
import { useExportTaskState } from './useExportTaskState'
import { statusText } from '../utils/exportTaskStatus'

let eventSource = null
let stopCreatorWatch = null
let activeConsumers = 0

function closeSubscription() {
  if (eventSource) {
	eventSource.close()
	eventSource = null
  }
}

function taskDisplayName(task) {
  return task?.taskName || task?.fileName || task?.taskNo || task?.id || '导出任务'
}

export function useExportTaskNotifier() {
  const {
	creator,
	publishExportTask,
	hasNotifiedTask,
	markTaskNotified
  } = useExportTaskState()

  function notifyFinishedTask(task) {
	if (!task || Number(task.status) !== 2 || hasNotifiedTask(task)) return

	markTaskNotified(task)
	ElNotification({
	  title: '导出任务已完成',
	  message: `${taskDisplayName(task)}：${statusText(task.status)}，可前往任务列表下载。`,
	  type: 'success',
	  duration: 6000,
	  position: 'top-right'
	})
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
  }

  function stop() {
	activeConsumers = Math.max(0, activeConsumers - 1)
	if (activeConsumers > 0) return

	if (stopCreatorWatch) {
	  stopCreatorWatch()
	  stopCreatorWatch = null
	}
	closeSubscription()
  }

  start()
  onUnmounted(stop)
}

