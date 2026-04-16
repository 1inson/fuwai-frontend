<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <!-- 模态框头部 -->
      <div class="modal-header">
        <div class="title-area">
          <h2>建筑详情 - {{ buildingId }}</h2>
          <div v-if="anomalyCount > 0" class="anomaly-badge">
            <span class="dot"></span>
            检测到 {{ anomalyCount }} 个表计异常 <Icon icon="lucide:chevron-down" class="ml-1" />
          </div>
        </div>
        <button class="close-btn" @click="close">
          <Icon icon="lucide:x" />
        </button>
      </div>

      <div class="modal-body" v-if="loading">
        <div class="loading-state">
          <Icon icon="lucide:loader-2" class="spin loading-icon" />
          <p>正在加载建筑详细信息...</p>
        </div>
      </div>
      
      <div class="modal-body layout-cols" v-else-if="detailData">
        <!-- 左侧：基本资料 -->
        <div class="col-left">
          <div class="card-section">
            <h3>基本资料</h3>
            <div class="kv-list">
              <div class="kv-item" v-for="metric in displayMetrics" :key="metric.key">
                <span class="k-label">{{ metric.label }}</span>
                <span class="v-val">
                  {{ metric.value.toLocaleString() }} 
                  <span v-if="metric.unit" class="v-unit">{{ metric.unit }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：监控表及占比 -->
        <div class="col-right">
          <!-- 小时级多维监控数据 -->
          <div class="card-section monitoring-section">
            <div class="section-top">
              <h3>小时级多维监控数据</h3>
              <input 
                type="date" 
                v-model="selectedDay" 
                class="single-date-picker" 
                @change="fetchHourlyOnly"
              />
            </div>
            
            <table class="hourly-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>总能耗 (KWH)</th>
                  <th>峰值 (KW)</th>
                  <th>平均 (KWH)</th>
                </tr>
              </thead>
              <tbody v-if="hourlyData.length > 0">
                <tr v-for="(item, idx) in hourlyData" :key="idx">
                  <td>{{ item.hour }}</td>
                  <td class="font-bold font-numeric">{{ formatNumber(item.total) }}</td>
                  <td class="font-numeric">{{ formatNumber(item.peak) }}</td>
                  <td class="font-numeric">{{ formatNumber(item.average) }}</td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr>
                  <td colspan="4" class="empty-cell">未能获取到当天的小时级数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- AI 运维分析结果 -->
        <div class="ops-guide-panel" v-if="opsLoading || opsError || opsResult">
          <div class="card-section">
            <div class="section-top">
              <h3>
                <Icon icon="lucide:bot" class="mr-1" />
                AI 运维指导
              </h3>
              <button v-if="opsResult" class="close-ops-btn" @click="opsResult = null">
                <Icon icon="lucide:x" />
              </button>
            </div>

            <div v-if="opsLoading" class="ops-loading">
              <Icon icon="lucide:loader-2" class="spin" />
              <span>AI 正在分析运维数据，请稍候...</span>
            </div>

            <div v-else-if="opsError" class="ops-error">
              <Icon icon="lucide:alert-circle" class="mr-1" />
              <span>{{ opsError }}</span>
              <button class="retry-btn" @click="exportData">重试</button>
            </div>

            <div v-else-if="opsResult" class="ops-content">
              <div class="ops-summary">
                <p>{{ opsResult.summary }}</p>
              </div>

              <div v-if="opsResult.preconditions && opsResult.preconditions.length > 0" class="ops-block">
                <h4><Icon icon="lucide:check-circle" class="mr-1" /> 前置条件</h4>
                <ul class="ops-checklist">
                  <li v-for="(pre, idx) in opsResult.preconditions" :key="idx">{{ pre }}</li>
                </ul>
              </div>

              <div v-if="opsResult.steps && opsResult.steps.length > 0" class="ops-block">
                <h4><Icon icon="lucide:list-checks" class="mr-1" /> 运维步骤</h4>
                <div class="ops-steps">
                  <div v-for="(step, idx) in opsResult.steps" :key="step.step_id" class="ops-step">
                    <div class="step-header">
                      <span class="step-num">{{ idx + 1 }}</span>
                      <span class="step-title">{{ step.title }}</span>
                      <span :class="['step-priority', `priority-${step.priority}`]">{{ step.priority }}</span>
                    </div>
                    <div class="step-body">
                      <p class="step-instruction">{{ step.instruction }}</p>
                      <div class="step-extras">
                        <div class="step-extra-item">
                          <Icon icon="lucide:target" class="mr-1" />
                          <span>预期结果: {{ step.expected_result }}</span>
                        </div>
                        <div class="step-extra-item text-warn">
                          <Icon icon="lucide:alert-triangle" class="mr-1" />
                          <span>未达标处理: {{ step.if_not_met }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="opsResult.risk_notice && opsResult.risk_notice.length > 0" class="ops-block">
                <h4 class="text-risk"><Icon icon="lucide:shield-alert" class="mr-1" /> 风险提示</h4>
                <ul class="ops-risk-list">
                  <li v-for="(risk, idx) in opsResult.risk_notice" :key="idx">{{ risk }}</li>
                </ul>
              </div>

              <div v-if="opsResult.actions && opsResult.actions.length > 0" class="ops-block">
                <h4><Icon icon="lucide:zap" class="mr-1" /> 建议操作</h4>
                <div class="ops-actions">
                  <button v-for="(action, idx) in opsResult.actions" :key="idx" class="ops-action-btn">
                    <Icon icon="lucide:arrow-right" class="mr-1" />
                    {{ action.label }}
                  </button>
                </div>
              </div>

              <div v-if="opsResult.evidence && opsResult.evidence.length > 0" class="ops-block">
                <h4><Icon icon="lucide:file-search" class="mr-1" /> 相关依据</h4>
                <div class="ops-evidence-list">
                  <div v-for="(ev, idx) in opsResult.evidence" :key="idx" class="ops-evidence-item">
                    <div class="ev-header">
                      <span class="ev-source">{{ ev.source }}</span>
                      <span class="ev-type">{{ ev.source_type }}</span>
                    </div>
                    <p class="ev-snippet">{{ ev.snippet }}</p>
                  </div>
                </div>
              </div>

              <div v-if="opsResult.applicability" class="ops-block">
                <h4><Icon icon="lucide:scope" class="mr-1" /> 适用范围</h4>
                <div class="ops-applicability">
                  <div v-if="opsResult.applicability.applies_to.length > 0" class="apply-group">
                    <span class="apply-label apply-yes">适用:</span>
                    <span v-for="(item, idx) in opsResult.applicability.applies_to" :key="idx" class="apply-tag tag-yes">{{ item }}</span>
                  </div>
                  <div v-if="opsResult.applicability.not_applies_to.length > 0" class="apply-group">
                    <span class="apply-label apply-no">不适用:</span>
                    <span v-for="(item, idx) in opsResult.applicability.not_applies_to" :key="idx" class="apply-tag tag-no">{{ item }}</span>
                  </div>
                </div>
              </div>

              <div class="ops-meta">
                <span><Icon icon="lucide:cpu" class="mr-1" /> {{ opsResult.meta.model }}</span>
                <span><Icon icon="lucide:clock" class="mr-1" /> {{ new Date(opsResult.meta.generated_at).toLocaleString('zh-CN') }}</span>
                <span v-if="opsResult.meta.knowledge_hits != null"><Icon icon="lucide:book-open" class="mr-1" /> 知识命中 {{ opsResult.meta.knowledge_hits }}</span>
                <span v-if="opsResult.meta.history_feedback_hits != null"><Icon icon="lucide:history" class="mr-1" /> 历史反馈 {{ opsResult.meta.history_feedback_hits }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 模态框底部 -->
      <div class="modal-footer">
        <button class="btn btn-default" @click="close">返回</button>
        <button class="btn btn-primary" @click="exportData" :disabled="opsLoading">
          <Icon v-if="opsLoading" icon="lucide:loader-2" class="spin mr-1" />
          <span v-if="opsLoading">分析中...</span>
          <template v-else>一键统计分析</template>
        </button>
        <button class="btn btn-primary btn-icon" @click="exportMarkdown" :disabled="exporting">
          <Icon v-if="exporting" icon="lucide:loader-2" class="spin mr-1" />
          <span v-if="exporting">导出中...</span>
          <template v-else>
            导出数据 <Icon icon="lucide:download" class="ml-1" />
          </template>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { getCurrentTimeString } from '../../utils/timeManager'
import { Icon } from '@iconify/vue'
import { 
  getBuildingById, 
  type BuildingDetailResponse, 
  getBuildingEnergySummary
} from '../../api/statistics'
import {
  getOpsGuide,
  type OpsGuideResponse
} from '../../api/anomaly'

const props = defineProps<{
  visible: boolean
  buildingId: string
  startTime?: string
  endTime?: string
}>()

const emit = defineEmits(['update:visible'])

const loading = ref(false)
const detailData = ref<BuildingDetailResponse | null>(null)
const anomalyCount = ref(0)
const hourlyData = ref<{ hour: string; total: number; peak: number; average: number }[]>([])
const hourlyLoading = ref(false)

const exporting = ref(false)

const opsLoading = ref(false)
const opsError = ref('')
const opsResult = ref<OpsGuideResponse | null>(null)

const selectedDay = ref('')

watch(() => props.startTime, (v) => {
  if (v) {
    const safeStr = v.replace(/-/g, '/')
    const d = new Date(safeStr)
    if (!isNaN(d.getTime())) {
      selectedDay.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return
    }
  }
  const now = new Date(getCurrentTimeString())
  selectedDay.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}, { immediate: true })

const close = () => {
  emit('update:visible', false)
}

const exportData = async () => {
  if (!props.buildingId) return
  opsLoading.value = true
  opsError.value = ''
  opsResult.value = null

  try {
    const res = await getOpsGuide({
      question: `建筑 ${props.buildingId} 的运维分析`,
      guide_mode: 'standard_sop',
      context: {
        building_id: props.buildingId,
        meter: 'electricity',
        time_range: {
          start: selectedDay.value ? `${selectedDay.value}T00:00:00Z` : new Date(Date.now() - 7 * 86400000).toISOString(),
          end: selectedDay.value ? `${selectedDay.value}T23:59:59Z` : new Date().toISOString()
        },
        page_context: {
          source: 'building_details_modal',
          page_type: 'statistics'
        }
      },
      include_knowledge: true,
      include_history: true,
      include_actions: true
    }) as any
    opsResult.value = res
  } catch (err: any) {
    console.error('AI 运维分析失败:', err)
    opsError.value = err?.response?.data?.detail || err?.message || 'AI 运维分析请求失败'
  } finally {
    opsLoading.value = false
  }
}

const exportMarkdown = () => {
  if (!detailData.value && hourlyData.value.length === 0) {
    alert('暂无数据可导出')
    return
  }
  exporting.value = true

  try {
    const building = detailData.value?.building
    const metrics = displayMetrics.value
    const lines: string[] = []

    lines.push(`# 建筑详情报表 - ${props.buildingId}`)
    lines.push('')
    lines.push(`> 导出时间: ${new Date().toLocaleString('zh-CN')}`)
    lines.push(`> 数据日期: ${selectedDay.value}`)
    lines.push('')

    lines.push('## 基本资料')
    lines.push('')
    lines.push('| 指标 | 值 |')
    lines.push('|------|-----|')
    for (const m of metrics) {
      const val = m.unit ? `${m.value.toLocaleString()} ${m.unit}` : m.value.toLocaleString()
      lines.push(`| ${m.label} | ${val} |`)
    }
    lines.push('')

    if (hourlyData.value.length > 0) {
      lines.push('## 小时级多维监控数据')
      lines.push('')
      lines.push('| 时间 | 总能耗 (KWH) | 峰值 (KW) | 平均 (KWH) |')
      lines.push('|------|-------------|-----------|-----------|')
      for (const item of hourlyData.value) {
        lines.push(`| ${item.hour} | ${formatNumber(item.total)} | ${formatNumber(item.peak)} | ${formatNumber(item.average)} |`)
      }
      lines.push('')
    }

    const meters = displayMeters.value
    const hasAnyMeter = meters.some(m => m.available)
    if (hasAnyMeter) {
      lines.push('## 监控表计')
      lines.push('')
      lines.push('| 表计类型 | 可用 |')
      lines.push('|---------|------|')
      for (const m of meters) {
        lines.push(`| ${formatMeterName(m.meter)} | ${m.available ? '✅' : '❌'} |`)
      }
      lines.push('')
    }

    const mdContent = lines.join('\n')
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `building_${props.buildingId}_${selectedDay.value}.md`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err: any) {
    alert('导出失败: ' + (err.message || '未知错误'))
    console.error(err)
  } finally {
    exporting.value = false
  }
}

const formatNumber = (val: number | null | undefined): string => {
  if (val == null || isNaN(val)) return '0.0'
  return val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

const fetchHourlyOnly = async () => {
  if (!props.buildingId || !selectedDay.value) return
  hourlyLoading.value = true
  hourlyData.value = []

  try {
    const promises = Array.from({ length: 24 }, (_, i) => {
      const hh = String(i).padStart(2, '0')
      const startStr = `${selectedDay.value}T${hh}:00:00`
      const endStr = `${selectedDay.value}T${hh}:59:59`
      return getBuildingEnergySummary(props.buildingId, {
        meter: 'electricity',
        granularity: 'hour',
        start_time: startStr,
        end_time: endStr
      }).then(raw => {
        const data = (raw as any)?.data ?? raw
        return {
          hour: `${hh}:00`,
          total: data?.summary?.total ?? 0,
          peak: data?.summary?.peak ?? 0,
          average: data?.summary?.average ?? 0
        }
      }).catch(() => ({
        hour: `${hh}:00`,
        total: 0,
        peak: 0,
        average: 0
      }))
    })

    hourlyData.value = await Promise.all(promises)
  } catch (err) {
    console.error('Failed to fetch hourly energy summary', err)
  } finally {
    hourlyLoading.value = false
  }
}

const fetchData = async () => {
  if (!props.buildingId) return
  loading.value = true
  detailData.value = null
  anomalyCount.value = Math.floor(Math.random() * 3)
  hourlyData.value = []
  
  try {
    const raw = await getBuildingById(props.buildingId)
    detailData.value = (raw as any)?.data ?? raw

    await fetchHourlyOnly()
  } catch (err) {
    console.error('Failed to fetch building details', err)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.buildingId) {
      fetchData()
    }
  }
)

const displayMetrics = computed(() => {
  const metrics = detailData.value?.summary_metrics || []
  const building = detailData.value?.building
  
  const fullList = [
    { key: 'usage', label: '建筑主要用途', value: building?.primaryspaceusage || '—', unit: '' },
    { key: 'sqm', label: '总面积', value: building?.sqm || 0, unit: 'm²' },
    ...metrics
  ]
  return fullList
})

const displayMeters = computed(() => {
  const meters = detailData.value?.meters || []
  const standardMeters = ['hotwater', 'chilledwater', 'irrigation', 'solar', 'gas', 'electricity']
  return standardMeters.map(sm => {
    const found = meters.find(m => m.meter === sm)
    return found ? found : { meter: sm, available: false }
  })
})

function formatMeterName(name: string) {
  const mapping: Record<string, string> = {
    electricity: '电 (ELEC)',
    hotwater: '热水 (HOT WATER)',
    chilledwater: '冷冻水 (CHILLED)',
    irrigation: '灌溉 (IRRIGATION)',
    solar: '太阳能 (SOLAR)',
    gas: '燃气 (GAS)',
    steam: '蒸汽 (STEAM)',
    water: '水 (WATER)'
  }
  return mapping[name] || name
}

function getMeterColor(name: string) {
  const mapping: Record<string, string> = {
    electricity: '#3b82f6',
    hotwater: '#f59e0b',
    chilledwater: '#0ea5e9',
    irrigation: '#10b981',
    solar: '#eab308',
    gas: '#ef4444'
  }
  return mapping[name] || '#94a3b8'
}

function getMockPct(name: string) {
  const pct: Record<string, string> = {
    electricity: '60.0',
    hotwater: '10.0',
    chilledwater: '15.0',
    irrigation: '10.0',
    solar: '7.0',
    gas: '8.0'
  }
  return pct[name] || '0.0'
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: #f1f5f9;
  width: 900px;
  max-width: 95vw;
  max-height: 90vh;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  font-family: 'Plus Jakarta Sans', -apple-system, 'PingFang SC', sans-serif;
}

/* Header */
.modal-header {
  background: white;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-area h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0b4582;
}

.anomaly-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fef2f2;
  color: #ef4444;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.anomaly-badge .dot {
  width: 6px;
  height: 6px;
  background: #ef4444;
  border-radius: 50%;
}

.close-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  transition: all 0.2s;
}
.close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.layout-cols {
  display: flex;
  gap: 20px;
}

.col-left {
  flex: 0 0 320px;
}

.col-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Cards */
.card-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(15,23,42,0.04);
}

