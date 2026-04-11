<template>
  <header class="header">
    <div class="page-title">中建八局建筑能源管理系统</div>
    <div class="user-info">
      <button class="notification-btn">🔔</button>
      <div class="profile">
        <div class="text">
          <span class="name">陈xx</span>
          <span class="role">能源监控中心</span>
        </div>
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" class="avatar" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  background-color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  z-index: 10;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 24px;
}

.notification-btn {
  background: none; border: none; font-size: 20px; cursor: pointer; color: #666;
}

.profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile .text {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.profile .name { font-size: 14px; font-weight: bold; color: #333; }
.profile .role { font-size: 12px; color: #888; }
.avatar { width: 40px; height: 40px; border-radius: 50%; background: #eee; }
</style>