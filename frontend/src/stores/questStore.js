import { reactive, computed } from 'vue'
import { api, checkServerHealth } from '../services/api'

export const store = reactive({
  // App state
  activeTab: 'dashboard', // dashboard, library, create, submit, gallery, group, auth
  selectedQuest: null,
  selectedAdoptedQuest: null,
  isLeaderboardOpen: false,
  isDetailsModalOpen: false,

  // User & Squad
  currentUser: null,
  currentGroup: null,
  groupMembers: [],
  allGroups: [],

  // Quests & Records
  quests: [],
  adoptedQuests: [],
  memories: [],
  leaderboard: [],

  // System & Toast
  isLiveServer: false,
  isLoading: false,
  toast: null, // { message: '', type: 'info' | 'success' | 'error' }

  // Filters
  libraryFilter: {
    search: '',
    difficulty: '',
    durationTab: 'all', // all, daily (1-2), weekly (3-7), monthly (8+)
    sortBy: 'likes'
  }
})

export const currentGroupXp = computed(() => {
  return store.currentGroup ? store.currentGroup.xp : 0
})

export const activeQuestsList = computed(() => {
  if (!store.currentGroup) return []
  return store.adoptedQuests.filter(
    (a) => a.group_id === store.currentGroup.id && a.status !== 'completed'
  )
})

export const completedQuestsCount = computed(() => {
  if (!store.currentGroup) return 0
  return store.memories.filter((m) => m.group_id === store.currentGroup.id).length
})

export function showToast(message, type = 'success') {
  store.toast = { message, type }
  setTimeout(() => {
    if (store.toast && store.toast.message === message) {
      store.toast = null
    }
  }, 4000)
}

export async function initApp() {
  store.isLoading = true
  try {
    store.isLiveServer = await checkServerHealth()
    await refreshCurrentUser()
    await loadInitialData()
  } catch (err) {
    console.error('Initialization error:', err)
  } finally {
    store.isLoading = false
  }
}

export async function refreshCurrentUser() {
  const me = await api.getMe()
  store.currentUser = me
  if (me && me.groups && me.groups.length > 0) {
    // Pick first group or previously selected
    const grpInfo = me.groups[0]
    const allGroups = await api.getGroups()
    store.allGroups = allGroups
    const fullGrp = allGroups.find((g) => g.id === grpInfo.group_id)
    if (fullGrp) {
      store.currentGroup = fullGrp
      store.groupMembers = await api.getGroupMembers(fullGrp.id)
    }
  } else {
    // No group yet
    const allGroups = await api.getGroups()
    store.allGroups = allGroups
    if (allGroups.length > 0 && !store.currentGroup) {
      store.currentGroup = allGroups[0]
      store.groupMembers = await api.getGroupMembers(allGroups[0].id)
    }
  }
}

export async function loadInitialData() {
  const [questsList, lbList] = await Promise.all([
    api.getQuests({ sort_by: 'likes' }),
    api.getLeaderboard()
  ])
  store.quests = questsList
  store.leaderboard = lbList

  if (store.currentGroup) {
    const adopted = api.getGroupAdoptedQuests(store.currentGroup.id)
    const memberCount = store.groupMembers.length || 1
    // Ensure total_members is always populated for progress-bar rendering
    store.adoptedQuests = adopted.map((a) => ({
      ...a,
      total_members: a.total_members || memberCount
    }))
    store.memories = api.getGroupMemories(store.currentGroup.id)
  }
}

export function setActiveTab(tab) {
  store.activeTab = tab
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function openQuestDetails(quest) {
  store.selectedQuest = quest
  store.isDetailsModalOpen = true
}

export function closeQuestDetails() {
  store.isDetailsModalOpen = false
  store.selectedQuest = null
}

export function openSubmitProof(adoptedQuest) {
  store.selectedAdoptedQuest = adoptedQuest
  const relatedQuest = store.quests.find((q) => q.id === adoptedQuest.quest_id)
  if (relatedQuest) {
    store.selectedQuest = relatedQuest
  }
  store.activeTab = 'submit'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export async function handleAdoptQuest(questId) {
  if (!store.currentGroup) {
    showToast('Please join or create a squad first', 'error')
    store.activeTab = 'group'
    return
  }
  try {
    const result = await api.adoptQuest(store.currentGroup.id, questId)
    const adopted = api.getGroupAdoptedQuests(store.currentGroup.id)
    const memberCount = store.groupMembers.length || 1
    store.adoptedQuests = adopted.map((a) => ({ ...a, total_members: a.total_members || memberCount }))
    showToast(result.message || 'Challenge adopted! Rally your squad to approve.')
    store.isDetailsModalOpen = false
    store.activeTab = 'dashboard'
  } catch (err) {
    showToast(err.message || 'Failed to adopt challenge', 'error')
  }
}

export async function handleApproveAdoption(adoptedQuestId) {
  try {
    const res = await api.approveAdoption(adoptedQuestId)
    const adopted = api.getGroupAdoptedQuests(store.currentGroup.id)
    const memberCount = store.groupMembers.length || 1
    store.adoptedQuests = adopted.map((a) => ({ ...a, total_members: a.total_members || memberCount }))
    if (res.status === 'active') {
      showToast('All squad members approved! Mission is now active.')
    } else {
      showToast(`Vote logged: ${res.approved} of ${res.total_members} members approved.`)
    }
  } catch (err) {
    showToast(err.message || 'Error casting vote', 'error')
  }
}

export async function handleCompleteQuest(adoptedQuestId, formData) {
  try {
    const res = await api.completeQuest(adoptedQuestId, formData)
    await refreshCurrentUser()
    await loadInitialData()
    showToast(res.message || 'Field proof verified! XP awarded.')
    store.activeTab = 'gallery'
  } catch (err) {
    showToast(err.message || 'Failed to submit completion', 'error')
    throw err
  }
}
