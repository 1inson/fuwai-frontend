import { createRouter, createWebHistory } from 'vue-router'
import Setting from '../components/Setting.vue'
import MainContent from '../components/MainContent.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: MainContent
  },
  {
    path: '/setting',
    name: 'Setting',
    component: Setting
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
