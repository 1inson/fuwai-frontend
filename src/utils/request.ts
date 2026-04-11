import axios from 'axios'

// 1. 创建 axios 实例
const request = axios.create({
  // 把你 Apifox 的根地址放在这里（根据你的截图填入）
  baseURL: 'http://192.168.2.6:8000', 
  timeout: 10000, // 请求超时时间：10秒
})

// 2. 请求拦截器（可以在这里自动加上 token，目前先留空）
request.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 3. 响应拦截器（帮你把后端嵌套的 data 直接解构出来）
request.interceptors.response.use(
  (response) => {
    // axios 默认包了一层 data，我们把它剥离掉返回
    return response.data
  },
  (error) => {
    console.error('接口报错了:', error)
    return Promise.reject(error)
  }
)

export default request