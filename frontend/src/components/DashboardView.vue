<script setup>
import { computed } from 'vue'
import {
  store,
  setActiveTab,
  openQuestDetails,
  openSubmitProof,
  handleApproveAdoption,
  currentGroupXp
} from '../stores/questStore'

const user = computed(() => store.currentUser)
const group = computed(() => store.currentGroup)
const activeQuests = computed(() => {
  if (!group.value) return []
  return store.adoptedQuests.filter(
    (a) => a.group_id === group.value.id && a.status !== 'completed'
  )
})

const recommendedQuest = computed(() => {
  return store.quests.find((q) => q.difficulty === 'easy') || store.quests[0]
})

const recentMemories = computed(() => {
  if (!group.value) return []
  return store.memories.filter((m) => m.group_id === group.value.id).slice(0, 3)
})

function getQuestData(questId) {
  return store.quests.find((q) => q.id === questId) || null
}

function formatDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="dashboard-page">
    <!-- Top Hero Briefing -->
    <section class="briefing-strip">
      <div class="briefing-info">
        <h1>Welcome back, {{ user ? user.username : 'Explorer' }}</h1>
        <p class="muted">
          Your squad coordinates real-world challenges, logs verified field evidence, and climbs the group standings.
        </p>
      </div>
      <div v-if="group" class="squad-stat-block">
        <div class="stat-item">
          <span class="stat-label">Active Squad</span>
          <span class="stat-value">{{ group.name }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-label">Group Score</span>
          <span class="stat-value stat-xp">{{ currentGroupXp }} XP</span>
        </div>
      </div>
    </section>

    <!-- Main Asymmetric Grid -->
    <div class="dashboard-grid">
      <!-- Left Column: Active Quests & Progress -->
      <section class="active-quests-column">
        <div class="section-header">
          <div>
            <h2>Active Field Quests</h2>
            <p class="muted">Challenges currently undertaken by your group.</p>
          </div>
          <button class="btn-secondary btn-sm" @click="setActiveTab('library')">
            Browse Quests
          </button>
        </div>

        <div v-if="activeQuests.length > 0" class="active-list">
          <div
            v-for="adopted in activeQuests"
            :key="adopted.id"
            class="active-quest-card"
          >
            <div class="quest-card-top">
              <div class="tags-row">
                <span
                  class="badge"
                  :class="adopted.status === 'active' ? 'badge-accent' : 'badge-outline'"
                >
                  {{ adopted.status === 'active' ? 'Active Mission' : 'Pending Squad Vote' }}
                </span>
                <span v-if="getQuestData(adopted.quest_id)" class="duration-tag">
                  {{ getQuestData(adopted.quest_id).duration }} Days Allotted
                </span>
              </div>
              <span v-if="getQuestData(adopted.quest_id)" class="xp-badge">
                +{{ getQuestData(adopted.quest_id).experience }} XP
              </span>
            </div>

            <div v-if="getQuestData(adopted.quest_id)" class="quest-body">
              <div v-if="getQuestData(adopted.quest_id).image_url" class="active-photo-box">
                <img
                  :src="getQuestData(adopted.quest_id).image_url"
                  :alt="getQuestData(adopted.quest_id).title"
                  class="active-quest-img"
                  loading="lazy"
                />
              </div>
              <h3>{{ getQuestData(adopted.quest_id).title }}</h3>
              <p class="instructions-text">
                {{ getQuestData(adopted.quest_id).instructions }}
              </p>
              <p v-if="getQuestData(adopted.quest_id).example" class="example-text">
                {{ getQuestData(adopted.quest_id).example }}
              </p>
            </div>

            <!-- Approval Progress Bar -->
            <div class="approval-tracker">
              <div class="tracker-header">
                <span class="tracker-title">Squad Approval Consensus</span>
                <span class="tracker-count">
                  {{ adopted.approved }} / {{ adopted.total_members }} votes
                </span>
              </div>
              <div class="progress-bar-track">
                <div
                  class="progress-bar-fill"
                  :style="{
                    width: `${Math.min(100, (adopted.approved / adopted.total_members) * 100)}%`
                  }"
                ></div>
              </div>
            </div>

            <!-- Action Row -->
            <div class="card-actions">
              <button
                v-if="adopted.status === 'pending'"
                class="btn-primary"
                @click="handleApproveAdoption(adopted.id)"
              >
                Cast Approval Vote
              </button>
              <button
                v-else
                class="btn-accent"
                @click="openSubmitProof(adopted)"
              >
                Record Field Proof
              </button>

              <button
                v-if="getQuestData(adopted.quest_id)"
                class="btn-secondary"
                @click="openQuestDetails(getQuestData(adopted.quest_id))"
              >
                View Rules
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-quest-box">
          <h3>No Active Quests In Progress</h3>
          <p class="muted">
            Adopt a challenge from the community library to start earning XP with your squad.
          </p>
          <button class="btn-primary" @click="setActiveTab('library')">
            Discover Community Quests
          </button>
        </div>
      </section>

      <!-- Right Column: Recommended & Recent Memories -->
      <aside class="dashboard-sidebar">
        <!-- Recommended Quest Card -->
        <div v-if="recommendedQuest" class="card recommended-card">
          <div v-if="recommendedQuest.image_url" class="recommended-img-box">
            <img
              :src="recommendedQuest.image_url"
              :alt="recommendedQuest.title"
              class="recommended-img"
              loading="lazy"
            />
          </div>
          <h3>{{ recommendedQuest.title }}</h3>
          <p class="muted card-desc">
            {{ recommendedQuest.instructions }}
          </p>
          <div class="meta-row">
            <span class="badge badge-accent">Featured Pick</span>
            <span class="badge badge-outline">{{ recommendedQuest.difficulty }}</span>
            <span class="meta-xp">+{{ recommendedQuest.experience }} XP</span>
          </div>
          <button
            class="btn-secondary"
            @click="openQuestDetails(recommendedQuest)"
          >
            Review Field Details
          </button>
        </div>

        <!-- Recent Memories Strip -->
        <div class="card memories-card">
          <div class="sidebar-header">
            <h3>Recent Field Evidence</h3>
            <button class="link-btn" @click="setActiveTab('gallery')">
              View All
            </button>
          </div>

          <div v-if="recentMemories.length > 0" class="recent-memories-list">
            <div
              v-for="memory in recentMemories"
              :key="memory.id"
              class="recent-memory-item"
              @click="setActiveTab('gallery')"
            >
              <img
                :src="memory.file_path"
                :alt="memory.quest_title"
                class="memory-thumb"
                loading="lazy"
              />
              <div class="memory-meta">
                <span class="memory-title">{{ memory.quest_title }}</span>
                <span class="memory-date">{{ formatDate(memory.completed_at) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-mini">
            <p class="muted">No verified evidence uploaded yet.</p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  padding-top: 2rem;
}

.briefing-strip {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
}

.briefing-info {
  max-width: 680px;
}

.squad-stat-block {
  display: flex;
  align-items: center;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem 1.5rem;
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-family: var(--font-heading);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.stat-value {
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-ink);
}

.stat-xp {
  color: var(--color-accent);
}

.stat-divider {
  width: 1px;
  height: 36px;
  background-color: var(--color-border);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 2rem;
  align-items: start;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.btn-sm {
  min-height: 36px;
  padding: 0.4rem 0.85rem;
  font-size: 0.82rem;
}

.active-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.active-quest-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.75rem;
}

.quest-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.tags-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.duration-tag {
  font-family: var(--font-heading);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.xp-badge {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-accent);
}

.active-photo-box {
  width: 100%;
  height: 200px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 1rem;
  background-color: var(--color-surface-muted);
}

.active-quest-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.recommended-img-box {
  width: 100%;
  height: 140px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.85rem;
  background-color: var(--color-surface-muted);
}

.recommended-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.quest-body h3 {
  font-size: 1.35rem;
  margin-bottom: 0.5rem;
}

.instructions-text {
  color: var(--color-ink);
  margin-bottom: 0.75rem;
}

.example-text {
  font-size: 0.88rem;
  color: var(--color-text-muted);
  background-color: var(--color-surface-muted);
  padding: 0.6rem 0.85rem;
  border-radius: 6px;
  margin-bottom: 1.25rem;
}

.approval-tracker {
  background-color: var(--color-surface-muted);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.tracker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.tracker-title {
  font-family: var(--font-heading);
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-ink);
}

.tracker-count {
  font-family: var(--font-heading);
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-accent);
}

