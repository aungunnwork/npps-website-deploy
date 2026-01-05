<template>
  <div class="page">
    <div class="wrap checkout">
      <!-- Header -->
      <header class="head">
        <div class="title-wrap">
          <h1>ชำระเงิน</h1>
          <p class="sub">กรอกข้อมูลจัดส่ง สร้างออเดอร์เพื่อขอ QR จากนั้นอัปโหลดสลิปและยืนยัน</p>
        </div>
      </header>

      <div v-if="loading" class="empty">กำลังโหลดตะกร้า...</div>
      <!-- ถ้ายังไม่มีสินค้าและยังไม่กดสร้างออเดอร์ -->
      <div v-else-if="items.length === 0 && !orderId" class="empty">ไม่มีสินค้าในตะกร้า</div>

      <section v-else class="grid">
        <!-- ซ้าย: ข้อมูลจัดส่ง + ชำระเงิน -->
        <div class="left">
          <div class="card">
            <h3 class="card-title">ข้อมูลจัดส่ง</h3>
            <div class="form">
              <label>ชื่อ-นามสกุล
                <input v-model="shipping.fullname" placeholder="ชื่อผู้รับ" />
              </label>
              <label>เบอร์โทร
                <input v-model="shipping.phone" placeholder="0812345678" />
              </label>
              <label>ที่อยู่
                <textarea v-model="shipping.address" rows="4" placeholder="บ้านเลขที่ / ถนน / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์"></textarea>
              </label>
            </div>
          </div>

          <div class="card">
            <h3 class="card-title">ชำระเงินโดยโอนบัญชี</h3>
            <div class="paybox">
              <p>โอนเข้าบัญชี: <b>พร้อมเพย์ 080-179-2785</b> ชื่อบัญชี <b>อังกูล เณรรักษา</b></p>

              <!-- ✅ แสดง QR หลังสร้างออเดอร์สำเร็จ -->
              <div v-if="qrUrl" class="qr-section">
                <p><b>สแกน QR ด้านล่างเพื่อชำระเงิน</b></p>
                <img
                  :src="toProdUrl(qrUrl)"
                  alt="QR PromptPay"
                  class="qr-img"
                />
                <p class="hint">เมื่อโอนเสร็จให้อัปโหลดสลิปเพื่อยืนยันการชำระเงิน</p>
              </div>
              <!-- ❗️ส่วนอัปโหลดสลิปจะแสดงเฉพาะเมื่อมี orderId (สร้าง QR แล้ว) -->
              <template v-if="orderId">
                <label class="file">
                  อัปโหลดสลิปโอนเงิน (jpg/png)
                  <input type="file" accept="image/*" @change="onSlipChange" />
                </label>
              </template>
              <p v-else class="hint">* กรุณากด “สร้างออเดอร์ / ขอ QR” ก่อน เพื่อเปิดส่วนอัปโหลดสลิป</p>
            </div>

            <!-- 🔘 ปุ่มที่ 1: สร้างออเดอร์ / ขอ QR (ไม่ต้องมีสลิป) -->
            <button
              class="btn primary mt"
              :disabled="placing || !canCreateOrder"
              @click="createOrderAndFetchQR"
            >
              {{ placing && !orderId ? 'กำลังสร้างคำสั่งซื้อ...' : 'สร้างออเดอร์ / ขอ QR' }}
            </button>

            <!-- 🔘 ปุ่มที่ 2: อัปโหลดสลิป & ยืนยันชำระเงิน (โผล่เฉพาะเมื่อมี orderId แล้ว) -->
            <button
              v-if="orderId"
              class="btn mt"
              :disabled="placing || !slipFile"
              @click="uploadSlipAndVerify"
            >
              {{ placing && orderId ? 'กำลังยืนยันการชำระเงิน...' : 'อัปโหลดสลิป & ยืนยันชำระเงิน' }}
            </button>

            <p v-if="error" class="error">{{ error }}</p>
          </div>
        </div>

        <!-- ขวา: สรุปรายการสินค้า
             ✅ ใช้ displayItems (snapshot) เพื่อไม่ให้หายหลังสร้าง QR -->
        <aside class="right" v-if="displayItems.length">
          <div class="card">
            <h3 class="card-title">สรุปรายการ</h3>

            <ul class="items">
              <li v-for="it in displayItems" :key="it.cart_id || it.product_id" class="item">
                <div class="meta">
                  <div class="name" :title="it.name">{{ it.name }}</div>
                  <div class="sub">
                    <span v-if="it.product_option" class="note">ตัวเลือก: {{ it.product_option }}</span>
                    <span class="qty">× {{ it.quantity }}</span>
                  </div>
                </div>
                <div class="price">{{ format(it.price * it.quantity) }} ฿</div>
              </li>
            </ul>

            <div class="total">
              <span>ราคารวมทั้งหมด</span>
              <b>{{ format(cartTotal) }} ฿</b>
            </div>
          </div>
        </aside>
      </section>

      <!-- Success Modal (โชว์หลัง verify สลิปผ่าน) -->
      <div
        v-if="success.order_code"
        class="success"
        @click.self="closeSuccess"
      >
        <div class="success-card">
          <button class="close-x" @click="closeSuccess" aria-label="close">×</button>
          <h3>สั่งซื้อสำเร็จ!</h3>
          <p>เลขที่คำสั่งซื้อ: <b>{{ success.order_code }}</b></p>
          <div class="actions">
            <button class="btn ghost" @click="closeSuccess">ปิด</button>
            <button class="btn primary" @click="$router.push('/')">กลับหน้าแรก</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../lib/api'
