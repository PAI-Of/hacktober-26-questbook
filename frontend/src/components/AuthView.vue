<script setup>
import { ref } from 'vue'
import {
  store,
  setActiveTab,
  showToast,
  refreshCurrentUser,
  loadInitialData
} from '../stores/questStore'
import { api } from '../services/api'

const mode = ref('login') // login or register
const username = ref('')
const password = ref('')
const isSubmitting = ref(false)

async function handleAuth() {
  if (!username.value.trim() || !password.value) {
    showToast('Please enter both username and password', 'error')
    return
  }

  if (mode.value === 'register' && password.value.length < 8) {
    showToast('Registration password must be at least 8 characters', 'error')
    return
  }

  isSubmitting.value = true
  try {
    if (mode.value === 'register') {
      await api.register(username.value.trim(), password.value)
      showToast('Account created! Now logging in...')
      await api.login(username.value.trim(), password.value)
    } else {
      await api.login(username.value.trim(), password.value)
      showToast('Logged in successfully.')
    }

    await refreshCurrentUser()
    await loadInitialData()

    if (store.currentGroup) {
      setActiveTab('dashboard')
    } else {
      setActiveTab('group')
    }
  } catch (err) {
    showToast(err.message || 'Authentication failed', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card card">
      <div class="auth-header">
        <span class="badge badge-accent">Explorer Access</span>
        <h1>{{ mode === 'login' ? 'Sign In to Squad' : 'Create Explorer Account' }}</h1>
        <p class="muted">
          {{
            mode === 'login'
              ? 'Access your squad challenges, field proofs, and group score.'
              : 'Form an identity to establish or join adventure squads.'
          }}
        </p>
      </div>

      <!-- Auth Mode Toggle -->
      <div class="mode-toggle">
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: mode === 'login' }"
          @click="mode = 'login'"
        >
          Existing Explorer
        </button>
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: mode === 'register' }"
          @click="mode = 'register'"
        >
          New Registration
        </button>
      </div>

      <!-- Form -->
      <form class="auth-form" @submit.prevent="handleAuth">
        <div class="form-group">
          <label for="auth-username">Username</label>
          <input
            id="auth-username"
            v-model="username"
            type="text"
            autocomplete="username"
            placeholder="e.g. alice"
            required
          />
        </div>

        <div class="form-group">
          <label for="auth-password">Password</label>
          <input
            id="auth-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            :placeholder="mode === 'register' ? 'Min 8 characters' : 'Enter your password'"
            required
          />
        </div>

        <button
          type="submit"
          class="btn-primary w-full"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Authenticating...' : mode === 'login' ? 'Enter Squad Hub' : 'Register Account' }}
        </button>
      </form>

      <!-- Sandbox Hint -->
      <div class="auth-footnote">
        <span class="footnote-lead">Demo accounts available:</span>
        <span class="footnote-demo">username: <code>alice</code> / pass: <code>supersecret123</code></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  padding-top: 4rem;
  max-width: 480px;
  margin: 0 auto;
}

.auth-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.auth-header h1 {
  font-size: 1.65rem;
  margin-top: 0.5rem;
  margin-bottom: 0.35rem;
}

.mode-toggle {
  display: flex;
  background-color: var(--color-surface-muted);
  border-radius: 6px;
  padding: 0.25rem;
  gap: 0.25rem;
}

.toggle-btn {
  flex: 1;
  background: transparent;
  border: none;
  font-family: var(--font-heading);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
  padding: 0.55rem;
  border-radius: 4px;
  min-height: 40px;
}

.toggle-btn.active {
  background-color: var(--color-surface);
  color: var(--color-ink);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.w-full {
  width: 100%;
}

.auth-footnote {
  background-color: var(--color-surface-muted);
  border-radius: 6px;
  padding: 0.85rem 1rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.footnote-lead {
  font-weight: 600;
}
</style>
