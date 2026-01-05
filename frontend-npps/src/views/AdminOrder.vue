<template>
  <div class="page">
    <AdminNavbar />

    <div class="container">
      <header class="header">
        <div class="title-wrap">
          <h1>จัดการคำสั่งซื้อ</h1>
          <p class="sub">ดูและอัปเดตสถานะคำสั่งซื้อทั้งหมด</p>
        </div>

        <div class="toolbar">
          <div class="search">
            <span class="icon">🔎</span>
            <input
              v-model.trim="search"
              type="text"
              placeholder="ค้นหาจากหมายเลขออเดอร์ / ชื่อลูกค้า / เบอร์โทร"
            />
          </div>

          <select v-model="statusFilter" class="select">
            <option value="">สถานะทั้งหมด</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="paid">ชำระแล้ว</option>
            <option value="shipping">กำลังจัดส่ง</option>
            <option value="done">สำเร็จ</option>
            <option value="cancel">ยกเลิก</option>
          </select>
        </div>
      </header>

      <div v-if="loading" class="skeleton">
        <div class="row" v-for="n in 4" :key="n"></div>
      </div>

      <div v-else-if="filteredOrders.length === 0" class="empty">
        ยังไม่มีคำสั่งซื้อที่ตรงเงื่อนไข
      </div>

      <section v-else class="list">
        <article
          class="card"
          v-for="o in filteredOrders"
          :key="o.order_id"
        >
          <div class="row-head" @click="toggle(o.order_id)">
            <div class="left">
              <span class="code">#{{ o.order_id }}</span>
              <span class="name">{{ o.username }}</span>

              <!-- ✅ สถานะของออเดอร์ (แสดงเป็นภาษาไทย) -->
              <span class="badge" :class="badgeClass(o.order_status)">{{ getStatusLabel(o.order_status) }}</span>


            </div>

            <div class="right">
              <div class="meta">
                <span class="when">{{ formatDate(o.created_at) }}</span>
                <span class="total">{{ format(o.total_price) }} ฿</span>
              </div>
              <button
                class="btn ghost"
                @click.stop="toggle(o.order_id)"
                aria-label="รายละเอียด"
              >
                {{ expanded === o.order_id ? 'ซ่อน' : 'รายละเอียด' }}
              </button>
            </div>
          </div>

          <transition name="fade">
            <div v-if="expanded === o.order_id" class="details">
              <!-- ✅ 1. บล็อกสินค้า - ขึ้นบนสุด -->
              <div class="items">
                <h4>สินค้าในออเดอร์</h4>
                <ul class="items-list">
                  <li
                    v-for="it in o.items"
                    :key="it.order_item_id"
                    class="item"
                  >
                    <img :src="toProdUrl(it.image_url)" alt="" />
                    <div class="meta">
                      <div class="name">{{ it.product_name }}</div>
                      <div class="sub">
                        x{{ it.quantity }}
                        <span v-if="it.product_option" class="note">({{ it.product_option }})</span>
                      </div>
                    </div>
                    <div class="price">{{ format(it.price * it.quantity) }} ฿</div>
                  </li>
                </ul>
              </div>

              <!-- ✅ 2. ข้อมูลผู้รับ / ชำระเงิน / จัดส่ง - ถัดลงมา -->
              <div class="grid">
                <div class="block">
                  <h4>ข้อมูลผู้รับ</h4>
                  <p><b>ที่อยู่:</b> {{ o.address || '-' }}</p>
                  <p><b>เบอร์โทร:</b> {{ o.phone || '-' }}</p>
                </div>

                <div class="block">
                  <h4>การชำระเงิน</h4>
                  <p>ยอดที่จ่าย: <b>{{ format(o.total_price) }} ฿</b></p>
                  <div v-if="o.payment_slip_url" class="slip">
                    <p>สลิปโอนเงิน:</p>
                    <img :src="toProdUrl(o.payment_slip_url) + '?_=' + (o.updated_at || o.paid_at || Date.now())" alt="slip" />
                  </div>


                </div>

                <div class="block">
                  <h4>การจัดส่ง</h4>
                  <div class="track">
                    <input
                      v-model="o.tracking_number"
                      placeholder="Tracking number"
                    />
                  </div>
                </div>
              </div>

              <!-- ✅ 3. Actions - ท้ายสุด -->
              <div class="actions">
                <label class="status-select">
                  <span>อัปเดตสถานะออเดอร์:</span>
                  <select v-model="o.order_status">
                    <option value="pending">รอดำเนินการ</option>
                    <option value="paid">ชำระแล้ว</option>
                    <option value="shipping">กำลังจัดส่ง</option>
                    <option value="done">สำเร็จ</option>
                    <option value="cancel">ยกเลิก</option>
                  </select>
                </label>

                <div class="spacer"></div>

                <button class="btn primary" @click="updateStatus(o)">
                  บันทึกการเปลี่ยนแปลง
                </button>

                <!-- ✅ ปุ่มลบออเดอร์ (แสดงเมื่อค้างชำระ > 20 นาที และยัง pending) -->
                <button
                  v-if="allowDelete(o)"
                  class="btn danger"
                  @click="forceDelete(o)"
                  title="ลบออเดอร์นี้ออกจากระบบ"
                >
                  ลบออเดอร์
                </button>
              </div>
            </div>
          </transition>
        </article>
      </section>
    </div>
    
    <SiteFooter />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../lib/api'
