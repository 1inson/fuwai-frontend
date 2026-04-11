<template>
  <main class="main-content">
    <div class="stat-cards">
      <div class="card stat-card">
        <div class="card-header">
          <span>今日总能耗</span>
          <span class="icon blue">⚡</span>
        </div>
        <div class="card-value">1,125.4 <span class="unit">kWh</span></div>
        <div class="card-trend text-green">同比昨日 ↓ 8.2%</div>
        <div class="mini-bar"><div class="bar"></div><div class="bar"></div></div>
      </div>
      
      <div class="card stat-card">
        <div class="card-header">
          <span>实时 COP 值</span>
          <span class="icon green">🌡️</span>
        </div>
        <div class="card-value">3.2</div>
        <div class="card-trend text-green">运行状态良好</div>
      </div>

      <div class="card stat-card">
        <div class="card-header">
          <span>异常建筑数</span>
          <span class="icon orange">⚠️</span>
        </div>
        <div class="card-value">3</div>
        <div class="card-trend text-gray">已处理 1, 待处理 2</div>
      </div>

      <div class="card stat-card">
        <div class="card-header">
          <span>待处理工单</span>
          <span class="icon dark-blue">📋</span>
        </div>
        <div class="card-value">5</div>
        <div class="card-trend text-gray">平均处理时长 2h</div>
      </div>
    </div>

    <div class="middle-section">
      <div class="card chart-card">
        <div class="chart-header">
          <h3>能耗趋势分析</h3>
          <div class="time-filter">
            <button class="active">日</button>
            <button>周</button>
            <button>月</button>
          </div>
        </div>
        <div ref="trendChartRef" class="echarts-container"></div>
      </div>

      <div class="card quick-links">
    <h3>快速跳转</h3>
    
    <div v-if="isLoading" class="loading-tips">数据加载中...</div>

    <div 
      v-for="(item, index) in highlightItems" 
      :key="index"
      class="link-btn" 
      :class="getStyleByType(item.type).colorClass"
      @click="handleLinkClick(item)"
    >
      <div class="icon-circle">{{ getStyleByType(item.type).icon }}</div>
      <div class="info">
        <h4>{{ item.title }}</h4>
        <p>{{ item.description }}</p>
      </div>
      <span class="arrow">></span>
    </div>
  </div>
    </div>

    <div class="bottom-section">
      <div class="card report-card">
        <h3>自动生成报表</h3>
        <ul class="report-list">
          <li><span class="icon">📄</span> 周度能耗分析报告 <a href="#" class="export">导出</a></li>
          <li><span class="icon">📊</span> 月度碳排放统计 <a href="#" class="export">导出</a></li>
          <li><span class="icon">⚙️</span> 设备运行效率评估 <a href="#" class="export">导出</a></li>
          <li><span class="icon">💡</span> 节能优化建议报告 <a href="#" class="export">导出</a></li>
        </ul>
      </div>

      <div class="card task-card">
        <div class="task-header">
          <h3>今日运维清单</h3>
          <button class="add-btn">+</button>
        </div>
        <ul class="task-list">
          <li class="completed"><span class="checkbox">✔️</span> 根据手册处理异常建筑</li>
          <li><span class="checkbox"></span> 运维前准备工作</li>
          <li><span class="checkbox"></span> 运维前准备工作</li>
        </ul>
        <div class="mascot-placeholder"><img src="/character.png" alt="character" /></div> </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const trendChartRef = ref<HTMLElement | null>(null)
let trendChart: echarts.ECharts | null = null

onMounted(() => {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    
    const option :echarts.EChartsOption = {
      tooltip: { trigger: 'axis' },
      legend: { 
        data: ['总能耗', '制冷能耗', '照明能耗'],
        icon: 'circle',
        top: 0
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        axisLine: { lineStyle: { color: '#ccc' } },
        axisLabel: { color: '#666' }
      },
      yAxis: {
        type: 'value',
        max: 200,
        splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
      },
      series: [
        {
          name: '总能耗',
          type: 'line',
          smooth: true,
          symbolSize: 8,
          itemStyle: { color: '#3b82f6' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ])
          },
          data: [120, 110, 180, 200, 190, 160, 130]
        },
        {
          name: '制冷能耗',
          type: 'line',
          smooth: true,
          symbolSize: 8,
          itemStyle: { color: '#10b981' },
          data: [40, 40, 30, 20, 20, 20, 30]
        },
        {
          name: '照明能耗',
          type: 'line',
          smooth: true,
          symbolSize: 8,
          itemStyle: { color: '#f59e0b' },
          data: [80, 70, 150, 180, 170, 140, 100]
        }
      ]
    }
    trendChart.setOption(option)
  }

  // 监听窗口大小变化以实现图表响应式
  window.addEventListener('resize', handleResize)
})

const handleResize = () => {
  trendChart?.resize()
}

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
})


