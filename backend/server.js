const express        = require("express");
const sqlite3        = require("sqlite3").verbose();
const multer         = require("multer");
const path           = require("path");
const fs             = require("fs");
const argon2         = require("argon2");
const session        = require("express-session");
const SQLiteStore    = require("connect-sqlite3")(session);

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(
  session({
    store : new SQLiteStore({ db: "sessions.db", dir: "./" }),
    secret: process.env.SESSION_SECRET || "change-me-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,          // JS cannot read the cookie
      sameSite: "strict",      // CSRF protection
      secure  : false,         // set true when behind HTTPS in prod
      maxAge  : 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// ─── SQLite Database ──────────────────────────────────────────────────────────
const db = new sqlite3.Database("./quests.db", (err) => {
  if (err) console.error("DB connect error:", err.message);
  else     console.log("Connected to SQLite.");
});

// ─── DB Helpers ───────────────────────────────────────────────────────────────
const dbRun = (sql, p = []) =>
  new Promise((res, rej) => db.run(sql, p, function (e) { e ? rej(e) : res(this); }));

const dbAll = (sql, p = []) =>
  new Promise((res, rej) => db.all(sql, p, (e, rows) => e ? rej(e) : res(rows)));

const dbGet = (sql, p = []) =>
  new Promise((res, rej) => db.get(sql, p, (e, row) => e ? rej(e) : res(row)));

// ─── Schema ───────────────────────────────────────────────────────────────────
db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  // Users  (one account per person — username + hashed password)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      username     TEXT    NOT NULL UNIQUE,
      password_hash TEXT   NOT NULL,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Groups  (name + hashed group password shared IRL)
  db.run(`
    CREATE TABLE IF NOT EXISTS groups (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      xp            INTEGER NOT NULL DEFAULT 0,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Members  (links a user to a group; this is the "member" identity)
  db.run(`
    CREATE TABLE IF NOT EXISTS members (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
      group_id   INTEGER NOT NULL REFERENCES groups(id)  ON DELETE CASCADE,
      joined_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, group_id)
    )
  `);

  // Quests
  db.run(`
    CREATE TABLE IF NOT EXISTS quests (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id     INTEGER NOT NULL REFERENCES groups(id)  ON DELETE CASCADE,
      member_id    INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      title        TEXT    NOT NULL,
      instructions TEXT    NOT NULL,
      experience   INTEGER NOT NULL DEFAULT 0,
      difficulty   TEXT    NOT NULL CHECK(difficulty IN ('easy','medium','hard')),
      flags        INTEGER NOT NULL DEFAULT 0,
      likes        INTEGER NOT NULL DEFAULT 0,
      duration     INTEGER NOT NULL DEFAULT 1,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Adopted Quests
  db.run(`
    CREATE TABLE IF NOT EXISTS adopted_quests (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      quest_id    INTEGER NOT NULL REFERENCES quests(id)   ON DELETE CASCADE,
      group_id    INTEGER NOT NULL REFERENCES groups(id)   ON DELETE CASCADE,
      member_id   INTEGER NOT NULL REFERENCES members(id)  ON DELETE CASCADE,
      approved    INTEGER NOT NULL DEFAULT 1,
      status      TEXT    NOT NULL DEFAULT 'pending'
                          CHECK(status IN ('pending','active','completed')),
      adopted_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Approvals
  db.run(`
    CREATE TABLE IF NOT EXISTS approvals (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      adopted_quest_id INTEGER NOT NULL REFERENCES adopted_quests(id) ON DELETE CASCADE,
      member_id        INTEGER NOT NULL REFERENCES members(id)        ON DELETE CASCADE,
      approved_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(adopted_quest_id, member_id)
    )
  `);

  // Completions
  db.run(`
    CREATE TABLE IF NOT EXISTS completions (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      adopted_quest_id INTEGER NOT NULL REFERENCES adopted_quests(id) ON DELETE CASCADE,
      member_id        INTEGER NOT NULL REFERENCES members(id)        ON DELETE CASCADE,
      description      TEXT,
      file_path        TEXT,
      submitted_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// ─── Multer ───────────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename   : (_req,  file, cb) => {
    const uid = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uid}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTH MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * requireLogin — any route that needs an authenticated user.
 * Attaches req.user = { id, username } from the session.
 */
const requireLogin = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "You must be logged in." });
  }
  req.user = { id: req.session.userId, username: req.session.username };
  next();
};

/**
 * requireGroupMember — use after requireLogin.
 * Reads :group_id from route params and verifies the logged-in user is a member.
 * Attaches req.member = { id } (the members row).
 */
const requireGroupMember = async (req, res, next) => {
  try {
    const groupId = req.params.group_id || req.body.group_id;
    if (!groupId) return res.status(400).json({ error: "group_id is required." });

    const member = await dbGet(
      "SELECT id FROM members WHERE user_id = ? AND group_id = ?",
      [req.user.id, groupId]
    );
    if (!member) {
      return res.status(403).json({ error: "You are not a member of this group." });
    }
    req.member  = member;
    req.groupId = Number(groupId);
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => res.json({ message: "Quest Server is running 🚀" }));

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH  (/auth/*)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /auth/register
 * Body: { username, password }
 * Creates a new user account. Hashes the password with argon2.
 */
app.post("/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "username and password are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const hash   = await argon2.hash(password);
    const result = await dbRun(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      [username, hash]
    );

    res.status(201).json({ id: result.lastID, username });
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "Username already taken." });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /auth/login
 * Body: { username, password }
 * Verifies credentials and creates a session cookie.
 */
app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "username and password are required." });
    }

    const user = await dbGet("SELECT * FROM users WHERE username = ?", [username]);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const valid = await argon2.verify(user.password_hash, password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    // Regenerate session to prevent fixation attacks
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: "Session error." });
      req.session.userId   = user.id;
      req.session.username = user.username;
      res.json({ message: "Logged in.", username: user.username });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /auth/logout
 * Destroys the session and clears the cookie.
 */
