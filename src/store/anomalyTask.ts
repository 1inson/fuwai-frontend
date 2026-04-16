import { reactive, ref, toRefs } from 'vue'
import { connectAnomalyProgress, type AnomalyProgressEvent } from '../api/anomaly'

interface TaskState {
  detecting: boolean
  detectProgress: string
  detectLogs: string[]
  detectError: string
}

const STORAGE_KEY = 'fw_anomaly_detect_logs'

const loadLogs = (): string[] => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch { }
  }
  return []
}

const state = reactive<TaskState>({
  detecting: false,
  detectProgress: '',
  detectLogs: loadLogs(),
  detectError: ''
})

let sseSource: EventSource | null = null

const saveLogs = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.detectLogs))
}

/**
 * 核心逻辑：尝试连接 SSE 并监听进度。
 * 如果连接成功并收到有效进度，则维持 detecting = true。
 */
export const initAnomalyTaskMonitor = (onComplete?: () => void) => {
  if (sseSource) return // 避免重复连接

  sseSource = connectAnomalyProgress(
    (event: AnomalyProgressEvent) => {
      // 收到任何进度信息，都说明任务正在跑
      state.detecting = true
      state.detectProgress = event.message
      
      // 只有新消息才入栈
      if (state.detectLogs[state.detectLogs.length - 1] !== event.message) {
        state.detectLogs.push(event.message)
        if (state.detectLogs.length > 200) state.detectLogs.shift()
        saveLogs()
      }
    },
    (err) => {
      console.warn('异常检测 SSE 监听断开或异常:', err)
      // SSE 浏览器会自动重连，所以这里通常不需要重设 detecting = false
    },
    () => {
      // 后端明确发送完成信号 (EventSource close 或特定数据)
      state.detecting = false
      state.detectProgress = '分析完成'
      state.detectLogs.push('--- 分析任务已完成 ---')
      saveLogs()
      if (onComplete) onComplete()
      sseSource?.close()
      sseSource = null
    }
  )
}

export const setDetectingStatus = (status: boolean) => {
  state.detecting = status
  if (status) {
    state.detectError = ''
    state.detectProgress = '初始化任务...'
  }
}

export const setDetectError = (msg: string) => {
  state.detectError = msg
  state.detecting = false
}

export const clearDetectLogs = () => {
  state.detectLogs = []
  saveLogs()
}

export const useAnomalyTaskStore = () => {
  return {
    ...toRefs(state),
    initAnomalyTaskMonitor,
    setDetectingStatus,
    setDetectError,
    clearDetectLogs
  }
}
