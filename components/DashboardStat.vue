<template>
  <div class="stat-card">
    <div class="stat-header">
      <div>
        <p class="stat-title">{{ title }}</p>
        <p class="stat-value">{{ value }}</p>
      </div>
      <span :class="['stat-delta', delta >= 0 ? 'positive' : 'negative']">
        {{ delta >= 0 ? '+' : '' }}{{ delta }}%
      </span>
    </div>
    <p class="stat-caption">{{ deltaLabel }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  value: string
  delta: number
  deltaLabel: string
  color: 'indigo' | 'emerald' | 'sky' | 'violet'
}>()
</script>

<style scoped>
.stat-card {
  border: 1px solid var(--border-color);
  border-radius: 22px;
  background: #ffffff;
  padding: 22px;
  box-shadow: var(--card-shadow);
}
.stat-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.stat-title {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin: 0;
}
.stat-value {
  margin: 10px 0 0;
  font-size: 1.85rem;
  font-weight: 700;
  color: var(--text-main);
}
.stat-delta {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}
.stat-delta.positive {
  background: #e9fbf2;
  color: #0f8a55;
}
.stat-delta.negative {
  background: #ffeaea;
  color: #c53a30;
}
.stat-caption {
  margin-top: 14px;
  font-size: 0.8rem;
  color: var(--text-muted);
}
</style>
