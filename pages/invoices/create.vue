<template>
  <InvoiceBuilder mode="create" />
</template>

<script setup lang="ts">
// @ts-ignore -- Vue SFC default export provided via shim
import InvoiceBuilder from '~/components/InvoiceBuilder.vue'

definePageMeta({ middleware: 'auth' })
</script>