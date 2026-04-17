import request from '../utils/request'

// ─── Types: TimeRange ────────────────────────────────────────────
export interface TimeRange {
  start: string
  end: string
}

// ─── Types: Dashboard Overview / AnomalySummary ──────────────────
export interface AnomalySummary {
  anomaly_id: string
  building_id: string
  device_id?: string | null
  meter?: string
  severity: string
  status: string
  title: string
  start_time: string
  resolution_status?: string
}

export interface MetricCard {
  label?: string
  value?: number
  unit?: string
  change_rate?: number
}

export interface DashboardOverviewResponse {
  time_range: TimeRange
  metrics: MetricCard[]
  top_anomalies: AnomalySummary[]
  ai_summary_hint?: string
}

export interface EnergyAnomalySeverityStats {
  total: number
  high: number
  medium: number
  low: number
}

export interface EnergyAnomalyListResponse {
  time_range: TimeRange
  items: AnomalySummary[]
  pagination: {
    page: number
    page_size: number
    total: number
  }
  severity_stats: EnergyAnomalySeverityStats
}

// ─── Types: Energy Anomaly Analysis ──────────────────────────────
export interface EnergyAnomalyAnalysisRequest {
  building_id: string
  meter: string
  time_range: TimeRange
  granularity?: string
  analysis_mode?: string
  include_weather_context?: boolean
}

export interface AnomalyDetectorBreakdownItem {
  detected_by: string
  event_type: string
  count: number
}

export interface DetectedAnomalyEvent {
  event_id: string
  start_time: string
  end_time: string
  severity: string
  detected_by: string
  event_type: string
  description: string
  peak_deviation?: number | null
}

export interface DetectedAnomalyPoint {
  timestamp: string
  actual_value: number
  baseline_value: number
  deviation_rate: number
  severity: 'low' | 'medium' | 'high'
}

export interface EnergyPoint {
  timestamp: string
  building_id?: string | null
  meter?: string | null
  value: number
}

export interface EnergySeries {
  building_id?: string | null
  meter: string
  unit?: string | null
  points: EnergyPoint[]
}

export interface EnergyAnomalyAnalysisResponse {
  building_id: string
  meter: string
  time_range: TimeRange
  is_anomalous: boolean
  summary: string
  analysis_mode?: string
  event_count?: number
  detector_breakdown?: AnomalyDetectorBreakdownItem[]
  detected_events?: DetectedAnomalyEvent[]
  series: EnergySeries
  weather_context?: any[] | null
}

// ─── Types: AI Analyze Anomaly ───────────────────────────────────
export interface AIAnalyzeAnomalyRequest {
  building_id: string
  meter: string
  time_range: TimeRange
  granularity?: string
  analysis_mode?: string
  include_weather_context?: boolean
  question?: string | null
  include_history_feedback?: boolean
  max_candidate_causes?: number
}

export interface AICandidateCause {
  cause_id: string
  title: string
  description: string
  confidence: number
  rank: number
  recommended_checks?: string[]
  evidence_ids?: string[]
}

export interface AIEvidenceItem {
  evidence_id: string
  type: string
  source: string
  snippet: string
  weight?: number | null
}

export interface AIActionItem {
  label: string
  action_type: string
  target: string
  target_id?: string | null
}

export interface AIFeedbackPrompt {
  enabled?: boolean
  message: string
  allow_score?: boolean
  allow_comment?: boolean
}

export interface AIAnalyzeAnomalyMeta {
  building_id: string
  meter: string
  time_range: TimeRange
  analysis_mode?: string
  generated_at: string
  model: string
  event_count?: number
  detector_breakdown?: AnomalyDetectorBreakdownItem[]
  knowledge_hits?: number
  history_feedback_hits?: number
  offline_context_used?: boolean
  used_fallback?: boolean
}

export interface AIAnalyzeAnomalyResponse {
  analysis_id: string
  status: string
  summary: string
  answer: string
  candidate_causes: AICandidateCause[]
  highlights?: string[]
  evidence?: AIEvidenceItem[]
  actions?: AIActionItem[]
  risk_notice: string
  feedback_prompt: AIFeedbackPrompt
  meta: AIAnalyzeAnomalyMeta
}

// ─── Types: AI Ops Guide ─────────────────────────────────────────
export interface OpsGuideIncidentRef {
  incident_id?: string
  message_id?: string
}