import { toProdUrl } from '@/lib/image'

const items = ref([])
const itemsSnapshot = ref([])   // ✅ เก็บสำเนาสินค้าไว้แสดงหลังเคลียร์ตะกร้า
const loading = ref(false)
const placing = ref(false)
const error = ref('')
const success = ref({ order_code: '' })
const slipFile = ref(null)

const qrUrl = ref('')          // ✅ รูป QR จาก backend
const orderId = ref(null)      // ✅ เก็บ orderId ที่เพิ่งสร้าง

const shipping = ref({
  fullname: '',
  phone: '',
  address: '',
  note: ''
})

const format = (n) =>
  Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** ✅ ใช้ displayItems เป็นแหล่งข้อมูลหลักสำหรับแสดงผล */
const displayItems = computed(() =>
  items.value.length ? items.value : itemsSnapshot.value
)

const cartTotal = computed(() =>
  displayItems.value.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0)
)

const canCreateOrder = computed(() =>
  (!!items.value.length) && !!shipping.value.phone && !!shipping.value.address
)

onMounted(async () => {
  await loadCart()
  await loadUserProfile()
})

async function loadCart() {
  loading.value = true
  try {
    const { data } = await api.get('/cart')
    items.value = data || []
  } catch {
    error.value = 'โหลดตะกร้าล้มเหลว'
  } finally {
    loading.value = false
  }
}

async function loadUserProfile() {
  try {
    const { data } = await api.get('/users/me')
    shipping.value.fullname = data.name
    shipping.value.phone = data.phone || ''
    shipping.value.address = data.address || ''
  } catch (e) {
    console.error(e)
  }
}

function onSlipChange(e) {
  const f = e.target.files?.[0]
  if (f) slipFile.value = f
}

/* ============================
   ปุ่มที่ 1: สร้างออเดอร์ / ขอ QR (ไม่บังคับสลิป)
   ============================ */
