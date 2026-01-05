<script setup>
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const { logout } = useAuth()
const router = useRouter()

function doLogout() {
  logout()
  router.push('/login')
}
</script>

<template>
  <header class="navbar">
    <div class="logo">
      <img src="/images/logo_npps.png" alt="NPPS Logo" />
    </div>

    <nav class="menu">
      <router-link to="/admin/dashboard">แดชบอร์ด</router-link>
      <router-link to="/admin/product">จัดการสินค้า</router-link>
      <router-link to="/admin/order">จัดการออเดอร์</router-link>
      <router-link to="/admin/user">จัดการผู้ใช้</router-link>
      
    </nav>

    <div class="auth">
      <button @click="doLogout" class="btn-logout">ออกจากระบบ</button>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--sp-4) var(--sp-6);
  min-height: 68px;
  background: #1E293B;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-bottom: 2px solid rgba(220, 38, 38, 0.15);
}

.logo img {
  height: 48px;
  width: auto;
  display: block;
}

.menu {
  display: flex;
  gap: var(--sp-2);
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 0 var(--sp-5);
}

.menu a {
  position: relative;
  text-decoration: none;
  color: #ffffff;
  font-weight: 600;
  font-size: 15px;
  padding: var(--sp-2) var(--sp-4);
  border-radius: 8px;
  transition: all var(--transition-fast) var(--ease);
}

.menu a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 70%;
  height: 3px;
  background: #DC2626;
  border-radius: 2px;
  transition: transform var(--transition-base) var(--ease);
}

.menu a:hover {
  color: #EF4444;
  background: rgba(220, 38, 38, 0.1);
}

.menu a:hover::after {
  transform: translateX(-50%) scaleX(1);
}

.menu a.router-link-active {
  color: #DC2626;
  font-weight: 700;
  background: rgba(220, 38, 38, 0.15);
}

.menu a.router-link-active::after {
  transform: translateX(-50%) scaleX(1);
}

.auth {
  display: flex;
  align-items: center;
  gap: 14px;
}

.btn-logout {
  background: var(--danger-600);
  border: 1px solid var(--danger-600);
  color: #fff;
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: filter .15s, transform .05s, background .15s;
}

.btn-logout:hover {
  background: var(--danger-700);
  filter: brightness(.98);
}

.btn-logout:active {
  transform: translateY(1px);
}

.btn-logout:focus-visible {
  outline: 3px solid rgba(220,38,38,.35);
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .navbar {
    flex-wrap: wrap;
    padding: var(--sp-3) var(--sp-4);
  }
  
  .menu {
    order: 3;
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    justify-content: flex-start;
    padding: var(--sp-3) 0 0;
    margin-top: var(--sp-3);
    border-top: 1px solid rgba(220, 38, 38, 0.2);
    gap: var(--sp-2);
  }
  
  .menu a {
    font-size: 13px;
    padding: var(--sp-2) var(--sp-3);
    white-space: nowrap;
  }
  
  .btn-logout {
    font-size: 13px;
    padding: 6px 12px;
  }
}

@media (max-width: 480px) {
  .navbar {
    padding: var(--sp-2) var(--sp-3);
  }
  
  .logo img {
    height: 40px;
  }
  
  .menu a {
    font-size: 12px;
    padding: var(--sp-2);
  }
}
</style>
