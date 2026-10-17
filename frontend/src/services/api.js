import axios from 'axios'

// Axios client with credentials for session cookie
const apiClient = axios.create({
  baseURL: '',
  withCredentials: true,
  timeout: 4000
})

const STORAGE_KEY = 'questbook_local_data_v2'

// Initial seed data for offline / sandbox mode
const defaultData = {
  currentUser: {
    id: 1,
    username: 'alice',
    groups: [
      {
        member_id: 3,
        group_id: 2,
        group_name: 'The Night Owls'
      }
    ]
  },
  groups: [
    {
      id: 2,
      name: 'The Night Owls',
      xp: 650,
      password: 'owls2024',
      created_at: '2026-10-17T05:00:00Z',
      members: [
        { member_id: 3, user_id: 1, username: 'alice', joined_at: '2026-10-17T05:00:00Z' },
        { member_id: 4, user_id: 2, username: 'bob', joined_at: '2026-10-17T05:30:00Z' },
        { member_id: 5, user_id: 3, username: 'clara', joined_at: '2026-10-17T06:15:00Z' }
      ]
    },
    {
      id: 1,
      name: 'Dawn Chasers',
      xp: 200,
      password: 'dawn2024',
      created_at: '2026-10-16T10:00:00Z',
      members: [
        { member_id: 1, user_id: 4, username: 'marcus', joined_at: '2026-10-16T10:00:00Z' }
      ]
    }
  ],
  quests: [
    {
      id: 1,
      title: 'Find 5 Objects That Look Like Faces',
      instructions: 'Pareidolia field challenge. Walk through your district and photograph five inanimate structures, fixtures, or tree barks that clearly resemble human faces.',
      example: 'Example: A brick wall air-vent with dual bolt eyes and a slotted mouth grill.',
      category: 'scavenger',
      experience: 200,
      difficulty: 'easy',
      duration: 1,
      likes: 24,
      flags: 0,
      created_at: '2026-10-17T06:00:00Z',
      group_name: 'The Night Owls',
      published_by: 'alice',
      image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 2,
      title: '30-Day Zero Refined Sugar Fast',
      instructions: 'Eliminate all artificial syrups, sodas, and processed confectionery for thirty consecutive days. Take one photo of your daily wholesome lunch plate.',
      example: 'Example: Daily field photo log of grain bowls, roasted roots, and water infusions.',
      category: 'health',
      experience: 500,
      difficulty: 'hard',
      duration: 30,
      likes: 42,
      flags: 0,
      created_at: '2026-10-16T14:00:00Z',
      group_name: 'Dawn Chasers',
      published_by: 'marcus',
      image_url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 3,
      title: 'Midnight Constellation Observation',
      instructions: 'Hike or cycle past city light spill after 11 PM. Identify and photograph Ursa Major and Cassiopeia against the tree line.',
      example: 'Example: Long exposure shot showing the northern sky clear of street lights.',
      category: 'outdoor',
      experience: 350,
      difficulty: 'medium',
      duration: 2,
      likes: 31,
      flags: 0,
      created_at: '2026-10-15T22:00:00Z',
      group_name: 'The Night Owls',
      published_by: 'bob',
      image_url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 4,
      title: 'Map 3 Secret Architectural Alleys',
      instructions: 'Explore your oldest city sector on foot. Locate three pedestrian alleyways or brick passages not highlighted on mainstream tourist routes.',
      example: 'Example: Narrow cobblestone path between former textile mills with historic gaslamp brackets.',
      category: 'exploration',
      experience: 400,
      difficulty: 'medium',
      duration: 7,
      likes: 19,
      flags: 0,
      created_at: '2026-10-14T09:00:00Z',
      group_name: 'Dawn Chasers',
      published_by: 'marcus',
      image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 5,
      title: 'Cook a Fire-Pit Dinner Without Utensils',
      instructions: 'Gather deadwood in a permitted zone, establish a safe stone pit, and prepare a meal using only cast iron and skewers.',
      example: 'Example: Roasted root vegetables and campfire flatbread on hot stone slates.',
      category: 'outdoor',
      experience: 450,
      difficulty: 'hard',
      duration: 3,
      likes: 38,
      flags: 0,
      created_at: '2026-10-13T17:00:00Z',
      group_name: 'The Night Owls',
      published_by: 'clara',
      image_url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 6,
      title: 'Record Sunrise from the Ridge Crest',
      instructions: 'Ascend your nearest topographical peak before dawn breaks. Photograph the horizon line at the exact moment the sun disc breaks cover.',
      example: 'Example: Golden hour horizon capture over morning mist.',
      category: 'adventure',
      experience: 180,
      difficulty: 'easy',
      duration: 1,
      likes: 29,
      flags: 0,
      created_at: '2026-10-12T04:30:00Z',
      group_name: 'Dawn Chasers',
      published_by: 'marcus',
      image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
    }
  ],
  adoptedQuests: [
    {
      id: 7,
      quest_id: 1,
      group_id: 2,
      approved: 2,
      total_members: 3,
      approvers: ['alice', 'bob'],
      status: 'pending',
      adopted_at: '2026-10-17T07:00:00Z'
    }
  ],
  completions: [
    {
      id: 101,
      adopted_quest_id: 8,
      quest_id: 4,
      quest_title: 'Map 3 Secret Architectural Alleys',
      group_id: 2,
      group_name: 'The Night Owls',
      experience: 400,
      description: 'Found three cobblestone passages behind the old wool factory. Complete stone archways intact from 1892.',
      file_path: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
      completed_at: '2026-10-16T18:30:00Z',
      completed_by: 'alice'
    },
    {
      id: 102,
      adopted_quest_id: 9,
      quest_id: 6,
      quest_title: 'Record Sunrise from the Ridge Crest',
      group_id: 2,
      group_name: 'The Night Owls',
      experience: 180,
      description: 'Dawn climb at Eagle Hill. Sub-zero mist at sunrise, verified disc crest visible.',
      file_path: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80',
      completed_at: '2026-10-15T06:14:00Z',
      completed_by: 'bob'
    }
  ]
}

