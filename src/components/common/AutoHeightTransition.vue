<template>
  <div ref="containerRef" class="auto-height-transition">
    <div ref="contentRef" class="auto-height-transition__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{
  duration?: number
}>(), {
  duration: 360
})

const containerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

let resizeObserver: ResizeObserver | null = null
let lastHeight = 0
let settleTimer: number | null = null
let rafId = 0

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const setAutoHeight = () => {
  const container = containerRef.value
  if (!container) return
  container.style.height = 'auto'
  container.style.overflow = 'visible'
}

const animateToHeight = (nextHeight: number) => {
  const container = containerRef.value
  if (!container) return

  if (prefersReducedMotion() || lastHeight <= 0) {
    lastHeight = nextHeight
    setAutoHeight()
    return
  }

  if (Math.abs(nextHeight - lastHeight) < 1) return

  window.clearTimeout(settleTimer || 0)
  cancelAnimationFrame(rafId)

  container.style.overflow = 'hidden'
  container.style.height = `${lastHeight}px`

  rafId = requestAnimationFrame(() => {
    container.style.height = `${nextHeight}px`
  })

  lastHeight = nextHeight
  settleTimer = window.setTimeout(() => {
    setAutoHeight()
    settleTimer = null
  }, props.duration + 80)
}

onMounted(async () => {
  await nextTick()
  const content = contentRef.value
  if (!content) return

  lastHeight = content.getBoundingClientRect().height
  setAutoHeight()

  if (typeof ResizeObserver === 'undefined') return

  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    animateToHeight(entry.contentRect.height)
  })
  resizeObserver.observe(content)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.clearTimeout(settleTimer || 0)
  cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.auto-height-transition {
  width: 100%;
  transition: height 0.36s cubic-bezier(0.22, 1, 0.36, 1);
}

.auto-height-transition__content {
  min-width: 0;
}

:slotted(table) {
  width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .auto-height-transition {
    transition: none;
  }
}
</style>
