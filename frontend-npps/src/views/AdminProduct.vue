<template>
  <div class="page">
    <AdminNavbar />

    <div class="wrap">
      <header class="head">
        <div class="title-wrap">
          <h1>จัดการสินค้า</h1>
          <p class="sub">เพิ่ม แก้ไข และลบสินค้าในร้านของคุณ</p>
        </div>
        <button class="btn primary" @click="openForm()">
          ➕ เพิ่มสินค้า
        </button>
      </header>

      <!-- ✅ Search Toolbar -->
      <div class="toolbar">
        <div class="search-box">
          <span class="search-icon">🔎</span>
          <input
            v-model="search"
            type="text"
            class="search-input"
            placeholder="ค้นหาสินค้าในร้าน..."
            aria-label="ค้นหาสินค้า"
            @keydown.enter.prevent
            @keydown.esc="clearSearch"
          />
          <button
            v-if="search"
            class="clear-btn"
            @click="clearSearch"
            aria-label="ล้างการค้นหา"
            title="ล้างการค้นหา (Esc)"
          >
            ✕
          </button>
        </div>
        <div class="search-result" v-if="debouncedSearch">
          พบ <strong>{{ filteredProducts.length }}</strong> รายการ
        </div>
      </div>

      <section class="card">
        <table class="table">
          <thead>
            <tr>
              <th style="width:80px">ID</th>
              <th style="width:100px">รูป</th>
              <th>ชื่อสินค้า</th>
              <th style="width:140px">หมวดหมู่</th>
              <th class="right" style="width:160px">ราคา</th>
              <th class="right" style="width:120px">สต็อก</th>
              <th style="width:160px">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredProducts" :key="p.product_id">
              <td class="muted">#{{ p.product_id }}</td>
              <td>
                <img :src="toProdUrl(p.image_url)" class="thumb" alt="" />
              </td>
              <td class="name-col">
                <div class="name">{{ p.product_name }}</div>
                <div class="sku" v-if="p.sku">SKU: {{ p.sku }}</div>
              </td>
              <td>
                <span class="badge soft" v-if="p.category_name">{{ p.category_name }}</span>
                <span class="muted" v-else>-</span>
              </td>
              <td class="right strong">{{ format(p.price) }} ฿</td>
              <td class="right">{{ p.stock }}</td>
              <td>
                <div class="row-actions">
                  <button class="btn ghost sm" @click="openForm(p)">แก้ไข</button>
                  <button class="btn danger sm" @click="removeProduct(p.product_id)">ลบ</button>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredProducts.length">
              <td colspan="7" class="empty">
                {{ debouncedSearch ? 'ไม่พบสินค้าที่ตรงกับการค้นหา' : 'ยังไม่มีสินค้า' }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <!-- Modal -->
    <div v-if="showForm" class="modal" @click.self="closeForm">
      <div class="sheet">
        <div class="sheet-head">
          <h3>{{ form.product_id ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า' }}</h3>
          <button class="btn ghost sm" @click="closeForm">ปิด</button>
        </div>

        <div class="grid">
          <div class="uploader">
            <div
              class="drop"
              :class="{ dragging }"
              @dragover.prevent="dragging = true"
              @dragleave.prevent="dragging = false"
              @drop.prevent="onDrop"
            >
              <img v-if="previewUrl" :src="previewUrl" class="preview" />
              <div v-else class="empty-drop">
                <div class="icon">🖼️</div>
                <div class="hint">ลากรูปมาวาง หรือ</div>
                <label class="btn ghost sm">
                  เลือกรูป
                  <input type="file" accept="image/*" hidden @change="onFileChange" />
                </label>
              </div>
            </div>
            
            <!-- ✅ ปุ่มเปลี่ยนรูปภาพ (แสดงเมื่อมีรูปพรีวิวอยู่แล้ว) -->
            <div v-if="previewUrl" class="change-image-section">
              <label class="btn ghost sm change-image-btn">
                {{ form.product_id ? 'เปลี่ยนรูปภาพ' : 'เปลี่ยนรูป' }}
                <input type="file" accept="image/*" hidden @change="onFileChange" />
              </label>
            </div>
            
            <small class="muted">รองรับ .jpg .png • แนะนำขนาดรูปสี่เหลี่ยมจัตุรัส</small>
          </div>

          <div class="form">
            <label>ชื่อสินค้า
              <input v-model.trim="form.product_name" placeholder="เช่น ค้อนยาง" />
            </label>

            <div class="row-2">
              <label>ราคา
                <input type="number" step="0.01" v-model.number="form.price" placeholder="0.00" />
              </label>
              <label>สต็อก
                <input type="number" v-model.number="form.stock" placeholder="0" />
              </label>
            </div>

            <!-- ✅ เลือกหมวดหมู่ (เพิ่มใหม่) -->
            <label>หมวดหมู่
              <select v-model="form.category_id">
                <option :value="null">— ไม่ระบุหมวด —</option>
                <option v-for="c in categories" :key="c.category_id" :value="c.category_id">
                  {{ c.name }}
                </option>
              </select>
            </label>

            <label v-if="'sku' in form">SKU (ถ้ามี)
              <input v-model.trim="form.sku" placeholder="เช่น SKU-001" />
            </label>

            <div class="actions">
              <button class="btn primary" @click="saveProduct" :disabled="saving">
                {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
              </button>
              <button class="btn ghost" @click="closeForm" :disabled="saving">ยกเลิก</button>
            </div>

            <p v-if="msg" class="msg">{{ msg }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <SiteFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import api from '../lib/api'
import { toProdUrl } from '@/lib/image'
import AdminNavbar from '../components/AdminNavbar.vue'
import SiteFooter from '../components/SiteFooter.vue'

const products = ref([])
const categories = ref([]) // ✅ list หมวดหมู่
const showForm = ref(false)
const form = ref({})
const file = ref(null)
const previewUrl = ref('')
const dragging = ref(false)
const saving = ref(false)
const msg = ref('')

// ✅ Search functionality
const search = ref('')
const debouncedSearch = ref('')
let debounceTimer = null

// Debounce search input (250ms)
watch(search, (newVal) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = newVal
  }, 250)
})

// Filter products based on search
const filteredProducts = computed(() => {
  const query = debouncedSearch.value.trim().toLowerCase()
  if (!query) return products.value
  
  return products.value.filter(p => {
    return (
      p.product_name?.toLowerCase().includes(query) ||
      p.sku?.toLowerCase().includes(query) ||
      p.category_name?.toLowerCase().includes(query) ||
      String(p.product_id).includes(query)
    )
  })
})

// Clear search
function clearSearch() {
  search.value = ''
  debouncedSearch.value = ''
}

// Load data and setup keyboard shortcuts
onMounted(async () => {
  // Load products and categories
  await Promise.all([loadProducts(), loadCategories()])
  
  // Setup keyboard shortcuts for search
  const handleKeydown = (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      document.querySelector('.search-input')?.focus()
    }
    // Esc to clear search when focused
    if (e.key === 'Escape' && search.value) {
      clearSearch()
      document.querySelector('.search-input')?.blur()
    }
  }
  window.addEventListener('keydown', handleKeydown)
  
  // Cleanup on unmount
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    clearTimeout(debounceTimer)
  })
})