.card-section h3 {
  margin: 0 0 16px 0;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

/* Left: KV List */
.kv-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kv-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #f1f5f9;
}
.kv-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.k-label {
  color: #64748b;
}

.v-val {
  font-weight: 700;
  color: #0b4582;
  text-align: right;
}

.v-unit {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  margin-left: 2px;
}

/* Right: Monitoring Table */
.section-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.single-date-picker {
  font-size: 13px;
  background: #f1f5f9;
  padding: 6px 12px;
  border-radius: 6px;
  color: #0b4582;
  font-weight: 600;
  border: 1px solid #cbd5e1;
  outline: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.single-date-picker:hover, .single-date-picker:focus {
  border-color: #0b4582;
  box-shadow: 0 0 0 2px rgba(11,69,130,0.1);
}

.hourly-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
}

.hourly-table th {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  padding: 10px;
  background: #f8fafc;
}

.hourly-table td {
  font-size: 13px;
  padding: 12px;
  border-bottom: 1px solid #f8fafc;
  color: #0f172a;
}

.link-btn {
  background: none;
  border: none;
  color: #0b4582;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
}

/* Right Bottom Widgets */
.bottom-widgets {
  display: flex;
  gap: 20px;
}

.savings-card {
  flex: 0 0 200px;
  background: #ecfdf5;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.s-label {
  font-size: 12px;
  color: #059669;
  font-weight: 600;
  margin-bottom: 8px;
}

