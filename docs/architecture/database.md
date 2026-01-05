# Database Schema

Beboa uses SQLite via better-sqlite3 for data persistence.

## Database Location

```
data/beboa.db
```

Created automatically on first run.

## Tables

### users

Core user data and engagement stats.

```sql
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    username TEXT,
    bebits INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_checkins INTEGER DEFAULT 0,
    last_checkin TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_bebits ON users(bebits DESC);
CREATE INDEX idx_users_streak ON users(streak DESC);
```

| Column | Type | Description |
|--------|------|-------------|
| user_id | TEXT | Discord user ID (PK) |
| username | TEXT | Cached username |
| bebits | INTEGER | Currency balance |
| streak | INTEGER | Current check-in streak |
| longest_streak | INTEGER | Best streak ever |
| total_checkins | INTEGER | Lifetime check-ins |
| last_checkin | TEXT | ISO timestamp |
| created_at | TEXT | First interaction |
| updated_at | TEXT | Last modification |

---

### relationships

Per-user relationship tracking.

```sql
CREATE TABLE relationships (
    user_id TEXT PRIMARY KEY,
    trust_level REAL DEFAULT 10.0,
    relationship_stage TEXT DEFAULT 'stranger',
    total_interactions INTEGER DEFAULT 0,
    positive_interactions INTEGER DEFAULT 0,
    negative_interactions INTEGER DEFAULT 0,
    first_interaction TEXT,
    last_interaction TEXT,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

| Column | Type | Description |
|--------|------|-------------|
| user_id | TEXT | Discord user ID (PK) |
| trust_level | REAL | 0-100 trust score |
| relationship_stage | TEXT | stranger/acquaintance/familiar/friend/close_friend/family |
| total_interactions | INTEGER | All interactions |
| positive_interactions | INTEGER | Pleasant exchanges |
| negative_interactions | INTEGER | Unpleasant exchanges |
| first_interaction | TEXT | First message timestamp |
| last_interaction | TEXT | Most recent timestamp |
| notes | TEXT | Admin notes JSON |

---

### memories

Semantic memory storage with embeddings.

```sql
CREATE TABLE memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    content TEXT NOT NULL,
    memory_type TEXT DEFAULT 'fact',
    importance REAL DEFAULT 0.5,
    embedding BLOB,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_accessed TEXT,
    access_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX idx_memories_user ON memories(user_id);
CREATE INDEX idx_memories_type ON memories(memory_type);
CREATE INDEX idx_memories_importance ON memories(importance DESC);
```

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Auto-increment PK |
| user_id | TEXT | Associated user |
| content | TEXT | Memory content |
| memory_type | TEXT | fact/preference/event/relationship/emotional/context |
| importance | REAL | 0.0-1.0 relevance score |
| embedding | BLOB | 1536-dim vector (binary) |
| created_at | TEXT | Creation timestamp |
| last_accessed | TEXT | Last retrieval |
| access_count | INTEGER | Times retrieved |

---

### personality

Global personality state (single row).

```sql
CREATE TABLE personality (
    id INTEGER PRIMARY KEY DEFAULT 1,
    openness REAL DEFAULT 0.7,
    conscientiousness REAL DEFAULT 0.4,
    extraversion REAL DEFAULT 0.6,
    agreeableness REAL DEFAULT 0.3,
    neuroticism REAL DEFAULT 0.5,
    playfulness REAL DEFAULT 0.8,
    sarcasm REAL DEFAULT 0.85,
    protectiveness REAL DEFAULT 0.7,
    curiosity REAL DEFAULT 0.65,
    stubbornness REAL DEFAULT 0.75,
    affection_hidden REAL DEFAULT 0.8,
    mischief REAL DEFAULT 0.7,
    drama REAL DEFAULT 0.6,
    loyalty REAL DEFAULT 0.9,
    last_updated TEXT
);
```

All trait columns are REAL values between 0.0 and 1.0.

---

### mood_state

Current mood (single row).

```sql
CREATE TABLE mood_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    current_mood TEXT DEFAULT 'neutral',
    mood_intensity REAL DEFAULT 0.5,
    last_changed TEXT,
    trigger_reason TEXT
);
```

| Column | Type | Description |
|--------|------|-------------|
| current_mood | TEXT | Active mood name |
| mood_intensity | REAL | 0.0-1.0 strength |
| last_changed | TEXT | Change timestamp |
| trigger_reason | TEXT | What caused change |

---

### redemptions

Reward redemption history.

```sql
CREATE TABLE redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    reward_name TEXT,
    reward_tier INTEGER,
    cost INTEGER,
    redeemed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    fulfilled INTEGER DEFAULT 0,
    fulfilled_by TEXT,
    fulfilled_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX idx_redemptions_user ON redemptions(user_id);
CREATE INDEX idx_redemptions_fulfilled ON redemptions(fulfilled);
```

---

### chat_history

Conversation history per user.

```sql
CREATE TABLE chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    role TEXT,  -- 'user' or 'assistant'
    content TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX idx_chat_user ON chat_history(user_id);
CREATE INDEX idx_chat_timestamp ON chat_history(timestamp DESC);
```

---

### jarvis_access

Jarvis Mode permissions.

```sql
CREATE TABLE jarvis_access (
    user_id TEXT PRIMARY KEY,
    granted_by TEXT,
    granted_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

### admin_log

Admin action audit trail.

```sql
CREATE TABLE admin_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id TEXT,
    command TEXT,
    target_id TEXT,
    details TEXT,  -- JSON
    result TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_log_admin ON admin_log(admin_id);
CREATE INDEX idx_admin_log_timestamp ON admin_log(timestamp DESC);
```

## Common Queries

### Get User with Stats

```sql
SELECT
    u.*,
    r.trust_level,
    r.relationship_stage,
    (SELECT COUNT(*) FROM memories WHERE user_id = u.user_id) as memory_count
FROM users u
LEFT JOIN relationships r ON u.user_id = r.user_id
WHERE u.user_id = ?;
```

### Leaderboard

```sql
SELECT user_id, username, bebits,
       ROW_NUMBER() OVER (ORDER BY bebits DESC) as rank
FROM users
ORDER BY bebits DESC
LIMIT 10;
```

### Search Memories

```javascript
// Semantic search requires application-level processing
const allMemories = db.prepare(`
    SELECT * FROM memories
    WHERE user_id = ?
    ORDER BY importance DESC
`).all(userId);

// Then compute cosine similarity with query embedding
const relevant = allMemories
    .map(m => ({ ...m, similarity: cosineSimilarity(queryEmbedding, m.embedding) }))
    .filter(m => m.similarity > 0.7)
    .sort((a, b) => b.similarity - a.similarity);
```

## Migrations

See [Database Migrations](../dev/migrations.md) for schema updates.

## Backup

```bash
# Copy database file
cp data/beboa.db data/beboa_backup_$(date +%Y%m%d).db

# Or use SQLite dump
sqlite3 data/beboa.db .dump > backup.sql
```

## Performance

| Table | Expected Rows | Index Strategy |
|-------|---------------|----------------|
| users | 100-10000 | bebits, streak |
| memories | 1000-100000 | user_id, importance |
| chat_history | 10000-1M | user_id, timestamp |
| admin_log | 1000-100000 | timestamp |

For large servers (>10k users), consider:
- Regular vacuuming: `VACUUM;`
- Chat history pruning
- Memory importance decay