async function loadProducts() {
  try {
    // ใช้ endpoint /products แบบใหม่ที่คืน category_name มาด้วย
    const { data } = await api.get('/products')
    products.value = data || []
  } catch (e) {
    console.error('[LOAD_PRODUCTS_ERROR]', e)
  }
}

async function loadCategories() {
  try {
    const { data } = await api.get('/admin/categories')
    categories.value = data || []
  } catch (e) {
    console.error('[LOAD_CATEGORIES_ERROR]', e)
  }
}

function format(n) {
  return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function openForm(p = null) {
  form.value = p
    ? { ...p, category_id: p.category_id ?? null }
    : { product_name: '', price: 0, stock: 0, image_url: '', category_id: null }
  file.value = null
  previewUrl.value = form.value.image_url ? toProdUrl(form.value.image_url) : ''
  showForm.value = true
  msg.value = ''
}

function closeForm() {
  showForm.value = false
  dragging.value = false
  msg.value = ''
}

function onFileChange(e) {
  const f = e.target.files?.[0]
  if (!f) return
  file.value = f
  previewUrl.value = URL.createObjectURL(f)
}

function onDrop(e) {
  dragging.value = false
  const f = e.dataTransfer.files?.[0]
  if (!f) return
  file.value = f
  previewUrl.value = URL.createObjectURL(f)
}

watch(showForm, (open) => {
  if (!open && previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
})

async function saveProduct() {
  if (!form.value.product_name?.trim()) return (msg.value = 'กรุณาใส่ชื่อสินค้า')
  if (Number(form.value.price) < 0) return (msg.value = 'ราคาต้องไม่ติดลบ')
  if (Number.isNaN(Number(form.value.stock)) || Number(form.value.stock) < 0)
    return (msg.value = 'สต็อกต้องเป็นตัวเลข 0 หรือมากกว่า')

  saving.value = true
  msg.value = ''

  try {
    // ถ้ามีไฟล์ใหม่ ให้อัปโหลดก่อน
    let imageUrl = form.value.image_url || ''
    if (file.value) {
      const fd = new FormData()
      fd.append('image', file.value)
      const { data } = await api.post('/upload/product', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      imageUrl = data.url // backend ควรส่ง { url: '/uploads/products/xxx.png' }
    }

    const payload = {
      product_name: form.value.product_name,
      price: Number(form.value.price || 0),
      stock: Number(form.value.stock || 0),
      image_url: imageUrl,
      category_id: form.value.category_id ?? null,
      ...(form.value.sku ? { sku: form.value.sku } : {})
    }

    if (form.value.product_id) {
      await api.put(`/products/${form.value.product_id}`, payload)
    } else {
      await api.post('/products', payload)
    }

    await loadProducts()
    closeForm()
  } catch (e) {
    console.error('[SAVE_PRODUCT_ERROR]', e)
    msg.value = e?.response?.data?.message || 'บันทึกไม่สำเร็จ'
  } finally {
    saving.value = false
  }
}

async function removeProduct(id) {
  if (!confirm('ต้องการลบสินค้านี้?')) return
  try {
    await api.delete(`/products/${id}`)
    await loadProducts()
  } catch (e) {
    console.error('[REMOVE_PRODUCT_ERROR]', e)
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

/* ✅ Search Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  margin-bottom: var(--sp-4);
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1 1 auto;
  min-width: min(280px, 100%);
  max-width: 520px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--c-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: var(--sp-3) var(--sp-4) var(--sp-3) 36px;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  background: var(--c-card);
  color: var(--c-text);
  font-size: 14px;
  outline: none;
  transition: all var(--transition-fast) var(--ease);
}

.search-input:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.search-input::placeholder {
  color: var(--c-text-muted);
}

.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: var(--c-bg-soft);
  color: var(--c-text-muted);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast) var(--ease);
}

.clear-btn:hover {
  background: var(--c-border);
  color: var(--c-text);
}

.search-result {
  color: var(--c-text-muted);
  font-size: 14px;
  white-space: nowrap;
}

.search-result strong {
  color: var(--c-primary);
  font-weight: 700;
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
  vertical-align: middle;
  color: var(--c-text);
}

.table tbody tr:hover {
  background: var(--c-bg-soft);
}

.empty {
  text-align: center;
  color: var(--c-text-muted);
  padding: var(--sp-6) 0;
}

.right {
  text-align: right;
}

.strong {
  font-weight: 700;
}

.muted {
  color: var(--c-text-muted);
}

.thumb {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--c-border);
  background: var(--c-bg-soft);
}

.name-col .name {
  font-weight: 600;
  color: var(--c-text);
}

.name-col .sku {
  font-size: 12px;
  color: var(--c-text-muted);
}

.row-actions {
  display: flex;
  gap: var(--sp-2);
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
  width: min(980px, 100%);
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

.grid {
  display: grid;
  gap: var(--sp-5);
  grid-template-columns: 360px 1fr;
}

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

  .grid {
    grid-template-columns: 1fr;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: var(--sp-3);
  }

  .search-box {
    max-width: 100%;
  }

  .search-result {
    text-align: center;
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

  .uploader .drop {
    min-height: 200px;
  }

  .search-input {
    font-size: 13px;
    padding: var(--sp-2) var(--sp-3) var(--sp-2) 32px;
  }

  .search-icon {
    left: 10px;
    font-size: 13px;
  }

  .search-result {
    font-size: 13px;
  }

  .table {
    min-width: 700px;
    font-size: 14px;
  }

  .thumb {
    width: 48px;
    height: 48px;
  }

  .row-actions {
    flex-direction: column;
    gap: var(--sp-1);
  }

  .row-actions .btn {
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

  .uploader .drop {
    min-height: 180px;
  }

  .empty-drop .icon {
    font-size: 32px;
  }

  .search-input {
    font-size: 12px;
    padding: var(--sp-2);
    padding-left: 30px;
  }

  .search-result {
    font-size: 12px;
  }

  .form {
    gap: var(--sp-3);
  }

  .form input,
  .form select {
    padding: var(--sp-2);
  }

  .table {
    font-size: 13px;
  }

  .table th,
  .table td {
    padding: var(--sp-2);
  }

  .thumb {
    width: 40px;
    height: 40px;
  }
}

/* Uploader */
.uploader .drop {
  border: 2px dashed var(--c-border);
  border-radius: 12px;
  min-height: 260px;
  display: grid;
  place-items: center;
  background: var(--c-bg-soft);
  transition: all var(--transition-fast) var(--ease);
}

.uploader .drop.dragging {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15) inset;
}

.empty-drop {
  text-align: center;
  color: var(--c-text-muted);
  display: grid;
  gap: var(--sp-2);
}

.empty-drop .icon {
  font-size: 42px;
}

.preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

/* ✅ ปุ่มเปลี่ยนรูปภาพ */
.change-image-section {
  margin-top: var(--sp-3);
  text-align: center;
}

.change-image-btn {
  width: 100%;
  justify-content: center;
  cursor: pointer;
}

/* Form */
.form {
  display: grid;
  gap: var(--sp-4);
}

.form label {
  display: grid;
  gap: var(--sp-2);
  font-weight: 600;
  color: var(--c-text);
}

.form input,
.form select {
  padding: var(--sp-3);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  outline: none;
  background: var(--c-bg);
  transition: all var(--transition-fast) var(--ease);
}

.form input:focus,
.form select:focus {
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

/* badge */
.badge {
  font-size: 12px;
  padding: var(--sp-1) var(--sp-2);
  border-radius: 999px;
  font-weight: 700;
}

.badge.soft {
  background: var(--c-bg-soft);
  color: var(--c-text-muted);
}
</style>