function getLocalDB() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.warn('Failed parsing stored questbook data, resetting to default', e)
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData))
  return JSON.parse(JSON.stringify(defaultData))
}

function saveLocalDB(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Check if live server is responding
let isLiveServerAvailable = false

export async function checkServerHealth() {
  try {
    await apiClient.get('/leaderboard')
    isLiveServerAvailable = true
    return true
  } catch (err) {
    isLiveServerAvailable = false
    return false
  }
}

export const api = {
  getIsLive() {
    return isLiveServerAvailable
  },

  // 1. Auth API
  async register(username, password) {
    try {
      const res = await apiClient.post('/auth/register', { username, password })
      isLiveServerAvailable = true
      return res.data
    } catch (err) {
      if (!isLiveServerAvailable) {
        const db = getLocalDB()
        const user = { id: Date.now(), username, groups: [] }
        db.currentUser = user
        saveLocalDB(db)
        return user
      }
      throw err
    }
  },

  async login(username, password) {
    try {
      const res = await apiClient.post('/auth/login', { username, password })
      isLiveServerAvailable = true
      return res.data
    } catch (err) {
      if (!isLiveServerAvailable) {
        const db = getLocalDB()
        let user = db.currentUser
        if (!user || user.username !== username) {
          user = { id: Date.now(), username, groups: [] }
          db.currentUser = user
          saveLocalDB(db)
        }
        return { message: 'Logged in.', username }
      }
      throw err
    }
  },

  async logout() {
    try {
      const res = await apiClient.post('/auth/logout')
      return res.data
    } catch (err) {
      const db = getLocalDB()
      db.currentUser = null
      saveLocalDB(db)
      return { message: 'Logged out.' }
    }
  },

  async getMe() {
    try {
      const res = await apiClient.get('/auth/me')
      isLiveServerAvailable = true
      return res.data
    } catch (err) {
      const db = getLocalDB()
      return db.currentUser || null
    }
  },

  // 2. Groups API
  async createGroup(name, password) {
    try {
      const res = await apiClient.post('/groups', { name, password })
      return res.data
    } catch (err) {
      const db = getLocalDB()
      const newGroupId = db.groups.length + 1
      const memberId = Date.now()
      const newGroup = {
        id: newGroupId,
        name,
        password,
        xp: 0,
        created_at: new Date().toISOString(),
        members: [
          {
            member_id: memberId,
            user_id: db.currentUser ? db.currentUser.id : 1,
            username: db.currentUser ? db.currentUser.username : 'traveler',
            joined_at: new Date().toISOString()
          }
        ]
      }
      db.groups.push(newGroup)
      if (db.currentUser) {
        if (!db.currentUser.groups) db.currentUser.groups = []
        db.currentUser.groups.push({
          member_id: memberId,
          group_id: newGroupId,
          group_name: name
        })
      }
      saveLocalDB(db)
      return {
        id: newGroupId,
        name,
        member_id: memberId,
        message: 'Group created. Share the group password IRL or via a secure channel so others can join.'
      }
    }
  },

  async joinGroup(groupId, password) {
    try {
      const res = await apiClient.post(`/groups/${groupId}/join`, { password })
      return res.data
    } catch (err) {
      const db = getLocalDB()
      const grp = db.groups.find((g) => g.id === Number(groupId))
      if (!grp) throw new Error('Group not found')
      if (grp.password && grp.password !== password) {
        throw new Error('Wrong group password')
      }
      const memberId = Date.now()
      const username = db.currentUser ? db.currentUser.username : 'explorer'
      grp.members.push({
        member_id: memberId,
        user_id: db.currentUser ? db.currentUser.id : 1,
        username,
        joined_at: new Date().toISOString()
      })
      if (db.currentUser) {
        if (!db.currentUser.groups) db.currentUser.groups = []
        db.currentUser.groups.push({
          member_id: memberId,
          group_id: grp.id,
          group_name: grp.name
        })
      }
      saveLocalDB(db)
      return {
        member_id: memberId,
        group_id: grp.id,
        group_name: grp.name,
        message: 'Successfully joined the group.'
      }
    }
  },

  async getGroups() {
    try {
      const res = await apiClient.get('/groups')
      return res.data
    } catch (err) {
      const db = getLocalDB()
      return db.groups.map((g) => ({
        id: g.id,
        name: g.name,
        xp: g.xp,
        created_at: g.created_at
      }))
    }
  },

  async getGroupMembers(groupId) {
    try {
      const res = await apiClient.get(`/groups/${groupId}/members`)
      return res.data
    } catch (err) {
      const db = getLocalDB()
      const grp = db.groups.find((g) => g.id === Number(groupId))
      return grp ? grp.members : []
    }
  },

  // 3. Quest Library API
  async getQuests(params = {}) {
    try {
      const res = await apiClient.get('/quests', { params })
      return res.data
    } catch (err) {
      const db = getLocalDB()
      let list = [...db.quests]
      if (params.difficulty) {
        list = list.filter((q) => q.difficulty === params.difficulty)
      }
      if (params.max_duration) {
        list = list.filter((q) => q.duration <= Number(params.max_duration))
      }
      if (params.sort_by === 'experience') {
        list.sort((a, b) => b.experience - a.experience)
      } else if (params.sort_by === 'duration') {
        list.sort((a, b) => a.duration - b.duration)
      } else {
        list.sort((a, b) => b.likes - a.likes)
      }
      return list
    }
  },

  async getQuest(id) {
    try {
      const res = await apiClient.get(`/quests/${id}`)
      return res.data
    } catch (err) {
      const db = getLocalDB()
      const q = db.quests.find((item) => item.id === Number(id))
      if (!q) throw new Error('Quest not found')
      return q
    }
  },

  // 4. Create Quest API
  async createQuest(groupId, questData) {
    try {
      const res = await apiClient.post(`/groups/${groupId}/quests`, questData)
      return res.data
    } catch (err) {
      const db = getLocalDB()
      const grp = db.groups.find((g) => g.id === Number(groupId))
      const newQuest = {
        id: db.quests.length + 1,
        title: questData.title,
        instructions: questData.instructions,
        example: questData.example || '',
        experience: Number(questData.experience) || 300,
        difficulty: questData.difficulty || 'medium',
        duration: Number(questData.duration) || 7,
        likes: 0,
        flags: 0,
        created_at: new Date().toISOString(),
        group_name: grp ? grp.name : 'The Night Owls',
        published_by: db.currentUser ? db.currentUser.username : 'traveler'
      }
      db.quests.unshift(newQuest)
      saveLocalDB(db)
      return newQuest
    }
  },

  // 5. Adopt Quest API
  async adoptQuest(groupId, questId) {
    try {
      const res = await apiClient.post(`/groups/${groupId}/adopt/${questId}`)
      return res.data
    } catch (err) {
      const db = getLocalDB()
      const existing = db.adoptedQuests.find(
        (a) => a.group_id === Number(groupId) && a.quest_id === Number(questId) && a.status !== 'completed'
      )
      if (existing) {
        throw new Error('Quest already adopted by this group')
      }
      const grp = db.groups.find((g) => g.id === Number(groupId))
      const totalMembers = grp ? grp.members.length : 3
      const username = db.currentUser ? db.currentUser.username : 'alice'
      const status = totalMembers <= 1 ? 'active' : 'pending'
      const record = {
        id: Date.now(),
        quest_id: Number(questId),
        group_id: Number(groupId),
        approved: 1,
        total_members: totalMembers,
        approvers: [username],
        status,
        adopted_at: new Date().toISOString(),
        message: status === 'active' ? 'Quest adopted and ready!' : 'Quest adoption requested. Other members must now approve.'
      }
      db.adoptedQuests.unshift(record)
      saveLocalDB(db)
      return record
    }
  },

  // 6. Approve Adoption API
  async approveAdoption(adoptedQuestId) {
    try {
      const res = await apiClient.post(`/adopted/${adoptedQuestId}/approve`)
      return res.data
    } catch (err) {
      const db = getLocalDB()
      const record = db.adoptedQuests.find((a) => a.id === Number(adoptedQuestId))
      if (!record) throw new Error('Adopted quest not found')
      const username = db.currentUser ? db.currentUser.username : 'bob'
      if (!record.approvers) record.approvers = []
      if (!record.approvers.includes(username)) {
        record.approvers.push(username)
        record.approved = record.approvers.length
      } else {
        // Allow simulating other squad members
        record.approved = Math.min(record.total_members, record.approved + 1)
      }
      if (record.approved >= record.total_members) {
        record.status = 'active'
      }
      saveLocalDB(db)
      return {
        adopted_quest_id: record.id,
        approved: record.approved,
        total_members: record.total_members,
        status: record.status
      }
    }
  },

  // 7. Complete Quest API
  async completeQuest(adoptedQuestId, formData) {
    try {
      const res = await apiClient.post(`/adopted/${adoptedQuestId}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data
    } catch (err) {
      const db = getLocalDB()
      const record = db.adoptedQuests.find((a) => a.id === Number(adoptedQuestId))
      const quest = record ? db.quests.find((q) => q.id === record.quest_id) : null
      const expReward = quest ? quest.experience : 200

      if (record) {
        record.status = 'completed'
      }

      // Add XP to group
      const grp = db.groups.find((g) => g.id === (record ? record.group_id : 2))
      if (grp) {
        grp.xp += expReward
      }

      // Read description and evidence file if present
      let desc = 'Challenge accomplished by squad.'
      let filePath = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80'

      if (formData instanceof FormData) {
        desc = formData.get('description') || desc
        const file = formData.get('evidence')
        if (file && file instanceof File) {
          filePath = URL.createObjectURL(file)
        }
      } else if (formData && typeof formData === 'object') {
        if (formData.description) desc = formData.description
        if (formData.evidenceUrl) filePath = formData.evidenceUrl
      }

      const newCompletion = {
        id: Date.now(),
        adopted_quest_id: Number(adoptedQuestId),
        quest_id: quest ? quest.id : 1,
        quest_title: quest ? quest.title : 'Field Quest',
        group_id: grp ? grp.id : 2,
        group_name: grp ? grp.name : 'The Night Owls',
        experience: expReward,
        description: desc,
        file_path: filePath,
        completed_at: new Date().toISOString(),
        completed_by: db.currentUser ? db.currentUser.username : 'alice'
      }
      db.completions.unshift(newCompletion)
      saveLocalDB(db)

      return {
        id: newCompletion.id,
        adopted_quest_id: Number(adoptedQuestId),
        file_path: filePath,
        message: `Quest completed! +${expReward} XP awarded to your group.`
      }
    }
  },

  // 8. Download Evidence API
  getEvidenceUrl(completionId) {
    if (isLiveServerAvailable) {
      return `/completions/${completionId}/evidence`
    }
    const db = getLocalDB()
    const c = db.completions.find((item) => item.id === Number(completionId))
    return c ? c.file_path : '#'
  },

  // 9. Leaderboard API
  async getLeaderboard() {
    try {
      const res = await apiClient.get('/leaderboard')
      return res.data
    } catch (err) {
      const db = getLocalDB()
      const sorted = [...db.groups].sort((a, b) => b.xp - a.xp)
      return sorted.map((g, idx) => ({
        rank: idx + 1,
        id: g.id,
        name: g.name,
        xp: g.xp,
        completed_quests: db.completions.filter((c) => c.group_id === g.id).length,
        is_top: idx === 0
      }))
    }
  },

  // Helper to fetch group adopted quests
  getGroupAdoptedQuests(groupId) {
    const db = getLocalDB()
    return db.adoptedQuests.filter((a) => a.group_id === Number(groupId))
  },

  // Helper to fetch group completions (Memories)
  getGroupMemories(groupId) {
    const db = getLocalDB()
    return db.completions.filter((c) => c.group_id === Number(groupId))
  }
}