export interface OpsGuidePageContext {
  source?: string
  page_type?: string
  current_chart_range?: string
}

export interface OpsGuideOperatorContext {
  operator_id?: string
  operator_name?: string
}

export interface OpsGuideAnomalySnapshot {
  summary?: string
  analysis_mode?: string
  event_count?: number
  detector_breakdown?: AnomalyDetectorBreakdownItem[]
  event_ids?: string[]
}

export interface OpsGuideContext {
  building_id: string
  meter?: string
  time_range?: TimeRange
  incident_ref?: OpsGuideIncidentRef
  page_context?: OpsGuidePageContext
  operator_context?: OpsGuideOperatorContext
  anomaly_snapshot?: OpsGuideAnomalySnapshot
}

export interface OpsGuideRequest {
  question?: string
  guide_mode?: 'standard_sop' | 'quick_check' | 'deep_diagnosis'
  context?: OpsGuideContext
  include_knowledge?: boolean
  include_history?: boolean
  include_actions?: boolean
}

export interface OpsGuideStep {
  step_id: string
  title: string
  instruction: string
  priority: string
  expected_result: string
  if_not_met: string
}

export interface OpsGuideEvidence {
  source_type: string
  source: string
  snippet: string
  score: number
}

export interface OpsGuideAction {
  label: string
  action_type: string
  target: string
}

export interface OpsGuideApplicability {
  applies_to: string[]
  not_applies_to: string[]
}

export interface OpsGuideDiagnosisSnapshot {
  analysis_mode?: string
  event_count?: number
  detector_breakdown?: AnomalyDetectorBreakdownItem[]
  candidate_cause_titles?: string[]
}

export interface OpsGuideMeta {
  generated_at: string
  model: string
  used_tools?: string[]
  context_source?: string
  knowledge_hits?: number
  history_feedback_hits?: number
  stage_timings_ms?: Record<string, number>
}

export interface OpsGuideResponse {
  incident_id: string
  status: string
  summary: string
  preconditions?: string[]
  steps: OpsGuideStep[]
  evidence?: OpsGuideEvidence[]
  actions?: OpsGuideAction[]
  risk_notice?: string[]
  applicability?: OpsGuideApplicability
  diagnosis_snapshot?: OpsGuideDiagnosisSnapshot
  meta: OpsGuideMeta
}

// ─── Types: Anomaly Feedback ─────────────────────────────────────
export interface CandidateFeedbackItem {
  cause_id: string
  score: number
  title?: string | null
}

export interface AnomalyFeedbackRequest {
  analysis_id: string
  building_id: string
  meter: string
  time_range: TimeRange
  selected_cause_id: string
  selected_score: number
  selected_cause_title?: string | null
  candidate_feedbacks?: CandidateFeedbackItem[]
  comment?: string | null
  operator_id?: string | null
  operator_name?: string | null
  resolution_status: string
  model_name?: string | null
  analysis_mode?: string | null
}

export interface AnomalyFeedbackResponse {
  feedback_id: string
  analysis_id: string
  stored: boolean
  message: string
  selected_cause: { cause_id: string; title: string; score: number }
  meta: { building_id: string; meter: string; resolution_status: string; created_at: string }
}

// ─── Types: SSE Progress ─────────────────────────────────────────
export interface AnomalyProgressEvent {
  action: string
  message: string
  context: string
}

// ─── API Functions ───────────────────────────────────────────────

/** 触发离线异常检测任务 */
export const triggerDetection = () => {
  return request.post<{ status: string; message: string }>('/dataset/trigger-detection')
}

/** 获取 Dashboard Overview（含 top_anomalies） */
export const getDashboardOverview = (params?: {
  start_time?: string
  end_time?: string
  site_id?: string
  building_id?: string
  chart_range?: 'day' | 'week' | 'month'
}) => {
  return request.get<DashboardOverviewResponse>('/dashboard/overview', {
    params: { chart_range: 'week', ...params },
    timeout: 60000 // 大数据量分析后响应可能较慢
  })
}

