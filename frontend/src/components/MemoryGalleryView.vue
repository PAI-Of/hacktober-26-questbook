<script setup>
import { ref, computed } from 'vue'
import { store, setActiveTab } from '../stores/questStore'
import { api } from '../services/api'

const group = computed(() => store.currentGroup)
const memories = computed(() => {
  if (!group.value) return []
  return store.memories.filter((m) => m.group_id === group.value.id)
})

const activeMemoryModal = ref(null)

function openMemoryModal(memory) {
  activeMemoryModal.value = memory
}

function closeMemoryModal() {
  activeMemoryModal.value = null
}

function formatDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function getEvidenceDownload(completionId) {
  return api.getEvidenceUrl(completionId)
}
</script>

<template>
  <div class="gallery-page">
    <div class="gallery-header">
      <div>
        <div class="private-badge-row">
          <span class="badge badge-accent">Squad Vault</span>
          <span class="badge badge-outline">Private Group Access</span>
        </div>
        <h1>Memory Gallery</h1>
        <p class="muted">
          Your squad's permanent photographic record of accomplished real-world expeditions.
        </p>
      </div>

      <div v-if="group" class="gallery-count-pill">
        <span class="count-num">{{ memories.length }}</span>
        <span class="count-label">Adventures Logged</span>
      </div>
    </div>

    <!-- Gallery Grid -->
    <div v-if="memories.length > 0" class="memories-grid">
      <div
        v-for="memory in memories"
        :key="memory.id"
        class="memory-card card"
        @click="openMemoryModal(memory)"
      >
        <div class="photo-wrapper">
          <img
            :src="memory.file_path"
            :alt="memory.quest_title"
            class="evidence-photo"
            loading="lazy"
          />
          <span class="photo-xp-tag">+{{ memory.experience }} XP</span>
        </div>

        <div class="card-details">
          <div class="details-top">
            <span class="memory-date">{{ formatDate(memory.completed_at) }}</span>
            <span class="completed-by">Logged by {{ memory.completed_by || 'Squad' }}</span>
          </div>

          <h3>{{ memory.quest_title }}</h3>
          <p class="memory-notes">{{ memory.description }}</p>

          <button class="btn-secondary btn-inspect" @click.stop="openMemoryModal(memory)">
            Inspect Field Photo
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="card empty-gallery">
      <h3>No Completed Adventures Yet</h3>
      <p class="muted">
        When your squad finishes an active quest and submits photographic evidence, the verified memory is permanently archived here.
      </p>
      <button class="btn-primary" @click="setActiveTab('library')">
        Find a Quest to Tackle
      </button>
    </div>

    <!-- Memory Lightbox Modal -->
    <div
      v-if="activeMemoryModal"
      class="modal-overlay"
      @click.self="closeMemoryModal"
    >
      <div class="modal-dialog memory-modal">
        <div class="modal-header">
          <div>
            <span class="badge badge-accent">Verified Field Proof</span>
            <h2>{{ activeMemoryModal.quest_title }}</h2>
          </div>
          <button class="close-btn" @click="closeMemoryModal">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="modal-img-box">
          <img
            :src="activeMemoryModal.file_path"
            :alt="activeMemoryModal.quest_title"
            class="modal-large-img"
          />
        </div>

        <div class="modal-notes-box">
          <h4>Field Notes & Observations</h4>
          <p>{{ activeMemoryModal.description }}</p>
          <div class="notes-meta">
            <span>Completed on {{ formatDate(activeMemoryModal.completed_at) }}</span>
            <span class="xp-bounty">+{{ activeMemoryModal.experience }} XP</span>
          </div>
        </div>

        <div class="modal-actions">
          <a
            :href="getEvidenceDownload(activeMemoryModal.id)"
            target="_blank"
            download
            class="btn-secondary"
          >
            Download Original File
          </a>
          <button class="btn-primary" @click="closeMemoryModal">
            Close Archive
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-page {
  padding-top: 2rem;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.private-badge-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.gallery-count-pill {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
}

.count-num {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-ink);
}

.count-label {
  font-family: var(--font-heading);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.memories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 2rem;
}

.memory-card {
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: transform var(--transition-fast);
}

.memory-card:hover {
  transform: translateY(-2px);
}

.photo-wrapper {
  position: relative;
  width: 100%;
  height: 240px;
  background-color: var(--color-surface-muted);
}

.evidence-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-xp-tag {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: var(--color-ink);
  color: var(--color-surface);
  font-family: var(--font-heading);
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 4px;
}

.card-details {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.details-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.memory-card h3 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.memory-notes {
  color: var(--color-ink);
  font-size: 0.92rem;
  line-height: 1.55;
  margin-bottom: 1.25rem;
  flex-grow: 1;
}

.btn-inspect {
  width: 100%;
}

.empty-gallery {
  padding: 3.5rem 2rem;
  text-align: left;
}

.empty-gallery h3 {
  margin-bottom: 0.5rem;
}

.empty-gallery p {
  margin-bottom: 1.5rem;
}

/* Modal */
.memory-modal {
  max-width: 680px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--color-text-muted);
}

.modal-img-box {
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 1.25rem;
  background-color: var(--color-surface-muted);
}

.modal-large-img {
  width: 100%;
  max-height: 480px;
  object-fit: cover;
  display: block;
}

.modal-notes-box {
  background-color: var(--color-surface-muted);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.modal-notes-box h4 {
  font-size: 0.78rem;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 0.35rem;
}

.notes-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  font-size: 0.85rem;
}

.xp-bounty {
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--color-accent);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .gallery-header {
    flex-direction: column;
  }
  .memories-grid {
    grid-template-columns: 1fr;
  }
}
</style>