app.post("/auth/logout", requireLogin, (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Could not log out." });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out." });
  });
});

/**
 * GET /auth/me
 * Returns the currently logged-in user's info and their group memberships.
 */
app.get("/auth/me", requireLogin, async (req, res) => {
  try {
    const memberships = await dbAll(
      `SELECT m.id AS member_id, g.id AS group_id, g.name AS group_name
       FROM members m
       JOIN groups g ON m.group_id = g.id
       WHERE m.user_id = ?`,
      [req.user.id]
    );
    res.json({ id: req.user.id, username: req.user.username, groups: memberships });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  GROUPS  (/groups/*)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /groups
 * Body: { name, password }
 * Creates a new group. The creator automatically becomes its first member.
 * The group password must be shared IRL or via a secure channel for others to join.
 */
app.post("/groups", requireLogin, async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: "Group name and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Group password must be at least 6 characters." });
    }

    const hash         = await argon2.hash(password);
    const groupResult  = await dbRun(
      "INSERT INTO groups (name, password_hash) VALUES (?, ?)",
      [name, hash]
    );
    const groupId = groupResult.lastID;

    // Auto-join creator as first member
    const memberResult = await dbRun(
      "INSERT INTO members (user_id, group_id) VALUES (?, ?)",
      [req.user.id, groupId]
    );

    res.status(201).json({
      id       : groupId,
      name,
      member_id: memberResult.lastID,
      message  : "Group created. Share the group password IRL or via a secure channel so others can join.",
    });
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "A group with that name already exists." });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /groups/:group_id/join
 * Body: { password }
 * Lets an authenticated user join a group by providing its password.
 */