.progress-bar-track {
  width: 100%;
  height: 8px;
  background-color: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: var(--color-accent);
  transition: width 0.3s ease;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.empty-quest-box {
  background-color: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: left;
}

.empty-quest-box h3 {
  margin-bottom: 0.5rem;
}

.empty-quest-box p {
  margin-bottom: 1.5rem;
}

.dashboard-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sidebar-label {
  font-family: var(--font-heading);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-accent);
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.card-desc {
  margin: 0.5rem 0 1rem;
  font-size: 0.9rem;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.meta-xp {
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--color-accent);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.link-btn {
  background: none;
  border: none;
  font-family: var(--font-heading);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-accent);
  cursor: pointer;
  padding: 0;
}

.recent-memories-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.recent-memory-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 6px;
  transition: background-color var(--transition-fast);
}

.recent-memory-item:hover {
  background-color: var(--color-surface-muted);
}

.memory-thumb {
  width: 52px;
  height: 52px;
  border-radius: 6px;
  object-fit: cover;
}

.memory-meta {
  display: flex;
  flex-direction: column;
}

.memory-title {
  font-family: var(--font-heading);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-ink);
  line-height: 1.3;
}

.memory-date {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.empty-mini {
  padding: 1rem 0;
}

@media (max-width: 960px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .briefing-strip {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
