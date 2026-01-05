<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <!-- Header -->
      <div class="modal-header">
        <h2>รายการออเดอร์วันที่ {{ formatDate(date) }}</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>กำลังโหลด...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="btn ghost" @click="loadOrders">ลองอีกครั้ง</button>
      </div>

      <!-- Empty -->
      <div v-else-if="orders.length === 0" class="empty-state">
        <p>ไม่มีออเดอร์ในวันนี้</p>
      </div>

      <!-- Orders List -->
      <div v-else class="modal-body">
        <div class="orders-container">
          <!-- ใช้รูปแบบเดียวกับ ProfileView -->
          <div class="order-card" v-for="o in orders" :key="o.order_id">
            <!-- Header row -->
            <div class="order-header">
              <div class="order-info">
                <span class="order-id">ออเดอร์ #{{ o.order_id }}</span>
                <span class="order-time">{{ formatDateTime(o.created_at) }}</span>
              </div>
              <div class="order-badges">
                <span class="badge" :class="`status-${o.order_status}`">
                  {{ getStatusLabel(o.order_status) }}
                </span>
              </div>
            </div>

            <!-- Customer info -->
            <div class="customer-section">
              <div class="customer-row">
                <span class="label">👤 ผู้สั่งซื้อ:</span>
                <span class="value">{{ o.username || 'N/A' }}</span>
              </div>
              <div class="customer-row" v-if="o.phone">
                <span class="label">📞 เบอร์โทร:</span>
                <span class="value">{{ o.phone }}</span>
              </div>
              <div class="customer-row" v-if="o.address">
                <span class="label">📍 ที่อยู่:</span>
                <span class="value">{{ o.address }}</span>
              </div>
            </div>

            <!-- Items -->
            <div class="items-section">
              <h4>รายการสินค้า</h4>
              <div class="item" v-for="item in o.items" :key="item.product_id">
                <img 
                  v-if="item.image_url" 
                  :src="toProdUrl(item.image_url)" 
                  :alt="item.product_name"
                  class="item-img"
                />
                <div class="item-info">
                  <div class="item-name">{{ item.product_name }}</div>
                  <div class="item-detail">
                    {{ item.quantity }} ชิ้น × {{ formatCurrency(item.price) }} ฿
                  </div>
                </div>
                <div class="item-total">
                  {{ formatCurrency(item.price * item.quantity) }} ฿
                </div>
              </div>
            </div>

            <!-- Payment slip -->
            <div v-if="o.payment_slip_url" class="slip-section">
              <span class="label">💳 หลักฐานการชำระ:</span>
              <a :href="toProdUrl(o.payment_slip_url)" target="_blank" class="slip-link">
                ดูสลิป
              </a>
            </div>

            <!-- Tracking -->
            <div v-if="o.tracking_number" class="tracking-section">
              <span class="label">📦 Tracking:</span>
              <span class="tracking-code">{{ o.tracking_number }}</span>
            </div>

            <!-- Total -->
            <div class="order-total">
              <span class="label">ยอดรวม:</span>
              <span class="value">{{ formatCurrency(o.total_price) }} ฿</span>
            </div>
          </div>
        </div>

        <!-- Summary footer -->
        <div class="summary-footer">
          <div class="summary-item">
            <span class="label">จำนวนออเดอร์:</span>
            <span class="value">{{ orders.length }} รายการ</span>
          </div>
          <div class="summary-item total">
            <span class="label">ยอดรวมทั้งหมด:</span>
            <span class="value">{{ formatCurrency(totalRevenue) }} ฿</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import api from '@/lib/api'
import { toProdUrl } from '@/lib/image'

const props = defineProps({
  show: Boolean,
  date: String // YYYY-MM-DD
})

const emit = defineEmits(['close'])

const orders = ref([])
const loading = ref(false)
const error = ref('')

const totalRevenue = computed(() => {
  return orders.value.reduce((sum, o) => sum + Number(o.total_price || 0), 0)
})

watch(() => props.show, (newVal) => {
  if (newVal && props.date) {
    loadOrders()
  } else {
    orders.value = []
    error.value = ''
  }
})

