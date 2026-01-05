<template>
  <div class="page">
    <AdminNavbar />

    <div class="wrap">
      <header class="head">
        <div class="title-wrap">
          <h1>จัดการผู้ใช้</h1>
          <p class="sub">เพิ่ม/แก้ไขสิทธิ์ผู้ใช้ และข้อมูลติดต่อ</p>
        </div>
        <button class="btn primary" @click="openAdd">➕ เพิ่มผู้ใช้</button>
      </header>

      <section class="card">
        <table class="table">
          <thead>
            <tr>
              <th style="width:80px">ID</th>
              <th>ชื่อผู้ใช้</th>
              <th>อีเมล</th>
              <th>เบอร์โทร</th>
              <th>ที่อยู่</th>
              <th style="width:120px">สิทธิ์</th>
              <th style="width:180px">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.user_id">
              <td class="muted">#{{ u.user_id }}</td>
              <td class="strong">{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td>{{ u.phone || '-' }}</td>
              <td class="addr">{{ u.address || '-' }}</td>
              <td>
                <span class="badge" :class="u.role === 'admin' ? 'info' : 'soft'">
                  {{ u.role }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <button class="btn ghost sm" @click="editUser(u)">แก้ไข</button>
                  <!-- ซ่อนปุ่มลบผู้ใช้ -->
                  <!-- <button class="btn danger sm" @click="deleteUser(u.user_id)">ลบ</button> -->
                </div>
              </td>
            </tr>
            <tr v-if="!users.length">
              <td colspan="7" class="empty">ยังไม่มีผู้ใช้</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <!-- Modal: Add/Edit -->
    <div v-if="showAddForm || editingUser" class="modal" @click.self="cancel">
      <div class="sheet">
        <div class="sheet-head">
          <h3>{{ editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้' }}</h3>
          <button class="btn ghost sm" @click="cancel">ปิด</button>
        </div>

        <div class="form-grid">
          <label>ชื่อ-นามสกุล
            <input v-model.trim="form.name" placeholder="ชื่อจริง นามสกุล" />
          </label>

          <label>อีเมล
            <input v-model.trim="form.email" type="email" placeholder="name@example.com" />
          </label>

          <div class="row-2">
            <label>เบอร์โทร
              <input v-model.trim="form.phone" placeholder="0812345678" />
            </label>
            <label>สิทธิ์
              <select v-model="form.role">
                <option value="customer">customer</option>
                <option value="admin">admin</option>
              </select>
            </label>
          </div>

          <label>ที่อยู่
            <textarea v-model.trim="form.address" rows="3" placeholder="บ้านเลขที่ / ถนน / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์"></textarea>
          </label>

          <label v-if="!editingUser">รหัสผ่าน
            <input v-model="form.password" type="password" placeholder="อย่างน้อย 6 ตัวอักษร" />
          </label>
          <label v-else>รหัสผ่านใหม่ (ถ้าเปลี่ยน)
            <input v-model="form.password" type="password" placeholder="เว้นว่างไว้ถ้าไม่เปลี่ยน" />
          </label>

          <div class="actions">
            <button class="btn primary" @click="saveUser" :disabled="saving">
              {{ saving ? 'กำลังบันทึก...' : (editingUser ? 'บันทึก' : 'เพิ่ม') }}
            </button>
            <button class="btn ghost" @click="cancel" :disabled="saving">ยกเลิก</button>
          </div>

          <p v-if="msg" class="msg">{{ msg }}</p>
        </div>
      </div>
    </div>
    
    <SiteFooter />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../lib/api'
import AdminNavbar from '../components/AdminNavbar.vue'
import SiteFooter from '../components/SiteFooter.vue'

const users = ref([])
const showAddForm = ref(false)
const editingUser = ref(null)
const saving = ref(false)
const msg = ref('')

const form = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  role: 'customer',
  password: ''
})

onMounted(loadUsers)

async function loadUsers() {
  try {
    const { data } = await api.get('/admin/users')
    users.value = data || []
  } catch (err) {
    console.error('[LOAD_USERS]', err)
  }
}

function openAdd() {
  showAddForm.value = true
  editingUser.value = null
  msg.value = ''
  form.value = { name: '', email: '', phone: '', address: '', role: 'customer', password: '' }
}

function editUser(u) {
  editingUser.value = u
  showAddForm.value = false
  msg.value = ''
  form.value = { ...u, password: '' }
}

function cancel() {
  showAddForm.value = false
  editingUser.value = null
  saving.value = false
  msg.value = ''
  form.value = { name: '', email: '', phone: '', address: '', role: 'customer', password: '' }
}

async function saveUser() {
  msg.value = ''
  if (!form.value.name?.trim()) return (msg.value = 'กรุณากรอกชื่อ-นามสกุล')
  if (!form.value.email?.trim()) return (msg.value = 'กรุณากรอกอีเมล')

  try {
    saving.value = true
    if (editingUser.value) {
      await api.put(`/admin/users/${editingUser.value.user_id}`, form.value)
    } else {
      await api.post('/admin/users', form.value)
    }
    await loadUsers()
    cancel()
  } catch (err) {
    console.error('[SAVE_USER]', err)
    msg.value = err?.response?.data?.error || 'บันทึกไม่สำเร็จ'
  } finally {
    saving.value = false
  }
}

async function deleteUser(id) {
  if (!confirm('แน่ใจว่าต้องการลบผู้ใช้นี้?')) return
  try {
    await api.delete(`/admin/users/${id}`)
    await loadUsers()
  } catch (err) {
    console.error('[DELETE_USER]', err)
    alert('ลบไม่สำเร็จ')
  }
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--c-bg);
}

.wrap {
  flex: 1 0 auto;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: var(--sp-8) var(--sp-4);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-5);
}

