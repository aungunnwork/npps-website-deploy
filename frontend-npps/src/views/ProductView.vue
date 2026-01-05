<template>
  <div class="page">
    <div class="wrap">
      <!-- Header / Toolbar -->
      <header class="head">
        <div class="title-wrap">
          <h1>สินค้า</h1>
          <p class="sub">เลือกสินค้า ใส่จำนวน แล้วเพิ่มลงตะกร้า</p>
        </div>

        <div class="toolbar">
          <!-- ✅ เลือกหมวดหมู่ -->
          <select v-model.number="selectedCategory" @change="reloadByCategory" class="cat-select">
            <option :value="0">หมวดหมู่ทั้งหมด</option>
            <option v-for="c in categories" :key="c.category_id" :value="c.category_id">
              {{ c.name }}
            </option>
          </select>

          <div class="search">
            <span class="icon">🔎</span>
            <input v-model="search" type="text" placeholder="ค้นหาสินค้า..." />
          </div>
        </div>
      </header>

      <!-- Product Grid - แสดงสินค้าทั้งหมดในหน้าเดียว -->
      <section class="grid">
        <article class="card product-card" v-for="product in filteredProducts" :key="product.product_id">
          <img :src="toProdUrl(product.image_url)" :alt="product.product_name" class="product-image" />

          <div class="meta">
            <div class="name" :title="product.product_name">{{ product.product_name }}</div>
            <div class="price">{{ Number(product.price).toLocaleString('th-TH', {minimumFractionDigits:2}) }} ฿</div>
            <div class="stock-row">
              <span class="badge soft">คงเหลือ: {{ product.stock }} ชิ้น</span>
              <span class="badge soft" v-if="product.category_name">{{ product.category_name }}</span>
            </div>
          </div>

          <div class="qty-row">
            <label>จำนวน</label>
            <input type="number" v-model.number="product.qty" min="1" @change="clampQty(product)" />
          </div>

          <button class="btn primary" @click="addToCart(product)">เพิ่มไปยังตะกร้า</button>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/lib/api'
import { toProdUrl } from '@/lib/image'

const search = ref('')
const products = ref([])
const loading = ref(true)
const categories = ref([])           // ✅ หมวดหมู่ทั้งหมด
const selectedCategory = ref(0)      // 0 = ทั้งหมด

onMounted(async () => {
  await Promise.all([loadCategories(), loadProducts()])
  loading.value = false
})

async function loadCategories() {
  try {
    const { data } = await api.get('/products/categories')
    categories.value = data || []
  } catch (err) {
    console.error('โหลดหมวดหมู่ไม่สำเร็จ', err)
  }
}

async function loadProducts() {
  try {
    const { data } = await api.get('/products', {
      params: selectedCategory.value ? { category_id: selectedCategory.value } : {}
    })
    products.value = (data || []).map(p => ({ ...p, qty: 1, selectedOption: '' }))
  } catch (err) {
    console.error('โหลดสินค้าไม่สำเร็จ', err)
  }
}

function reloadByCategory() {
  loadProducts()
}

// ✅ แสดงสินค้าทั้งหมดหลังกรองด้วย search - ไม่มี pagination
const filteredProducts = computed(() => {
  return products.value
    .filter(p => (p.product_name || '').toLowerCase().includes((search.value || '').toLowerCase()))
})

function clampQty(p) {
  if (!p.qty || p.qty < 1) p.qty = 1
  if (p.stock && p.qty > p.stock) p.qty = p.stock
}

async function addToCart(product) {
  if (product.qty > product.stock) {
    alert(`ไม่สามารถเพิ่มเกินจำนวนสต็อก (${product.stock} ชิ้น) ได้`)
    return
  }
  try {
    await api.post('/cart', {
      product_id: product.product_id,
      quantity: product.qty,
      product_option: product.selectedOption
    })
    alert(`${product.product_name} ถูกเพิ่มลงตะกร้าแล้ว`)
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการเพิ่มสินค้า: ' + (err.response?.data?.message || err.message))
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--c-bg-soft);
  padding-bottom: var(--sp-8);
}

.wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--sp-6) var(--sp-4);
}

.head {
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
  margin-bottom: var(--sp-6);
  padding-bottom: var(--sp-5);
  border-bottom: 2px solid var(--c-border);
}