async function loadOrders() {
  if (!props.date) return
  
  loading.value = true
  error.value = ''
  
  try {
    console.log('[DEBUG] Loading orders for date:', props.date)
    const { data } = await api.get(`/admin/orders/daily/${props.date}`)
    console.log('[DEBUG] Response:', data)
    orders.value = data || []
    console.log('[DEBUG] Orders count:', orders.value.length)
  } catch (err) {
    console.error('[LOAD_DAILY_ORDERS]', err)
    console.error('[DEBUG] Error response:', err.response?.data)
    error.value = 'โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่'
    orders.value = []
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr + 'T00:00:00+07:00')
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

function formatCurrency(num) {
  return Number(num || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function getStatusLabel(status) {
  const labels = {
    pending: 'รอดำเนินการ',
    paid: 'ชำระแล้ว',
    shipping: 'กำลังจัดส่ง',
    done: 'สำเร็จ',
    cancel: 'ยกเลิก'
  }
  return labels[status] || status
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  backdrop-filter: blur(2px);
}

.modal-card {
  background: var(--c-card, #fff);
  border-radius: var(--radius, 12px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--sp-5, 20px) var(--sp-6, 24px);
  border-bottom: 1px solid var(--c-border, #e5e7eb);
  background: var(--c-bg-soft, #f9fafb);
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--c-text, #1f2937);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--c-text-muted, #6b7280);
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--c-border, #e5e7eb);
  color: var(--c-text, #1f2937);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--sp-5, 20px);
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--c-border, #e5e7eb);
  border-top-color: var(--c-primary, #1e3a8a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state p,
.empty-state p {
  color: var(--c-text-muted, #6b7280);
  font-size: 16px;
}

.orders-container {
  display: grid;
  gap: var(--sp-4, 16px);
}

/* ยืมสไตล์จาก ProfileView */
.order-card {
  background: var(--c-card, #fff);
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: var(--radius, 12px);
  padding: var(--sp-4, 16px);
  box-shadow: var(--shadow-1, 0 1px 3px rgba(0,0,0,0.1));
  transition: box-shadow 0.2s;
}

.order-card:hover {
  box-shadow: var(--shadow-2, 0 4px 12px rgba(0,0,0,0.1));
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--sp-3, 12px);
  gap: 12px;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-id {
  font-size: 16px;
  font-weight: 700;
  color: var(--c-text, #1f2937);
}

.order-time {
  font-size: 13px;
  color: var(--c-text-muted, #6b7280);
}

.order-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
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

.customer-section {
  background: var(--c-bg-soft, #f9fafb);
  padding: var(--sp-3, 12px);
  border-radius: 8px;
  margin-bottom: var(--sp-3, 12px);
  display: grid;
  gap: 8px;
}

.customer-row {
  display: flex;
  gap: 12px;
  font-size: 14px;
}

.customer-row .label {
  font-weight: 600;
  color: var(--c-text-muted, #6b7280);
  min-width: 100px;
}

.customer-row .value {
  color: var(--c-text, #1f2937);
}

.items-section {
  margin-bottom: var(--sp-3, 12px);
}

.items-section h4 {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--c-text, #1f2937);
}

.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: var(--c-bg-soft, #f9fafb);
  border-radius: 8px;
  margin-bottom: 8px;
}

.item-img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 6px;
  background: #fff;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text, #1f2937);
  margin-bottom: 2px;
}

.item-detail {
  font-size: 13px;
  color: var(--c-text-muted, #6b7280);
}

.item-total {
  font-size: 14px;
  font-weight: 700;
  color: var(--c-primary, #1e3a8a);
  white-space: nowrap;
}

.slip-section,
.tracking-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--c-bg-soft, #f9fafb);
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.slip-section .label,
.tracking-section .label {
  font-weight: 600;
  color: var(--c-text-muted, #6b7280);
}

.slip-link {
  color: var(--c-primary, #1e3a8a);
  text-decoration: underline;
  font-weight: 600;
}

.tracking-code {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: var(--c-primary, #1e3a8a);
}

.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--c-bg-soft, #f9fafb);
  border-radius: 8px;
  font-weight: 700;
  font-size: 16px;
  border-top: 2px solid var(--c-border, #e5e7eb);
}

.order-total .label {
  color: var(--c-text, #1f2937);
}

.order-total .value {
  color: var(--c-primary, #1e3a8a);
  font-size: 18px;
}

.summary-footer {
  margin-top: var(--sp-4, 16px);
  padding: var(--sp-4, 16px);
  background: var(--c-bg-soft, #f9fafb);
  border-radius: var(--radius, 12px);
  border: 2px solid var(--c-border, #e5e7eb);
  display: grid;
  gap: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.summary-item.total {
  font-size: 18px;
  font-weight: 700;
  padding-top: 12px;
  border-top: 2px solid var(--c-border, #e5e7eb);
}

.summary-item .label {
  color: var(--c-text, #1f2937);
}

.summary-item .value {
  color: var(--c-primary, #1e3a8a);
  font-weight: 700;
}

.btn.ghost {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn.ghost:hover {
  background: var(--c-bg-soft, #f9fafb);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-card {
    max-height: 100vh;
    border-radius: 0;
  }

  .order-header {
    flex-direction: column;
  }

  .customer-row {
    flex-direction: column;
    gap: 4px;
  }

  .item {
    flex-wrap: wrap;
  }

  .item-total {
    width: 100%;
    text-align: right;
  }
}
</style>