import { toProdUrl } from '@/lib/image'
import AdminNavbar from '../components/AdminNavbar.vue'
import SiteFooter from '../components/SiteFooter.vue'

const orders = ref([])
const loading = ref(true)
const expanded = ref(null)

// ค้นหา + กรองสถานะ (เฉพาะฝั่งหน้าเว็บ)
const search = ref('')
const statusFilter = ref('')

onMounted(loadOrders)

async function loadOrders() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/orders')
    orders.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const filteredOrders = computed(() => {
  let list = orders.value.slice()

  // กรองสถานะ ถ้าเลือก
  if (statusFilter.value) {
    list = list.filter(o => (o.order_status || '').toLowerCase() === statusFilter.value)
  }

  // ค้นหา order_id / ชื่อ / โทร
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter(o =>
      String(o.order_id).includes(q) ||
      (o.username || '').toLowerCase().includes(q) ||
      (o.phone || '').toLowerCase().includes(q)
    )
  }

  return list
})

async function updateStatus(order) {
  try {
    await api.patch(`/admin/orders/${order.order_id}`, {
      status: order.order_status,
      tracking_number: order.tracking_number
    })
    alert('อัปเดตสถานะเรียบร้อย')
    await loadOrders()
    expanded.value = order.order_id
  } catch (e) {
    console.error(e)
    alert('อัปเดตไม่สำเร็จ')
  }
}

/* ✅ อัปเดตสถานะการชำระเงิน (รองรับ need_review) */
async function updatePaymentStatus(order) {
  try {
    await api.patch(`/admin/payments/by-order/${order.order_id}`, {
      status: order.payment_status
    })
    alert('อัปเดตสถานะการชำระเงินเรียบร้อย')
  } catch (e) {
    console.error(e)
    alert('อัปเดตสถานะการชำระเงินไม่สำเร็จ')
  }
}

function toggle(id) {
  expanded.value = expanded.value === id ? null : id
}

function format(n) {
  return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })
}

// แสดงวัน–เวลาเป็นโซนไทย
function formatDate(dt) {
  if (!dt) return '-'
  try {
    const date = new Date(dt)
    return date.toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return String(dt)
  }
}

// แปลงสถานะเป็นภาษาไทย
function getStatusLabel(status) {
  const labels = {
    pending: 'รอดำเนินการ',
    paid: 'ชำระแล้ว',
    shipping: 'กำลังจัดส่ง',
    done: 'สำเร็จ',
    cancel: 'ยกเลิก',
    needs_review: 'รอตรวจสอบ'
  }
  return labels[(status || '').toLowerCase()] || status
}

// สีป้ายสถานะออเดอร์ (เดิม)
function badgeClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'pending': return 'warn'
    case 'paid': return 'info'
    case 'shipping': return 'accent'
    case 'done': return 'good'
    case 'cancel': return 'bad'
    default: return 'soft'
  }
}

/* ✅ สีป้ายสถานะการชำระเงิน */
function payBadgeClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'pending': return 'soft'
    case 'paid': return 'good'
    case 'rejected': return 'bad'
    case 'need_review': return 'warn' // ใช้โทนส้มเดียวกับ pending เพื่อดึงสายตา
    default: return 'soft'
  }
}

