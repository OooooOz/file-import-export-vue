import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8091',
  timeout: 30000
})

export function createExportTask(data) {
  return request.post('/api/export/task/create', data).then(res => res.data.data)
}

export function getExportTask(id) {
  return request.get(`/api/export/task/${id}`).then(res => res.data.data)
}

export function pageExportTask(params) {
  return request.get('/api/export/task/page', { params }).then(res => res.data.data)
}

export function subscribeExportTask(creator, onMessage) {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8091'
  const source = new EventSource(`${baseURL}/api/export/task/subscribe?creator=${encodeURIComponent(creator || '')}`)
  source.addEventListener('export-task', event => {
    onMessage(JSON.parse(event.data))
  })
  source.onerror = () => {
    // SSE 异常时浏览器会自动重连；生产环境也可在这里降级为轮询。
  }
  return source
}

