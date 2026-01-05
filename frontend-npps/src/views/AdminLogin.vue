<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const email = ref(''); // ใส่ไว้ทดสอบได้ เอาออกทีหลังก็ได้
const password = ref('');
const router = useRouter();
const { login, state } = useAuth();

const submit = async () => {
  const res = await login({ email: email.value, password: password.value });
  if (res.ok && res.role === 'admin') router.push('/admin/dashboard');
};
</script>

<template>
  <div class="container">
    <h2>Admin Login</h2>
    <form @submit.prevent="submit">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button :disabled="state.loading">Login</button>
      <p v-if="state.error" style="color:red">{{ state.error }}</p>
    </form>
  </div>
</template>
