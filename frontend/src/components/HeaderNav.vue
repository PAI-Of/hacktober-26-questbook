<script setup>
import { computed, ref } from 'vue'
import { store, setActiveTab, currentGroupXp } from '../stores/questStore'
import { api } from '../services/api'

const currentTab = computed(() => store.activeTab)
const group = computed(() => store.currentGroup)
const user = computed(() => store.currentUser)
const isMobileMenuOpen = ref(false)

const hasActiveQuests = computed(() => {
  if (!store.currentGroup) return false
  return store.adoptedQuests.some(
    (a) => a.group_id === store.currentGroup.id && a.status !== 'completed'
  )
})

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function navigateTo(tab) {
  setActiveTab(tab)
  isMobileMenuOpen.value = false
}

async function handleLogout() {
  await api.logout()
  store.currentUser = null
  isMobileMenuOpen.value = false
  setActiveTab('auth')
}
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <!-- Wordmark & Squad Badge -->
      <div class="brand-cluster">
        <button class="brand-link" @click="navigateTo('dashboard')">
          <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" y1="3" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="21" />
          </svg>
          <span class="brand-title">QUESTBOOK</span>
        </button>

        <div v-if="group" class="squad-pill" @click="navigateTo('group')" title="Manage Squad">
          <span class="squad-name">{{ group.name }}</span>
          <span class="squad-xp">{{ currentGroupXp }} XP</span>
        </div>
      </div>

      <!-- Navigation Links (desktop) -->
      <nav class="nav-links">
        <button
          class="nav-item"
          :class="{ active: currentTab === 'dashboard' }"
          @click="navigateTo('dashboard')"
        >
          Field Hub
        </button>
        <button
          class="nav-item"
          :class="{ active: currentTab === 'library' }"
          @click="navigateTo('library')"
        >
          Quest Library
        </button>
        <button
          class="nav-item"
          :class="{ active: currentTab === 'gallery' }"
          @click="navigateTo('gallery')"
        >
          Field Memories
        </button>
        <button
          class="nav-item"
          :class="{ active: currentTab === 'create' }"
          @click="navigateTo('create')"
        >
          New Challenge
        </button>
        <!-- Submit Proof — shown when your group has an active/pending quest -->
        <button
          v-if="hasActiveQuests"
          class="nav-item nav-item-submit"
          :class="{ active: currentTab === 'submit' }"
          @click="navigateTo('submit')"
          title="Submit proof for your active quest"
        >
          Submit Proof
        </button>
        <button
          class="nav-item"
          :class="{ active: currentTab === 'group' }"
          @click="navigateTo('group')"
        >
          Squad Roster
        </button>
      </nav>

      <!-- Actions -->
      <div class="header-actions">
        <button
          class="btn-secondary leaderboard-btn"
          @click="store.isLeaderboardOpen = true"
          title="View Standings"
        >
          <svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
          Standings
        </button>

        <button
          v-if="user"
          class="btn-ghost user-btn"
          @click="handleLogout"
          title="Sign Out"
        >
          <span>{{ user.username }}</span>
          <svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
        <button
          v-else
          class="btn-primary"
          @click="navigateTo('auth')"
        >
          Sign In
        </button>

        <!-- Hamburger button (mobile only) -->
        <button
          class="hamburger-btn"
          :class="{ open: isMobileMenuOpen }"
          @click="toggleMobileMenu"
          :aria-expanded="isMobileMenuOpen"
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>

    <!-- Mobile Dropdown Menu -->
    <div v-if="isMobileMenuOpen" class="mobile-menu">
      <button class="mobile-nav-item" :class="{ active: currentTab === 'dashboard' }" @click="navigateTo('dashboard')">Field Hub</button>
      <button class="mobile-nav-item" :class="{ active: currentTab === 'library' }" @click="navigateTo('library')">Quest Library</button>
      <button class="mobile-nav-item" :class="{ active: currentTab === 'gallery' }" @click="navigateTo('gallery')">Field Memories</button>
      <button class="mobile-nav-item" :class="{ active: currentTab === 'create' }" @click="navigateTo('create')">New Challenge</button>
      <button v-if="hasActiveQuests" class="mobile-nav-item mobile-nav-item-submit" :class="{ active: currentTab === 'submit' }" @click="navigateTo('submit')">
        ⚡ Submit Proof
      </button>
      <button class="mobile-nav-item" :class="{ active: currentTab === 'group' }" @click="navigateTo('group')">Squad Roster</button>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border); /* taste-skill-ignore */
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.25rem;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.brand-cluster {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.brand-icon {
  width: 24px;
  height: 24px;
  color: var(--color-accent);
}

.brand-title {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-ink);
}

.squad-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
}

.squad-name {
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--color-ink);
}

.squad-xp {
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--color-accent);
  background-color: var(--color-accent-subtle);
  padding: 0.15rem 0.45rem;
  border-radius: 12px;
  font-size: 0.78rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.nav-item {
  background: transparent;
  border: none;
  font-family: var(--font-heading);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-text-muted);
  padding: 0.5rem 0.85rem;
  border-radius: 6px;
  min-height: 44px;
}

.nav-item:hover {
  color: var(--color-ink);
  background-color: var(--color-surface-muted);
}

.nav-item.active {
  color: var(--color-ink);
  background-color: var(--color-ground);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.leaderboard-btn {
  padding: 0.45rem 0.95rem;
}

.user-btn {
  padding: 0.45rem 0.75rem;
}

.icon-inline {
  width: 17px;
  height: 17px;
}


/* Submit Proof nav item highlight */
.nav-item-submit {
  color: var(--color-accent) !important;
  background-color: var(--color-accent-subtle);
  border: 1px solid var(--color-accent);
  border-radius: 6px;
}

.nav-item-submit:hover,
.nav-item-submit.active {
  background-color: var(--color-accent);
  color: var(--color-surface) !important;
}

/* Hamburger button */
.hamburger-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: none;
  cursor: pointer;
  width: 36px;
  height: 36px;
  padding: 4px;
}

.hamburger-btn span {
  display: block;
  width: 22px;
  height: 2px;
  background-color: var(--color-ink);
  border-radius: 2px;
  transition: transform 0.2s ease, opacity 0.2s ease;
  transform-origin: center;
}

.hamburger-btn.open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hamburger-btn.open span:nth-child(2) {
  opacity: 0;
}

.hamburger-btn.open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* Mobile dropdown menu */
.mobile-menu {
  display: none;
  flex-direction: column;
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 0.5rem 0;
}

.mobile-nav-item {
  background: none;
  border: none;
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-muted);
  padding: 0.85rem 1.25rem;
  text-align: left;
  cursor: pointer;
  width: 100%;
  border-radius: 0;
}

.mobile-nav-item:hover {
  background-color: var(--color-surface-muted);
  color: var(--color-ink);
}

.mobile-nav-item.active {
  color: var(--color-ink);
  background-color: var(--color-ground);
}

.mobile-nav-item-submit {
  color: var(--color-accent) !important;
  font-weight: 700;
}

.mobile-nav-item-submit.active {
  background-color: var(--color-accent-subtle);
}

@media (max-width: 900px) {
  .nav-links {
    display: none;
  }

  .hamburger-btn {
    display: flex;
  }

  .mobile-menu {
    display: flex;
  }
}
</style>