app.post("/groups/:group_id/join", requireLogin, async (req, res) => {
  try {
    const { group_id } = req.params;
    const { password  } = req.body;
    if (!password) return res.status(400).json({ error: "Group password is required." });

    const group = await dbGet("SELECT * FROM groups WHERE id = ?", [group_id]);
    if (!group) return res.status(404).json({ error: "Group not found." });

    const valid = await argon2.verify(group.password_hash, password);
    if (!valid) return res.status(403).json({ error: "Wrong group password." });

    // Check not already a member
    const already = await dbGet(
      "SELECT id FROM members WHERE user_id = ? AND group_id = ?",
      [req.user.id, group_id]
    );
    if (already) return res.status(409).json({ error: "You are already in this group." });

    const result = await dbRun(
      "INSERT INTO members (user_id, group_id) VALUES (?, ?)",
      [req.user.id, group_id]
    );

    res.status(201).json({
      member_id: result.lastID,
      group_id : Number(group_id),
      group_name: group.name,
      message  : "Successfully joined the group.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /groups
 * Public — lists all groups (without password hashes, of course).
 */
app.get("/groups", async (_req, res) => {
  try {
    const groups = await dbAll(
      "SELECT id, name, xp, created_at FROM groups ORDER BY xp DESC"
    );
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /groups/:group_id/members
 * Members only — lists who is in the group.
 */
app.get("/groups/:group_id/members", requireLogin, requireGroupMember, async (req, res) => {
  try {
    const members = await dbAll(
      `SELECT m.id AS member_id, u.id AS user_id, u.username, m.joined_at
       FROM members m
       JOIN users u ON m.user_id = u.id
       WHERE m.group_id = ?`,
      [req.groupId]
    );
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  1. CREATE A QUEST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /groups/:group_id/quests
 * Auth required — must be a member of the group.
 * Body: { title, instructions, experience, difficulty, duration, flags?, likes? }
 */
app.post("/groups/:group_id/quests", requireLogin, requireGroupMember, async (req, res) => {
  try {
    const {
      title, instructions, experience, difficulty, duration,
      flags = 0, likes = 0,
    } = req.body;

    if (!title || !instructions || !experience || !difficulty || !duration) {
      return res.status(400).json({
        error: "title, instructions, experience, difficulty, and duration are required.",
      });
    }

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return res.status(400).json({ error: "difficulty must be easy, medium, or hard." });
    }

    const result = await dbRun(
      `INSERT INTO quests
         (group_id, member_id, title, instructions, experience, difficulty, flags, likes, duration)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.groupId, req.member.id, title, instructions, experience, difficulty, flags, likes, duration]
    );

    res.status(201).json({ id: result.lastID, title, difficulty, experience, duration });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  2. QUEST LIBRARY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /quests
 * Public. Query params: difficulty, max_duration, sort_by (likes|experience|duration)
 */
app.get("/quests", async (req, res) => {
  try {
    const { difficulty, max_duration, sort_by } = req.query;

    let sql = `
      SELECT q.id, q.title, q.instructions, q.experience, q.difficulty,
             q.flags, q.likes, q.duration, q.created_at,
             g.name AS group_name, u.username AS published_by
      FROM   quests   q
      JOIN   groups   g ON q.group_id  = g.id
      JOIN   members  m ON q.member_id = m.id
      JOIN   users    u ON m.user_id   = u.id
      WHERE  1=1
    `;
    const params = [];

    if (difficulty) { sql += " AND q.difficulty = ?"; params.push(difficulty); }
    if (max_duration) { sql += " AND q.duration <= ?"; params.push(Number(max_duration)); }

    const allowed = ["likes", "experience", "duration"];
    const col     = allowed.includes(sort_by) ? sort_by : "likes";
    sql += ` ORDER BY q.${col} DESC`;

    res.json(await dbAll(sql, params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /quests/:id
 * Public — single quest detail.
 */
app.get("/quests/:id", async (req, res) => {
  try {
    const quest = await dbGet(
      `SELECT q.*, g.name AS group_name, u.username AS published_by
       FROM   quests   q
       JOIN   groups   g ON q.group_id  = g.id
       JOIN   members  m ON q.member_id = m.id
       JOIN   users    u ON m.user_id   = u.id
       WHERE  q.id = ?`,
      [req.params.id]
    );
    if (!quest) return res.status(404).json({ error: "Quest not found." });
    res.json(quest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  3. ADOPT A QUEST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /groups/:group_id/adopt/:quest_id
 * Auth required — member initiates adoption for their group.
 */
app.post(
  "/groups/:group_id/adopt/:quest_id",
  requireLogin,
  requireGroupMember,
  async (req, res) => {
    try {
      const { quest_id } = req.params;

      const quest = await dbGet("SELECT id FROM quests WHERE id = ?", [quest_id]);
      if (!quest) return res.status(404).json({ error: "Quest not found." });

      const existing = await dbGet(
        "SELECT id FROM adopted_quests WHERE quest_id = ? AND group_id = ?",
        [quest_id, req.groupId]
      );
      if (existing) {
        return res.status(409).json({ error: "Quest already adopted by this group." });
      }

      const result = await dbRun(
        `INSERT INTO adopted_quests (quest_id, group_id, member_id, approved, status)
         VALUES (?, ?, ?, 1, 'pending')`,
        [quest_id, req.groupId, req.member.id]
      );

      // Initiator's approval is auto-recorded
      await dbRun(
        "INSERT INTO approvals (adopted_quest_id, member_id) VALUES (?, ?)",
        [result.lastID, req.member.id]
      );

      res.status(201).json({
        id        : result.lastID,
        quest_id  : Number(quest_id),
        group_id  : req.groupId,
        approved  : 1,
        status    : "pending",
        message   : "Quest adoption requested. Other members must now approve.",
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /adopted/:adopted_quest_id/approve
 * Auth required — any other group member approves the adoption.
 * Quest becomes 'active' once ALL members have approved.
 */
app.post("/adopted/:adopted_quest_id/approve", requireLogin, async (req, res) => {
  try {
    const { adopted_quest_id } = req.params;

    const adopted = await dbGet(
      "SELECT * FROM adopted_quests WHERE id = ?",
      [adopted_quest_id]
    );
    if (!adopted) return res.status(404).json({ error: "Adopted quest not found." });
    if (adopted.status === "completed") {
      return res.status(400).json({ error: "Quest is already completed." });
    }

    // Confirm the logged-in user is in the group
    const member = await dbGet(
      "SELECT id FROM members WHERE user_id = ? AND group_id = ?",
      [req.user.id, adopted.group_id]
    );
    if (!member) {
      return res.status(403).json({ error: "You are not a member of this group." });
    }

    // Insert approval (UNIQUE constraint blocks duplicates)
    try {
      await dbRun(
        "INSERT INTO approvals (adopted_quest_id, member_id) VALUES (?, ?)",
        [adopted_quest_id, member.id]
      );
    } catch (_) {
      return res.status(409).json({ error: "You have already approved this quest." });
    }

    const { count: approvalCount } = await dbGet(
      "SELECT COUNT(*) AS count FROM approvals WHERE adopted_quest_id = ?",
      [adopted_quest_id]
    );
    const { count: memberCount } = await dbGet(
      "SELECT COUNT(*) AS count FROM members WHERE group_id = ?",
      [adopted.group_id]
    );

    const newStatus = approvalCount >= memberCount ? "active" : adopted.status;

    await dbRun(
      "UPDATE adopted_quests SET approved = ?, status = ? WHERE id = ?",
      [approvalCount, newStatus, adopted_quest_id]
    );

    res.json({
      adopted_quest_id: Number(adopted_quest_id),
      approved        : approvalCount,
      total_members   : memberCount,
      status          : newStatus,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  4. COMPLETE A QUEST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /adopted/:adopted_quest_id/complete
 * Auth required — group member submits evidence (text + optional file).
 * Multipart form: { description? } + optional file field "evidence".
 */
app.post(
  "/adopted/:adopted_quest_id/complete",
  requireLogin,
  upload.single("evidence"),
  async (req, res) => {
    try {
      const { adopted_quest_id } = req.params;
      const { description }      = req.body;

      const adopted = await dbGet(
        "SELECT * FROM adopted_quests WHERE id = ?",
        [adopted_quest_id]
      );
      if (!adopted) return res.status(404).json({ error: "Adopted quest not found." });
      if (adopted.status !== "active") {
        return res.status(400).json({ error: "Quest must be active before completing." });
      }

      const member = await dbGet(
        "SELECT id FROM members WHERE user_id = ? AND group_id = ?",
        [req.user.id, adopted.group_id]
      );
      if (!member) {
        return res.status(403).json({ error: "You are not a member of this group." });
      }

      const filePath = req.file ? req.file.filename : null;

      const result = await dbRun(
        `INSERT INTO completions (adopted_quest_id, member_id, description, file_path)
         VALUES (?, ?, ?, ?)`,
        [adopted_quest_id, member.id, description || null, filePath]
      );

      // Mark quest completed + award XP
      await dbRun(
        "UPDATE adopted_quests SET status = 'completed' WHERE id = ?",
        [adopted_quest_id]
      );
      const quest = await dbGet(
        "SELECT experience FROM quests WHERE id = ?",
        [adopted.quest_id]
      );
      await dbRun(
        "UPDATE groups SET xp = xp + ? WHERE id = ?",
        [quest.experience, adopted.group_id]
      );

      res.status(201).json({
        id               : result.lastID,
        adopted_quest_id : Number(adopted_quest_id),
        file_path        : filePath,
        message          : `Quest completed! +${quest.experience} XP awarded to your group.`,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /completions/:completion_id/evidence
 * Auth required — only group members can download evidence files.
 */
app.get("/completions/:completion_id/evidence", requireLogin, async (req, res) => {
  try {
    const completion = await dbGet(
      `SELECT c.*, aq.group_id
       FROM   completions    c
       JOIN   adopted_quests aq ON c.adopted_quest_id = aq.id
       WHERE  c.id = ?`,
      [req.params.completion_id]
    );
    if (!completion) return res.status(404).json({ error: "Completion not found." });

    const member = await dbGet(
      "SELECT id FROM members WHERE user_id = ? AND group_id = ?",
      [req.user.id, completion.group_id]
    );
    if (!member) {
      return res.status(403).json({ error: "Access denied. Not a member of this group." });
    }

    if (!completion.file_path) {
      return res.status(404).json({ error: "No file evidence was submitted." });
    }

    const filePath = path.join(uploadsDir, completion.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server." });
    }

    res.download(filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  5. GROUP LEADERBOARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /leaderboard
 * Public — shows all groups ranked by XP with completed quest count.
 */
app.get("/leaderboard", async (_req, res) => {
  try {
    const groups = await dbAll(`
      SELECT
        g.id,
        g.name,
        g.xp,
        COUNT(DISTINCT aq.id) AS completed_quests
      FROM   groups g
      LEFT   JOIN adopted_quests aq
             ON aq.group_id = g.id AND aq.status = 'completed'
      GROUP  BY g.id
      ORDER  BY g.xp DESC
    `);

    res.json(
      groups.map((g, i) => ({ rank: i + 1, ...g, is_top: i === 0 }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Quest server running at http://localhost:${PORT}`);
});

module.exports = app;