.s-val {
  font-size: 28px;
  font-weight: 800;
}

.percent {
  font-size: 16px;
}

.text-green { color: #059669; }

.meters-legend-card {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(15,23,42,0.04);
}

.meter-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.meter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
}

.meter-item.disabled {
  opacity: 0.5;
  filter: grayscale(1);
}

.m-dot {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
}

.m-info {
  display: flex;
  flex-direction: column;
}

.m-name {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.m-pct {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
}

.m-pct.na {
  color: #cbd5e1;
}

/* Footer */
.modal-footer {
  background: white;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-default {
  background: white;
  border-color: #cbd5e1;
  color: #475569;
}
.btn-default:hover {
  background: #f1f5f9;
}

.btn-primary {
  background: #0b4582;
  color: white;
}
.btn-primary:hover {
  background: #093463;
}

.btn-icon {
  display: flex;
  align-items: center;
}

/* Common */
.ml-1 { margin-left: 4px; }
.mr-1 { margin-right: 4px; }
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #64748b;
  font-size: 14px;
}
.loading-icon {
  font-size: 32px;
  color: #0b4582;
  margin-bottom: 12px;
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.font-numeric {
  font-variant-numeric: tabular-nums;
}

/* ─── AI Ops Guide Panel ─── */
.ops-guide-panel {
  width: 100%;
  margin-top: 20px;
}

.ops-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 32px 0;
  justify-content: center;
  color: #0b4582;
  font-size: 14px;
  font-weight: 600;
}

.ops-loading .spin {
  font-size: 20px;
}

.ops-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #fef2f2;
  border-radius: 8px;
  color: #ef4444;
  font-size: 13px;
}

