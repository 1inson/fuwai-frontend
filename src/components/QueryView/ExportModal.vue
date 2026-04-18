<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <!-- 头部 -->
      <div class="modal-header">
        <h3>导出运行数据</h3>
        <button class="close-btn" @click="handleClose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <!-- 内容区域 -->
      <div class="modal-body">
        <div class="format-option" :class="{ 'disabled': exporting }">
          <div class="download-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <polyline points="8 12 12 16 16 12"></polyline>
            </svg>
          </div>
          <div class="format-info">
            <span class="format-text">Markdown (.md)</span>
            <span class="format-desc">导出为Markdown表格格式，包含基础信息、小时级监测数据及表计状态</span>
          </div>
        </div>
      </div>

      <!-- 底部 -->
      <div class="modal-footer">
        <button class="btn btn-cancel" @click="handleClose" :disabled="exporting">取消</button>
        <button 
          class="btn btn-export" 
          @click="handleExport" 
          :disabled="exporting"
        >
          <svg v-if="exporting" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;" class="spin">
            <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="10"></circle>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          {{ exporting ? '导出中...' : '开始导出' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface MetricItem {
  key: string
  label: string
  value: number
  unit?: string
}

interface MeterItem {
  meter: string
  available: boolean
}

// 兼容两种调用方式：
// 1. index.vue 传入: visible, selectedCount, selectedIds, timeRange
// 2. BuildingDetail.vue 传入: visible, buildingId, exportData, metrics, meters
const props = defineProps<{
  visible: boolean
  // index.vue 传入的属性（全部可选）
  selectedCount?: number      
  selectedIds?: string[]      
  timeRange?: 'today' | 'week' | 'month' | 'quarter' | 'year' | string  
  // BuildingDetail.vue 传入的属性（全部可选）
  buildingId?: string         
  exportData?: any[]            
  metrics?: MetricItem[]        
  meters?: MeterItem[]          
  selectedDay?: string          
}>()

const emit = defineEmits(['update:visible', 'export'])

const exporting = ref(false)

const handleClose = () => {
  if (exporting.value) return
  emit('update:visible', false)
}

const formatNumber = (val: number | null | undefined): string => {
  if (val == null || Number.isNaN(val)) return '0.0'
  return val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

const formatMeterName = (meter: string): string => meter || '-'

const handleExport = async () => {
  exporting.value = true
  
  try {
    const lines: string[] = []
    const now = new Date()
    
    // 智能获取建筑ID：优先使用buildingId，其次取selectedIds第一个，最后默认'data'
    let buildingId = props.buildingId || 'data'
    if (props.selectedIds && props.selectedIds.length > 0) {
      buildingId = props.selectedIds?.[0] ?? 'data'
    }
    
    const fileDate = props.selectedDay || 
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    
    // 标题与元信息
    lines.push(`# 建筑运行数据报表 - ${buildingId}`)
    lines.push('')
    lines.push(`> 导出时间: ${now.toLocaleString('zh-CN')}`)
    lines.push(`> 数据日期: ${fileDate}`)
    
    // 有时间范围则显示
    if (props.timeRange) {
      lines.push(`> 时间范围: ${props.timeRange}`)
    }
    
    // 有多个选中建筑则列出
    if (props.selectedIds && props.selectedIds.length > 1) {
      lines.push(`> 选中建筑数: ${props.selectedIds.length} 个`)
    }
    lines.push('')

    // 基础信息
    if (props.metrics && props.metrics.length > 0) {
      lines.push('## 基础信息')
      lines.push('')
      lines.push('| 指标 | 值 |')
      lines.push('|------|-----|')
      
      for (const metric of props.metrics) {
        const valueStr = metric.unit 
          ? `${metric.value.toLocaleString()} ${metric.unit}` 
          : metric.value.toLocaleString()
        lines.push(`| ${metric.label} | ${valueStr} |`)
      }
      lines.push('')
    }

    // 小时级监测数据
    lines.push('## 小时级监测数据')
    lines.push('')
    lines.push('| 时间 | 总能耗(KWH) | 峰值(KW) | 平均(KWH) |')
    lines.push('|------|-------------|-----------|-----------|')
    
    if (props.exportData && props.exportData.length > 0) {
      for (const item of props.exportData) {
        lines.push(`| ${item.hour || '-'} | ${formatNumber(item.total)} | ${formatNumber(item.peak)} | ${formatNumber(item.average)} |`)
      }
    }
    lines.push('')

    // 表计可用性
    if (props.meters && props.meters.length > 0) {
      const hasMeters = props.meters.some(item => item.available)
      if (hasMeters) {
        lines.push('## 表计可用性')
        lines.push('')
        lines.push('| 表计类型 | 可用 |')
        lines.push('|---------|------|')
        
        for (const meter of props.meters) {
          lines.push(`| ${formatMeterName(meter.meter)} | ${meter.available ? '是' : '否'} |`)
        }
        lines.push('')
      }
    }

    // 生成文件
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `building_${buildingId}_${fileDate}.md`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    emit('export', { 
      format: 'md', 
      fileName: `building_${buildingId}_${fileDate}.md`,
      count: props.exportData?.length || 0,
      buildingId
    })
    
    setTimeout(() => {
      handleClose()
    }, 500)
    
  } catch (err: any) {
    console.error('导出失败:', err)
    alert('导出失败: ' + (err.message || '未知错误'))
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalShow 0.3s ease;
}

@keyframes modalShow {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.modal-header {
  padding: 24px 24px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #002B54;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #F3F4F6;
  color: #6B7280;
}

.modal-body {
  padding: 20px 24px;
}

.format-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #EFF6FF;
  border-radius: 8px;
  border: 1px solid #BFDBFE;
  transition: all 0.2s;
  cursor: pointer;
}

.format-option:hover:not(.disabled) {
  background: #DBEAFE;
  border-color: #93C5FD;
}

.format-option.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.download-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #005BAC;
  flex-shrink: 0;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.format-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.format-text {
  font-size: 15px;
  color: #1F2937;
  font-weight: 500;
}

.format-desc {
  font-size: 13px;
  color: #6B7280;
}

.modal-footer {
  padding: 16px 24px 24px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  border-top: 1px solid #EEEEEE;
}

.btn {
  height: 40px;
  padding: 0 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: none;
  outline: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn-cancel {
  background: white;
  color: #4B5563;
  border: 1px solid #E5E7EB;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-cancel:hover:not(:disabled) {
  background: #F9FAFB;
  border-color: #D1D5DB;
  color: #374151;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.btn-export {
  background: linear-gradient(135deg, #005BAC 0%, #004a8d 100%);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 91, 172, 0.3);
}

.btn-export:hover:not(:disabled) {
  background: linear-gradient(135deg, #004a8d 0%, #003d75 100%);
  box-shadow: 0 10px 15px -3px rgba(0, 91, 172, 0.4);
  transform: translateY(-2px);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
