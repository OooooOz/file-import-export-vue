const STATUS_MAP = {
  0: { text: '初始', type: 'info' },
  1: { text: '进行中', type: 'warning' },
  2: { text: '完成', type: 'success' },
  3: { text: '失败', type: 'danger' }
}

export function statusText(status) {
  return STATUS_MAP[status]?.text || '未知'
}

export function statusTagType(status) {
  return STATUS_MAP[status]?.type || 'info'
}

export function isTaskFinished(status) {
  return Number(status) === 2 || Number(status) === 3
}
