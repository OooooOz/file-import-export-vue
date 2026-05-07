import { ref, watch } from 'vue'

const CREATOR_STORAGE_KEY = 'export-task-creator'

function readStoredCreator() {
  try {
    return localStorage.getItem(CREATOR_STORAGE_KEY) || 'demoUser'
  } catch (error) {
    return 'demoUser'
  }
}

const creator = ref(readStoredCreator())
const latestTask = ref(null)
const notifiedTaskKeys = new Set()

watch(creator, value => {
  try {
    localStorage.setItem(CREATOR_STORAGE_KEY, value || '')
  } catch (error) {
    // localStorage 不可用时仅保持内存态。
  }
})

function taskKey(task) {
  if (!task) return ''
  return String(task.id || task.taskNo || task.fileUrl || '')
}

function publishExportTask(task) {
  latestTask.value = task
}

function hasNotifiedTask(task) {
  const key = taskKey(task)
  return Boolean(key && notifiedTaskKeys.has(key))
}

function markTaskNotified(task) {
  const key = taskKey(task)
  if (key) notifiedTaskKeys.add(key)
}

export function useExportTaskState() {
  return {
    creator,
    latestTask,
    publishExportTask,
    hasNotifiedTask,
    markTaskNotified
  }
}
