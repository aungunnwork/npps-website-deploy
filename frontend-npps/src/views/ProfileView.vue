<template>
  <div class="wrap">
    <h2 class="page-title">ข้อมูลส่วนตัว</h2>

    <!-- โปรไฟล์ -->
    <div class="card profile">
      <template v-if="!editMode">
        <div class="profile-grid">
          <div class="row">
            <span class="label">ชื่อ-นามสกุล</span>
            <span class="value">{{ profile.name || '-' }}</span>
          </div>
          <div class="row">
            <span class="label">เบอร์โทร</span>
            <span class="value">{{ profile.phone || '-' }}</span>
          </div>
          <div class="row">
            <span class="label">ที่อยู่</span>
            <span class="value">{{ profile.address || '-' }}</span>
          </div>
        </div>
        <div class="actions">
          <button class="btn primary" @click="editMode = true">แก้ไขข้อมูล</button>
        </div>
      </template>

      <template v-else>
        <div class="form-grid">
          <label>ชื่อ-นามสกุล
            <input v-model="form.name" />
          </label>
          <label>เบอร์โทร
            <input v-model="form.phone" />
          </label>
          <label>ที่อยู่
            <textarea v-model="form.address" rows="3"></textarea>
          </label>
          <!-- ซ่อนช่องแก้ไขรหัสผ่าน -->
          <!-- <label>รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)
            <input type="password" v-model="form.password" />
          </label> -->
        </div>

        <div class="actions">
          <button class="btn primary" @click="saveProfile" :disabled="saving">
            {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
          </button>
          <button class="btn ghost" @click="cancelEdit" :disabled="saving">ยกเลิก</button>
        </div>

        <p v-if="msg" class="msg">{{ msg }}</p>
      </template>
    </div>

    <!-- ประวัติการสั่งซื้อ -->
    <h2 class="page-title mt">ประวัติการสั่งซื้อ</h2>

    <div v-if="orders.length === 0" class="empty">ยังไม่มีการสั่งซื้อ</div>

    <div v-else class="orders">
      <div class="order-card" v-for="o in orders" :key="o.order_id">
        <!-- Header - ปรับใหม่ให้สวยกว่าเดิม -->
        <div class="order-header">
          <div class="order-main-info">
            <div class="order-id-row">
              <span class="order-id">ออเดอร์ #{{ o.order_id }}</span>
              <span class="order-date">{{ toThaiDateTime(o.created_at) }}</span>
            </div>
            <div class="order-status-row">
              <span class="badge" :class="`status-${o.status}`">{{ getStatusLabel(o.status) }}</span>
              <span class="order-total">{{ format(o.total_price) }} ฿</span>
            </div>
          </div>
          <div class="order-actions">
            <!-- ✅ ปุ่มยกเลิก (เฉพาะสถานะ pending) -->
            <button
              v-if="o.status === 'pending'"
              class="btn danger sm"
              :disabled="cancellingId === o.order_id"
              @click="cancelOrder(o)"
            >
              {{ cancellingId === o.order_id ? 'กำลังยกเลิก...' : 'ยกเลิก' }}
            </button>

            <!-- ✅ ปุ่มลูกค้ายืนยันรับสินค้า (เฉพาะ shipping) -->
            <button
              v-if="o.status === 'shipping'"
              class="btn primary sm"
              :disabled="confirmingId === o.order_id"
              @click="confirmReceived(o)"
            >
              {{ confirmingId === o.order_id ? 'กำลังบันทึก...' : 'ได้รับสินค้าแล้ว' }}
            </button>

            <button class="btn ghost sm" @click="toggle(o.order_id)">
              {{ expanded === o.order_id ? 'ซ่อน ▲' : 'รายละเอียด ▼' }}
            </button>
          </div>
        </div>

        <!-- Detail -->
        <transition name="fade">
          <div v-if="expanded === o.order_id" class="order-body">

            <!-- ✅ กล่องเครื่องมือชำระเงินย้อนหลัง (เฉพาะ pending / needs_review) -->
            <div
              v-if="o.status === 'pending' || o.status === 'needs_review'"
              class="retro-box"
            >
              <div class="retro-row">
                <button
                  class="btn ghost sm"
                  @click="toggleQR(o)"
                  :disabled="loadingQRId === o.order_id"
                >
                  {{ showQR[o.order_id] ? 'ซ่อน QR' : (loadingQRId === o.order_id ? 'กำลังโหลด QR...' : 'ดู QR สำหรับออเดอร์นี้') }}
                </button>

                <div class="fileup">
                  <input
                    type="file"
                    accept="image/*"
                    :id="`slip-${o.order_id}`"
                    @change="onPickSlip(o, $event)"
                  />
                </div>

                <button
                  class="btn primary sm"
                  :disabled="!slipFiles[o.order_id] || uploadingId === o.order_id"
                  @click="submitSlip(o)"
                >
                  {{ uploadingId === o.order_id ? 'กำลังอัปโหลด...' : 'อัปสลิปยืนยัน' }}
                </button>
              </div>

              <div v-if="showQR[o.order_id] && qrUrls[o.order_id]" class="qr-wrap">
                <img :src="qrUrls[o.order_id]" alt="Order QR" />
                <div class="hint">สแกน QR เพื่อชำระ แล้วอัปโหลดสลิปด้านบน</div>
              </div>
            </div>
            <!-- /retro tools -->

            <!-- รายการสินค้า - ปรับใหม่ให้สวยกว่า -->
            <div class="items-section">
              <h4 class="section-title">รายการสินค้า</h4>
              <div class="items-list">
                <div v-for="it in o.items" :key="`${o.order_id}-${it.product_id}`" class="item-row">
                  <img 
                    :src="toProdUrl(it.image_url)" 
                    alt="" 
                    class="item-image"
                  />
                  <div class="item-details">
                    <div class="item-name">{{ it.product_name }}</div>
                    <div class="item-qty">
                      {{ it.quantity }} ชิ้น × {{ format(it.price) }} ฿
                      <span v-if="it.product_option" class="item-option">({{ it.product_option }})</span>
                    </div>
                  </div>
                  <div class="item-total">{{ format(it.price * it.quantity) }} ฿</div>
                </div>
              </div>
            </div>

            <!-- สลิปเดิม (ถ้ามี) - ปรับใหม่ -->
            <div v-if="o.payment_slip_url" class="payment-section">
              <h4 class="section-title">💳 หลักฐานการชำระเงิน</h4>
              <a 
                :href="toProdUrl(o.payment_slip_url)" 
                target="_blank" 
                rel="noopener"
                class="slip-link"
              >
                <img :src="toProdUrl(o.payment_slip_url)" alt="slip" class="slip-image" />
              </a>
            </div>

            <!-- tracking (ถ้ามี) -->
            <div v-if="o.tracking_number" class="tracking-section">
              <h4 class="section-title">🚚 หมายเลขติดตาม</h4>
              <div class="tracking-info">
                <div class="tracking-label">เลขพัสดุ:</div>
                <a 
                  :href="o.tracking_number" 
                  target="_blank" 
                  rel="noopener"
                  class="tracking-link"
                >
                  {{ o.tracking_number }} →
                </a>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../lib/api'
import { toProdUrl } from '@/lib/image'

const editMode = ref(false)
const saving = ref(false)
const profile = ref({ name: '', phone: '', address: '' })
const form = ref({ name: '', phone: '', address: '', password: '' })
const msg = ref('')

const orders = ref([])
const expanded = ref(null)
const cancellingId = ref(null)

/* ✅ states ใหม่สำหรับอัปสลิปย้อนหลัง + แสดง QR */
const slipFiles = ref({})        // { [orderId]: File }
const uploadingId = ref(null)    // กำลังอัปสลิปของ order ไหน
const qrUrls = ref({})           // { [orderId]: 'http://...' }
const showQR = ref({})           // { [orderId]: boolean }
const loadingQRId = ref(null)    // กำลังโหลด QR ของ order ไหน
const confirmingId = ref(null)   // กำลัง confirm received ของ order ไหน

onMounted(async () => {
  await loadProfile()
  await loadOrders()
})

async function loadProfile() {
  try {
    const { data } = await api.get('/users/me')
    profile.value = data || {}
    form.value = { ...profile.value, password: '' }
  } catch (e) {
    console.error(e)
  }
}

function cancelEdit() {
  editMode.value = false
  form.value = { ...profile.value, password: '' }
}

async function saveProfile() {
  try {
    saving.value = true
    await api.patch('/users/me', {
      name: form.value.name,
      phone: form.value.phone,
      address: form.value.address,
      ...(form.value.password ? { password: form.value.password } : {})
    })
    profile.value = { ...form.value, password: '' }
    editMode.value = false
    msg.value = 'บันทึกสำเร็จ'
    setTimeout(() => (msg.value = ''), 1800)
  } catch (err) {
    console.error(err)
    msg.value = 'บันทึกล้มเหลว'
  } finally {
    saving.value = false
  }
}

async function loadOrders() {
  try {
    const { data } = await api.get('/orders/my')
    orders.value = data || []
  } catch (e) {
    console.error(e)
  }
}

function toggle(id) {
  expanded.value = expanded.value === id ? null : id
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

function format(n) {
  return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function toThaiDateTime(dt) {
  try {
    return new Date(dt).toLocaleString('th-TH', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  } catch {
    return dt
  }
}

async function cancelOrder(o) {
  if (o.status !== 'pending') return
  if (!confirm(`ยืนยันยกเลิกคำสั่งซื้อ #${o.order_id} ?`)) return

  try {
    cancellingId.value = o.order_id
    await api.patch(`/orders/${o.order_id}/cancel`)
    await loadOrders()
    if (expanded.value === o.order_id) expanded.value = null
    alert('ยกเลิกคำสั่งซื้อเรียบร้อย')
  } catch (e) {
    console.error(e)
    alert(e?.response?.data?.message || 'ยกเลิกคำสั่งซื้อไม่สำเร็จ')
  } finally {
    cancellingId.value = null
  }
}

/* ========== อัปสลิปย้อนหลัง ========== */
function onPickSlip(o, ev) {
  const f = ev.target.files?.[0]
  if (f) {
    slipFiles.value = { ...slipFiles.value, [o.order_id]: f }
  }
}

async function submitSlip(o) {
  if (!slipFiles.value[o.order_id]) return
  try {
    uploadingId.value = o.order_id
    const fd = new FormData()
    fd.append('slip', slipFiles.value[o.order_id])

    // ยิงแบบ path param ก่อน
    try {
      await api.post(`/payments/verify-slip/${o.order_id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    } catch (_e) {
      // สำรองแบบ query
      await api.post(`/payments/verify-slip?order_id=${o.order_id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }

    // โหลดข้อมูลออเดอร์ใหม่
    await loadOrders()
    alert('ส่งสลิปเรียบร้อย กำลังตรวจสอบ')
  } catch (e) {
    console.error(e)
    alert(e?.response?.data?.message || 'อัปสลิปไม่สำเร็จ')
  } finally {
    uploadingId.value = null
  }
}

/* ========== ดู QR ของออเดอร์ ========== */
async function toggleQR(o) {
  const id = o.order_id
  if (showQR.value[id]) {
    showQR.value = { ...showQR.value, [id]: false }
    return
  }
  try {
    loadingQRId.value = id
    const { data } = await api.get(`/payments/by-order/${id}`)
    const url = toProdUrl(data?.qr_image_url)
    qrUrls.value = { ...qrUrls.value, [id]: url }
    showQR.value = { ...showQR.value, [id]: true }
  } catch (e) {
    console.error(e)
    alert('โหลด QR ไม่สำเร็จ')
  } finally {
    loadingQRId.value = null
  }
}

/* ========== ลูกค้ายืนยันรับสินค้า (mark done) ========== */
async function confirmReceived(o) {
  if (o.status !== 'shipping') return
  if (!confirm(`ยืนยันได้รับสินค้าแล้วสำหรับ #${o.order_id} ?`)) return
  try {
    confirmingId.value = o.order_id
    await api.patch(`/orders/${o.order_id}/received`) // <- ต้องมี route ฝั่ง backend
    await loadOrders()
    alert('อัปเดตเป็น DONE แล้ว ขอบคุณครับ')
  } catch (e) {
    console.error(e)
    alert(e?.response?.data?.message || 'อัปเดตไม่สำเร็จ')
  } finally {
    confirmingId.value = null
  }
}
</script>

<style scoped>
.wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--sp-8) var(--sp-4);
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 var(--sp-5);
  color: var(--c-text);
}

.page-title.mt {
  margin-top: var(--sp-8);
}

.card {
  background: var(--c-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-1);
  padding: var(--sp-5);
}

/* Profile */
.profile .profile-grid .row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: var(--sp-4);
  padding: var(--sp-3) 0;
  border-bottom: 1px solid var(--c-border);
}

.profile .profile-grid .row:last-child {
  border-bottom: none;
}

.profile .label {
  color: var(--c-text-muted);
  font-weight: 600;
}

.profile .value {
  font-weight: 600;
  color: var(--c-text);
}

.actions {
  display: flex;
  gap: var(--sp-3);
  justify-content: flex-end;
  margin-top: var(--sp-4);
}

.form-grid {
  display: grid;
  gap: var(--sp-4);
}

.form-grid label {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text);
}

.form-grid input,
.form-grid textarea {
  width: 100%;
  padding: var(--sp-3);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  outline: none;
  background: var(--c-bg);
  transition: all var(--transition-fast) var(--ease);
}

.form-grid input:focus,
.form-grid textarea:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.msg {
  color: #16a34a;
  margin-top: var(--sp-2);
  font-weight: 600;
}

/* Buttons */
.btn {
  border: 1px solid var(--c-border);
  border-radius: 10px;
  padding: var(--sp-3) var(--sp-4);
  background: var(--c-card);
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease);
  font-weight: 600;
  color: var(--c-text);
}

.btn:hover {
  background: var(--c-bg-soft);
}

.btn.primary {
  background: var(--c-primary);
  border-color: var(--c-primary);
  color: #fff;
}

.btn.primary:hover {
  background: var(--c-primary-700);
}

.btn.ghost {
  background: transparent;
  border-color: var(--c-border);
}

.btn.danger {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.2);
}

