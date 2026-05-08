import axios from 'axios'

const SUCCESS_CODE = '0'

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || ''
}

export function unwrapResponse(response) {
  const payload = response?.data
  if (!payload) {
    throw new Error('接口返回为空')
  }
  if (payload.code !== SUCCESS_CODE || payload.isSuccess === false) {
    throw new Error(payload.message || '接口调用失败')
  }
  return payload.data
}

export const request = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000
})

