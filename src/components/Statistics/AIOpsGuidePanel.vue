<template>
  <Teleport to="body">
    <Transition name="ops-panel">
      <div v-if="visible" class="ops-panel-overlay" @click.self="close">
        <div class="ops-panel-shell">
          <header class="ops-panel-header">
            <div class="ops-panel-brand">
              <div class="ops-panel-badge">
                <Icon icon="lucide:bot" />
              </div>
              <div class="ops-panel-title">
                <h2>AI 运维指导</h2>
                <span class="ops-panel-sub">{{ buildingId }}</span>
              </div>
            </div>
            <div class="ops-panel-actions">
              <button class="ops-head-btn" @click="startAnalysis" :disabled="opsLoading" title="重新分析">
                <Icon icon="lucide:refresh-cw" :class="{ spin: opsLoading }" />
              </button>
              <button class="ops-head-btn close" @click="close" title="关闭">
                <Icon icon="lucide:x" />
              </button>
            </div>
          </header>

          <div class="ops-panel-body">
            <div v-if="!opsLoading && !opsError && !opsResult" class="ops-empty">
              <div class="ops-empty-icon">
                <Icon icon="lucide:brain-circuit" />
              </div>
              <h3>AI 运维分析</h3>
              <p>点击下方按钮，AI 将基于当前建筑数据生成运维指导方案</p>
              <button class="ops-start-btn" @click="startAnalysis">
                <Icon icon="lucide:sparkles" class="mr-1" />
                开始分析
              </button>
            </div>

            <div v-if="opsLoading" class="ops-loading">
              <div class="ops-loading-inner">
                <Icon icon="lucide:loader-2" class="spin ops-loading-icon" />
                <span class="ops-loading-text">{{ opsProgressMsg || 'AI 正在分析运维数据，请稍候...' }}</span>
              </div>
              <button class="cancel-ops-btn" @click="cancelOpsGuide">取消分析</button>
            </div>

            <div v-else-if="opsError" class="ops-error">
              <Icon icon="lucide:alert-circle" class="mr-1" />
              <span>{{ opsError }}</span>
              <button class="retry-btn" @click="startAnalysis">重试</button>
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
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import {
  connectOpsGuideStream,
  type OpsGuideResponse,
  type OpsGuideSSEEvent
} from '../../api/anomaly'

const props = defineProps<{
  visible: boolean
  buildingId: string
  selectedDay: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

const opsLoading = ref(false)
const opsError = ref('')
const opsResult = ref<OpsGuideResponse | null>(null)
const opsProgressMsg = ref('')
const opsAbortController = ref<AbortController | null>(null)

const close = () => {
  emit('update:visible', false)
}

const startAnalysis = () => {
  if (!props.buildingId) return
  opsLoading.value = true
  opsError.value = ''
  opsResult.value = null
  opsProgressMsg.value = '正在连接 AI 服务...'

  const controller = connectOpsGuideStream(
    {
      question: `建筑 ${props.buildingId} 的运维分析`,
      guide_mode: 'standard_sop',
      context: {
        building_id: props.buildingId,
        meter: 'electricity',
        time_range: {
          start: props.selectedDay ? `${props.selectedDay}T00:00:00Z` : new Date(Date.now() - 7 * 86400000).toISOString(),
          end: props.selectedDay ? `${props.selectedDay}T23:59:59Z` : new Date().toISOString()
        },
        page_context: {
          source: 'building_details_modal',
          page_type: 'statistics'
        }
      },
      include_knowledge: true,
      include_history: true,
      include_actions: true
    },
    (event: OpsGuideSSEEvent) => {
      handleOpsSSEEvent(event)
    },
    (err: Error) => {
      opsLoading.value = false
      opsAbortController.value = null
      opsError.value = err.message || 'AI 运维分析请求失败'
    },
    (fullResult: OpsGuideResponse | null) => {
      opsLoading.value = false
      opsAbortController.value = null
      if (fullResult) {
        opsResult.value = fullResult
      }
    }
  )

  opsAbortController.value = controller
}

const handleOpsSSEEvent = (event: OpsGuideSSEEvent) => {
  const { event: eventType, data } = event

  switch (eventType) {
    case 'status':
    case 'progress':
      opsProgressMsg.value = data?.message || data?.status || JSON.stringify(data)
      break
    case 'summary':
      if (!opsResult.value) {
        opsResult.value = {
          incident_id: '',
          status: 'streaming',
          summary: data?.summary || data || '',
          steps: [],
          meta: { generated_at: new Date().toISOString(), model: '' }
        }
      } else {
        opsResult.value.summary = data?.summary || data || ''
      }
      break
    case 'preconditions':
      if (opsResult.value) {
        opsResult.value.preconditions = Array.isArray(data) ? data : data?.preconditions || []
      }
      break
    case 'step':
      if (opsResult.value) {
        const step = data?.step || data
        if (step) {
          const existing = opsResult.value.steps.findIndex(s => s.step_id === step.step_id)
          if (existing >= 0) {
            opsResult.value.steps[existing] = step
          } else {
            opsResult.value.steps.push(step)
          }
        }
      }
      break
    case 'evidence':
      if (opsResult.value) {
        opsResult.value.evidence = Array.isArray(data) ? data : data?.evidence || []
      }
      break
    case 'actions':
      if (opsResult.value) {
        opsResult.value.actions = Array.isArray(data) ? data : data?.actions || []
      }
      break
    case 'risk_notice':
      if (opsResult.value) {
        opsResult.value.risk_notice = Array.isArray(data) ? data : data?.risk_notice || []
      }
      break
    case 'applicability':
      if (opsResult.value) {
        opsResult.value.applicability = data?.applicability || data
      }
      break
    case 'diagnosis_snapshot':
      if (opsResult.value) {
        opsResult.value.diagnosis_snapshot = data?.diagnosis_snapshot || data
      }
      break
    case 'meta':
      if (opsResult.value) {
        opsResult.value.meta = data?.meta || data
      }
      break
    case 'complete':
    case 'done':
      opsLoading.value = false
      if (data && typeof data === 'object' && data.steps) {
        opsResult.value = data
      }
      opsProgressMsg.value = ''
      break
    case 'error':
      opsLoading.value = false
      opsError.value = data?.message || data?.detail || 'AI 运维分析出错'
      opsProgressMsg.value = ''
      break
    default:
      if (data && typeof data === 'object' && data.steps) {
        opsResult.value = data
        opsLoading.value = false
        opsProgressMsg.value = ''
      }
      break
  }
}

const cancelOpsGuide = () => {
  if (opsAbortController.value) {
    opsAbortController.value.abort()
    opsAbortController.value = null
  }
  opsLoading.value = false
  opsProgressMsg.value = ''
}

watch(() => props.visible, (val) => {
  if (val && !opsResult.value && !opsLoading.value) {
    startAnalysis()
  }
})

onUnmounted(() => {
  cancelOpsGuide()
})
</script>

<style scoped>
.ops-panel-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(15, 23, 42, 0.3);
  backdrop-filter: blur(2px);
  z-index: 10000;
  display: flex;
  justify-content: flex-end;
}

