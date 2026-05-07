<template>
  <AppLayout />
</template>

<script setup>
import AppLayout from './components/AppLayout.vue'
import { useExportTaskNotifier } from './composables/useExportTaskNotifier'

useExportTaskNotifier()
</script>


