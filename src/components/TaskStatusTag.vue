<template>
  <el-tag :type="statusTagType(status)" effect="light">
    {{ statusText(status) }}
  </el-tag>
</template>

<script setup>
import { statusTagType, statusText } from '../utils/exportTaskStatus'

defineProps({
  status: {
    type: [Number, String],
    default: undefined
  }
})
</script>

