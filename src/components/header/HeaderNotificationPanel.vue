<template>
  <div class="notification-panel">
    <div class="panel-header">
      <div>
        <h3>消息通知</h3>
        <p>{{ unreadCount }} 条未读消息</p>
      </div>
      <button
        v-if="items.length > 0"
        class="mark-all-btn"
        type="button"
        @click="$emit('mark-all-read')"
      >
        全部已读
      </button>
    </div>

    <div v-if="loading" class="panel-state">
      正在加载消息...
    </div>

    <div v-else-if="items.length === 0" class="panel-state empty">
      暂无需要关注的消息
    </div>

    <div v-else class="notification-list">
      <button
        v-for="item in items"
        :key="item.id"
        class="notification-item"
        :class="[item.type, { unread: item.unread }]"
        type="button"
        @click="$emit('select', item)"
      >
        <div class="item-icon" :class="item.type">
          <Icon :icon="iconMap[item.type]" />
        </div>
        <div class="item-body">
          <div class="item-row">
            <strong>{{ typeLabelMap[item.type] }}</strong>
            <span v-if="item.unread" class="unread-tag">未读</span>
          </div>
          <div class="item-title">{{ item.title }}</div>
          <p>{{ item.description }}</p>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { HeaderNotificationItem } from '../../composables/useHeaderNotifications'

defineProps<{
  items: HeaderNotificationItem[]
  loading: boolean
  unreadCount: number
}>()

defineEmits<{
  select: [item: HeaderNotificationItem]
  'mark-all-read': []
}>()

const iconMap = {
  anomaly: 'lucide:triangle-alert',
  insight: 'lucide:lightbulb',
  task: 'lucide:calendar-check-2'
}

const typeLabelMap = {
  anomaly: '异常告警',
  insight: '提示通知',
  task: '待办提醒'
}
</script>

<style scoped>
.notification-panel {
  position: absolute;
  top: calc(100% + 14px);
  right: 0;
  width: 360px;
  max-width: min(360px, calc(100vw - 32px));
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 12px;
  border-bottom: 1px solid #eef2f7;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.panel-header p {
  margin: 6px 0 0;
  font-size: 12px;
  color: #64748b;
}

.mark-all-btn {
  border: none;
  background: transparent;
  color: #0b4582;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.panel-state {
  padding: 28px 18px;
  text-align: center;
  color: #64748b;
  font-size: 13px;
}

.panel-state.empty {
  color: #94a3b8;
}

.notification-list {
  max-height: 420px;
  overflow-y: auto;
}

.notification-item {
  width: 100%;
  border: none;
  background: #ffffff;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 18px;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s ease;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: #f8fafc;
}

.notification-item.unread {
  background: linear-gradient(90deg, rgba(11, 69, 130, 0.04), rgba(11, 69, 130, 0));
}

.item-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
}

.item-icon.anomaly {
  background: #fef2f2;
  color: #ef4444;
}

.item-icon.task {
  background: #eff6ff;
  color: #2563eb;
}

.item-icon.insight {
  background: #fff7ed;
  color: #f59e0b;
}

.item-body {
  min-width: 0;
  flex: 1;
}

.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.item-row strong {
  font-size: 13px;
  color: #0f172a;
}

.unread-tag {
  color: #ef4444;
  font-size: 11px;
  font-weight: 700;
}

.item-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.item-body p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}
</style>