.title-wrap h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--c-primary);
}

.title-wrap .sub {
  margin: var(--sp-2) 0 0;
  color: var(--c-text-muted);
  font-size: 15px;
}

.toolbar {
  display: flex;
  gap: var(--sp-3);
  align-items: center;
  flex-wrap: wrap;
}

.cat-select {
  padding: 10px 14px;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  background: var(--c-bg);
  outline: none;
  font-weight: 600;
  min-width: 180px;
  transition: all var(--transition-fast) var(--ease);
}

.cat-select:hover {
  border-color: var(--c-text-muted);
}

.cat-select:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.15);
}

.search {
  position: relative;
  flex: 1;
  min-width: 240px;
  max-width: 500px;
}

.search .icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: var(--c-text-muted);
}

.search input {
  width: 100%;
  padding: 10px 14px 10px 38px;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  background: var(--c-bg);
  outline: none;
  transition: all var(--transition-fast) var(--ease);
}

.search input:hover {
  border-color: var(--c-text-muted);
}

.search input:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.15);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--sp-5);
  margin-bottom: var(--sp-6);
}

.card {
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-1);
  padding: var(--sp-4);
  transition: all var(--transition-base) var(--ease);
  display: flex;
  flex-direction: column;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-2);
  border-color: var(--c-primary);
}

.product-card .product-image {
  width: 100%;
  height: 180px;
  object-fit: contain;
  border: 1px dashed var(--c-border-light);
  background: linear-gradient(135deg, #fafafa 0%, #f8fafc 100%);
  border-radius: 10px;
  padding: var(--sp-3);
  transition: transform var(--transition-base) var(--ease);
}

.card:hover .product-image {
  transform: scale(1.03);
}

.meta {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
  flex: 1;
}

.name {
  font-weight: 700;
  font-size: 15px;
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
  color: var(--c-text);
}

.price {
  font-weight: 700;
  font-size: 20px;
  color: var(--c-primary);
  margin: var(--sp-1) 0;
}

.stock-row {
  display: flex;
  gap: var(--sp-2);
  flex-wrap: wrap;
  margin-top: var(--sp-1);
}

.qty-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--sp-3);
  align-items: center;
  margin-top: var(--sp-3);
  padding-top: var(--sp-3);
  border-top: 1px solid var(--c-border-light);
}

.qty-row label {
  font-size: 13px;
  font-weight: 700;
  color: var(--c-text);
}

.qty-row input {
  padding: 8px 12px;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  outline: none;
  background: var(--c-bg);
  font-weight: 600;
  text-align: center;
  transition: all var(--transition-fast) var(--ease);
}

.qty-row input:hover {
  border-color: var(--c-text-muted);
}

.qty-row input:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.15);
}

.badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 600;
}

.badge.soft {
  background: var(--c-bg-soft);
  color: var(--c-text-muted);
  border: 1px solid var(--c-border-light);
}

.btn {
  width: 100%;
  margin-top: var(--sp-3);
  padding: 11px 16px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-base) var(--ease);
}

.btn:hover {
  transform: translateY(-1px);
}

.btn.primary {
  background: var(--c-primary);
  color: #fff;
}

.btn.primary:hover {
  background: var(--c-primary-700);
}

.btn.ghost {
  background: transparent;
  border: 1px solid var(--c-border);
  color: var(--c-text);
  width: auto;
}

.btn.ghost:hover {
  background: var(--c-bg-soft);
}

.btn.sm {
  padding: 8px 14px;
  font-size: 14px;
}

/* ✅ Responsive Styles */
@media (max-width: 1024px) {
  .wrap {
    padding: var(--sp-5) var(--sp-4);
  }
  
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .head {
    gap: var(--sp-4);
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .cat-select,
  .search {
    width: 100%;
    max-width: none;
    min-width: 0;
  }
  
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--sp-3);
  }
}

@media (max-width: 480px) {
  .wrap {
    padding: var(--sp-4) var(--sp-3);
  }
  
  .title-wrap h1 {
    font-size: 24px;
  }
  
  .grid {
    grid-template-columns: 1fr;
  }
  
  .card {
    padding: var(--sp-3);
  }
}
</style>
