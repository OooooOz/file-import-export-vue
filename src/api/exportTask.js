import { getApiBaseUrl, request, unwrapResponse } from './request'

function parseEventData(data) {
  if (data == null || data === '') {
    return null
  }
  if (typeof data !== 'string') {
    return data
  }
  try {
    return JSON.parse(data)
  } catch (error) {
    return null
  }
}


export function createExportTask(data) {
  return request.post('/api/export/task/create', data).then(unwrapResponse)
}

export function getExportTask(id) {
  return request.get(`/api/export/task/${id}`).then(unwrapResponse)
}

export function pageExportTask(params) {
  return request.get('/api/export/task/page', { params }).then(unwrapResponse)
}

export function subscribeExportTask(creator, onMessage) {
  const source = new EventSource(`${getApiBaseUrl()}/api/export/task/subscribe?creator=${encodeURIComponent(creator || '')}`)
  source.addEventListener('export-task', event => {
    const payload = parseEventData(event.data)
    if (payload) {
      onMessage(payload)
    }
  })
  source.onerror = () => {
    // SSE 异常时浏览器会自动重连；生产环境也可在这里降级为轮询。
  }
  return source
}

