<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <!-- 头部 - 白色背景 -->
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
            <span class="format-desc">导出为Markdown表格格式，包含所有列表数据及建筑详情</span>
          </div>
        </div>
        
        <!-- 数据预览 -->
        <div class="preview-section" v-if="hasAnyData">
          <div class="preview-header">
            <span>即将导出 {{ totalRecords }} 条记录</span>
            <span class="time-range" v-if="timeRangeText">时间范围：{{ timeRangeText }}</span>
          </div>
          <div class="preview-details" v-if="metrics && metrics.length">
            <span>包含 {{ metrics.length }} 项基础指标</span>
            <span v-if="meters && meters.length">, {{ meters.length }} 个表计状态</span>
          </div>
        </div>
        
        <div v-else-if="!exporting" class="empty-tip">
          暂无数据可导出
        </div>
      </div>

      <!-- 底部 -->
      <div class="modal-footer">
        <button class="btn btn-cancel" @click="handleClose" :disabled="exporting">取消</button>
        <button 
          class="btn btn-export" 
          @click="handleExport" 
          :disabled="exporting || !hasAnyData"
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
import { computed, ref } from 'vue'

// 定义指标和表计的数据结构类型
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

const props = defineProps<{
  visible: boolean
  // 基础数据（列表数据）
  exportData?: any[]
  buildingId?: string
  timeRange?: string
  startTime?: string
  endTime?: string
  columns?: { key: string; label: string }[]
  
  // 新增：建筑详情数据，用于生成完整报告
  metrics?: MetricItem[]        // 基础指标（如总能耗、峰值等）
  meters?: MeterItem[]          // 表计可用性数据
  selectedDay?: string          // 选中的日期（用于文件名）
}>()

const emit = defineEmits(['update:visible', 'export'])

const exporting = ref(false)

// 判断是否有任何数据可导出
const hasAnyData = computed(() => {
  return (props.exportData && props.exportData.length > 0) || 
         (props.metrics && props.metrics.length > 0)
})

// 计算总记录数
const totalRecords = computed(() => {
  let count = props.exportData?.length || 0
  if (props.metrics) count += props.metrics.length
  if (props.meters) count += props.meters.length
  return count
})

// 计算时间范围文本
const timeRangeText = computed(() => {
  const map: Record<string, string> = {
    'today': '今日',
    'week': '本周',
    'month': '本月',
    'quarter': '本季',
    'year': '本年'
  }
  if (props.timeRange && map[props.timeRange]) {
    return map[props.timeRange]
  }
  if (props.startTime && props.endTime) {
    return `${props.startTime} 至 ${props.endTime}`
  }
  if (props.selectedDay) {
    return props.selectedDay
  }
  return ''
})