/* ✅ เงื่อนไขปุ่มลบ: ออเดอร์ pending + ยังไม่จ่าย + เกิน 20 นาที */
function allowDelete(order) {
  if ((order.order_status || '').toLowerCase() !== 'pending') return false
  if ((order.payment_status || '').toLowerCase() === 'paid') return false
  if (!order.created_at) return false
  const created = new Date(order.created_at).getTime()
  const now = Date.now()
  const diffMin = (now - created) / 60000
  return diffMin >= 20
}

/* ✅ ลบออเดอร์ (ยืนยันก่อน) */
async function forceDelete(order) {
  const ok = confirm(`ยืนยันลบออเดอร์ #${order.order_id} ?\n(ใช้เมื่อค้างชำระเกิน 20 นาทีเท่านั้น)`)
  if (!ok) return
  try {
    await api.delete(`/admin/orders/${order.order_id}`)
    alert('ลบออเดอร์เรียบร้อย')
    await loadOrders()
  } catch (e) {
    console.error(e)
    alert('ลบออเดอร์ไม่สำเร็จ')
  }
}
</script>

<style scoped>
/* ---------- Layout ---------- */
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--c-bg);
}

.container {
  flex: 1 0 auto;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: var(--sp-8) var(--sp-4);
}

.header {
  display: grid;
  gap: var(--sp-4);
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

.toolbar {
  display: flex;
  gap: var(--sp-4);
  align-items: center;
  flex-wrap: wrap;
  margin-top: var(--sp-2);
}

.search {
  position: relative;
  flex: 1 1 320px;
  max-width: 520px;
  margin-right: 36px;
}

.search .icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--c-text-muted);
}

.search input {
  width: 100%;
  padding: var(--sp-3) var(--sp-4) var(--sp-3) 30px;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  background: var(--c-bg);
  outline: none;
  transition: all var(--transition-fast) var(--ease);
}

.search input:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.select {
  padding: var(--sp-3);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  background: var(--c-card);
  outline: none;
  transition: all var(--transition-fast) var(--ease);
}

.select:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

/* ---------- Cards ---------- */
.list {
  display: grid;
  gap: var(--sp-4);
}

.card {
  background: var(--c-card);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-1);
  transition: box-shadow var(--transition-fast) var(--ease);
}

.card:hover {
  box-shadow: var(--shadow-2);
}

.row-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-4);
  cursor: pointer;
  transition: background var(--transition-fast) var(--ease);
}

.row-head:hover {
  background: var(--c-bg-soft);
}

.left {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  min-width: 0;
}

.code {
  font-weight: 700;
  color: var(--c-text);
}

.name {
  color: var(--c-text);
  max-width: 40vw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.right {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.meta {
  display: grid;
  text-align: right;
  gap: var(--sp-1);
}

.meta .when {
  color: var(--c-text-muted);
  font-size: 12px;
}

.meta .total {
  font-weight: 700;
  color: var(--c-text);
}

.details {
  padding: 0 var(--sp-4) var(--sp-4);
  border-top: 1px dashed var(--c-border);
}

/* ✅ Items block - ตอนนี้อยู่บนสุดแล้ว ไม่ต้องมี margin-top มาก */
.items {
  margin-top: var(--sp-4);
}

.items h4 {
  margin: 0 0 var(--sp-2);
  color: var(--c-text);
}

/* ✅ Grid block - ย้ายลงมาถัดจาก items แล้ว ต้องมี margin-top */
.grid {
  display: grid;
  gap: var(--sp-4);
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  margin-top: var(--sp-5);
}

.block {
  background: var(--c-bg-soft);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: var(--sp-4);
}

.block h4 {
  margin: 0 0 var(--sp-2);
  font-size: 14px;
  color: var(--c-text);
}

.slip img {
  width: 220px;
  border-radius: 10px;
  border: 1px solid var(--c-border);
}

/* ---------- Items List ---------- */

.items h4 {
  margin: 0 0 var(--sp-2);
  color: var(--c-text);
}

.items-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--sp-3);
}

.item {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  padding: var(--sp-2) var(--sp-3);
}

.item img {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--c-border);
}

.item .meta {
  flex: 1;
}

