<template>
  <div class="table-card">
    <!-- 表格 -->
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <!-- 导出模式显示全选框 -->
            <th v-if="props.isExportMode" class="checkbox-column">
              <input 
                type="checkbox" 
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="toggleSelectAll"
                class="custom-checkbox"
              />
            </th>
            <th>建筑标识ID</th>
            <th>设备</th>
            <th class="text-right">总能耗</th>
            <th class="text-right">EUI 指数</th>
            <th class="text-right">碳排放</th>
            <th class="text-center">系统状态</th>
            <th class="text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <!-- 加载状态 -->
          <tr v-if="props.loading" class="loading-row">
            <td :colspan="props.isExportMode ? 8 : 7" class="loading-cell">
              <div class="loading-content">
                <div class="loading-spinner"></div>
                <span>数据加载中...</span>
              </div>
            </td>
          </tr>
          
          <!-- 空状态 -->
          <tr v-else-if="!props.buildingList || props.buildingList.length === 0" class="empty-row">
            <td :colspan="props.isExportMode ? 8 : 7" class="empty-cell">
              <div class="empty-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="9" x2="15" y2="9"></line>
                  <line x1="9" y1="13" x2="15" y2="13"></line>
                  <line x1="9" y1="17" x2="11" y2="17"></line>
                </svg>
                <p>暂无建筑运行数据</p>
              </div>
            </td>
          </tr>
          
          <!-- 数据列表 -->
          <tr v-else v-for="item in props.buildingList" :key="item.id" :class="{ 'selected-row': props.isExportMode && selectedIds.has(item.id) }">
            <!-- 导出模式显示多选框 -->
            <td v-if="props.isExportMode" class="checkbox-column">
              <input 
                type="checkbox" 
                :value="item.id"
                :checked="selectedIds.has(item.id)"
                @change="toggleSelection(item.id)"
                class="custom-checkbox"
              />
            </td>
            <td>
              <div class="building-id">{{ item.buildingId }}</div>
            </td>
            <td>
              <div class="site">{{ item.site }}</div>
            </td>
            <td class="text-right">
              <div class="energy">{{ item.energy?.toLocaleString() || 0 }}</div>
              <div class="unit">kWh</div>
            </td>
            <td class="text-right">{{ item.eui || 0 }}</td>
            <td class="text-right">{{ item.carbon || 0 }}</td>
            <td class="text-center">
              <!-- 使用复用的状态组件 -->
              <StatusBadge 
                :status="item.status" 
                :custom-text="item.statusText"
                size="md"
              />
            </td>
            <td class="text-right">
              <div class="actions">
                <button class="action-btn blue" @click="handleView(item)" title="查看详情">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
                <button class="action-btn green" @click="handleStats(item)" title="统计数据">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </button>
                <button class="action-btn orange" @click="handleFault(item)" title="故障分析">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页栏 -->
      <div class="pagination-bar">
        <div class="pagination-info">
          <template v-if="props.isExportMode">
            已选择 <strong>{{ selectedIds.size }}</strong> 个建筑
          </template>
          <template v-else>
            显示第 {{ displayStart }}-{{ displayEnd }} 条，共 {{ props.pagination?.total || 0 }} 条建筑运行记录
          </template>
        </div>
        
        <div class="pagination-right">
          <div class="pagination-controls">
            <button 
              class="page-btn nav-btn" 
              :disabled="(props.pagination?.current || 1) === 1" 
              @click="onPageChange((props.pagination?.current || 1) - 1)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <button 
              v-for="page in visiblePages" 
              :key="page" 
              :class="['page-btn', { active: page === props.pagination?.current }]" 
              @click="onPageChange(page)"
            >
              {{ page }}
            </button>

            <button 
              class="page-btn nav-btn" 
              :disabled="(props.pagination?.current || 1) >= totalPages" 
              @click="onPageChange((props.pagination?.current || 1) + 1)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import StatusBadge from './StatusBadge.vue'

// ===== Props & Emits =====
const props = defineProps<{
  buildingList?: any[]      
  loading?: boolean          
  pagination?: {
    current: number
    pageSize: number  
    total: number
  }
  filterForm?: {
    status?: string,
    timeRange?: string
  },
  advancedFilters?: Record<string, any>,
  sortConfig?: { field: string, order: 'asc' | 'desc' },
  timeRange?: 'today' | 'week' | 'month' | 'quarter' | 'year',
  isExportMode?: boolean
}>()

const emit = defineEmits([
  'view-detail', 
  'view-stats', 
  'fault-analysis', 
  'export-data',
  'selection-change',
  'page-change'
])

// ===== 响应式数据 =====
// 只保留选中状态（用于导出模式）
const selectedIds = ref<Set<string>>(new Set())

// ===== 计算属性 =====
const totalPages = computed(() => {
  const total = props.pagination?.total || 0
  const pageSize = props.pagination?.pageSize || 7
  return Math.ceil(total / pageSize) || 1
})