.title-wrap h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--c-text);
}

.title-wrap .sub {
  margin: var(--sp-1) 0 0;
  color: var(--c-text-muted);
  font-size: 14px;
}

/* Card/Table */
.card {
  background: var(--c-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-1);
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead th {
  text-align: left;
  font-weight: 600;
  background: var(--c-bg-soft);
  border-bottom: 1px solid var(--c-border);
  padding: var(--sp-4);
  color: var(--c-text);
}

.table tbody td {
  padding: var(--sp-4);
  border-bottom: 1px solid var(--c-border-light);
  vertical-align: top;
  color: var(--c-text);
}

.table tbody tr:hover {
  background: var(--c-bg-soft);
}

.empty {
  color: var(--c-text-muted);
  text-align: center;
  padding: var(--sp-5) 0;
}

.strong {
  font-weight: 700;
}

.muted {
  color: var(--c-text-muted);
}

.addr {
  max-width: 360px;
  white-space: pre-wrap;
}

/* Buttons */
.btn {
  padding: var(--sp-2) var(--sp-4);
  border-radius: 10px;
  border: 1px solid var(--c-primary);
  background: var(--c-primary);
  color: #fff;
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease);
  font-weight: 600;
}

.btn:hover {
  background: var(--c-primary-700);
  transform: translateY(-1px);
}

.btn.primary {
  background: var(--c-primary);
  border-color: var(--c-primary);
  color: #fff;
}

.btn.ghost {
  background: transparent;
  color: var(--c-text);
  border-color: var(--c-border);
}

.btn.ghost:hover {
  background: var(--c-bg-soft);
  transform: none;
}

.btn.danger {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.2);
}

.btn.danger:hover {
  background: rgba(220, 38, 38, 0.15);
  transform: none;
}

.btn.sm {
  padding: var(--sp-2) var(--sp-3);
  border-radius: 8px;
  font-size: 13px;
}

.row-actions {
  display: flex;
  gap: var(--sp-2);
}

/* Badges */
.badge {
  font-size: 12px;
  padding: var(--sp-1) var(--sp-2);
  border-radius: 999px;
  text-transform: lowercase;
  font-weight: 700;
}

.badge.info {
  background: rgba(79, 70, 229, 0.1);
  color: var(--c-primary);
  border: 1px solid rgba(79, 70, 229, 0.2);
}

.badge.soft {
  background: var(--c-bg-soft);
  color: var(--c-text-muted);
}

/* Modal / Sheet */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-4);
  z-index: 50;
  backdrop-filter: blur(2px);
}

.sheet {
  width: min(720px, 100%);
  background: var(--c-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-2);
  padding: var(--sp-5);
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-4);
}

.sheet-head h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--c-text);
}

/* Form */
.form-grid {
  display: grid;
  gap: var(--sp-4);
}

.form-grid label {
  display: grid;
  gap: var(--sp-2);
  font-weight: 600;
  color: var(--c-text);
}

.form-grid input,
.form-grid textarea,
.form-grid select {
  padding: var(--sp-3);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  outline: none;
  background: var(--c-bg);
  transition: all var(--transition-fast) var(--ease);
}

.form-grid input:focus,
.form-grid textarea:focus,
.form-grid select:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-4);
}

.actions {
  display: flex;
  gap: var(--sp-3);
  margin-top: var(--sp-2);
}

.msg {
  color: #dc2626;
  margin-top: var(--sp-1);
  font-weight: 600;
}

/* ---------- Responsive ---------- */
/* Tablet & Below */
@media (max-width: 1024px) {
  .wrap {
    padding: var(--sp-6) var(--sp-4);
  }

  .head {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-3);
  }

  .head .btn {
    width: 100%;
  }

  .card {
    overflow-x: auto;
  }

  .table {
    min-width: 800px;
  }

  .sheet {
    width: min(720px, 100%);
    padding: var(--sp-4);
  }

  .row-2 {
    grid-template-columns: 1fr;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .wrap {
    padding: var(--sp-5) var(--sp-3);
  }

  h1 {
    font-size: 22px;
  }

  .sub {
    font-size: 13px;
  }

  .sheet {
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .sheet-head {
    margin-bottom: var(--sp-3);
  }

  .sheet-head h3 {
    font-size: 16px;
  }

  .table {
    min-width: 700px;
    font-size: 14px;
  }

  .row-actions {
    flex-direction: column;
    gap: var(--sp-1);
  }

  .row-actions .btn {
    width: 100%;
  }

  .form-grid {
    gap: var(--sp-3);
  }

  .actions {
    flex-direction: column;
  }

  .actions .btn {
    width: 100%;
  }
}

/* Small Mobile */
@media (max-width: 480px) {
  .wrap {
    padding: var(--sp-4) var(--sp-2);
  }

  h1 {
    font-size: 20px;
  }

  .sub {
    font-size: 12px;
  }

  .sheet {
    padding: var(--sp-3);
  }

  .sheet-head h3 {
    font-size: 15px;
  }

  .table {
    font-size: 13px;
  }

  .table th,
  .table td {
    padding: var(--sp-2);
  }

  .form-grid input,
  .form-grid textarea,
  .form-grid select {
    padding: var(--sp-2);
  }

  .form-grid label {
    font-size: 13px;
  }
}
</style>
