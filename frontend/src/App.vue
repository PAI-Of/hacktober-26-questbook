<script setup>
import { onMounted, computed } from 'vue'
import { store, initApp, setActiveTab } from './stores/questStore'
import HeaderNav from './components/HeaderNav.vue'
import DashboardView from './components/DashboardView.vue'
import QuestLibraryView from './components/QuestLibraryView.vue'
import CreateQuestView from './components/CreateQuestView.vue'
import ActiveQuestSubmitView from './components/ActiveQuestSubmitView.vue'
import MemoryGalleryView from './components/MemoryGalleryView.vue'
import MyGroupView from './components/MyGroupView.vue'
import AuthView from './components/AuthView.vue'
import QuestDetailsModal from './components/QuestDetailsModal.vue'
import LeaderboardModal from './components/LeaderboardModal.vue'

onMounted(() => {
  initApp()
})

const currentTab = computed(() => store.activeTab)
const toast = computed(() => store.toast)
</script>

<template>
  <div id="app-root" class="app-root">
    <!-- Header Navigation -->
    <HeaderNav />

    <!-- Sub-navigation ticker / status strip -->
    <div class="status-ticker">
      <div class="ticker-inner">
        <div class="ticker-left">
          <span class="status-dot" :class="{ 'live-dot': store.isLiveServer }"></span>
          <span class="status-msg">
            {{ store.isLiveServer ? 'Connected to live Quest Server' : 'Running in local squad sandbox' }}
          </span>
        </div>
        <div class="ticker-right">
          <span class="ticker-action" @click="setActiveTab('library')">32 Active Community Quests</span>
          <span class="ticker-sep">•</span>
          <span class="ticker-action" @click="store.isLeaderboardOpen = true">Standings Updated</span>
        </div>
      </div>
    </div>

    <!-- Main View Switcher -->
    <main class="app-container">
      <DashboardView v-if="currentTab === 'dashboard'" />
      <QuestLibraryView v-else-if="currentTab === 'library'" />
      <CreateQuestView v-else-if="currentTab === 'create'" />
      <ActiveQuestSubmitView v-else-if="currentTab === 'submit'" />
      <MemoryGalleryView v-else-if="currentTab === 'gallery'" />
      <MyGroupView v-else-if="currentTab === 'group'" />
      <AuthView v-else-if="currentTab === 'auth'" />
    </main>

    <!-- Modals & Overlays -->
    <QuestDetailsModal />
    <LeaderboardModal />

    <!-- Toast Notification -->
    <transition name="toast-fade">
      <div v-if="toast" class="toast-alert">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{{ toast.message }}</span>
      </div>
    </transition>

    <!-- Footer -->
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-left">
          <span class="footer-title">QUESTBOOK</span>
          <p class="muted footer-copy">
            Tactile, minimal, real-world quest coordination for explorer squads.
          </p>
        </div>
        <div class="footer-links">
          <button class="footer-link" @click="setActiveTab('dashboard')">Field Hub</button>
          <button class="footer-link" @click="setActiveTab('library')">Library</button>
          <button class="footer-link" @click="setActiveTab('gallery')">Memories</button>
          <button class="footer-link" @click="setActiveTab('group')">Squad</button>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}

[data-ui] .status-ticker {
  background-color: var(--color-surface-muted);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.78rem;
  padding: 0.4rem 1.25rem;
}

.ticker-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ticker-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--color-text-muted);
}

.status-dot.live-dot {
  background-color: #10b981;
}

.status-msg {
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--color-text-muted);
}

.ticker-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--color-text-muted);
}

.ticker-action {
  cursor: pointer;
  font-weight: 600;
}

.ticker-action:hover {
  color: var(--color-ink);
}

[data-ui] .site-footer {
  margin-top: auto;
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 2.5rem 1.25rem;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.footer-title {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.footer-copy {
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.footer-links {
  display: flex;
  gap: 1.25rem;
}

.footer-link {
  background: none;
  border: none;
  font-family: var(--font-heading);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0;
}

.footer-link:hover {
  color: var(--color-ink);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 768px) {
  .ticker-right {
    display: none;
  }
  .footer-inner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
