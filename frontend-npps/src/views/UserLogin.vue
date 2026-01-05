<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const email = ref('');
const password = ref('');
const router = useRouter();
const { login, state } = useAuth();

const submit = async () => {
  const res = await login({ email: email.value, password: password.value });
  if (res.ok) router.push('/'); // ผู้ใช้ทั่วไปกลับหน้าแรก
};
</script>

<template>
  <div class="container">
    <h2>User Login</h2>
    <form @submit.prevent="submit">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button :disabled="state.loading">Login</button>
      <p v-if="state.error" style="color:red">{{ state.error }}</p>
    </form>
  </div>
</template>
