<template>
  <main class="dashboard">
    <KpiCards :metrics="metrics" :loading="overviewLoading" />

    <section class="middle-row">
      <EnergyTrendChart />
      <HighlightPanel />
    </section>

    <section class="bottom-row">
      <AnomalyPanel :anomalies="topAnomalies" />
      <AiInsightPanel
        :summaryHint="aiSummaryHint"
        :loading="overviewLoading"
        @open-report="openReportModal"
      />
    </section>

    <ReportExportModal ref="reportModalRef" />
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCurrentTimeString } from '../utils/timeManager'
import { getDashboardOverview, type MetricCard, type AnomalySummary, type DashboardOverviewResponse } from '../api/dashboard'

import KpiCards from './dashboard/KpiCards.vue'
import EnergyTrendChart from './dashboard/EnergyTrendChart.vue'
import HighlightPanel from './dashboard/HighlightPanel.vue'
import AnomalyPanel from './dashboard/AnomalyPanel.vue'
import AiInsightPanel from './dashboard/AiInsightPanel.vue'
import ReportExportModal from './dashboard/ReportExportModal.vue'

const overviewLoading = ref(false)
const metrics = ref<MetricCard[]>([])
const topAnomalies = ref<AnomalySummary[]>([])
const aiSummaryHint = ref('')

const reportModalRef = ref<InstanceType<typeof ReportExportModal> | null>(null)

const openReportModal = () => {
  reportModalRef.value?.open()
}

const unwrap = (res: any) => res?.data ?? res

/** 首页固定展示近 7 天的异常建筑（与故障分析"近1周"语义对齐） */
const HOMEPAGE_RANGE_MS = 7 * 24 * 60 * 60 * 1000

const fetchOverview = async () => {
  overviewLoading.value = true
  try {
    const now = new Date(getCurrentTimeString())
    const start = new Date(now.getTime() - HOMEPAGE_RANGE_MS)
    const raw = await getDashboardOverview({
      start_time: start.toISOString(),
      end_time: now.toISOString(),
      chart_range: 'week'
    })
    const data = unwrap(raw) as DashboardOverviewResponse
    metrics.value = data?.metrics ?? []
    topAnomalies.value = data?.top_anomalies ?? []
    aiSummaryHint.value = data?.ai_summary_hint ?? ''
  } catch (err: any) {
    console.error('Dashboard overview 加载失败:', err.message)
  } finally {
    overviewLoading.value = false
  }
}

onMounted(() => {
  fetchOverview()
})
</script>

<style scoped>
/* ─── Foundation ──────────────────────────────────────────────── */
.dashboard {
  --color-primary: #0b4582;
  --color-primary-light: #1e6fd0;
  --color-surface: #ffffff;
  --color-bg: #f4f7f9;
  --color-text: #0f172a;
  --color-text-secondary: #64748b;
  --color-border: #e8ecf1;
  --color-good: #059669;
  --color-bad: #dc2626;
  --color-amber: #d97706;
  --radius: 14px;
  --shadow-card: 0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 14px rgba(15, 23, 42, 0.03);
  --shadow-hover: 0 8px 28px rgba(15, 23, 42, 0.08);
  --font: var(--font-sans);

  padding: 24px 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  font-family: var(--font);
  color: var(--color-text);
}

/* ═══ Middle ═════════════════════════════════════════════════════ */
.middle-row {
  display: flex;
  gap: 18px;
}

@media (max-width: 1024px) {
  .middle-row { flex-direction: column; }
}

/* ═══ Bottom Row ═════════════════════════════════════════════════ */
.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

@media (max-width: 900px) {
  .bottom-row { grid-template-columns: 1fr; }
}
</style>