async function createOrderAndFetchQR() {
  error.value = ''
  if (!canCreateOrder.value) {
    return (error.value = 'กรอกข้อมูลจัดส่งให้ครบและตรวจสอบตะกร้า')
  }

  placing.value = true
  try {
    // อัปเดตที่อยู่ก่อน (ของเดิม)
    await api.patch('/users/me', {
      phone: shipping.value.phone,
      address: shipping.value.address
    })

    // เตรียม payload ออเดอร์ (ไม่แนบสลิปในขั้นนี้)
    const fd = new FormData()
    fd.append('shipping_fullname', shipping.value.fullname)
    fd.append('shipping_phone', shipping.value.phone)
    fd.append('shipping_address', shipping.value.address)
    fd.append('note', shipping.value.note || '')
    fd.append('payment_method', 'BANK_TRANSFER')

    const payloadItems = items.value.map(it => ({
      product_id: it.product_id,
      quantity: it.quantity,
      product_option: it.product_option || null
    }))
    fd.append('items', JSON.stringify(payloadItems))
    fd.append('total_client', String(cartTotal.value))
    // ❌ ไม่แนบ 'slip' ที่นี่

    const { data } = await api.post('/orders', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    // เก็บ orderId ไว้ใช้ขั้น verify + ดึง QR
    if (data?.orderId) {
      orderId.value = data.orderId

      // โหลด QR
      try {
        const res = await api.get(`/payments/by-order/${data.orderId}`)
        qrUrl.value = res.data?.qr_image_url || ''
      } catch (e) {
        console.warn('โหลด QR ไม่สำเร็จ', e)
      }
    }

    // ✅ snapshot รายการไว้ก่อนเคลียร์ตะกร้า (เพื่อไม่ให้ UI หาย)
    itemsSnapshot.value = items.value.map(i => ({ ...i }))

    // ✅ เคลียร์ตะกร้าใน backend กันกดซ้ำ แต่ UI ยังแสดงจาก snapshot
    try {
      await api.delete('/cart/clear')
    } catch {
      for (const it of items.value) {
        try { await api.delete(`/cart/${it.cart_id}`) } catch {}
      }
    }
    items.value = [] // UI จะไปใช้ itemsSnapshot แทน
  } catch (e) {
    console.error(e)
    error.value = e?.response?.data?.message || 'สร้างคำสั่งซื้อไม่สำเร็จ'
  } finally {
    placing.value = false
  }
}

/* ============================
   ปุ่มที่ 2: อัปโหลดสลิป & ขอ verify (รองรับทั้ง path และ query)
   ============================ */
async function uploadSlipAndVerify() {
  error.value = ''
  if (!orderId.value) return (error.value = 'ยังไม่มีคำสั่งซื้อ กรุณากด "สร้างออเดอร์ / ขอ QR" ก่อน')
  if (!slipFile.value) return (error.value = 'กรุณาอัปโหลดสลิปการโอนเงิน')

  placing.value = true
  try {
    const fd = new FormData()
    fd.append('slip', slipFile.value)

    // พยายามแบบ path param ก่อน
    try {
      await api.post(`/payments/verify-slip/${orderId.value}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    } catch (_e) {
      // ถ้า backend ใช้แบบ query ก็ลองแบบนี้แทน
      await api.post(`/payments/verify-slip?order_id=${orderId.value}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }

    // verify ผ่าน -> โชว์ modal
    success.value.order_code = String(orderId.value)
    error.value = ''
    // (ออปชัน) เคลียร์ไฟล์ เพื่อกันอัปซ้ำโดยไม่ตั้งใจ
    slipFile.value = null
  } catch (e) {
    console.error(e)
    // ✅ รองรับเคส pending (422) ให้ข้อความสุภาพ
    if (e?.response?.status === 422) {
      error.value = e.response.data?.message || 'อัปโหลดสลิปสำเร็จ ระบบกำลังตรวจสอบ'
      success.value.order_code = String(orderId.value) // แสดง modal ได้เหมือนเดิม
    } else {
      error.value = e?.response?.data?.message || 'ยืนยันการชำระเงินไม่สำเร็จ'
    }
  } finally {
    placing.value = false
  }
}

/* === ปิดโมดัลสำเร็จ === */
function closeSuccess() {
  success.value = { order_code: '' }
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

.grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: var(--sp-5);
  align-items: start;
}

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr;
    gap: var(--sp-5);
  }
  
  .wrap {
    padding: var(--sp-6) var(--sp-4);
  }
}