// 从后端获取高亮事项
import { getHighlights, type HighlightItem } from '../api/dashboard'

const highlightItems = ref<HighlightItem[]>([])
const isLoading = ref(false)

const fetchHighlights = async () => {
  isLoading.value = true
  try {
    // 像调用普通函数一样调用 API
    const res = await getHighlights(3) 
    
    if (res && res.data && res.data.items) {
      highlightItems.value = res.data.items
    }
  } catch (error: any) {
 {
  if (error.code === 'ECONNABORTED') {
    console.error('请求超时，请检查网络或后端服务')
  } else {
    console.error('获取高亮数据失败', error.message)
  }
}
  } finally {
    isLoading.value = false
  }
}

// 样式映射函数保持不变...
const getStyleByType = (type: HighlightItem['type']) => { 
  switch (type) {
    case 'anomaly':
      return { colorClass: 'red', icon: '!' }
    case 'insight':
      return { colorClass: 'yellow', icon: '!' }
    case 'task':
      return { colorClass: 'blue', icon: '📅' }
    default:
      return { colorClass: 'blue', icon: '👉' } 
  }
 }
const handleLinkClick = (item: HighlightItem) => { 
  console.log('用户点击了:', item.title, '打算跳转到目标ID:', item.target_id)
  // 这里可以写 vue-router 的跳转逻辑，比如：
  // router.push({ path: `/${item.target}/${item.target_id}` })
}

onMounted(() => {
  fetchHighlights()
})
</script>

<style scoped>
.main-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

h3 { margin-top: 0; font-size: 16px; color: #333; margin-bottom: 16px;}

/* 顶部四卡片 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}
.stat-card .card-header { display: flex; justify-content: space-between; color: #666; font-size: 14px; margin-bottom: 12px; }
.stat-card .card-value { font-size: 28px; font-weight: bold; color: #111; margin-bottom: 8px;}
.stat-card .unit { font-size: 14px; font-weight: normal; color: #666; }
.stat-card .card-trend { font-size: 12px; }
.text-green { color: #10b981; }
.text-gray { color: #888; }

/* 中间区域布局 */
.middle-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}
@media (max-width: 1024px) {
  .middle-section { grid-template-columns: 1fr; }
}

/* 图表区域 */
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.time-filter { display: flex; background: #f0f2f5; border-radius: 6px; padding: 2px;}
.time-filter button { border: none; background: transparent; padding: 4px 16px; border-radius: 4px; cursor: pointer; color: #666;}
.time-filter button.active { background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); color: #333; font-weight: bold;}
.echarts-container { width: 100%; height: 280px; }

/* 快捷跳转 */
.quick-links { display: flex; flex-direction: column; gap: 12px;}
.link-btn { display: flex; align-items: center; padding: 16px; border-radius: 12px; cursor: pointer; border: 1px solid transparent; transition: 0.2s;}
.link-btn.red { background: #fef2f2; border-color: #fecaca; }
.link-btn.yellow { background: #fffbeb; border-color: #fde68a; }
.link-btn.blue { background: #eff6ff; border-color: #bfdbfe; }
.link-btn .icon-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 16px;}
.link-btn.red .icon-circle { background: #ef4444; color: white; }
.link-btn.yellow .icon-circle { background: #f59e0b; color: white; }
.link-btn.blue .icon-circle { background: #3b82f6; color: white; }
.link-btn .info { flex: 1; }
.link-btn .info h4 { margin: 0 0 4px 0; font-size: 14px; color: #111; }
.link-btn .info p { margin: 0; font-size: 12px; color: #666; }
.link-btn .arrow { color: #999; }

/* 底部区域 */
.bottom-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 768px) {
  .bottom-section { grid-template-columns: 1fr; }
}

/* 报表列表 */
.report-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px;}
.report-list li { display: flex; align-items: center; font-size: 14px; color: #333; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;}
.report-list li:last-child { border-bottom: none; }
.report-list .icon { margin-right: 12px; font-size: 18px;}
.report-list .export { margin-left: auto; color: #3b82f6; text-decoration: none; font-weight: 500;}

/* 任务清单 */
.task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.add-btn { width: 28px; height: 28px; border-radius: 50%; background: #0b4582; color: white; border: none; font-size: 18px; cursor: pointer;}
.task-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;}
.task-list li { display: flex; align-items: center; font-size: 14px; color: #666; padding: 12px; border-radius: 8px; background: #fafafa;}
.task-list li.completed { background: #e0f2fe; color: #0369a1; }
.task-list .checkbox { width: 20px; height: 20px; border-radius: 50%; border: 1px solid #ccc; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; background: white;}
.task-list li.completed .checkbox { background: #0b4582; color: white; border-color: #0b4582;}

.task-card { position: relative; overflow: hidden;}
.mascot-placeholder { position: absolute; bottom: 10px; right: 20px; font-size: 60px; opacity: 0.8;}
</style>