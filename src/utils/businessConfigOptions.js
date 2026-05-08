export const BUSINESS_CONFIG_TYPE = {
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT'
}

export const BUSINESS_CONFIG_TABS = [
  { label: '导出配置', value: BUSINESS_CONFIG_TYPE.EXPORT },
  { label: '导入配置', value: BUSINESS_CONFIG_TYPE.IMPORT }
]

function uniqueBy(items, keyBuilder) {
  const cache = new Set()
  return items.filter(item => {
    const key = keyBuilder(item)
    if (!key || cache.has(key)) {
      return false
    }
    cache.add(key)
    return true
  })
}

export function buildBusinessSystemOptions(configs) {
  return uniqueBy(configs || [], item => item.businessSystem).map(item => ({
    label: item.businessSystem,
    value: item.businessSystem
  }))
}

export function buildBusinessTypeOptions(configs, businessSystem) {
  const filtered = businessSystem
    ? (configs || []).filter(item => item.businessSystem === businessSystem)
    : (configs || [])
  return uniqueBy(filtered, item => `${item.businessSystem || ''}::${item.businessType || ''}`).map(item => ({
    label: item.businessType,
    value: item.businessType
  }))
}

