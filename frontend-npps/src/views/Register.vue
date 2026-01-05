<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/lib/api'

const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const showPwd = ref(false)

const router = useRouter()

const canSubmit = computed(() => {
  return (
    name.value.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email.value) &&
    password.value.length >= 6 &&
    !loading.value
  )
})

const submit = async () => {
  if (!canSubmit.value) return
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    await api.post('/auth/register', {
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value
    })
    success.value = 'สมัครสมาชิกสำเร็จ!'
    setTimeout(() => router.push('/login'), 1200)
  } catch (e) {
    error.value = e?.response?.data?.message || 'สมัครไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="card">
      <div class="brand">
        <img src="/images/logo_npps.png" alt="NPPS" />
      </div>

      <h2>สมัครสมาชิก</h2>
      <p class="sub">สร้างบัญชีเพื่อเริ่มสั่งซื้อสินค้า</p>

      <div v-if="error" class="alert error">{{ error }}</div>
      <div v-if="success" class="alert success">{{ success }}</div>

      <form @submit.prevent="submit" class="form">
        <label>
          ชื่อ-นามสกุล
          <input
            v-model.trim="name"
            placeholder="เช่น สมชาย ใจดี"
            required
          />
        </label>

        <label>
          อีเมล
          <input
            v-model.trim="email"
            type="email"
            placeholder="name@example.com"
            required
          />
        </label>

        <label class="pwd-label">
          รหัสผ่าน
          <div class="pwd">
            <input
              :type="showPwd ? 'text' : 'password'"
              v-model="password"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              required
              minlength="6"
            />
            <button type="button" class="btn ghost toggle" @click="showPwd = !showPwd">
              {{ showPwd ? 'ซ่อน' : 'แสดง' }}
            </button>
          </div>
        </label>

        <button class="submit" :disabled="!canSubmit" type="submit">
          {{ loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก' }}
        </button>
      </form>

      <div class="foot">
        เป็นสมาชิกแล้ว?
        <router-link to="/login">เข้าสู่ระบบ</router-link>
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

.brand {
  display: flex;
  justify-content: center;
  margin-bottom: var(--sp-5);
}

.brand img {
  height: 64px;
  border-radius: 12px;
  padding: var(--sp-2);
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.1), rgba(220, 38, 38, 0.08));
}

h2 {
  text-align: center;
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 var(--sp-2);
  color: var(--c-text);
}

.sub {
  text-align: center;
  color: var(--c-text-muted);
  margin: 0 0 var(--sp-6);
  font-size: 15px;
}

.alert {
  padding: var(--sp-3) var(--sp-4);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: var(--sp-4);
  border-width: 1px;
  border-style: solid;
}

.alert.error {
  background: rgba(220,38,38,.1);
  color: #dc2626;
  border-color: rgba(220,38,38,.2);
}

.alert.success {
  background: rgba(34,197,94,.1);
  color: #16a34a;
  border-color: rgba(34,197,94,.2);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

label {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text);
}

input {
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

input::placeholder {
  color: var(--c-text-muted);
}

input:hover {
  border-color: var(--c-text-muted);
}

input:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.15);
}

.pwd-label {
  margin-bottom: 0;
}

.pwd {
  position: relative;
  display: flex;
  align-items: center;
}

.pwd input {
  padding-right: 80px;
}

.toggle {
  position: absolute;
  right: var(--sp-2);
  height: 34px;
  padding: 0 var(--sp-3);
  font-size: 13px;
}

.submit {
  margin-top: var(--sp-3);
  width: 100%;
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
.submit:hover:not(:disabled) {
  background: linear-gradient(90deg, #1E40AF, #2563EB);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
}
.submit:active:not(:disabled) {
  transform: translateY(0);
}
.submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.foot {
  margin-top: var(--sp-6);
  padding-top: var(--sp-5);
  border-top: 1px solid var(--c-border);
  text-align: center;
  font-size: 14px;
  color: var(--c-text-muted);
}

.foot a {
  color: var(--c-primary);
  font-weight: 700;
  text-decoration: none;
  margin-left: var(--sp-1);
  transition: color var(--transition-fast) var(--ease);
}

.foot a:hover {
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
  
  .brand img {
    height: 56px;
  }
  
  h2 {
    font-size: 22px;
  }
}
</style>
