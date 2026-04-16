<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <!-- 头部 - 白色背景 -->
      <div class="modal-header">
        <h3>导出</h3>
        <button class="close-btn" @click="handleClose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <!-- 内容区域 -->
      <div class="modal-body">
        <div class="format-option">
          <div class="download-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <polyline points="8 12 12 16 16 12"></polyline>
            </svg>
          </div>
          <span class="format-text">Markdown (.md)</span>
        </div>
      </div>

      <!-- 底部 -->
      <div class="modal-footer">
        <button class="btn btn-cancel" @click="handleClose">取消</button>
        <button class="btn btn-export" @click="handleExport">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          开始导出
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits(['update:visible', 'export'])

const handleClose = () => {
  emit('update:visible', false)
}

const handleExport = () => {
  emit('export', { format: 'md' })
  handleClose()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalShow 0.3s ease;
}

@keyframes modalShow {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 头部样式 - 白色背景 */
.modal-header {
  padding: 24px 24px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #002B54;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #F3F4F6;
  color: #6B7280;
}

/* 内容区域 */
.modal-body {
  padding: 20px 24px 32px;
}

.format-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #EFF6FF;
  border-radius: 8px;
  border: 1px solid #BFDBFE;
  transition: all 0.2s;
  cursor: pointer;
}

.format-option:hover {
  background: #DBEAFE;
  border-color: #93C5FD;
}

.download-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #005BAC;
  flex-shrink: 0;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.format-text {
  font-size: 15px;
  color: #1F2937;
  font-weight: 500;
}

/* 底部样式 */
.modal-footer {
  padding: 16px 24px 24px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  border-top: 1px solid #EEEEEE;
}

/* 按钮基础样式 - 圆角阴影 */
.btn {
  height: 40px;
  padding: 0 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: none;
  outline: none;
  position: relative;
  overflow: hidden;
}

/* 取消按钮样式 */
.btn-cancel {
  background: white;
  color: #4B5563;
  border: 1px solid #E5E7EB;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-cancel:hover {
  background: #F9FAFB;
  border-color: #D1D5DB;
  color: #374151;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.btn-cancel:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* 开始导出按钮样式 - 深蓝渐变 */
.btn-export {
  background: linear-gradient(135deg, #005BAC 0%, #004a8d 100%);
  color: white;
  box-shadow: 
    0 4px 6px -1px rgba(0, 91, 172, 0.3),
    0 2px 4px -1px rgba(0, 91, 172, 0.2);
}

.btn-export:hover {
  background: linear-gradient(135deg, #004a8d 0%, #003d75 100%);
  box-shadow: 
    0 10px 15px -3px rgba(0, 91, 172, 0.4),
    0 4px 6px -2px rgba(0, 91, 172, 0.3);
  transform: translateY(-2px);
}

.btn-export:active {
  transform: translateY(0);
  box-shadow: 
    0 4px 6px -1px rgba(0, 91, 172, 0.3),
    0 2px 4px -1px rgba(0, 91, 172, 0.2);
}
</style>
