<template>
  <div class="tw-min-h-screen tw-bg-gradient-to-br tw-from-gray-50 tw-to-gray-100 tw-flex tw-items-center tw-justify-center tw-px-6">
    <VSheet elevation="12" class="tw-max-w-xl tw-w-full tw-rounded-[32px] tw-border tw-border-gray-200 tw-shadow-2xl tw-bg-white tw-overflow-hidden">
      <div class="tw-px-8 tw-pt-10 tw-pb-8">
        <div class="tw-flex tw-items-start tw-gap-4">
          <div class="tw-h-14 tw-w-14 tw-rounded-2xl tw-bg-primary/10 tw-flex tw-items-center tw-justify-center">
            <VIcon color="primary" size="32">mdi-alert-circle-outline</VIcon>
          </div>
          <div class="tw-space-y-2 tw-flex-1">
            <h1 class="tw-text-2xl tw-font-semibold tw-text-gray-900">Page not found</h1>
            <p class="tw-text-sm tw-text-gray-500">
              We couldn’t find the page you were looking for. It might have been moved, renamed, or doesn’t exist.
            </p>
          </div>
        </div>

        <div class="tw-mt-8 tw-grid tw-gap-4 sm:tw-grid-cols-2">
          <VSheet class="tw-rounded-3xl tw-border tw-border-gray-100 tw-bg-gray-50 tw-p-5 tw-flex tw-flex-col tw-gap-2">
            <div class="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-900">
              <VIcon color="primary" size="20">mdi-file-document-outline</VIcon>
              View invoices
            </div>
            <p class="tw-text-xs tw-text-gray-500">See all invoices, payment status, and outstanding balances.</p>
            <VBtn to="/invoices" color="primary" variant="flat" class="tw-rounded-full tw-mt-auto tw-font-semibold">
              Open invoices
            </VBtn>
          </VSheet>

          <VSheet class="tw-rounded-3xl tw-border tw-border-gray-100 tw-bg-gray-50 tw-p-5 tw-flex tw-flex-col tw-gap-2">
            <div class="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-900">
              <VIcon color="primary" size="20">mdi-pencil-outline</VIcon>
              Create invoice
            </div>
            <p class="tw-text-xs tw-text-gray-500">Generate a new invoice with customer details and line items.</p>
            <VBtn to="/invoices/create" color="secondary" variant="flat" class="tw-rounded-full tw-mt-auto tw-font-semibold">
              New invoice
            </VBtn>
          </VSheet>
        </div>

        <div class="tw-mt-6">
          <VBtn to="/" variant="text" color="secondary" class="tw-rounded-full tw-font-semibold">
            Back to home
          </VBtn>
        </div>
      </div>
    </VSheet>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
</script>