// 格式化数字
const formatNumber = (val: number | null | undefined): string => {
  if (val == null || isNaN(val)) return '0.0'
  return val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

// 格式化表计名称
const formatMeterName = (meter: string): string => meter || '-'

const handleClose = () => {
  if (exporting.value) return
  emit('update:visible', false)
}

const handleExport = async () => {
  if (!hasAnyData.value) {
    alert('暂无数据可导出')
    return
  }

  exporting.value = true
  
  try {
    const lines: string[] = []
    const now = new Date()
    const exportTime = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    
    // ========== 1. 标题与元信息（复用第一个组件的逻辑） ==========
    lines.push(`# 建筑运行数据报表 - ${props.buildingId || 'Unknown'}`)
    lines.push('')
    lines.push(`> 导出时间: ${now.toLocaleString('zh-CN')}`)
    if (timeRangeText.value) {
      lines.push(`> 时间范围: ${timeRangeText.value}`)
    }
    if (props.startTime && props.endTime) {
      lines.push(`> 起止时间: ${props.startTime} 至 ${props.endTime}`)
    }
    lines.push('')

    // ========== 2. 基础信息部分（新增，来自第一个组件） ==========
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

    // ========== 3. 小时级监测数据（复用并增强原有逻辑） ==========
    if (props.exportData && props.exportData.length > 0) {
      lines.push('## 小时级监测数据')
      lines.push('')

      // 表头处理：优先使用传入的columns，否则使用默认列
      const headers = props.columns || [
        { key: 'hour', label: '时间' },
        { key: 'total', label: '总能耗(KWH)' },
        { key: 'peak', label: '峰值(KW)' },
        { key: 'average', label: '平均(KWH)' }
      ]
      
      const headerLine = '| ' + headers.map(h => h.label).join(' | ') + ' |'
      const separatorLine = '|' + headers.map(() => '------').join('|') + '|'
      
      lines.push(headerLine)
      lines.push(separatorLine)

      // 数据行处理
      for (const item of props.exportData) {
        const rowValues = headers.map(header => {
          let value = item[header.key]
          
          // 特殊处理时间字段（兼容多种时间格式）
          if (header.key === 'time' || header.key === 'hour') {
            if (typeof value === 'string' && value.includes('T')) {
              // ISO格式时间转换
              const date = new Date(value)
              if (!isNaN(date.getTime())) {
                value = `${String(date.getHours()).padStart(2, '0')}:00`
              }
            }
          } else if (typeof value === 'number') {
            value = formatNumber(value)
          } else if (value === undefined || value === null) {
            value = '-'
          }
          return value
        })
        lines.push('| ' + rowValues.join(' | ') + ' |')
      }
      lines.push('')
    }

    // ========== 4. 表计可用性（新增，来自第一个组件） ==========
    if (props.meters && props.meters.length > 0) {
      const hasAvailableMeters = props.meters.some(item => item.available)
      if (hasAvailableMeters) {
        lines.push('## 表计可用性')
        lines.push('')
        lines.push('| 表计类型 | 可用 |')
        lines.push('|---------|------|')
        
        for (const meter of props.meters) {
          const status = meter.available ? '是' : '否'
          lines.push(`| ${formatMeterName(meter.meter)} | ${status} |`)
        }
        lines.push('')
      }
    }

    // ========== 5. 页脚统计 ==========
    lines.push('---')
    lines.push(`*共导出 ${props.exportData?.length || 0} 条数据*`)
    if (props.metrics) {
      lines.push(`*包含 ${props.metrics.length} 项基础指标*`)
    }

    // ========== 6. 生成并下载文件（复用原有逻辑） ==========
    const mdContent = lines.join('\n')
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // 文件名格式：building_{ID}_{日期}.md
    const fileDate = props.selectedDay || exportTime
    const fileName = `building_${props.buildingId || 'data'}_${fileDate}.md`
    
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    // 通知父组件导出完成
    emit('export', { 
      format: 'md', 
      fileName,
      count: props.exportData?.length || 0,
      metricsCount: props.metrics?.length || 0
    })
    
    // 延迟关闭，让用户看到完成状态
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
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 头部样式 - 白色背景 */
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

/* 内容区域 */
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

/* 预览区域 */
.preview-section {
  margin-top: 20px;
  padding: 12px 16px;
  background: #F9FAFB;
  border-radius: 6px;
  border: 1px solid #E5E7EB;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #374151;
}

.preview-details {
  margin-top: 4px;
  font-size: 12px;
  color: #6B7280;
}

.time-range {
  color: #6B7280;
  font-size: 12px;
}

.empty-tip {
  margin-top: 20px;
  padding: 20px;
  text-align: center;
  color: #9CA3AF;
  font-size: 14px;
  background: #F9FAFB;
  border-radius: 6px;
  border: 1px dashed #E5E7EB;
}

/* 底部样式 */
.modal-footer {
  padding: 16px 24px 24px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  border-top: 1px solid #EEEEEE;
}

/* 按钮基础样式 - 圆角阴影 */
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
  position: relative;
  overflow: hidden;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* 取消按钮样式 */
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

/* 开始导出按钮样式 - 深蓝渐变 */
.btn-export {
  background: linear-gradient(135deg, #005BAC 0%, #004a8d 100%);
  color: white;
  box-shadow: 
    0 4px 6px -1px rgba(0, 91, 172, 0.3),
    0 2px 4px -1px rgba(0, 91, 172, 0.2);
}

.btn-export:hover:not(:disabled) {
  background: linear-gradient(135deg, #004a8d 0%, #003d75 100%);
  box-shadow: 
    0 10px 15px -3px rgba(0, 91, 172, 0.4),
    0 4px 6px -2px rgba(0, 91, 172, 0.3);
  transform: translateY(-2px);
}

/* 加载动画 */
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
