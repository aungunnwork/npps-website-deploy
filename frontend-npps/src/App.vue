<template>
  <div class="app-wrapper">
    <Navbar v-if="!$route.path.startsWith('/admin')" />
    <main class="main-content">
      <router-view />
    </main>
    <SiteFooter v-if="!$route.path.startsWith('/admin')" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from './lib/api'
import Navbar from './components/Navbar.vue'
import SiteFooter from './components/SiteFooter.vue'

const products = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    // ✅ ใช้ axios แทน fetch เพื่อให้ผ่าน Vercel proxy
    const { data } = await api.get('/products')
    products.value = data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1 0 auto;
}

.product {
  border: 1px solid #ddd;
  padding: 1rem;
  margin-bottom: 1rem;
}
</style>
