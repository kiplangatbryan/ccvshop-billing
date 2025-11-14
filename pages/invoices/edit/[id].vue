<template>
  <InvoiceBuilder mode="edit" :invoice-id="invoiceId" />
</template>

<script setup lang="ts">
// @ts-ignore -- Vue SFC default export provided via shim
import InvoiceBuilder from '~/components/InvoiceBuilder.vue'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const invoiceId = computed(() => String(route.params.id || ''))
</script>