const displayStart = computed(() => {
  if (!props.pagination || props.pagination.total === 0) return 0
  return (props.pagination.current - 1) * props.pagination.pageSize + 1
})

const displayEnd = computed(() => {
  if (!props.pagination || props.pagination.total === 0) return 0
  return Math.min(props.pagination.current * props.pagination.pageSize, props.pagination.total)
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  const current = props.pagination?.current || 1
  const total = totalPages.value
  let start = Math.max(1, current - Math.floor(maxVisible / 2))
  let end = Math.min(total, start + maxVisible - 1)
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const isAllSelected = computed(() => {
  const list = props.buildingList || []
  return list.length > 0 && list.every(item => selectedIds.value.has(item.id))
})

const isIndeterminate = computed(() => {
  const list = props.buildingList || []
  return selectedIds.value.size > 0 && selectedIds.value.size < list.length
})

// ===== 方法 =====
const toggleSelection = (id: string) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  selectedIds.value = new Set(selectedIds.value)
}

const toggleSelectAll = () => {
  const list = props.buildingList || []
  if (isAllSelected.value) {
    selectedIds.value.clear()
  } else {
    list.forEach(item => selectedIds.value.add(item.id))
  }
  selectedIds.value = new Set(selectedIds.value)
}

const handleView = (item: any) => {
  emit('view-detail', item)
}

const handleStats = (item: any) => {
  emit('view-stats', item)
}

const handleFault = (item: any) => {
  emit('fault-analysis', item)
}

const onPageChange = (page: number) => {
  emit('page-change', page)
}

// ===== 监听 =====
// 监听导出模式变化，退出时清空选择
watch(() => props.isExportMode, (newVal) => {
  if (!newVal) {
    selectedIds.value.clear()
  }
}, { immediate: true })

// 监听选择变化，通知父组件
watch(selectedIds, (newVal) => {
  emit('selection-change', Array.from(newVal))
}, { deep: true })

// 暴露方法给父组件调用
defineExpose({
  enterExportMode: () => {
    selectedIds.value.clear()
  },
  exitExportMode: () => {
    selectedIds.value.clear()
  }
})
</script>

<style scoped>
/* ===== 卡片容器 ===== */
.table-card {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* ===== 表格区域 ===== */
.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th {
  background: #F9FAFB;
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #E5E7EB;
  white-space: nowrap;
}

td {
  padding: 16px;
  border-bottom: 1px solid #F3F4F6;
  color: #374151;
  vertical-align: middle;
}

tr:hover {
  background: #F9FAFB;
}

/* 选中行样式 */
.selected-row {
  background: #EFF6FF !important;
}

/* 复选框列样式 */
.checkbox-column {
  width: 40px;
  text-align: center;
  padding: 12px 8px;
}

.custom-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #005BAC;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

/* ===== 数据单元格样式 ===== */
.building-id {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #111827;
  font-size: 13px;
}

.site {
  font-family: monospace;
  color: #6B7280;
  font-size: 13px;
}

.energy {
  font-weight: 600;
  color: #005BAC;
  font-size: 15px;
}

.unit {
  font-size: 11px;
  color: #9CA3AF;
  margin-top: 2px;
}

/* ===== 操作按钮 ===== */
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.blue {
  color: #005BAC;
  border-color: #BFDBFE;
}

.action-btn.blue:hover {
  background: #EFF6FF;
  transform: scale(1.05);
}

.action-btn.green {
  color: #27AE60;
  border-color: #BBF7D0;
}

.action-btn.green:hover {
  background: #F0FDF4;
  transform: scale(1.05);
}

.action-btn.orange {
  color: #F39C12;
  border-color: #FDE68A;
}

.action-btn.orange:hover {
  background: #FFFBEB;
  transform: scale(1.05);
}

/* ===== Loading & Empty 状态 ===== */
.loading-row, .empty-row {
  background: transparent !important;
}

.loading-cell, .empty-cell {
  text-align: center;
  padding: 60px 20px;
  border-bottom: none;
}

.loading-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #6B7280;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #F3F4F6;
  border-top-color: #005BAC;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #9CA3AF;
}

.empty-content p {
  margin: 0;
  font-size: 14px;
}

/* ===== 分页栏 ===== */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #F3F4F6;
  background: white;
}

.pagination-info {
  font-size: 14px;
  color: #6B7280;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination-info strong {
  color: #005BAC;
  font-weight: 600;
}

.pagination-right {
  display: flex;
  align-items: center;
}

/* 分页控制 */
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #E5E7EB;
  background: #fff;
  border-radius: 50%;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  font-weight: 500;
}

.page-btn:hover:not(:disabled):not(.active) {
  border-color: #005BAC;
  color: #005BAC;
  background: #F5F7FA;
}

.nav-btn {
  color: #9CA3AF;
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: #E5E7EB;
  color: #D1D5DB;
}

.page-btn.active {
  background: #005BAC;
  color: #fff;
  border-color: #005BAC;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 91, 172, 0.2);
}
</style>
