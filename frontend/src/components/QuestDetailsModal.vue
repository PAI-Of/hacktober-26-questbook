<script setup>
import { computed } from 'vue'
import {
  store,
  closeQuestDetails,
  handleAdoptQuest
} from '../stores/questStore'

const quest = computed(() => store.selectedQuest)
const isOpen = computed(() => store.isDetailsModalOpen && !!store.selectedQuest)

const isAdopted = computed(() => {
  if (!quest.value || !store.currentGroup) return false
  return store.adoptedQuests.some(
    (a) => a.group_id === store.currentGroup.id && a.quest_id === quest.value.id && a.status !== 'completed'
  )
})

function formatDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeQuestDetails">
    <div class="modal-dialog quest-details-modal">
      <div class="modal-header">
        <div class="meta-tags">
          <span class="badge badge-accent">{{ quest.difficulty }} Tier</span>
          <span class="badge badge-outline">{{ quest.duration }} Days Duration</span>
        </div>
        <button class="close-btn" @click="closeQuestDetails" title="Close Dossier">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <h2>{{ quest.title }}</h2>

        <div class="xp-banner">
          <span class="xp-title">Completion Bounty</span>
          <span class="xp-amount">+{{ quest.experience }} XP</span>
        </div>

        <div class="section-block">
          <h4>Field Instructions & Rules</h4>
          <p class="quest-instructions">{{ quest.instructions }}</p>
        </div>

        <div v-if="quest.example" class="example-box">
          <h4>Concrete Example</h4>
          <p>{{ quest.example }}</p>
        </div>

        <div class="creator-info-panel">
          <div class="info-row">
            <span class="info-label">Publishing Squad:</span>
            <span class="info-val">{{ quest.group_name || 'Community Squad' }}</span>
          </div>
          <div v-if="quest.published_by" class="info-row">
            <span class="info-label">Author:</span>
            <span class="info-val">{{ quest.published_by }}</span>
          </div>
          <div v-if="quest.created_at" class="info-row">
            <span class="info-label">Logged Date:</span>
            <span class="info-val">{{ formatDate(quest.created_at) }}</span>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn-secondary" @click="closeQuestDetails">
          Dismiss
        </button>
        <button
          v-if="isAdopted"
          class="btn-secondary"
          disabled
        >
          Already In Progress
        </button>
        <button
          v-else
          class="btn-primary"
          @click="handleAdoptQuest(quest.id)"
        >
          Adopt Challenge For Squad
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quest-details-modal {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-tags {
  display: flex;
  gap: 0.5rem;
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--color-text-muted);
  min-height: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--color-ink);
}

.modal-body h2 {
  font-size: 1.6rem;
  margin-bottom: 1rem;
}

.xp-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--color-surface-muted);
  border-radius: 6px;
  padding: 0.85rem 1.25rem;
  margin-bottom: 1.5rem;
}

.xp-title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.xp-amount {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.35rem;
  color: var(--color-accent);
}

.section-block {
  margin-bottom: 1.25rem;
}

.section-block h4 {
  margin-bottom: 0.5rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  font-size: 0.78rem;
}

.quest-instructions {
  font-size: 1rem;
  line-height: 1.65;
}

.example-box {
  background-color: var(--color-surface-muted);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.example-box h4 {
  font-size: 0.78rem;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 0.35rem;
}

.creator-info-panel {
  background-color: var(--color-surface-muted);
  border-radius: 6px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.info-label {
  color: var(--color-text-muted);
}

.info-val {
  font-family: var(--font-heading);
  font-weight: 600;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
}
</style>