.btn.danger:hover {
  background: rgba(220, 38, 38, 0.15);
}

.btn.sm {
  padding: var(--sp-2) var(--sp-3);
  border-radius: 8px;
  font-size: 13px;
}

/* Orders - ปรับใหม่ให้สวยกว่า */
.orders {
  display: grid;
  gap: var(--sp-4);
  margin-top: var(--sp-4);
}

.order-card {
  background: var(--c-card);
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: var(--radius);
  padding: 0;
  box-shadow: var(--shadow-1);
  transition: all var(--transition-fast) var(--ease);
  overflow: hidden;
}

.order-card:hover {
  box-shadow: var(--shadow-2);
  border-color: var(--c-primary, #1e3a8a);
}

/* Header ใหม่ */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--sp-4);
  background: var(--c-bg-soft, #f9fafb);
  border-bottom: 1px solid var(--c-border, #e5e7eb);
  gap: var(--sp-3);
}

.order-main-info {
  flex: 1;
}

.order-id-row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin-bottom: var(--sp-1);
}

.order-id {
  font-size: 18px;
  font-weight: 700;
  color: var(--c-text, #1f2937);
}

.order-date {
  font-size: 13px;
  color: var(--c-text-muted, #6b7280);
}

.order-status-row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.order-total {
  font-size: 18px;
  font-weight: 700;
  color: var(--c-primary, #1e3a8a);
}

.order-actions {
  display: flex;
  gap: var(--sp-2);
  flex-wrap: wrap;
}

@media (max-width: 1024px) {
  .wrap {
    padding: var(--sp-6) var(--sp-4);
  }
  
  .tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .tabs button {
    white-space: nowrap;
  }
}

@media (max-width: 768px) {
  .wrap {
    padding: var(--sp-5) var(--sp-3);
  }
  
  .order-info-row {
    grid-template-columns: 1fr;
    gap: var(--sp-2);
  }
  
  .actions-row {
    justify-content: flex-start !important;
    flex-direction: column;
  }
  
  .actions-row .btn {
    width: 100%;
  }
  
  .order-detail-sheet {
    width: 100% !important;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .title-wrap h1 {
    font-size: 20px;
  }
  
  .tabs button {
    font-size: 13px;
    padding: var(--sp-2) var(--sp-3);
  }
  
  .card {
    padding: var(--sp-3);
  }
}

.dt {
  color: var(--c-text-muted);
  font-size: 14px;
}

.amt {
  font-weight: 700;
  color: var(--c-text);
}

.status-text {
  text-align: center;
}

.actions-row {
  display: flex;
  justify-content: flex-end;
  gap: var(--sp-2);
  flex-wrap: wrap;
}

/* Badge - ปรับสีใหม่ให้สวยกว่า */
.badge {
  display: inline-block;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 999px;
  font-weight: 600;
  white-space: nowrap;
}

.badge.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.badge.status-paid {
  background: #d1fae5;
  color: #065f46;
}

.badge.status-shipping {
  background: #dbeafe;
  color: #1e40af;
}

.badge.status-done {
  background: #d1fae5;
  color: #065f46;
}

.badge.status-cancel {
  background: #fee2e2;
  color: #991b1b;
}

.badge.status-needs_review {
  background: #fff7ed;
  color: #9a3412;
}

/* Body */
.order-body {
  padding: var(--sp-4);
}

/* retro tools */
.retro-box {
  margin-bottom: var(--sp-3);
  padding: var(--sp-3);
  background: rgba(251, 191, 36, 0.05);
  border: 1px dashed #fbbf24;
  border-radius: 10px;
}

.retro-row {
  display: flex;
  gap: var(--sp-2);
  align-items: center;
  flex-wrap: wrap;
}

.fileup input[type='file'] {
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  background: var(--c-card);
}

.qr-wrap {
  margin-top: var(--sp-3);
  text-align: center;
}

.qr-wrap img {
  width: 220px;
  height: 220px;
  object-fit: contain;
  border: 1px solid var(--c-border);
  border-radius: 12px;
  background: var(--c-card);
}

.hint {
  color: var(--c-text-muted);
  font-size: 12px;
  margin-top: var(--sp-1);
}

/* Items Section - ปรับใหม่ */
.items-section {
  margin-bottom: var(--sp-4);
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 var(--sp-3);
  color: var(--c-text, #1f2937);
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.items-list {
  display: grid;
  gap: var(--sp-2);
}

.item-row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3);
  background: var(--c-bg-soft, #f9fafb);
  border-radius: 8px;
  border: 1px solid var(--c-border, #e5e7eb);
}

.item-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  background: #fff;
  border: 1px solid var(--c-border, #e5e7eb);
}

.item-details {
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: var(--c-text, #1f2937);
  margin-bottom: 4px;
  font-size: 14px;
}

.item-qty {
  color: var(--c-text-muted, #6b7280);
  font-size: 13px;
}

.item-option {
  color: var(--c-text-muted, #6b7280);
  font-style: italic;
}

.item-total {
  font-weight: 700;
  color: var(--c-primary, #1e3a8a);
  font-size: 15px;
  white-space: nowrap;
}

/* Payment Section */
.payment-section {
  margin-bottom: var(--sp-4);
}

.slip-link {
  display: inline-block;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--c-border, #e5e7eb);
  transition: all 0.2s;
}

.slip-link:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.slip-image {
  width: 280px;
  max-width: 100%;
  display: block;
  background: #fff;
}

/* Tracking Section */
.tracking-section {
  margin-bottom: var(--sp-4);
}

.tracking-info {
  padding: var(--sp-3);
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(14, 165, 233, 0.08));
  border-radius: 10px;
  border: 1px solid rgba(6, 182, 212, 0.2);
}

.tracking-label {
  font-size: 13px;
  color: var(--c-text-muted, #6b7280);
  margin-bottom: var(--sp-1);
  font-weight: 500;
}

.tracking-link {
  color: var(--c-accent, #06b6d4);
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  transition: all 0.2s;
}

.tracking-link:hover {
  text-decoration: underline;
  transform: translateX(2px);
}

.empty {
  color: var(--c-text-muted);
  margin-top: var(--sp-2);
  text-align: center;
  padding: var(--sp-5);
  background: var(--c-bg-soft);
  border-radius: 10px;
}

/* Anim */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-3);
  }

  .order-actions {
    width: 100%;
    flex-direction: column;
  }

  .order-actions button {
    width: 100%;
    justify-content: center;
  }

  .item-row {
    grid-template-columns: 60px 1fr;
    gap: var(--sp-2);
  }

  .item-image {
    width: 60px;
    height: 60px;
  }

  .item-details {
    font-size: 13px;
  }

  .item-total {
    text-align: left;
    margin-top: var(--sp-1);
  }
}
</style>
