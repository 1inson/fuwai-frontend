import request from '../utils/request'

// 1. 导出类型定义，方便组件复用
export interface HighlightItem {
  type: 'anomaly' | 'insight' | 'task';
  title: string;
  description: string;
  target?: string;
  target_id?: string;
}

// 2. 封装获取高亮事项的 API 函数
// 注意这里的路径只需要写 '/dashboard/highlights' 即可，baseURL 会自动拼在前面
export const getHighlights = (limit: number = 3) => {
  // request.get 的泛型可以定义返回的数据结构，如果有通用的 ResponseWrapper 这里可以更严谨
  return request.get<{ items: HighlightItem[] }>('/dashboard/highlights', {
    params: { limit }
  })
}

// 如果你有获取折线图的数据接口，可以接着写在下面：
// export const getTrendChartData = () => {
//   return request.get('/dashboard/trend-chart')
// }