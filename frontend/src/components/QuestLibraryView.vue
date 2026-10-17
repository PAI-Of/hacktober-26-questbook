<script setup>
import { ref, computed } from 'vue'
import {
  store,
  openQuestDetails,
  handleAdoptQuest,
  setActiveTab
} from '../stores/questStore'

const searchQuery = ref('')
const selectedDifficulty = ref('')
const selectedDurationTab = ref('all') // all, daily, weekly, monthly
const selectedSort = ref('likes')

const filteredQuests = computed(() => {
  let list = [...store.quests]

  // Search filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.instructions.toLowerCase().includes(q) ||
        (item.group_name && item.group_name.toLowerCase().includes(q))
    )
  }

  // Difficulty filter
  if (selectedDifficulty.value) {
    list = list.filter((item) => item.difficulty === selectedDifficulty.value)
  }

  // Duration tabs: daily (1-2), weekly (3-7), monthly (8+)
  if (selectedDurationTab.value === 'daily') {
    list = list.filter((item) => item.duration <= 2)
  } else if (selectedDurationTab.value === 'weekly') {
    list = list.filter((item) => item.duration >= 3 && item.duration <= 7)
  } else if (selectedDurationTab.value === 'monthly') {
    list = list.filter((item) => item.duration >= 8)
  }

  // Sort
  if (selectedSort.value === 'experience') {
    list.sort((a, b) => b.experience - a.experience)
  } else if (selectedSort.value === 'duration') {
    list.sort((a, b) => a.duration - b.duration)
  } else {
    list.sort((a, b) => (b.likes || 0) - (a.likes || 0))
  }

  return list
})

function isAlreadyAdopted(questId) {
  if (!store.currentGroup) return false
  return store.adoptedQuests.some(
    (a) => a.group_id === store.currentGroup.id && a.quest_id === questId && a.status !== 'completed'
  )
}
</script>

<template>
  <div class="library-page">
    <!-- Header -->
    <div class="library-header">
      <div>
        <span class="badge badge-dark">Field Archive</span>
        <h1>Community Quest Library</h1>
        <p class="muted">
          Browse challenges crafted by explorer squads. Adopt one to begin tracking real-world proof.
        </p>
      </div>
      <button class="btn-primary" @click="setActiveTab('create')">
        Draft New Quest
      </button>
    </div>

    <!-- Filter Control Bar -->
    <div class="filter-bar">
      <!-- Search -->
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search challenges by keyword or creator squad..."
        />
      </div>

      <!-- Duration Bucket Tabs -->
      <div class="duration-tabs">
        <button
          class="tab-btn"
          :class="{ active: selectedDurationTab === 'all' }"
          @click="selectedDurationTab = 'all'"
        >
          All Durations
        </button>
        <button
          class="tab-btn"
          :class="{ active: selectedDurationTab === 'daily' }"
          @click="selectedDurationTab = 'daily'"
        >
          Daily (1–2d)
        </button>
        <button
          class="tab-btn"
          :class="{ active: selectedDurationTab === 'weekly' }"
          @click="selectedDurationTab = 'weekly'"
        >
          Weekly (3–7d)
        </button>
        <button
          class="tab-btn"
          :class="{ active: selectedDurationTab === 'monthly' }"
          @click="selectedDurationTab = 'monthly'"
        >
          Monthly (8d+)
        </button>
      </div>

      <!-- Difficulty & Sort Controls -->
      <div class="filter-controls">
        <div class="filter-group">
          <select v-model="selectedDifficulty">
            <option value="">All Difficulties</option>
            <option value="easy">Easy (100–250 XP)</option>
            <option value="medium">Medium (300–450 XP)</option>
            <option value="hard">Hard (500+ XP)</option>
          </select>
        </div>

        <div class="filter-group">
          <select v-model="selectedSort">
            <option value="likes">Sort: Most Endorsed</option>
            <option value="experience">Sort: Highest XP</option>
            <option value="duration">Sort: Shortest Duration</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Quests Grid -->
    <div v-if="filteredQuests.length > 0" class="quests-grid">
      <div
        v-for="quest in filteredQuests"
        :key="quest.id"
        class="quest-item card"
      >
        <div class="quest-top">
          <div class="meta-pills">
            <span
              class="badge"
              :class="{
                'badge-accent': quest.difficulty === 'hard',
                'badge-outline': quest.difficulty !== 'hard'
              }"
            >
              {{ quest.difficulty }}
            </span>
            <span class="duration-pill">{{ quest.duration }} Days</span>
          </div>
          <span class="xp-reward">+{{ quest.experience }} XP</span>
        </div>

        <h3>{{ quest.title }}</h3>
        <p class="quest-desc">{{ quest.instructions }}</p>

        <div class="creator-strip">
          <span class="creator-label">Published by</span>
          <span class="creator-name">{{ quest.group_name || 'Community Squad' }}</span>
        </div>

        <div class="card-footer">
          <button
            class="btn-secondary flex-1"
            @click="openQuestDetails(quest)"
          >
            Review Rules
          </button>

          <button
            v-if="isAlreadyAdopted(quest.id)"
            class="btn-ghost flex-1 disabled-btn"
            disabled
          >
            Adopted
          </button>
          <button
            v-else
            class="btn-primary flex-1"
            @click="handleAdoptQuest(quest.id)"
          >
            Adopt Quest
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state card">
      <h3>No Challenges Match Criteria</h3>
      <p class="muted">
        Adjust your search keyword or duration filters to inspect other community field quests.
      </p>
      <button
        class="btn-secondary"
        @click="
          searchQuery = '';
          selectedDifficulty = '';
          selectedDurationTab = 'all';
        "
      >
        Reset Filters
      </button>
    </div>
  </div>
</template>

<style scoped>
.library-page {
  padding-top: 2rem;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.filter-bar {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-wrap {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--color-text-muted);
}

.search-wrap input {
  padding-left: 2.5rem;
}

.duration-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-ink);
  font-family: var(--font-heading);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.45rem 0.95rem;
  min-height: 40px;
  border-radius: 6px;
}

.tab-btn.active {
  background-color: var(--color-ink);
  color: var(--color-surface);
  border-color: var(--color-ink);
}

.filter-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  flex: 1;
  min-width: 180px;
}

.quests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;
}

.quest-item {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.quest-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.85rem;
}

.meta-pills {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.duration-pill {
  font-family: var(--font-heading);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-muted);
  background-color: var(--color-surface-muted);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.xp-reward {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--color-accent);
}

.quest-item h3 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.quest-desc {
  color: var(--color-ink);
  font-size: 0.92rem;
  margin-bottom: 1.25rem;
  flex-grow: 1;
}

.creator-strip {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  margin-bottom: 1.25rem;
  padding-top: 0.5rem;
}

.creator-label {
  color: var(--color-text-muted);
}

.creator-name {
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--color-ink);
}

.card-footer {
  display: flex;
  gap: 0.5rem;
}

.flex-1 {
  flex: 1;
}

.disabled-btn {
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
}

.empty-state {
  text-align: left;
  padding: 3rem 2rem;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .library-header {
    flex-direction: column;
  }
}
</style>
