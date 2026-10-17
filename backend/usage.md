# Quest Server — API Usage Reference

Base URL: `http://localhost:3000`

All request bodies are JSON unless noted as `multipart/form-data`.  
All protected routes require a valid session cookie (set automatically after login).

---

## Table of Contents

1. [Auth](#1-auth)
2. [Groups](#2-groups)
3. [Quest Library](#3-quest-library)
4. [Create a Quest](#4-create-a-quest)
5. [Adopt a Quest](#5-adopt-a-quest)
6. [Approve an Adoption](#6-approve-an-adoption)
7. [Complete a Quest](#7-complete-a-quest)
8. [Download Evidence](#8-download-evidence)
9. [Leaderboard](#9-leaderboard)

---

## 1. Auth

### `POST /auth/register`
Create a new user account.

**Body**
```json
{
  "username": "alice",
  "password": "supersecret123"
}
```

**Response `201`**
```json
{
  "id": 1,
  "username": "alice"
}
```

**Errors**
| Code | Reason |
|------|--------|
| 400  | Missing username or password / password < 8 chars |
| 409  | Username already taken |

---

### `POST /auth/login`
Login and receive a session cookie (`connect.sid`).

**Body**
```json
{
  "username": "alice",
  "password": "supersecret123"
}
```

**Response `200`**
```json
{
  "message": "Logged in.",
  "username": "alice"
}
```

The server sets an `HttpOnly`, `SameSite=strict` cookie automatically. Include it in all subsequent requests.

**Errors**
| Code | Reason |
|------|--------|
| 400  | Missing fields |
| 401  | Wrong username or password |

---

### `POST /auth/logout`
🔒 Requires login. Destroys the session and clears the cookie.

**Body** _(none)_

**Response `200`**
```json
{
  "message": "Logged out."
}
```

---

### `GET /auth/me`
🔒 Requires login. Returns the current user and their group memberships.

**Response `200`**
```json
{
  "id": 1,
  "username": "alice",
  "groups": [
    {
      "member_id": 3,
      "group_id": 2,
      "group_name": "The Night Owls"
    }
  ]
}
```

---

## 2. Groups

### `POST /groups`
🔒 Requires login. Creates a new group. The creator is automatically joined as the first member.

> The group password must be shared **in real life or via a secure channel** (e.g. Signal) for others to join. It is never returned by the API after creation.

**Body**
```json
{
  "name": "The Night Owls",
  "password": "owls2024"
}
```

**Response `201`**
```json
{
  "id": 2,
  "name": "The Night Owls",
  "member_id": 3,
  "message": "Group created. Share the group password IRL or via a secure channel so others can join."
}
```

**Errors**
| Code | Reason |
|------|--------|
| 400  | Missing name or password / password < 6 chars |
| 401  | Not logged in |
| 409  | Group name already exists |

---

### `POST /groups/:group_id/join`
🔒 Requires login. Join an existing group using its shared password.

**Params**
| Name | Type | Description |
|------|------|-------------|
| `group_id` | integer | ID of the group to join |

**Body**
```json
{
  "password": "owls2024"
}
```

**Response `201`**
```json
{
  "member_id": 4,
  "group_id": 2,
  "group_name": "The Night Owls",
  "message": "Successfully joined the group."
}
```

**Errors**
| Code | Reason |
|------|--------|
| 400  | Missing password |
| 403  | Wrong group password |
| 404  | Group not found |
| 409  | Already a member |

---

### `GET /groups`
Public. Lists all groups sorted by XP descending.

**Response `200`**
```json
[
  {
    "id": 2,
    "name": "The Night Owls",
    "xp": 450,
    "created_at": "2026-10-17T05:00:00"
  },
  {
    "id": 1,
    "name": "Dawn Chasers",
    "xp": 200,
    "created_at": "2026-10-16T10:00:00"
  }
]
```

---

### `GET /groups/:group_id/members`
🔒 Requires login + must be a member of the group.

**Params**
| Name | Type | Description |
|------|------|-------------|
| `group_id` | integer | ID of the group |

**Response `200`**
```json
[
  {
    "member_id": 3,
    "user_id": 1,
    "username": "alice",
    "joined_at": "2026-10-17T05:00:00"
  },
  {
    "member_id": 4,
    "user_id": 2,
    "username": "bob",
    "joined_at": "2026-10-17T05:30:00"
  }
]
```

---

## 3. Quest Library

### `GET /quests`
Public. Browse all quests with optional filters.

**Query Params**
| Name | Type | Description |
|------|------|-------------|
| `difficulty` | string | Filter by `easy`, `medium`, or `hard` |
| `max_duration` | integer | Max duration in days |
| `sort_by` | string | Sort by `likes`, `experience`, or `duration` (default: `likes`) |

**Example Request**
```
GET /quests?difficulty=hard&max_duration=7&sort_by=experience
```

**Response `200`**
```json
[
  {
    "id": 5,
    "title": "30-Day No Sugar Challenge",
    "instructions": "Cut all refined sugar for 30 days. Log daily.",
    "experience": 500,
    "difficulty": "hard",
    "flags": 0,
    "likes": 12,
    "duration": 30,
    "created_at": "2026-10-17T06:00:00",
    "group_name": "The Night Owls",
    "published_by": "alice"
  }
]
```

---

### `GET /quests/:id`
Public. Fetch a single quest by ID.

**Params**
| Name | Type | Description |
|------|------|-------------|
| `id` | integer | Quest ID |

**Response `200`** — same shape as one item in the list above.

**Errors**
| Code | Reason |
|------|--------|
| 404  | Quest not found |

---

## 4. Create a Quest

### `POST /groups/:group_id/quests`
🔒 Requires login + must be a member of the group.

**Params**
| Name | Type | Description |
|------|------|-------------|
| `group_id` | integer | The group publishing this quest |

**Body**
```json
{
  "title": "30-Day No Sugar Challenge",
  "instructions": "Cut all refined sugar for 30 days. Log your meals daily and submit a photo journal as evidence.",
  "experience": 500,
  "difficulty": "hard",
  "duration": 30,
  "likes": 0,
  "flags": 0
}
```

> `likes` and `flags` are optional (default `0`).
> `difficulty` must be exactly `"easy"`, `"medium"`, or `"hard"`.
> `duration` is in days.

**Response `201`**
```json
{
  "id": 5,
  "title": "30-Day No Sugar Challenge",
  "difficulty": "hard",
  "experience": 500,
  "duration": 30
}
```

**Errors**
| Code | Reason |
|------|--------|
| 400  | Missing required fields or invalid difficulty |
| 401  | Not logged in |
| 403  | Not a member of this group |

---

## 5. Adopt a Quest

### `POST /groups/:group_id/adopt/:quest_id`
🔒 Requires login + must be a member of the group. Initiates adoption for the group.

The initiating member's approval is automatically counted as `1`. Other members must call [Approve](#6-approve-an-adoption). The quest becomes `active` once **all** group members have approved.

**Params**
| Name | Type | Description |
|------|------|-------------|
| `group_id` | integer | Your group's ID |
| `quest_id` | integer | The quest to adopt |

**Body** _(none)_

**Response `201`**
```json
{
  "id": 7,
  "quest_id": 5,
  "group_id": 2,
  "approved": 1,
  "status": "pending",
  "message": "Quest adoption requested. Other members must now approve."
}
```

**Errors**
| Code | Reason |
|------|--------|
| 401  | Not logged in |
| 403  | Not a member of this group |
| 404  | Quest not found |
| 409  | Quest already adopted by this group |

---

## 6. Approve an Adoption

### `POST /adopted/:adopted_quest_id/approve`
🔒 Requires login. Any group member calls this to cast their approval.

**Params**
| Name | Type | Description |
|------|------|-------------|
| `adopted_quest_id` | integer | ID from the adopt response |

**Body** _(none)_

**Response `200`**
```json
{
  "adopted_quest_id": 7,
  "approved": 2,
  "total_members": 2,
  "status": "active"
}
```

> When `approved` equals `total_members`, `status` flips to `"active"` and the quest can be completed.

**Errors**
| Code | Reason |
|------|--------|
| 400  | Quest is already completed |
| 401  | Not logged in |
| 403  | Not a member of the relevant group |
| 404  | Adopted quest not found |
| 409  | Already approved by this user |

---

## 7. Complete a Quest

### `POST /adopted/:adopted_quest_id/complete`
🔒 Requires login + must be a group member.
Content type: `multipart/form-data` (to support optional file evidence).

**Params**
| Name | Type | Description |
|------|------|-------------|
| `adopted_quest_id` | integer | ID of the active adopted quest |

**Form Fields**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | text | No | Written evidence / notes |
| `evidence` | file | No | Photo or document proof |

**Example (curl)**
```bash
curl -X POST http://localhost:3000/adopted/7/complete \
  -b "connect.sid=<your-cookie>" \
  -F "description=Completed all 30 days! Here is my food journal." \
  -F "evidence=@/path/to/journal.jpg"
```

**Response `201`**
```json
{
  "id": 11,
  "adopted_quest_id": 7,
  "file_path": "1729143600000-834729183-journal.jpg",
  "message": "Quest completed! +500 XP awarded to your group."
}
```

**Errors**
| Code | Reason |
|------|--------|
| 400  | Quest is not in `active` status |
| 401  | Not logged in |
| 403  | Not a member of the group |
| 404  | Adopted quest not found |

---

## 8. Download Evidence

### `GET /completions/:completion_id/evidence`
🔒 Requires login + must be a member of the group that owns the completion.

**Params**
| Name | Type | Description |
|------|------|-------------|
| `completion_id` | integer | ID from the completion response |

**Response `200`** — Streams the file as a download.

**Example (curl)**
```bash
curl -OJ http://localhost:3000/completions/11/evidence \
  -b "connect.sid=<your-cookie>"
```

**Errors**
| Code | Reason |
|------|--------|
| 401  | Not logged in |
| 403  | Not a member of the group |
| 404  | Completion not found / no file submitted / file missing on disk |

---

## 9. Leaderboard

### `GET /leaderboard`
Public. All groups ranked by XP, highest first.

**Response `200`**
```json
[
  {
    "rank": 1,
    "id": 2,
    "name": "The Night Owls",
    "xp": 650,
    "completed_quests": 3,
    "is_top": true
  },
  {
    "rank": 2,
    "id": 1,
    "name": "Dawn Chasers",
    "xp": 200,
    "completed_quests": 1,
    "is_top": false
  }
]
```

---

## Typical User Flow

```
1.  POST /auth/register               — create account
2.  POST /auth/login                  — get session cookie

3a. POST /groups                      — create a group (you are auto-joined)
                                        share the password IRL / Signal / etc.
3b. POST /groups/:id/join             — other users join with the shared password

4.  POST /groups/:id/quests           — any member publishes a quest
5.  GET  /quests                      — anyone browses the quest library

6.  POST /groups/:id/adopt/:quest_id  — a member initiates adoption
7.  POST /adopted/:id/approve         — every other member approves
                                        (status -> "active" when all approved)

8.  POST /adopted/:id/complete        — a member submits evidence
                                        (group earns XP automatically)

9.  GET  /leaderboard                 — see who's winning
```

---

## Cookie Notes

- The session cookie (`connect.sid`) is set automatically on login.
- It is `HttpOnly` — JavaScript cannot read it.
- It is `SameSite=strict` — protects against CSRF.
- It expires after **7 days**.
- In production, set `secure: true` in the session config and serve over HTTPS.