.ops-panel-shell {
  width: 520px;
  max-width: 90vw;
  height: 100vh;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 30px rgba(0, 0, 0, 0.12);
  font-family: 'Plus Jakarta Sans', -apple-system, 'PingFang SC', sans-serif;
}

.ops-panel-header {
  background: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.ops-panel-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ops-panel-badge {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #0b4582, #1565c0);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.ops-panel-title h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}

.ops-panel-sub {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.ops-panel-actions {
  display: flex;
  gap: 4px;
}

.ops-head-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 16px;
}

.ops-head-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.ops-head-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ops-head-btn.close:hover {
  background: #fef2f2;
  color: #ef4444;
}

.ops-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.ops-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.ops-empty-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #0b4582;
  margin-bottom: 16px;
}

.ops-empty h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.ops-empty p {
  margin: 0 0 20px 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  max-width: 280px;
}

.ops-start-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #0b4582, #1565c0);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
}

.ops-start-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(11, 69, 130, 0.3);
}

.ops-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 20px;
}

.ops-loading-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.ops-loading-icon {
  font-size: 32px;
  color: #0b4582;
}

.ops-loading-text {
  color: #0b4582;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.cancel-ops-btn {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.cancel-ops-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.ops-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #fef2f2;
  border-radius: 10px;
  color: #ef4444;
  font-size: 13px;
}

.retry-btn {
  margin-left: auto;
  background: #ef4444;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #dc2626;
}

.ops-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: opsFadeIn 0.35s ease;
}

@keyframes opsFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.ops-summary {
  background: #eff6ff;
  border-left: 4px solid #0b4582;
  padding: 14px 16px;
  border-radius: 0 10px 10px 0;
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
  border-radius: 6px;
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
  border-radius: 10px;
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
  border-radius: 8px;
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
  border-radius: 8px;
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

.mr-1 { margin-right: 4px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

.ops-panel-enter-active {
  transition: opacity 0.25s ease;
}
.ops-panel-enter-active .ops-panel-shell {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.ops-panel-leave-active {
  transition: opacity 0.2s ease;
}
.ops-panel-leave-active .ops-panel-shell {
  transition: transform 0.2s ease;
}
.ops-panel-enter-from {
  opacity: 0;
}
.ops-panel-enter-from .ops-panel-shell {
  transform: translateX(100%);
}
.ops-panel-leave-to {
  opacity: 0;
}
.ops-panel-leave-to .ops-panel-shell {
  transform: translateX(100%);
}
</style>
