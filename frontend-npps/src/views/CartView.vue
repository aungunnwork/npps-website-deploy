<template>
  <div class="page">
    <div class="wrap">
      <!-- Header -->
      <header class="head">
        <div class="title-wrap">
          <h1>ตะกร้าสินค้า</h1>
          <p class="sub">ตรวจสอบจำนวน แก้ไข หรือไปชำระเงิน</p>
        </div>
      </header>

      <div v-if="loading" class="empty">กำลังโหลด...</div>
      <div v-else-if="items.length === 0" class="empty">ไม่มีสินค้าในตะกร้า</div>

      <!-- รายการสินค้าในตะกร้า -->
      <section v-else class="list">
        <article
          v-for="item in items"
          :key="item.cart_id"
          class="card cart-card"
        >
          <!-- รูป -->
          <img :src="toProdUrl(item.image_url)" :alt="item.name" class="thumb" />

          <!-- ข้อมูล -->
          <div class="meta">
            <div class="name" :title="item.name">{{ item.name }}</div>
            <div class="price">ราคา: {{ format(item.price) }} ฿</div>

            <!-- จำนวน -->
            <div class="qty-row">
              <label>จำนวน</label>
              <div class="qty">
                <button class="btn ghost sm" @click="decQty(item)">−</button>
                <input
                  type="number"
                  min="1"
                  v-model.number="item.quantity"
                  @change="onQtyChange(item)"
                />
                <button class="btn ghost sm" @click="incQty(item)">+</button>
              </div>
            </div>

            <div class="line-total">รวมรายการ: <b>{{ format(item.price * item.quantity) }}</b> ฿</div>

            <div class="actions">
              <button class="btn danger sm" @click="removeItem(item.cart_id)">ลบสินค้า</button>
            </div>
          </div>
        </article>
      </section>

      <!-- สรุปราคา + ปุ่มไปชำระเงิน -->
      <div v-if="items.length" class="summary card">
        <div class="sum-text">ราคารวมทั้งหมด</div>
        <div class="sum-amt">{{ format(cartTotal) }} ฿</div>
        <button class="btn primary" @click="$router.push('/checkout')">ชำระเงิน</button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../lib/api'
import { toProdUrl } from '@/lib/image'

const items = ref([])
const loading = ref(false)
const error = ref('')

const format = (n) =>
  Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const cartTotal = computed(() =>
  items.value.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0)
)

onMounted(loadCart)

async function loadCart() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/cart')
    items.value = data || []
  } catch (e) {
    error.value = 'โหลดข้อมูลตะกร้าล้มเหลว'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function updateItem(id, payload) {
  try {
    await api.patch(`/cart/${id}`, payload)
  } catch (e) {
    console.error(e)
    error.value = e?.response?.data?.message || 'อัปเดตรายการไม่สำเร็จ'
    await loadCart()
  }
}

function onQtyChange(item) {
  const q = Math.max(1, Number(item.quantity) || 1)
  if (q > item.stock) {
    alert(`ไม่สามารถสั่งเกิน ${item.stock} ชิ้นได้`)
    item.quantity = item.stock
  } else {
    item.quantity = q
  }
  updateItem(item.cart_id, { quantity: item.quantity })
}

function incQty(item) {
  const next = Number(item.quantity || 1) + 1
  if (next > item.stock) {
    alert(`ไม่สามารถสั่งเกิน ${item.stock} ชิ้นได้`)
    return
  }
  item.quantity = next
  updateItem(item.cart_id, { quantity: item.quantity })
}

function decQty(item) {
  const next = Math.max(1, Number(item.quantity || 1) - 1)
  if (next !== item.quantity) {
    item.quantity = next
    updateItem(item.cart_id, { quantity: next })
  }
}

async function removeItem(id) {
  if (!confirm('ลบสินค้ารายการนี้ออกจากตะกร้า?')) return
  try {
    await api.delete(`/cart/${id}`)
    items.value = items.value.filter((it) => it.cart_id !== id)
  } catch (e) {
    console.error(e)
    error.value = e?.response?.data?.message || 'ลบสินค้าไม่สำเร็จ'
  }
}
</script>

<style scoped>
.page {
  background: var(--c-bg);
  min-height: 100vh;
}

.wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: var(--sp-8) var(--sp-4);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
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

/* Card / list */
.list {
  display: grid;
  gap: var(--sp-4);
}

.card {
  background: var(--c-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-1);
  padding: var(--sp-4);
  transition: box-shadow var(--transition-fast) var(--ease);
}

.card:hover {
  box-shadow: var(--shadow-2);
}

/* Cart item card */
.cart-card {
  display: flex;
  gap: var(--sp-4);
  align-items: flex-start;
}

.thumb {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--c-border);
  background: var(--c-bg-soft);
}

.meta {
  flex: 1;
  display: grid;
  gap: var(--sp-2);
}

.name {
  font-weight: 700;
  color: var(--c-text);
}

.price {
  color: var(--c-text);
}

.line-total {
  font-weight: 600;
  color: var(--c-text);
}

.qty-row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.qty {
  display: inline-flex;
  gap: var(--sp-2);
  align-items: center;
  background: var(--c-bg-soft);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  padding: var(--sp-1);
}

.qty input {
  width: 70px;
  text-align: center;
  padding: var(--sp-2);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  outline: none;
  background: var(--c-card);
  transition: all var(--transition-fast) var(--ease);
}

.qty input:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

/* Summary block */
.summary {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  justify-content: flex-end;
  margin-top: var(--sp-5);
}

.sum-text {
  color: var(--c-text-muted);
}

.sum-amt {
  font-size: 18px;
  font-weight: 700;
  color: var(--c-text);
}

/* Buttons */
.btn {
  padding: var(--sp-3) var(--sp-4);
  border-radius: 10px;
  border: 1px solid var(--c-primary);
  background: var(--c-primary);
  color: #fff;
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-fast) var(--ease);
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

.empty {
  background: var(--c-card);
  border: 1px dashed var(--c-border);
  border-radius: 12px;
  padding: var(--sp-6);
  text-align: center;
  color: var(--c-text-muted);
  box-shadow: var(--shadow-1);
}

.error {
  color: #dc2626;
  margin-top: var(--sp-4);
  font-weight: 600;
}

/* Responsive */
@media (max-width: 1024px) {
  .wrap {
    padding: var(--sp-6) var(--sp-4);
  }
  
  .cart-body {
    flex-direction: column;
    gap: var(--sp-5);
  }
  
  .items-col {
    flex: 1;
  }
  
  .summary-col {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .wrap {
    padding: var(--sp-5) var(--sp-3);
  }
  
  .head {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-3);
  }
  
  .item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .img {
    width: 100%;
    max-width: 200px;
    margin: 0 auto;
  }
  
  .info {
    padding: 0;
  }
  
  .actions {
    flex-direction: row;
    justify-content: space-between;
    padding-top: var(--sp-3);
    border-top: 1px solid var(--c-border-light);
  }
}

@media (max-width: 480px) {
  .title-wrap h1 {
    font-size: 20px;
  }
  
  .qty {
    gap: var(--sp-1);
  }
  
  .qty button {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
  
  .qty input {
    width: 48px;
    padding: 4px;
    font-size: 14px;
  }
  
  .actions {
    flex-direction: column;
    gap: var(--sp-2);
  }
  
  .btn.sm {
    width: 100%;
  }
}
</style>
