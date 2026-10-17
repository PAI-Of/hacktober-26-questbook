<script setup>
import { ref, computed } from 'vue'
import {
  store,
  setActiveTab,
  handleCompleteQuest,
  handleApproveAdoption,
  showToast
} from '../stores/questStore'

const adopted = computed(() => {
  if (store.selectedAdoptedQuest) {
    return store.selectedAdoptedQuest
  }
  // Fallback to first non-completed adopted quest in current group
  const groupId = store.currentGroup ? store.currentGroup.id : null
  return (
    store.adoptedQuests.find(
      (a) => a.status !== 'completed' && (!groupId || a.group_id === groupId)
    ) || null
  )
})

const quest = computed(() => {
  if (!adopted.value) return null
  return store.quests.find((q) => q.id === adopted.value.quest_id) || null
})

const description = ref('')
const selectedFile = ref(null)
const previewUrl = ref('')
const isSubmitting = ref(false)

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) {
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }
}

function removeSelectedPhoto() {
  selectedFile.value = null
  previewUrl.value = ''
}

async function submitProof() {
  if (!adopted.value) return
  if (!previewUrl.value) {
    showToast('Please attach at least one field photograph as evidence', 'error')
    return
  }

  isSubmitting.value = true
  try {
    const formData = new FormData()
    formData.append('description', description.value || 'Field challenge accomplished.')
    if (selectedFile.value) {
      formData.append('evidence', selectedFile.value)
    }

    await handleCompleteQuest(adopted.value.id, formData)
    description.value = ''
    selectedFile.value = null
    previewUrl.value = ''
  } catch (err) {
    // Handled in store
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="submit-proof-page">
    <div v-if="adopted && quest" class="mission-wrapper">
      <!-- Mission Brief Header -->
      <div class="mission-header card">
        <div class="header-tags">
          <span
            class="badge"
            :class="adopted.status === 'active' ? 'badge-accent' : 'badge-outline'"
          >
            {{ adopted.status === 'active' ? 'Active Mission' : 'Pending Squad Vote' }}
          </span>
          <span class="badge badge-dark">+{{ quest.experience }} XP Bounty</span>
        </div>

        <h1>{{ quest.title }}</h1>
        <p class="instructions-lead">{{ quest.instructions }}</p>

        <div v-if="quest.example" class="example-callout">
          <strong>Field Guideline:</strong> {{ quest.example }}
        </div>

        <!-- Consensus Tracker if pending -->
        <div v-if="adopted.status === 'pending'" class="pending-notice">
          <div class="notice-top">
            <h4>Squad Consensus Required</h4>
            <span class="vote-ratio">{{ adopted.approved }} / {{ adopted.total_members }} Approved</span>
          </div>
          <p class="muted">
            All squad members must cast an approval vote before this quest opens for evidence submission.
          </p>
          <button
            class="btn-primary mt-3"
            @click="handleApproveAdoption(adopted.id)"
          >
            Cast Approval Vote
          </button>
        </div>
      </div>

      <!-- Proof Submission Form (Ready when active) -->
      <div v-if="adopted.status === 'active'" class="proof-form card">
        <div class="proof-context-bar">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="10" y1="9" x2="8" y2="9"/>
          </svg>
          <span>Proof for: <strong>{{ quest.title }}</strong></span>
        </div>
        <h2>Submit Verified Field Evidence</h2>
        <p class="muted">
          Attach a real-life photograph proving your group accomplished the task listed above.
        </p>

        <!-- Photo Upload Box -->
        <div class="upload-section">
          <label class="form-label">Evidence Photograph</label>

          <div v-if="!previewUrl" class="upload-dropzone">
            <input
              type="file"
              accept="image/*"
              class="file-input"
              @change="handleFileSelect"
            />
            <div class="dropzone-content">
              <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span class="upload-primary-text">Select Field Photo</span>
              <span class="upload-sub-text">PNG, JPG, or HEIC from camera or gallery</span>
            </div>
          </div>

          <!-- Preview Area -->
          <div v-else class="preview-container">
            <img :src="previewUrl" alt="Evidence Preview" class="preview-img" />
            <button
              type="button"
              class="remove-photo-btn"
              @click="removeSelectedPhoto"
              title="Remove Photograph"
            >
              Change Photo
            </button>
          </div>
        </div>

        <!-- Field Notes Description -->
        <div class="notes-section">
          <label for="proof-notes" class="form-label">Field Notes & Observations</label>
          <textarea
            id="proof-notes"
            v-model="description"
            rows="3"
            placeholder="Record where and how your squad solved this challenge..."
          ></textarea>
        </div>

        <!-- Submit Button -->
        <div class="submit-actions">
          <button
            type="button"
            class="btn-secondary"
            @click="setActiveTab('dashboard')"
          >
            Return to Hub
          </button>
          <button
            type="button"
            class="btn-accent"
            :disabled="isSubmitting || !previewUrl"
            @click="submitProof"
          >
            {{ isSubmitting ? 'Verifying Proof...' : 'Complete Quest & Claim XP' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="card empty-container">
      <h2>No Active Quest Adopted</h2>
      <p class="muted">
        Your squad must first select and adopt a quest from the library.
      </p>
      <button class="btn-primary mt-3" @click="setActiveTab('library')">
        Browse Quest Library
      </button>
    </div>
  </div>
</template>

<style scoped>
.submit-proof-page {
  padding-top: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.mission-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.mission-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header-tags {
  display: flex;
  gap: 0.5rem;
}

.instructions-lead {
  font-size: 1.05rem;
  line-height: 1.6;
}

.example-callout {
  background-color: var(--color-surface-muted);
  border-radius: 6px;
  padding: 0.85rem 1rem;
  font-size: 0.92rem;
}

.pending-notice {
  background-color: var(--color-surface-muted);
  border-radius: 6px;
  padding: 1.25rem;
  margin-top: 0.5rem;
}

.notice-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.vote-ratio {
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--color-accent);
}

.proof-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.proof-context-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-accent-subtle);
  border: 1px solid var(--color-accent);
  border-radius: 6px;
  padding: 0.65rem 0.9rem;
  font-size: 0.88rem;
  color: var(--color-ink);
}

.proof-context-bar svg {
  flex-shrink: 0;
  color: var(--color-accent);
}

.form-label {
  display: block;
  font-family: var(--font-heading);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.upload-dropzone {
  position: relative;
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  padding: 2.5rem 1.5rem;
  text-align: center;
  cursor: pointer;
  background-color: var(--color-ground);
  transition: border-color var(--transition-fast);
}

.upload-dropzone:hover {
  border-color: var(--color-ink);
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-icon {
  width: 36px;
  height: 36px;
  color: var(--color-text-muted);
}

.upload-primary-text {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-ink);
}

.upload-sub-text {
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.preview-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--color-surface-muted);
  border: 1px solid var(--color-border);
}

.preview-img {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  display: block;
}

.remove-photo-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: rgba(22, 23, 26, 0.85);
  color: #fff;
  border: none;
  font-family: var(--font-heading);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.4rem 0.85rem;
  border-radius: 4px;
}

.submit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.mt-3 {
  margin-top: 0.85rem;
}

.empty-container {
  padding: 3.5rem 2rem;
  text-align: left;
}
</style>
