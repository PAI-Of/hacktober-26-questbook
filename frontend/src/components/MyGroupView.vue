<script setup>
import { ref, computed } from 'vue'
import {
  store,
  setActiveTab,
  currentGroupXp,
  completedQuestsCount,
  showToast,
  refreshCurrentUser,
  loadInitialData
} from '../stores/questStore'
import { api } from '../services/api'

const group = computed(() => store.currentGroup)
const members = computed(() => store.groupMembers)
const activeQuests = computed(() => {
  if (!group.value) return []
  return store.adoptedQuests.filter(
    (a) => a.group_id === group.value.id && a.status !== 'completed'
  )
})

// Create Group Form
const newGroupName = ref('')
const newGroupPassword = ref('')
const isCreatingGroup = ref(false)

// Join Group Form
const joinGroupId = ref('')
const joinPassword = ref('')
const isJoiningGroup = ref(false)

async function handleCreateGroup() {
  if (!newGroupName.value.trim() || newGroupPassword.value.length < 6) {
    showToast('Group name required, password must be 6+ characters', 'error')
    return
  }

  isCreatingGroup.value = true
  try {
    const res = await api.createGroup(newGroupName.value.trim(), newGroupPassword.value)
    await refreshCurrentUser()
    await loadInitialData()
    showToast(res.message || 'New squad created!')
    newGroupName.value = ''
    newGroupPassword.value = ''
  } catch (err) {
    showToast(err.message || 'Failed to create group', 'error')
  } finally {
    isCreatingGroup.value = false
  }
}

async function handleJoinGroup() {
  if (!joinGroupId.value || !joinPassword.value) {
    showToast('Please provide Group ID and shared password', 'error')
    return
  }

  isJoiningGroup.value = true
  try {
    const res = await api.joinGroup(joinGroupId.value, joinPassword.value)
    await refreshCurrentUser()
    await loadInitialData()
    showToast(res.message || 'Joined squad successfully!')
    joinGroupId.value = ''
    joinPassword.value = ''
  } catch (err) {
    showToast(err.message || 'Failed to join group', 'error')
  } finally {
    isJoiningGroup.value = false
  }
}

function formatDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function copyGroupId() {
  if (!group.value) return
  navigator.clipboard.writeText(String(group.value.id))
  showToast('Squad ID copied to clipboard')
}
</script>