/** 获取异常事件列表 */
export const getEnergyAnomalies = (params?: {
  start_time?: string
  end_time?: string
  site_id?: string
  building_id?: string
  meter?: string
  severity?: 'high' | 'medium' | 'low'
  page?: number
  page_size?: number
}) => {
  return request.get<EnergyAnomalyListResponse>('/energy/anomalies', {
    params: { page: 1, page_size: 10, ...params },
    timeout: 60000
  })
}

/** 获取建筑异常分析详情 */
export const getAnomalyAnalysis = (data: EnergyAnomalyAnalysisRequest) => {
  return request.post<EnergyAnomalyAnalysisResponse>('/energy/anomaly-analysis', data, {
    timeout: 60000 // 异常分析可能涉及大量数据计算
  })
}

/** AI 故障诊断 */
export const aiAnalyzeAnomaly = (data: AIAnalyzeAnomalyRequest) => {
  return request.post<AIAnalyzeAnomalyResponse>('/ai/analyze-anomaly', data, {
    timeout: 120000 // AI 分析需要较长超时
  })
}

/** AI 运维指导（普通 POST，保留兼容） */
export const getOpsGuide = (data: OpsGuideRequest) => {
  return request.post<OpsGuideResponse>('/ai/ops-guide', data, {
    timeout: 300000
  })
}

export interface OpsGuideSSEEvent {
  event: string
  data: any
}

export interface AIStatusResponse {
  status: string
  message?: string
  progress?: number
  current_tool?: string
  [key: string]: any
}

export const getAIStatus = () => {
  return request.get<AIStatusResponse>('/ai/status', {
    timeout: 10000
  })
}

export function connectOpsGuideStream(
  data: OpsGuideRequest,
  onEvent: (event: OpsGuideSSEEvent) => void,
  onError?: (err: Error) => void,
  onComplete?: (fullResult: OpsGuideResponse | null) => void
): AbortController {
  const controller = new AbortController()

  const baseURL = '/api'
  const url = `${baseURL}/ai/ops-guide`

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    },
    body: JSON.stringify(data),
    signal: controller.signal
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text()
        let detail = errorText
        try {
          const errorJson = JSON.parse(errorText)
          detail = errorJson.detail || errorJson.message || errorText
        } catch {}
        throw new Error(`HTTP ${response.status}: ${detail}`)
      }

      if (!response.body) {
        throw new Error('Response body is null, SSE not supported')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullResult: OpsGuideResponse | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let currentEvent = ''
        let currentData = ''

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            currentData = line.slice(5).trim()
          } else if (line === '' && (currentEvent || currentData)) {
            try {
              const parsed = JSON.parse(currentData)
              const sseEvent: OpsGuideSSEEvent = {
                event: currentEvent || 'message',
                data: parsed
              }
              onEvent(sseEvent)

              if (currentEvent === 'complete' || currentEvent === 'done') {
                fullResult = parsed
              }
            } catch {
              onEvent({
                event: currentEvent || 'message',
                data: currentData
              })
            }
            currentEvent = ''
            currentData = ''
          }
        }
      }

      onComplete?.(fullResult)
    })
    .catch((err) => {
      if (err.name === 'AbortError') return
      onError?.(err)
    })

  return controller
}

/** 提交异常反馈 */
export const submitAnomalyFeedback = (data: AnomalyFeedbackRequest) => {
  return request.post<AnomalyFeedbackResponse>('/ai/anomaly-feedback', data)
}

/**
 * 建立 SSE 连接监听异常检测进度
 * @returns EventSource 实例，调用者需在合适时机手动 close()
 */
export const connectAnomalyProgress = (
  onMessage: (event: AnomalyProgressEvent) => void,
  onError?: (err: Event) => void,
  onComplete?: () => void
): EventSource => {
  const baseURL = '/api'
  const es = new EventSource(`${baseURL}/dataset/anomaly-progress`)

  es.onmessage = (event) => {
    try {
      const data: AnomalyProgressEvent = JSON.parse(event.data)
      onMessage(data)
      // 用 action 字段判断是否完成
      if (data.action === 'anomaly_detect_complete') {
        onComplete?.()
        es.close()
      }
    } catch (e) {
      console.warn('SSE parse error:', e)
    }
  }

  es.onerror = (err) => {
    onError?.(err)
    // 如果连接直接关闭（后端任务已完成），也算完成
    if (es.readyState === EventSource.CLOSED) {
      onComplete?.()
    }
  }

  return es
}