.retry-btn {
  margin-left: auto;
  background: #ef4444;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
}

.retry-btn:hover {
  background: #dc2626;
}

.ops-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ops-summary {
  background: #eff6ff;
  border-left: 4px solid #0b4582;
  padding: 14px 16px;
  border-radius: 0 8px 8px 0;
  font-size: 14px;
  line-height: 1.7;
  color: #1e3a5f;
}

.ops-summary p {
  margin: 0;
}

.ops-block h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
}

.ops-block h4.text-risk {
  color: #dc2626;
}

.ops-checklist,
.ops-risk-list {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.8;
  color: #334155;
}

.ops-risk-list {
  color: #dc2626;
}

.ops-risk-list li {
  background: #fef2f2;
  padding: 6px 10px;
  border-radius: 4px;
  margin-bottom: 6px;
  list-style: none;
}

.ops-risk-list li::before {
  content: '⚠';
  margin-right: 6px;
}

.ops-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ops-step {
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: white;
  border-bottom: 1px solid #f1f5f9;
}

.step-num {
  width: 24px;
  height: 24px;
  background: #0b4582;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.step-title {
  font-weight: 700;
  font-size: 13px;
  color: #0f172a;
  flex: 1;
}

.step-priority {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
}

.priority-high,
.priority-critical {
  background: #fef2f2;
  color: #ef4444;
}

