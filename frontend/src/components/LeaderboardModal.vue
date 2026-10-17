<script setup>
import { computed } from 'vue'
import { store } from '../stores/questStore'

const isOpen = computed(() => store.isLeaderboardOpen)
const rankings = computed(() => store.leaderboard)

function closeLeaderboard() {
  store.isLeaderboardOpen = false
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeLeaderboard">
    <div class="modal-dialog leaderboard-modal">
      <div class="modal-header">
        <div>
          <span class="badge badge-accent">Community Standings</span>
          <h2>Global Squad Leaderboard</h2>
          <p class="muted">Ranked by total verified field XP across all completed quests.</p>
        </div>
        <button class="close-btn" @click="closeLeaderboard" title="Close Standings">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="rankings-list">
        <div
          v-for="item in rankings"
          :key="item.id"
          class="ranking-item"
          :class="{ 'top-squad': item.is_top }"
        >
          <div class="rank-pos">
            <span class="rank-badge" :class="{ 'top-badge': item.rank === 1 }">
              #{{ item.rank }}
            </span>
          </div>

          <div class="squad-info">
            <span class="squad-title">{{ item.name }}</span>
            <span class="quests-count">{{ item.completed_quests || 0 }} completed quests</span>
          </div>

          <div class="xp-score">
            <span>{{ item.xp }} XP</span>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn-primary" @click="closeLeaderboard">
          Close Standings
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leaderboard-modal {
  max-width: 580px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  margin-top: 0.35rem;
  margin-bottom: 0.25rem;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--color-text-muted);
}

.rankings-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.ranking-item {
  display: flex;
  align-items: center;
  background-color: var(--color-surface-muted);
  border-radius: 6px;
  padding: 0.85rem 1.25rem;
  gap: 1rem;
}

.ranking-item.top-squad {
  border: 1px solid var(--color-accent);
}

.rank-badge {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-text-muted);
  min-width: 32px;
}

.top-badge {
  color: var(--color-accent);
}

.squad-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.squad-title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--color-ink);
}

.quests-count {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.xp-score {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--color-accent);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