<template>
  <div class="group-page">
    <div v-if="group" class="group-content">
      <!-- Group Header Strip -->
      <div class="group-header card">
        <div class="header-left">
          <span class="badge badge-accent">Squad Headquarters</span>
          <h1>{{ group.name }}</h1>
          <p class="muted">
            Squad formed on {{ formatDate(group.created_at) }}. Coordinate field missions and verify team progress.
          </p>
        </div>

        <div class="stats-ribbon">
          <div class="ribbon-box">
            <span class="ribbon-label">Total Squad Score</span>
            <span class="ribbon-val xp-color">{{ currentGroupXp }} XP</span>
          </div>
          <div class="ribbon-box">
            <span class="ribbon-label">Completed Expeditions</span>
            <span class="ribbon-val">{{ completedQuestsCount }}</span>
          </div>
          <div class="ribbon-box">
            <span class="ribbon-label">Active Challenges</span>
            <span class="ribbon-val">{{ activeQuests.length }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="quick-nav-row">
        <button class="btn-primary" @click="setActiveTab('gallery')">
          Open Squad Memory Gallery
        </button>
        <button class="btn-secondary" @click="setActiveTab('library')">
          Browse Library for New Quests
        </button>
      </div>

      <!-- Asymmetric Two-Column Section -->
      <div class="group-grid">
        <!-- Left: Members Roster & Invite Box -->
        <div class="left-col">
          <!-- Member Roster -->
          <div class="card members-card">
            <h3>Squad Roster</h3>
            <p class="muted subtitle">Authorized members eligible to vote on quest adoptions.</p>

            <div class="members-list">
              <div
                v-for="m in members"
                :key="m.member_id"
                class="member-row"
              >
                <div class="member-identity">
                  <div class="member-avatar">
                    {{ m.username ? m.username.charAt(0).toUpperCase() : 'U' }}
                  </div>
                  <div class="member-names">
                    <span class="member-username">{{ m.username }}</span>
                    <span class="member-joined">Joined {{ formatDate(m.joined_at) }}</span>
                  </div>
                </div>
                <span class="badge badge-outline">Member #{{ m.member_id }}</span>
              </div>
            </div>
          </div>

          <!-- Invite Friends Box -->
          <div class="card invite-card">
            <h3>Rally Fellow Explorers</h3>
            <p class="muted">
              To keep squad adventures private, passwords are never exposed publicly. Share your squad credentials in person or over encrypted messaging.
            </p>

            <div class="credential-box">
              <div class="cred-row">
                <span class="cred-label">Squad ID:</span>
                <span class="cred-val">#{{ group.id }}</span>
                <button class="btn-secondary btn-copy" @click="copyGroupId">
                  Copy ID
                </button>
              </div>
            </div>

            <p class="invite-footnote">
              Instruct your friends to select "Join Squad" and enter your secret group password.
            </p>
          </div>
        </div>

        <!-- Right: Create or Join Another Squad -->
        <div class="right-col">
          <!-- Create Squad Form -->
          <div class="card form-box">
            <h3>Form a New Squad</h3>
            <p class="muted">Start a separate explorer group with a unique name and password.</p>

            <form @submit.prevent="handleCreateGroup">
              <div class="form-group">
                <label for="new-group-name">Squad Name</label>
                <input
                  id="new-group-name"
                  v-model="newGroupName"
                  type="text"
                  placeholder="e.g. Dawn Chasers"
                  required
                />
              </div>

              <div class="form-group">
                <label for="new-group-password">Secret Password</label>
                <input
                  id="new-group-password"
                  v-model="newGroupPassword"
                  type="password"
                  placeholder="Min 6 characters (shared IRL)"
                  required
                />
              </div>

              <button
                type="submit"
                class="btn-primary w-full"
                :disabled="isCreatingGroup"
              >
                {{ isCreatingGroup ? 'Creating...' : 'Establish Squad' }}
              </button>
            </form>
          </div>

          <!-- Join Squad Form -->
          <div class="card form-box">
            <h3>Join an Existing Squad</h3>
            <p class="muted">Enter a squad ID and shared password provided by your friend.</p>

            <form @submit.prevent="handleJoinGroup">
              <div class="form-group">
                <label for="join-group-id">Squad ID Number</label>
                <input
                  id="join-group-id"
                  v-model="joinGroupId"
                  type="number"
                  placeholder="e.g. 2"
                  required
                />
              </div>

              <div class="form-group">
                <label for="join-password">Shared Secret Password</label>
                <input
                  id="join-password"
                  v-model="joinPassword"
                  type="password"
                  placeholder="Enter the secret code"
                  required
                />
              </div>

              <button
                type="submit"
                class="btn-secondary w-full"
                :disabled="isJoiningGroup"
              >
                {{ isJoiningGroup ? 'Joining...' : 'Join Squad' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Fallback if user is not in a group -->
    <div v-else class="card empty-page">
      <h2>You are Not Enrolled in a Squad</h2>
      <p class="muted">
        Form your own squad or join an existing group using their shared password to participate in quests.
      </p>

      <div class="onboarding-grid">
        <form class="onboarding-form" @submit.prevent="handleCreateGroup">
          <h3>Create a New Squad</h3>
          <div class="form-group">
            <label>Squad Name</label>
            <input v-model="newGroupName" type="text" placeholder="e.g. The Night Owls" required />
          </div>
          <div class="form-group">
            <label>Secret Password (min 6 chars)</label>
            <input v-model="newGroupPassword" type="password" required />
          </div>
          <button type="submit" class="btn-primary">Establish Squad</button>
        </form>

        <form class="onboarding-form" @submit.prevent="handleJoinGroup">
          <h3>Join an Existing Squad</h3>
          <div class="form-group">
            <label>Squad ID Number</label>
            <input v-model="joinGroupId" type="number" placeholder="e.g. 1" required />
          </div>
          <div class="form-group">
            <label>Shared Password</label>
            <input v-model="joinPassword" type="password" required />
          </div>
          <button type="submit" class="btn-secondary">Join Squad</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.group-page {
  padding-top: 2rem;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.header-left {
  max-width: 600px;
}

.stats-ribbon {
  display: flex;
  gap: 1.25rem;
}

.ribbon-box {
  background-color: var(--color-surface-muted);
  border-radius: 6px;
  padding: 0.85rem 1.25rem;
  display: flex;
  flex-direction: column;
}

.ribbon-label {
  font-family: var(--font-heading);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.ribbon-val {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-ink);
}

.xp-color {
  color: var(--color-accent);
}

.quick-nav-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.group-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 2rem;
  align-items: start;
}

.left-col,
.right-col {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.subtitle {
  margin-bottom: 1.25rem;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.member-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: var(--color-surface-muted);
  border-radius: 6px;
}

.member-identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.member-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: var(--color-ink);
  color: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.95rem;
}

.member-names {
  display: flex;
  flex-direction: column;
}

.member-username {
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--color-ink);
}

.member-joined {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.invite-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.credential-box {
  background-color: var(--color-surface-muted);
  border-radius: 6px;
  padding: 1rem;
  margin: 0.5rem 0;
}

.cred-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cred-label {
  font-family: var(--font-heading);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

.cred-val {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-ink);
  flex-grow: 1;
}

.btn-copy {
  min-height: 36px;
  padding: 0.35rem 0.75rem;
  font-size: 0.82rem;
}

.invite-footnote {
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.form-box {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.w-full {
  width: 100%;
}

.empty-page {
  padding: 3rem 2rem;
}

.onboarding-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;
}

.onboarding-form {
  background-color: var(--color-surface-muted);
  padding: 1.5rem;
  border-radius: 8px;
}

.onboarding-form h3 {
  margin-bottom: 1rem;
}

@media (max-width: 900px) {
  .group-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .group-grid {
    grid-template-columns: 1fr;
  }
  .onboarding-grid {
    grid-template-columns: 1fr;
  }
}
</style>
