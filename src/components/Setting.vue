<template>
  <main class="settings-page">
    <header class="page-header">
      <div class="title-area">
        <h2>系统设置</h2>
        <p class="subtitle">管理您的个人资料、数据连接及 AI 引擎配置</p>
      </div>
      <div class="action-buttons">
        <button class="btn btn-default">取消更改</button>
        <button class="btn btn-primary" @click="saveSettings">保存设置</button>
      </div>
    </header>

    <div class="settings-grid">

      <div class="grid-column">

        <div class="card profile-card">
          <div class="profile-header">
            <div class="avatar-wrapper">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Alex Chen" class="avatar" />
              <button class="edit-avatar-btn">编</button>
            </div>
            <div class="profile-title">
              <h3>Alex Chen</h3>
              <span class="user-id">ID: CSCEC-2024-0892</span>
              <div class="status-badge"><span class="dot"></span> 在线状态</div>
            </div>
          </div>

          <ul class="info-list">
            <li><span class="label">所属部门</span><span class="value">能源管理事业部</span></li>
            <li><span class="label">当前职位</span><span class="value">首席工程师</span></li>
            <li><span class="label">联系电话</span><span class="value font-num">+86 138 **** 8888</span></li>
            <li><span class="label">电子邮箱</span><span class="value font-num">alex.chen@cscec.com</span></li>
          </ul>
        </div>

        <div class="card notify-card">
          <div class="card-header">
            <h3>智能通知</h3>
          </div>
          <p class="card-desc">通知页面配置</p>

          <div class="toggle-list">
            <div class="toggle-item" v-for="(item, index) in notifySettings" :key="index">
              
              <div class="item-info">
                <h4>{{ item.title }}</h4>
                <p>{{ item.desc }}</p>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="item.enabled" />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div class="card time-sync-card">
          <div class="card-header">
            <h3>系统时间与同步</h3>
          </div>

          <div class="time-display">
            <div class="time-value">{{ currentTime }}</div>
            <div class="time-date">{{ currentDate }}</div>
          </div>

          <div class="input-group">
            <label>目标时间设置（数据集时间范围：2015-2016）</label>
            <input type="datetime-local" v-model="targetTime" class="datetime-input" />
          </div>

          

          <div class="input-group">
            <label>时区设置</label>
            <select v-model="timezone">
              <option value="GMT+08:00">(GMT+08:00) 北京、上海、香港</option>
              <option value="GMT+09:00">(GMT+09:00) 东京、首尔</option>
              <option value="GMT+00:00">(GMT+00:00) 伦敦、都柏林</option>
              <option value="GMT-05:00">(GMT-05:00) 纽约、华盛顿</option>
            </select>
          </div>

          <button class="sync-time-btn" @click="applyTime">
            立即修改当前时间
          </button>
          <button class="sync-time-btn mt-3" @click="restoreTime">业务系统恢复真实时间</button>
        </div>
      </div>

      <div class="grid-column">

        <div class="card data-card">
          <div class="card-header">
            <h3>数据管理</h3>
          </div>

          <div class="data-source">
            <span class="source-label">当前数据源：</span>
            <div class="source-name">BDG2 (Building Data Genome Project 2)</div>
          </div>

          <div class="data-stats">
            <div class="stat-box">
              <span class="stat-label">元数据表 (metadata)</span>
              <div class="stat-value green">1,284,502 <span class="unit">条</span></div>
            </div>
            <div class="stat-box">
              <span class="stat-label">天气表 (weather)</span>
              <div class="stat-value green">1,284,502 <span class="unit">条</span></div>
            </div>
            <div class="stat-box">
              <span class="stat-label">能耗表 (meters)</span>
              <div class="stat-value green">1,284,502 <span class="unit">条</span></div>
            </div>
          </div>

          <div class="storage-action-row">
            <div class="storage-info">
              <div class="storage-text">
                <span class="label">云存储使用情况</span>
                <span class="usage"><b>1.8GB</b> / 5.0GB</span>
                <span class="percent">36%</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width: 36%"></div></div>
            </div>
            <button class="clear-cache-btn">
              清除缓存
            </button>
          </div>
        </div>

        <div class="card ai-card">
          <div class="card-header">
            <h3>AI引擎配置</h3>
            <span v-if="!aiLoading" class="connection-status" :class="{ active: aiSettings?.llm?.api_key_configured }">
              {{ aiSettings?.llm?.api_key_configured ? '已连接 Active' : '未连接 Inactive' }}
            </span>
          </div>
          <p class="card-desc">配置核心 LLM 服务及 RAGFlow 知识库连接</p>

          <template v-if="aiLoading">
            <div class="ai-loading">加载 AI 配置中...</div>
          </template>
          <template v-else-if="aiError">
            <div class="ai-error">{{ aiError }}</div>
            <button class="retry-btn" @click="fetchAISettings">重新加载</button>
          </template>
          <template v-else>
            <div class="input-group">
              <label>LLM 服务地址 (Base URL)</label>
              <input type="text" v-model="aiSettings.llm.base_url" />
            </div>

            <div class="input-group">
              <label>API KEY</label>
              <div class="input-with-icon">
                <input :type="showApiKey ? 'text' : 'password'" :value="aiSettings.llm.api_key || (aiSettings.llm.api_key_configured ? '********************' : '')" @input="onApiKeyInput" />
                <div class="input-actions">
                  <button @click="showApiKey = !showApiKey" class="icon-btn">显示</button>
                  <button class="icon-btn" @click="copyApiKey">复制</button>
                </div>
              </div>
            </div>

            <div class="input-group">
              <label>模型名称 (Model)</label>
              <input type="text" v-model="aiSettings.llm.model" />
            </div>

            <div class="ai-params-row">
              <div class="input-group half">
                <label>温度 (Temperature)</label>
                <input type="number" step="0.1" min="0" max="2" v-model.number="aiSettings.llm.temperature" />
              </div>
              <div class="input-group half">
                <label>Top-P</label>
                <input type="number" step="0.1" min="0" max="1" v-model.number="aiSettings.llm.top_p" />
              </div>
            </div>

            <div class="input-group">
              <label>RAGFlow API 地址</label>
              <input type="text" v-model="aiSettings.ragflow.api_url" />
            </div>

            <div class="toggle-row">
              <div class="toggle-left">
                <span class="toggle-label">使用知识图谱</span>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="aiSettings.features.enable_knowledge" />
                <span class="slider"></span>
              </label>
            </div>
            <p class="kg-hint">开启后AI模型将结合领域知识图谱，对结构化历史文本与「用能策略」关联规则（内建）</p>
          </template>
        </div>

        <div class="card upload-card">
          <div class="upload-area">
            <h4>导入数据集</h4>
            <p>将文件拖到此处或 <a href="#" @click.prevent="openModal">点击上传</a></p>
            <span class="file-types">注：目前仅支持单个文件上传，支持格式为 CSV / JSON / XLSX，最大 500MB。</span>
          </div>
        </div>

      </div>
    </div>

    <!-- 上传数据集确认弹窗 -->
    <div v-if="showUploadModal" class="upload-modal-overlay" @click.self="closeModal">
      <div class="upload-modal">
        <div class="modal-header">
          <div class="modal-title-area">
            <h3>上传数据集确认</h3>
          </div>
          <button class="modal-close-btn" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <p class="modal-subtitle">请找到上传的原始数据文件信息，并分配数据类型</p>

          <div class="info-banner">
            <span>无法直接查看文件上传后，该操作仅对文件进行元数据匹配。</span>
          </div>

          <!-- 文件信息区 -->
          <div class="file-info-card" @click="triggerFileSelect">
            <div class="file-info-left">
              <div class="file-detail">
                <span class="file-name-text">{{ uploadedFileName || '未选择文件' }}</span>
                <span class="file-size-text">{{ uploadedFileSize }}</span>
              </div>
            </div>
            <span class="file-tag">CSV 文件</span>
          </div>

          <!-- 数据源类型 Tab -->
          <div class="section-label">数据源类型</div>
          <div class="tab-group">
            <button
              v-for="tab in dataSourceTabs"
              :key="tab.key"
              class="tab-item"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >{{ tab.label }}</button>
          </div>

          <!-- 子类型选择（仅表计原始数据时显示） -->
          <template v-if="activeTab === 'raw'">
            <div class="sub-type-section">
              <label class="sub-label">子数据类型（按表计类别）</label>
              <select v-model="selectedMeterType" class="meter-select">
                <option disabled value="">请选择表计类型</option>
                <option v-for="m in meterTypes" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
            </div>
          </template>

          <!-- 提示信息条 -->
          <div class="hint-bar">
            <span>确认后，系统将开启数据解析和自动校验流程，预计耗时约 45 秒，上传过程中请保持页面活跃。</span>
          </div>

          <!-- 上传状态提示 -->
          <div v-if="uploadMessage" class="upload-status-bar" :class="{ success: uploadSuccess, error: !uploadSuccess && !uploading }">
            <span class="status-icon">{{ uploading ? '执行中...' : (uploadSuccess ? '已完成' : '失败') }}</span>
            <span class="status-text">{{ uploadMessage }}</span>
          </div>
        </div>

        <input
          ref="fileInputRef"
          type="file"
          accept=".csv,.xlsx,.xls"
          style="display: none"
          @change="handleFileSelected"
        />

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal" :disabled="uploading">取消</button>
          <button class="btn-confirm" :disabled="!canConfirm || uploading" @click="confirmUpload">
            <span v-if="!uploading" class="btn-confirm-icon">↻</span>
            {{ uploading ? '上传中...' : '确认上传' }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { getRuntimeAISettings, type RuntimeAISettingsResponse, uploadMetadataDataset, uploadWeatherDataset, uploadRawMeterDataset } from '../api/system'
import { useTimeManager } from '../utils/timeManager'

const notifySettings = reactive([
  { title: '异常预警提醒', desc: '能耗突变破预设阈值时即时通知', iconClass: 'red', enabled: true },
  { title: '告警通知', desc: '系统层级安全告警与维护提示', iconClass: 'gray', enabled: true },
  { title: '待办任务提醒', desc: '每日节能任务与巡检任务提醒', iconClass: 'blue', enabled: false },
  { title: '功能通知', desc: '系统功能升级与周报推送', iconClass: 'gray', enabled: true }
])

const showApiKey = ref(false)
const timezone = ref('GMT+08:00')

const aiLoading = ref(true)
const aiError = ref('')
const aiSettings = reactive<RuntimeAISettingsResponse>({
  config_path: '',
  llm: {
    base_url: '',
    api_key: '',
    api_key_configured: false,
    model: '',
    timeout_seconds: 420,
    temperature: 0.2,
    top_p: 0.9
  },
  ragflow: {
    api_url: '',
    api_key: '',
    api_key_configured: false,
    timeout_seconds: 60,
    chat_model: 'ragflow-chat',
    dataset_ids: [],
    default_chat_id: ''
  },
  features: {
    enable_history: true,
    enable_knowledge: true
  }
})

const fetchAISettings = async () => {
  aiLoading.value = true
  aiError.value = ''
  try {
    const res = await getRuntimeAISettings() as any
    Object.assign(aiSettings, res)
    if (res.llm) Object.assign(aiSettings.llm, res.llm)
    if (res.ragflow) Object.assign(aiSettings.ragflow, res.ragflow)
    if (res.features) Object.assign(aiSettings.features, res.features)
  } catch (err) {
    console.error('获取AI配置失败:', err)
    aiError.value = '无法连接后端服务，请检查网络或服务状态'
  } finally {
    aiLoading.value = false
  }
}

const onApiKeyInput = (e: Event) => {
  aiSettings.llm.api_key = (e.target as HTMLInputElement).value
}

const { state: timeState, startCustomTime, resetToNaturalTime, syncTimeToBackend, getCurrentTimeString } = useTimeManager()

const currentTime = ref('14:32:05')
const currentDate = ref('2026年10月4日 星期四')
const targetTime = ref('')
let timeTimer: number | null = null

const timezoneMap: Record<string, string> = {
  'GMT+08:00': 'Asia/Shanghai',
  'GMT+09:00': 'Asia/Tokyo',
  'GMT+00:00': 'Europe/London',
  'GMT-05:00': 'America/New_York'
}

const getTimezoneOffset = (tz: string): string => {
  const map: Record<string, string> = {
    'GMT+08:00': '+08:00',
    'GMT+09:00': '+09:00',
    'GMT+00:00': '+00:00',
    'GMT-05:00': '-05:00'
  }
  return map[tz] || '+08:00'
}

const updateTime = () => {
  const current = new Date(getCurrentTimeString())
  formatAndDisplayTime(current)
}

const formatAndDisplayTime = (date: Date) => {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  currentTime.value = `${h}:${m}:${s}`

  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  currentDate.value = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`
}

const reverseTimezoneMap: Record<string, string> = {
  'Asia/Shanghai': 'GMT+08:00',
  'Asia/Tokyo': 'GMT+09:00',
  'Europe/London': 'GMT+00:00',
  'America/New_York': 'GMT-05:00'
}

onMounted(() => {
  updateTime()
  timeTimer = window.setInterval(updateTime, 1000)
  fetchAISettings()
  // Recover UI state
  if (timeState.timezone) {
    timezone.value = reverseTimezoneMap[timeState.timezone] || 'GMT+08:00'
  }
})

onUnmounted(() => {
  if (timeTimer !== null) clearInterval(timeTimer)
})

const applyTime = async () => {
  if (!targetTime.value) {
    alert('请先选择目标时间')
    return
  }
  const offset = getTimezoneOffset(timezone.value)
  const isoTime = `${targetTime.value}${offset}`
  const ianaTz = timezoneMap[timezone.value] || 'Asia/Shanghai'

  try {
    startCustomTime(isoTime, ianaTz)
    const res = await syncTimeToBackend() as any
    alert(`系统时间已修改为目标时间（来源：${res?.source || 'custom_time'}）`)
  } catch (err) {
    console.error('设置时间失败:', err)
    alert('时间设置失败，请检查网络连接或后端服务')
  }
}

const restoreTime = async () => {
  try {
    resetToNaturalTime()
    await syncTimeToBackend()
    alert('系统时间已恢复为真实环境时间')
  } catch (err) {
    alert('时间恢复失败，请检查网络即可')
  }
}

const copyApiKey = () => {
  navigator.clipboard.writeText(aiSettings.llm.api_key)
  alert('API Key 已复制到剪贴板')
}

const saveSettings = () => {
  alert('设置正在保存...')
}

const showUploadModal = ref(false)
const uploading = ref(false)
const uploadMessage = ref('')
const uploadSuccess = ref(false)
const uploadedFile = ref<File | null>(null)
const uploadedFileName = ref('')
const uploadedFileSize = ref('')
const activeTab = ref<'weather' | 'metadata' | 'raw'>('raw')
const selectedMeterType = ref('')

const fileInputRef = ref<HTMLInputElement | null>(null)

const dataSourceTabs = [
  { key: 'weather' as const, label: '天气数据' },
  { key: 'metadata' as const, label: '建筑元数据' },
  { key: 'raw' as const, label: '表计原始数据' }
]

const meterTypes = [
  { value: 'electricity', label: '电表 (Electricity)' },
  { value: 'water', label: '水表 (Water)' },
  { value: 'gas', label: '燃气表 (Gas)' },
  { value: 'steam', label: '蒸汽表 (Steam)' },
  { value: 'hotwater', label: '热水表 (Hotwater)' },
  { value: 'chilledwater', label: '冷水表 (Chilledwater)' },
  { value: 'irrigation', label: '灌溉表 (Irrigation)' },
  { value: 'solar', label: '太阳能表 (Solar)' }
]

const canConfirm = computed(() => {
  if (!uploadedFile.value) return false
  if (activeTab.value === 'raw') return !!selectedMeterType.value
  return true
})

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const openModal = () => {
  resetUploadState()
  showUploadModal.value = true
}

const closeModal = () => {
  if (!uploading.value) {
    showUploadModal.value = false
    resetUploadState()
  }
}

const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

const handleFileSelected = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadedFile.value = file
  uploadedFileName.value = file.name
  uploadedFileSize.value = formatFileSize(file.size)

  if (!canConfirm.value && activeTab.value === 'raw') {
    selectedMeterType.value = ''
  }
}

const confirmUpload = async () => {
  if (!uploadedFile.value || !canConfirm.value) return

  uploading.value = true
  uploadMessage.value = ''
  uploadSuccess.value = false

  try {
    let res
    if (activeTab.value === 'metadata') {
      res = await uploadMetadataDataset(uploadedFile.value)
    } else if (activeTab.value === 'weather') {
      res = await uploadWeatherDataset(uploadedFile.value)
    } else {
      res = await uploadRawMeterDataset(selectedMeterType.value, uploadedFile.value)
    }
    uploadMessage.value = (res as any).message || '文件已接收，后台任务已入队'
    uploadSuccess.value = true
    setTimeout(() => {
      showUploadModal.value = false
      resetUploadState()
    }, 2000)
  } catch (err: any) {
    console.error('上传失败:', err)
    uploadMessage.value = err?.response?.data?.detail || err?.message || '上传失败，请重试'
    uploadSuccess.value = false
  } finally {
    uploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

const resetUploadState = () => {
  uploadedFile.value = null
  uploadedFileName.value = ''
  uploadedFileSize.value = ''
  activeTab.value = 'raw'
  selectedMeterType.value = ''
  uploading.value = false
  uploadMessage.value = ''
  uploadSuccess.value = false
}
</script>

<style scoped>
.settings-page {
  padding: 30px 40px;
  background-color: #f4f7f9;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.page-header h2 { margin: 0 0 8px 0; font-size: 24px; color: #111; font-weight: 600;}
.page-header .subtitle { margin: 0; color: #666; font-size: 14px; }

.action-buttons { display: flex; gap: 12px; }
.btn { padding: 10px 24px; border-radius: 20px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: 0.2s;}
.btn-default { background: #eef2f6; color: #0b4582; border: 1px solid #d0dbe5;}
.btn-default:hover { background: #e0e8f0; }
.btn-primary { background: #0056e0; color: white; box-shadow: 0 4px 10px rgba(0, 86, 224, 0.2);}
.btn-primary:hover { background: #004ac2; }

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}
.grid-column { display: flex; flex-direction: column; gap: 24px; }

.card {
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}
.card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px;}
.card-header h3 { margin: 0; font-size: 18px; color: #111; font-weight: 600;}
.card-desc { margin: 0 0 20px 0; font-size: 13px; color: #888; }
.font-num { font-family: 'Courier New', Courier, monospace; font-weight: 600;}

.profile-header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px dashed #eee;}
.avatar-wrapper { position: relative; width: 80px; height: 80px; }
.avatar { width: 100%; height: 100%; border-radius: 16px; object-fit: cover;}
.edit-avatar-btn { position: absolute; bottom: -6px; right: -6px; background: #0056e0; color: white; border: none; border-radius: 50%; width: 26px; height: 26px; font-size: 12px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.2);}
.profile-title h3 { margin: 0 0 4px 0; font-size: 20px;}
.user-id { display: inline-block; font-size: 13px; color: #0056e0; background: #eff6ff; padding: 2px 8px; border-radius: 4px; font-weight: 600; margin-bottom: 8px;}
.status-badge { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #666; background: #f9f9f9; width: max-content; padding: 2px 10px; border-radius: 12px;}
.status-badge .dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; }

.info-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 20px;}
.info-list li { display: flex; justify-content: space-between; font-size: 14px;}
.info-list .label { color: #888; }
.info-list .value { color: #111; font-weight: 500;}

.toggle-list { display: flex; flex-direction: column; gap: 24px; margin-top: 24px;}
.toggle-item { display: flex; align-items: center; gap: 16px;}
.item-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;}
.item-icon.red { background: #fef2f2; color: #ef4444;}
.item-icon.gray { background: #f4f4f5; color: #52525b;}
.item-icon.blue { background: #eff6ff; color: #3b82f6;}
.item-info { flex: 1; }
.item-info h4 { margin: 0 0 4px 0; font-size: 15px; color: #333;}
.item-info p { margin: 0; font-size: 12px; color: #888;}

.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #e4e4e7; transition: .3s; border-radius: 24px; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1);}
input:checked + .slider { background-color: #0b4582; }
input:checked + .slider:before { transform: translateX(20px); }

.time-display {
  text-align: center;
  padding: 24px 16px;
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 100%);
  border-radius: 14px;
  margin-bottom: 24px;
}
.time-value {
  font-size: 42px;
  font-weight: 700;
  color: #0b4582;
  letter-spacing: 2px;
  font-family: 'Courier New', Courier, monospace;
}
.time-date {
  font-size: 13px;
  color: #666;
  margin-top: 6px;
}

.sync-time-btn {
  width: 100%;
  padding: 12px;
  background: #eff6ff;
  border: none;
  border-radius: 12px;
  color: #0b4582;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.sync-time-btn:hover { background: #dbeafe; }
.sync-time-btn:active { transform: scale(0.98); }
.mt-3 { margin-top: 12px; border: 1px solid #c8d8ec; background: #fafbfc; color: #333; }
.mt-3:hover { background: #f0f4f8; }
.btn-icon { font-size: 16px; }

.datetime-input {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: #333;
  outline: none;
  transition: border-color 0.2s;
  background: #fafbfc;
}
.datetime-input:focus { border-color: #0056e0; background: white; }

.data-source { background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 20px;}
.source-label { font-size: 12px; color: #888; display: block; margin-bottom: 4px;}
.source-name { font-size: 18px; font-weight: 700; color: #111;}

.data-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px;}
.stat-box { background: #f8fafc; padding: 16px; border-radius: 12px; }
.stat-label { font-size: 12px; color: #666; display: block; margin-bottom: 8px;}
.stat-value { font-size: 20px; font-weight: bold; color: #111;}
.stat-value.green { color: #10b981; }
.stat-value .unit { font-size: 12px; font-weight: normal; color: #888;}

.storage-action-row { display: flex; gap: 16px; align-items: stretch;}
.storage-info { flex: 1; display: flex; flex-direction: column; justify-content: center;}
.storage-text { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; font-size: 12px;}
.storage-text .label { color: #888;}
.storage-text .usage { color: #333;}
.storage-text .percent { color: #0056e0; font-weight: bold;}
.progress-bar { height: 8px; background: #eef2f6; border-radius: 4px; overflow: hidden;}
.progress-fill { height: 100%; background: #0056e0; border-radius: 4px;}
.clear-cache-btn { background: #f8fafc; border: none; border-radius: 12px; padding: 0 24px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; font-size: 13px; color: #333; font-weight: 500; transition: background 0.2s;}
.clear-cache-btn:hover { background: #f1f5f9; }

.connection-status {
  margin-left: auto;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 10px;
  font-weight: 500;
  background: #f1f5f9;
  color: #666;
}
.connection-status.active {
  background: #ecfdf5;
  color: #059669;
}

.input-group { margin-bottom: 20px; }
.input-group label { display: block; font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 500;}
.input-group input[type="text"], .input-group input[type="password"] {
  width: 100%;
  border: none;
  border-bottom: 1px solid #ddd;
  padding: 8px 0;
  font-size: 15px;
  color: #0b4582;
  font-family: monospace;
  font-weight: 600;
  outline: none;
  background: transparent;
  transition: border-color 0.2s;
}
.input-group input:focus { border-bottom-color: #0056e0; }
.input-group select {
  width: 100%;
  border: none;
  border-bottom: 1px solid #ddd;
  padding: 8px 0;
  font-size: 14px;
  color: #333;
  outline: none;
  background: transparent;
  transition: border-color 0.2s;
  cursor: pointer;
}
.input-group select:focus { border-bottom-color: #0056e0; }

.input-with-icon { position: relative; display: flex; align-items: center;}
.input-actions { position: absolute; right: 0; display: flex; gap: 8px;}
.icon-btn { background: transparent; border: none; cursor: pointer; font-size: 16px; opacity: 0.6; transition: opacity 0.2s;}
.icon-btn:hover { opacity: 1; }

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
.toggle-label { font-size: 14px; color: #333; font-weight: 500; }
.kg-hint { margin: 10px 0 0 0; font-size: 11px; color: #aaa; line-height: 1.6; }

.ai-loading { text-align: center; padding: 40px 0; color: #888; font-size: 14px; }
.ai-error { color: #ef4444; font-size: 13px; text-align: center; padding: 20px 0; }
.retry-btn { width: 100%; padding: 10px; margin-top: 12px; background: #fef2f2; border: none; border-radius: 8px; color: #ef4444; font-size: 13px; cursor: pointer; }
.retry-btn:hover { background: #fee2e2; }

.ai-params-row { display: flex; gap: 16px; }
.input-group.half { flex: 1; }

.upload-card { padding: 0; border: 2px dashed #d0dbe5; background: transparent; box-shadow: none; display: flex; justify-content: center;}
.upload-area { padding: 30px; text-align: center; width: 100%; border-radius: 20px; transition: background 0.2s; cursor: pointer;}
.upload-area:hover { background: rgba(0, 86, 224, 0.02); border-color: #0056e0;}
.cloud-icon { font-size: 32px; display: block; margin-bottom: 12px; color: #0056e0;}
.upload-area h4 { margin: 0 0 4px 0; font-size: 16px; color: #111;}
.upload-area p { margin: 0 0 8px 0; font-size: 13px; color: #666;}
.upload-area a { color: #0056e0; text-decoration: none;}
.file-types { font-size: 11px; color: #999; }

@media (max-width: 1200px) {
  .settings-grid { grid-template-columns: 1fr; }
  .data-stats { grid-template-columns: 1fr; }
}

/* ===== 上传数据集确认弹窗样式（白色主题） ===== */
.upload-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.upload-modal {
  background: #fff;
  border-radius: 16px;
  width: 540px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
}
.modal-title-area {
  display: flex;
  align-items: center;
  gap: 10px;
}
.modal-title-icon { font-size: 22px; }
.modal-header h3 {
  margin: 0;
  font-size: 17px;
  color: #111;
  font-weight: 600;
}
.modal-close-btn {
  background: #f1f3f5;
  border: none;
  color: #666;
  font-size: 15px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.modal-close-btn:hover { background: #e2e4e7; color: #333; }

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 20px;
}
.modal-body::-webkit-scrollbar { width: 5px; }
.modal-body::-webkit-scrollbar-track { background: transparent; }
.modal-body::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }

.modal-subtitle {
  margin: 0 0 14px;
  font-size: 13px;
  color: #555;
}

.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 18px;
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}
.info-icon {
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

.file-info-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 22px;
}
.file-info-card:hover {
  border-color: #0056e0;
  background: #fbfdff;
}
.file-info-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.file-card-icon { font-size: 26px; }
.file-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.file-name-text {
  font-size: 14px;
  font-weight: 600;
  color: #111;
}
.file-size-text {
  font-size: 11px;
  color: #888;
  font-family: 'Courier New', Courier, monospace;
}
.file-tag {
  padding: 4px 10px;
  background: #eef6ff;
  color: #0056e0;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
}

.section-label {
  font-size: 12px;
  color: #666;
  font-weight: 600;
  margin-bottom: 8px;
}

.tab-group {
  display: flex;
  gap: 0;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 18px;
}
.tab-item {
  flex: 1;
  padding: 9px 0;
  text-align: center;
  font-size: 13px;
  color: #555;
  background: #fff;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  border-right: 1.5px solid #e2e8f0;
}
.tab-item:last-child { border-right: none; }
.tab-item:hover { background: #f8fafc; }
.tab-item.active {
  background: #0056e0;
  color: #fff;
  font-weight: 600;
}
.tab-item.active:hover { background: #004ac2; }

.sub-type-section {
  margin-bottom: 18px;
}
.sub-label {
  display: block;
  font-size: 12px;
  color: #666;
  font-weight: 500;
  margin-bottom: 6px;
}
.meter-select {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #333;
  outline: none;
  background: #fff;
  cursor: pointer;
  appearance: auto;
  transition: border-color 0.2s;
}
.meter-select:focus { border-color: #0056e0; }

.hint-bar {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  background: #ecfdf5;
  border-radius: 8px;
  margin-bottom: 14px;
  font-size: 12px;
  color: #059669;
  line-height: 1.5;
}
.hint-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eee;
  background: #fafbfc;
}
.btn-cancel {
  padding: 9px 24px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1.5px solid #d0dbe5;
  background: #fff;
  color: #555;
  transition: all 0.2s;
}
.btn-cancel:hover:not(:disabled) { background: #f4f7fa; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-confirm {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 24px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: #0056e0;
  color: #fff;
  transition: all 0.2s;
}
.btn-confirm:hover:not(:disabled) { background: #004ac2; }
.btn-confirm:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-confirm-icon { font-size: 14px; }

.upload-status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  animation: fadeIn 0.25s ease;
}
.upload-status-bar.success {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}
.upload-status-bar.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}
.status-icon { font-size: 15px; flex-shrink: 0; }
.status-text { flex: 1; word-break: break-word; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
