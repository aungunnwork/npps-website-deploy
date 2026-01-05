<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login, state } = useAuth()

const isAdmin = ref(false)
const email = ref('')
const password = ref('')
const showPassword = ref(false)

const canSubmit = computed(() =>
  /\S+@\S+\.\S+/.test(email.value) &&
  password.value.length >= 6 &&
  !state.loading
)

async function submit() {
  state.error = ''
  const res = await login({
    email: email.value.trim(),
    password: password.value
  })
  if (!res?.ok) return

  if (isAdmin.value) {
    if (res.role === 'admin') router.push('/admin/dashboard')
    else state.error = 'บัญชีนี้ไม่ใช่ผู้ดูแล'
  } else {
    router.push('/') // ผู้ใช้ทั่วไป -> หน้าแรก
  }
}

function toggleMode(toAdmin) {
  if (isAdmin.value === toAdmin) return
  isAdmin.value = toAdmin
  state.error = ''
  password.value = ''
}
</script>

<template>
  <div class="page">
    <div class="card">
      <img src="/images/logo_npps.png" alt="NPPS Logo" class="logo" />

      <h1 class="title">{{ isAdmin ? 'เข้าสู่ระบบผู้ดูแล' : 'เข้าสู่ระบบ' }}</h1>
      <p class="subtitle">
        {{ isAdmin ? 'สำหรับผู้ดูแลระบบ' : 'เข้าสู่ระบบเพื่อเริ่มสั่งซื้อสินค้า' }}
      </p>

      <!-- สลับโหมด ผู้ใช้ / ผู้ดูแล -->
      <div class="mode-switch">
        <button
          :class="['mode-btn', !isAdmin && 'active']"
          @click="toggleMode(false)"
          type="button"
        >ผู้ใช้</button>
        <button
          :class="['mode-btn', isAdmin && 'active']"
          @click="toggleMode(true)"
          type="button"
        >ผู้ดูแล</button>
      </div>

      <form class="form" @submit.prevent="submit" autocomplete="off">
        <label class="label">อีเมล</label>
        <input
          v-model="email"
          type="email"
          class="input"
          placeholder="name@example.com"
          required
          autocomplete="username"
        />

        <label class="label">รหัสผ่าน</label>
        <div class="input-group">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="input"
            placeholder="อย่างน้อย 6 ตัวอักษร"
            required
            :autocomplete="isAdmin ? 'current-password' : 'new-password'"
          />
          <button type="button" class="ghost" @click="showPassword = !showPassword">
            {{ showPassword ? 'ซ่อน' : 'แสดง' }}
          </button>
        </div>

        <button class="primary" :disabled="!canSubmit">
          {{ state.loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
        </button>

        <p v-if="state.error" class="error">{{ state.error }}</p>
      </form>

      <div class="footer">
        ยังไม่มีบัญชี?
        <router-link to="/register" class="link">สมัครสมาชิก</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100dvh;
  background: linear-gradient(135deg, rgba(248, 250, 252, 1) 0%, rgba(226, 232, 240, 0.5) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-8) var(--sp-4);
}

.card {
  width: 100%;
  max-width: 460px;
  background: var(--c-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-2);
  padding: var(--sp-7) var(--sp-6);
  position: relative;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, var(--c-primary), var(--c-accent));
}

.logo {
  width: 64px;
  height: 64px;
  display: block;
  margin: 0 auto var(--sp-5);
  border-radius: 12px;
  padding: var(--sp-2);
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.1), rgba(220, 38, 38, 0.08));
}

.title {
  text-align: center;
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 var(--sp-2);
  color: var(--c-text);
}

.subtitle {
  text-align: center;
  color: var(--c-text-muted);
  margin: 0 0 var(--sp-6);
  font-size: 15px;
}

.mode-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
  margin-bottom: var(--sp-5);
  padding: var(--sp-1);
  background: var(--c-bg-soft);
  border-radius: 10px;
}

.mode-btn {
  padding: var(--sp-3) var(--sp-4);
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--c-text-muted);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease);
}

.mode-btn:hover {
  color: var(--c-text);
}

.mode-btn.active {
  background: var(--c-card);
  color: var(--c-primary);
  box-shadow: var(--shadow-1);
  font-weight: 700;
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.label {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text);
  margin-bottom: calc(var(--sp-2) * -1);
}

.input {
  width: 100%;
  height: 48px;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  padding: 0 var(--sp-4);
  outline: none;
  font-size: 15px;
  background: var(--c-bg);
  transition: all var(--transition-fast) var(--ease);
}

.input::placeholder {
  color: var(--c-text-muted);
}

.input:hover {
  border-color: var(--c-text-muted);
}

.input:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.15);
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-group .input {
  padding-right: 80px;
}

.ghost {
  position: absolute;
  right: var(--sp-2);
  height: 34px;
  padding: 0 var(--sp-3);
  border: none;
  border-radius: 8px;
  background: var(--c-bg-soft);
  color: var(--c-text-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease);
}

.ghost:hover {
  background: var(--c-border);
  color: var(--c-text);
}

.primary {
  margin-top: var(--sp-3);
  height: 48px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(90deg, #1E3A8A, #1E40AF);
  color: #ffffff;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all var(--transition-base) var(--ease);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.25);
}

.primary:hover:not(:disabled) {
  background: linear-gradient(90deg, #1E40AF, #2563EB);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
}

.primary:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.error {
  color: #dc2626;
  background: rgba(220,38,38,.1);
  padding: var(--sp-3);
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  margin-top: var(--sp-2);
  border: 1px solid rgba(220,38,38,.2);
}

.footer {
  margin-top: var(--sp-6);
  padding-top: var(--sp-5);
  border-top: 1px solid var(--c-border);
  text-align: center;
  color: var(--c-text-muted);
  font-size: 14px;
}

.link {
  color: var(--c-primary);
  font-weight: 700;
  text-decoration: none;
  margin-left: var(--sp-1);
  transition: color var(--transition-fast) var(--ease);
}

.link:hover {
  color: var(--c-primary-700);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .card {
    max-width: 440px;
  }
}

@media (max-width: 480px) {
  .page {
    padding: var(--sp-5) var(--sp-3);
  }
  
  .card {
    padding: var(--sp-6) var(--sp-5);
  }
  
  .logo {
    width: 56px;
    height: 56px;
  }
  
  .title {
    font-size: 22px;
  }
}
</style>