.item .name {
  font-weight: 600;
  color: var(--c-text);
}

.item .sub {
  color: var(--c-text-muted);
  font-size: 13px;
}

.item .note {
  color: var(--c-text-muted);
}

.item .price {
  font-weight: 700;
  color: var(--c-text);
}

/* ---------- Actions ---------- */
.actions {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin-top: var(--sp-5);
  flex-wrap: wrap;
}

.status-select {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.status-select select {
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  background: var(--c-card);
  outline: none;
  transition: all var(--transition-fast) var(--ease);
}

.status-select select:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.spacer {
  flex: 1;
}

/* ---------- Badges & Buttons ---------- */
.badge {
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.25s ease;
}

.badge:hover {
  filter: brightness(0.95);
}

.badge.soft {
  background: var(--c-bg-soft);
  color: var(--c-text-muted);
}

/* Status badges matching ProfileView */
.badge.warn {
  background: #fff8e1;
  color: #b45309;
}

.badge.info {
  background: #eff6ff;
  color: #1d4ed8;
}

.badge.accent {
  background: #e0f2fe;
  color: #0369a1;
}

.badge.good {
  background: #eaf9ed;
  color: #2e7d32;
}

.badge.bad {
  background: #ffe9e9;
  color: #b40b0b;
}

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
  background: #dc2626;
  border-color: #dc2626;
  color: #fff;
}

.btn.danger:hover {
  background: #b91c1c;
}

.track {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-2);
}

.track input {
  flex: 1;
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  outline: none;
  background: var(--c-bg);
  transition: all var(--transition-fast) var(--ease);
}

.track input:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

/* ---------- States ---------- */
.skeleton .row {
  height: 76px;
  border-radius: 12px;
  background: linear-gradient(
    90deg,
    var(--c-bg-soft) 25%,
    var(--c-border) 37%,
    var(--c-bg-soft) 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  margin-bottom: 10px;
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}

.empty {
  margin-top: var(--sp-6);
  padding: var(--sp-6);
  text-align: center;
  color: var(--c-text-muted);
  background: var(--c-card);
  border: 1px dashed var(--c-border);
  border-radius: 12px;
}

/* ---------- Transitions ---------- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ---------- Responsive ---------- */
/* Tablet & Below */
@media (max-width: 1024px) {
  .container {
    padding: var(--sp-6) var(--sp-4);
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search {
    max-width: 100%;
    flex: 1 1 auto;
    margin-right: 0;
  }

  .select {
    width: 100%;
  }

  .grid {
    grid-template-columns: 1fr;
    gap: var(--sp-4);
  }
}

/* Mobile */
@media (max-width: 768px) {
  .container {
    padding: var(--sp-5) var(--sp-3);
  }

  .title-wrap h1 {
    font-size: 22px;
  }

  .title-wrap .sub {
    font-size: 13px;
  }

  .row-head {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-3);
  }

  .row-head .left {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-2);
  }

  .row-head .right {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-2);
  }

  .row-head .meta {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
  }

  .row-head .btn {
    width: 100%;
  }

  .details {
    padding: var(--sp-4);
  }

  .details h4 {
    font-size: 14px;
  }

  .details p {
    font-size: 13px;
  }

  .item-list .item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-2);
  }

  .item .thumb {
    width: 56px;
    height: 56px;
  }

  .actions {
    flex-direction: column;
    gap: var(--sp-2);
  }

  .actions .btn {
    width: 100%;
  }
}

/* Small Mobile */
@media (max-width: 480px) {
  .container {
    padding: var(--sp-4) var(--sp-2);
  }

  .title-wrap h1 {
    font-size: 20px;
  }

  .title-wrap .sub {
    font-size: 12px;
  }

  .card {
    padding: var(--sp-3);
  }

  .code {
    font-size: 13px;
  }

  .name {
    font-size: 14px;
  }

  .badge {
    font-size: 11px;
    padding: 2px 6px;
  }

  .when,
  .total {
    font-size: 12px;
  }

  .details {
    padding: var(--sp-3);
  }

  .details h4 {
    font-size: 13px;
  }

  .details p {
    font-size: 12px;
  }

  .item .thumb {
    width: 48px;
    height: 48px;
  }

  .btn {
    font-size: 13px;
    padding: var(--sp-2) var(--sp-3);
  }
}
</style>
