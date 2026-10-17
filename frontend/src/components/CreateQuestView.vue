<script setup>
import { ref, computed } from 'vue'
import { store, setActiveTab, showToast, loadInitialData } from '../stores/questStore'
import { api } from '../services/api'

const title = ref('')
const instructions = ref('')
const example = ref('')
const category = ref('scavenger')
const difficulty = ref('medium')
const duration = ref(7)
const customExperience = ref(350)
const isSubmitting = ref(false)

const computedExperience = computed(() => {
  if (difficulty.value === 'easy') return 200
  if (difficulty.value === 'medium') return 350
  return 500
})

function handleDifficultyChange() {
  customExperience.value = computedExperience.value
}

async function handleSubmitQuest() {
  if (!store.currentGroup) {
    showToast('You must join or create a squad before publishing a quest', 'error')
    setActiveTab('group')
    return
  }

  if (!title.value.trim() || !instructions.value.trim()) {
    showToast('Please provide both title and field instructions', 'error')
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      title: title.value.trim(),
      instructions: instructions.value.trim(),
      example: example.value.trim(),
      category: category.value,
      difficulty: difficulty.value,
      duration: Number(duration.value) || 1,
      experience: Number(customExperience.value) || 300,
      likes: 0,
      flags: 0
    }

    await api.createQuest(store.currentGroup.id, payload)
    await loadInitialData()

    showToast('New quest published to the community library!')
    title.value = ''
    instructions.value = ''
    example.value = ''
    setActiveTab('library')
  } catch (err) {
    showToast(err.message || 'Failed to publish quest', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="create-quest-page">
    <div class="create-header">
      <span class="badge badge-accent">Community Expedition</span>
      <h1>Draft a Field Quest</h1>
      <p class="muted">
        Formulate a real-world task for fellow squads to adopt, execute, and verify with photographic evidence.
      </p>
    </div>

    <form class="create-form card" @submit.prevent="handleSubmitQuest">
      <!-- Title Input -->
      <div class="form-group">
        <label for="quest-title">Quest Title</label>
        <input
          id="quest-title"
          v-model="title"
          type="text"
          placeholder="e.g. Find 5 Objects That Look Like Faces"
          required
        />
      </div>

      <!-- Category & Duration Row -->
      <div class="form-row">
        <div class="form-group">
          <label for="quest-category">Category Field</label>
          <select id="quest-category" v-model="category">
            <option value="scavenger">Urban Scavenger</option>
            <option value="photography">Field Photography</option>
            <option value="outdoor">Wilderness & Hiking</option>
            <option value="health">Habit & Health</option>
            <option value="exploration">Historic Exploration</option>
          </select>
        </div>

        <div class="form-group">
          <label for="quest-duration">Duration Horizon (Days)</label>
          <input
            id="quest-duration"
            v-model.number="duration"
            type="number"
            min="1"
            max="90"
            required
          />
        </div>
      </div>

      <!-- Difficulty & XP Reward -->
      <div class="form-row">
        <div class="form-group">
          <label for="quest-difficulty">Difficulty Tier</label>
          <select
            id="quest-difficulty"
            v-model="difficulty"
            @change="handleDifficultyChange"
          >
            <option value="easy">Easy (1–2 days, low physical load)</option>
            <option value="medium">Medium (Moderate persistence or skill)</option>
            <option value="hard">Hard (Demanding physical or mental discipline)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="quest-xp">XP Reward Bounty</label>
          <input
            id="quest-xp"
            v-model.number="customExperience"
            type="number"
            min="50"
            max="1500"
            step="50"
            required
          />
        </div>
      </div>

      <!-- Instructions -->
      <div class="form-group">
        <label for="quest-instructions">Field Instructions & Rules</label>
        <textarea
          id="quest-instructions"
          v-model="instructions"
          rows="4"
          placeholder="Specify exact real-world tasks and what evidence must be captured in the final photograph..."
          required
        ></textarea>
      </div>

      <!-- Example Input -->
      <div class="form-group">
        <label for="quest-example">Concrete Example (Optional)</label>
        <input
          id="quest-example"
          v-model="example"
          type="text"
          placeholder="e.g. A brick wall ventilation grill with dual bolt eyes and slotted mouth"
        />
      </div>

      <!-- Publishing Squad Summary -->
      <div class="publishing-credit-box">
        <span class="credit-label">Publishing Squad:</span>
        <span class="credit-name">{{ store.currentGroup ? store.currentGroup.name : 'No Squad Selected' }}</span>
      </div>

      <!-- Submit Actions -->
      <div class="form-actions">
        <button
          type="button"
          class="btn-secondary"
          @click="setActiveTab('library')"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn-primary"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Publishing...' : 'Publish to Quest Library' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.create-quest-page {
  padding-top: 2rem;
  max-width: 760px;
  margin: 0 auto;
}

.create-header {
  margin-bottom: 2rem;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.publishing-credit-box {
  background-color: var(--color-surface-muted);
  border-radius: 6px;
  padding: 0.85rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
}

.credit-label {
  color: var(--color-text-muted);
}

.credit-name {
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--color-ink);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