@media (max-width: 768px) {
  .wrap {
    padding: var(--sp-5) var(--sp-3);
  }
  
  .card {
    padding: var(--sp-4);
  }
}

@media (max-width: 480px) {
  .title-wrap h1 {
    font-size: 20px;
  }
  
  .card {
    padding: var(--sp-3);
  }
  
  .card-title {
    font-size: 15px;
  }
}

.card {
  background: var(--c-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-1);
  padding: var(--sp-5);
  transition: box-shadow var(--transition-fast) var(--ease);
}

.card:hover {
  box-shadow: var(--shadow-2);
}

.card-title {
  margin: 0 0 var(--sp-3);
  font-size: 16px;
  font-weight: 700;
  color: var(--c-text);
}

.form {
  display: grid;
  gap: var(--sp-4);
}

.form label {
  display: grid;
  gap: var(--sp-2);
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text);
}

.form input,
.form textarea {
  padding: var(--sp-3);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  outline: none;
  background: var(--c-bg);
  transition: all var(--transition-fast) var(--ease);
}

.form input:focus,
.form textarea:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.paybox {
  background: var(--c-bg-soft);
  border: 1px dashed var(--c-border);
  border-radius: 12px;
  padding: var(--sp-4);
}

.paybox .file input[type='file'] {
  margin-top: var(--sp-2);
}

.mt {
  margin-top: var(--sp-4);
}

.qr-section,
.qr-modal {
  margin-top: var(--sp-3);
  text-align: center;
}

.qr-img {
  width: 220px;
  height: 220px;
  object-fit: contain;
  border: 1px solid var(--c-border);
  border-radius: 12px;
  margin-top: var(--sp-2);
  background: var(--c-card);
}

.hint {
  color: var(--c-text-muted);
  font-size: 12px;
  margin-top: var(--sp-1);
}

.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--sp-3);
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: var(--c-bg-soft);
  border-radius: 10px;
  padding: var(--sp-3);
}

.item .meta {
  display: grid;
  gap: var(--sp-1);
}

.name {
  font-weight: 700;
  color: var(--c-text);
}

.sub {
  color: var(--c-text-muted);
  font-size: 13px;
  display: flex;
  gap: var(--sp-2);
  align-items: center;
}

.note {
  color: var(--c-text-muted);
}

.qty {
  color: var(--c-text-muted);
}

.price {
  font-weight: 700;
  color: var(--c-text);
}

.total {
  margin-top: var(--sp-4);
  padding-top: var(--sp-4);
  border-top: 1px dashed var(--c-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 700;
  color: var(--c-text);
}

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
  margin-top: var(--sp-3);
  font-weight: 600;
}

/* Success modal */
.success {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 50;
  backdrop-filter: blur(2px);
}

.success-card {
  position: relative;
  background: var(--c-card);
  border-radius: var(--radius);
  padding: var(--sp-6);
  width: min(420px, 92vw);
  box-shadow: var(--shadow-2);
  text-align: center;
}

.success-card h3 {
  margin: 0 0 var(--sp-3);
  font-size: 20px;
  font-weight: 700;
  color: var(--c-text);
}

.success-card p {
  margin: 0 0 var(--sp-4);
  color: var(--c-text);
}

.close-x {
  position: absolute;
  right: var(--sp-3);
  top: var(--sp-3);
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
  color: var(--c-text-muted);
  transition: color var(--transition-fast) var(--ease);
}

.close-x:hover {
  color: var(--c-text);
}

.actions {
  display: flex;
  gap: var(--sp-2);
  justify-content: center;
}
</style>
