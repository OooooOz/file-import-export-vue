import { request, unwrapResponse } from './request'

const BUSINESS_CONFIG_API_BASE = '/api/business/config'

export function pageBusinessConfig(params) {
  return request.get(`${BUSINESS_CONFIG_API_BASE}/page`, { params }).then(unwrapResponse)
}

export function getBusinessConfig(id) {
  return request.get(`${BUSINESS_CONFIG_API_BASE}/${id}`).then(unwrapResponse)
}

export function createBusinessConfig(data) {
  return request.post(`${BUSINESS_CONFIG_API_BASE}/create`, data).then(unwrapResponse)
}

export function updateBusinessConfig(data) {
  return request.post(`${BUSINESS_CONFIG_API_BASE}/update`, data).then(unwrapResponse)
}

export function deleteBusinessConfig(id) {
  return request.post(`${BUSINESS_CONFIG_API_BASE}/delete/${id}`).then(unwrapResponse)
}

export function listBusinessConfigOptions(params) {
  return request.get(`${BUSINESS_CONFIG_API_BASE}/options`, { params }).then(unwrapResponse)
}