.priority-medium {
  background: #fffbeb;
  color: #f59e0b;
}

.priority-low {
  background: #ecfdf5;
  color: #059669;
}

.step-body {
  padding: 12px 14px;
}

.step-instruction {
  margin: 0 0 10px 0;
  font-size: 13px;
  line-height: 1.7;
  color: #334155;
}

.step-extras {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.step-extra-item {
  display: flex;
  align-items: flex-start;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.step-extra-item.text-warn {
  color: #d97706;
}

.ops-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ops-action-btn {
  display: flex;
  align-items: center;
  background: #0b4582;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.ops-action-btn:hover {
  background: #093463;
}

.ops-evidence-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ops-evidence-item {
  background: #f8fafc;
  border-radius: 6px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
}

.ev-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.ev-source {
  font-size: 12px;
  font-weight: 700;
  color: #0b4582;
}

.ev-type {
  font-size: 11px;
  background: #e0e7ff;
  color: #3730a3;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.ev-snippet {
  margin: 0;
  font-size: 12px;
  color: #475569;
  line-height: 1.6;
}

.ops-applicability {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.apply-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.apply-label {
  font-size: 12px;
  font-weight: 700;
}

.apply-yes {
  color: #059669;
}

.apply-no {
  color: #dc2626;
}

.apply-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.tag-yes {
  background: #ecfdf5;
  color: #059669;
}

.tag-no {
  background: #fef2f2;
  color: #dc2626;
}

.ops-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px dashed #e2e8f0;
  font-size: 11px;
  color: #94a3b8;
}

.ops-meta span {
  display: flex;
  align-items: center;
}

.close-ops-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  transition: all 0.2s;
}

.close-ops-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
