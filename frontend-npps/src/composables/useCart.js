// /src/composables/useCart.js
import { ref } from 'vue'

const cart = ref([])

export function useCart() {
  const addToCart = (product) => {
    const found = cart.value.find(item => item.id === product.id)
    if (found) {
      found.qty++
    } else {
      cart.value.push({ ...product, qty: 1 })
    }
  }

  const removeFromCart = (id) => {
    cart.value = cart.value.filter(item => item.id !== id)
  }

  const clearCart = () => {
    cart.value = []
  }

  return { cart, addToCart, removeFromCart, clearCart }
}
