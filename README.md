# Beboa Bot

A Discord loyalty/engagement bot for BubbleBebe's community server. Beboa is an AI-powered snake companion with a dynamic evolving personality who tracks daily check-ins, awards "Bebits" currency, remembers conversations through semantic memory, and builds genuine relationships with community members over time.

## Features

### Core Features
- **Daily Check-ins** - Users earn 1 Bebit per day with `/checkin`
- **Streak System** - 72-hour grace period to maintain streaks
- **Leaderboard** - Top 10 users ranked by Bebits
- **Reward Shop** - 11 reward tiers from 1 to 500 Bebits

### AI Evolution System
- **Dynamic Personality** - 14 personality traits that evolve through interactions
- **Mood System** - 12 distinct moods affecting behavior (happy, annoyed, mischievous, etc.)
- **Relationship Tracking** - Per-user relationship stages from Stranger → Family
- **Semantic Memory** - Vector-based long-term memory with auto-extraction
- **Channel Awareness** - Sees past 20 messages for context
- **Tool Calls** - Image generation, memory recall, and extensible tools
- **Jarvis Mode 2.0** - Smart natural language admin commands with 25+ commands, AI fallback, and context awareness

### Admin Tools
- Manage Bebits, streaks, and view stats
- Memory management (add, search, view status)
- Personality control (view state, set mood, view relationships)
- Jarvis permission management

## Quick Start

### Prerequisites

- Node.js 20 or higher
- A Discord bot application with a token
- OpenRouter API key (required for AI features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/CMLKevin/beboa_evo.git
   cd beboa_evo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials (see Configuration section below)

4. Enable MessageContent Intent:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Select your application → Bot
   - Enable "Message Content Intent" under Privileged Gateway Intents

5. Start the bot:
   ```bash
   npm start
   ```

## Configuration

### Required Variables

```env
# Discord Configuration
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_client_id
GUILD_ID=your_server_id
CHECKIN_CHANNEL_ID=your_checkin_channel_id
NOTIFICATION_CHANNEL_ID=your_notification_channel_id
ADMIN_ROLE_ID=role_to_ping_for_redemptions

# OpenRouter API (Required for AI)
OPENROUTER_API_KEY=your_openrouter_api_key
```

### AI Model Configuration

```env
# Chat Model
OPENROUTER_MODEL=deepseek/deepseek-chat
OPENROUTER_MAX_TOKENS=1000
OPENROUTER_TEMPERATURE=0.9

# Embedding Model (for semantic memory)
EMBEDDING_MODEL=openai/text-embedding-3-small

# Image Generation Model
IMAGE_MODEL=bytedance-seed/seedream-4.5

# Memory Extraction Model
EXTRACTION_MODEL=x-ai/grok-4.1-fast
```

### Feature Settings

```env
# Chat
CHAT_COOLDOWN_SECONDS=1
CHAT_MAX_HISTORY=150
CHAT_ENABLED=true

# Memory System
MEMORY_ENABLED=true
MEMORY_AUTO_EXTRACT=true
CHANNEL_CONTEXT_LIMIT=20

# Tools
TOOLS_ENABLED=true
IMAGE_GEN_ENABLED=true

# Jarvis Mode (bebe.blu's user ID)
BEBE_USER_ID=your_bebe_user_id
```

## Commands

### User Commands

| Command | Description | Channel |
|---------|-------------|---------|
| `/checkin` | Daily check-in to earn 1 Bebit | #log-in only |
| `/balance` | Check your Bebits and streak | Any |
| `/leaderboard` | View top 10 users | Any |
| `/shop` | Browse and redeem rewards | Any |
| `/chat` | Talk to Beboa | Any |
| `/summarize` | Summarize channel messages | Any |
| `@Beboa` | Mention Beboa to chat | Any |

### Admin Commands

#### Bebits Management
| Command | Description |
|---------|-------------|
| `/admin bebits add @user <amount>` | Add Bebits to a user |
| `/admin bebits remove @user <amount>` | Remove Bebits from a user |
| `/admin bebits set @user <amount>` | Set a user's Bebits balance |
| `/admin streak reset @user` | Reset a user's streak |
| `/admin stats` | View server statistics |

#### Chat & Notes
| Command | Description |
|---------|-------------|
| `/admin chat clear` | Clear all conversation history |
| `/admin chat status` | View chat feature status |
| `/admin chat viewnote @user` | View notes about a user |
| `/admin chat setnote @user <note>` | Set notes about a user |
| `/admin chat clearnote @user` | Clear notes about a user |

#### Memory System
| Command | Description |
|---------|-------------|
| `/admin memory add @user <content>` | Add a memory about a user |
| `/admin memory search <query>` | Search Beboa's memories |
| `/admin memory status` | View memory system status |

#### Personality System
| Command | Description |
|---------|-------------|
| `/admin personality status` | View current personality state & mood |
| `/admin personality mood <mood>` | Set Beboa's current mood |
| `/admin personality relationship @user` | View relationship with a user |

#### Jarvis Permissions
| Command | Description |
|---------|-------------|
| `/admin jarvis grant @user` | Grant Jarvis-style command permission |
| `/admin jarvis revoke @user` | Revoke Jarvis permission |
| `/admin jarvis commands` | List available Jarvis commands |

#### Tools
| Command | Description |
|---------|-------------|
| `/admin tools` | View registered AI tools |

## AI Evolution System

### Dynamic Personality

Beboa has 14 personality traits that evolve through interactions:

**Big Five Inspired:**
- Openness (curiosity, creativity)
- Conscientiousness (organization vs chaos)
- Extraversion (energy, sociability)
- Agreeableness (warmth beneath snark)
- Neuroticism (emotional reactivity)

**Beboa-Specific:**
- Tsundere Level (defensive about caring)
- Snarkiness (wit and sass)
- Protectiveness (toward community)
- Chaos Energy (unpredictability)
- Wisdom (when to be serious)
- Playfulness (joking and teasing)
- Patience (tolerance for annoyance)
- Competitiveness (drive to win)
- Vulnerability (willingness to show softness)

### Mood System

12 distinct moods that temporarily modify personality expression:

| Mood | Effect | Duration |
|------|--------|----------|
| Neutral | Default state | 60 min |
| Happy | +playfulness, -snarkiness | 45 min |
| Annoyed | +snarkiness, -patience | 30 min |
| Mischievous | +chaos, scheming energy | 40 min |
| Protective | +protectiveness, -tsundere | 60 min |
| Flustered | +tsundere, caught being nice | 20 min |
| Bored | +chaos, needs entertainment | 30 min |
| Energetic | +extraversion, high energy | 35 min |
| Melancholic | +wisdom, thoughtful | 45 min |
| Competitive | Game on mode | 30 min |
| Smug | Feeling superior | 25 min |
| Soft | Rare genuine warmth | 20 min |

### Relationship Stages

Beboa's behavior changes based on familiarity with each user:

| Stage | Familiarity | Behavior |
|-------|-------------|----------|
| Stranger | 0-20% | Sizing them up, default snark |
| Acquaintance | 20-40% | Recognizes them, slightly warmer |
| Regular | 40-60% | Comfortable teasing, remembers things |
| Friend | 60-80% | Genuine care beneath snark, inside jokes |
| Close Friend | 80-95% | Protective, drops act occasionally |
| Family | 95%+ | Would die for them (not that she'd admit it) |

### Semantic Memory

Beboa remembers facts about users through vector embeddings:

- **Auto-extraction** - Automatically detects and stores facts from conversations
- **Semantic search** - Finds relevant memories by meaning, not just keywords
- **Memory types** - Facts, preferences, events, relationships, jokes, lore
- **Natural recall** - References memories naturally in conversation

### Jarvis Mode 2.0

For bebe.blu (server owner), Beboa executes admin commands via natural language with smart intent parsing.

#### Available Commands

**💰 Bebits Management:**
| Command | Examples |
|---------|----------|
| Give bebits | `give @user 100 bebits`, `award @user 50 points`, `bless them with 200` |
| Remove bebits | `take 50 from @user`, `yoink 100 from @user`, `yeet 25 from them` |
| Set bebits | `set @user bebits to 500`, `@user bebits = 100` |
| Transfer | `transfer 100 from @user1 to @user2` |
| Mass give | `award everyone 10 bebits`, `give @user1 @user2 50 each` |

**📊 Info Commands:**
| Command | Examples |
|---------|----------|
| User info | `info @user`, `check @user`, `tell me about @user` |
| Compare users | `compare @user1 vs @user2`, `@user1 versus @user2` |
| Server stats | `server stats`, `how is the server doing` |

**🧠 Memory Commands:**
| Command | Examples |
|---------|----------|
| Add note | `remember that @user loves cats`, `note about @user: allergic to peanuts` |
| Search | `what do you remember about cats`, `recall birthday` |

**🎭 Personality Commands:**
| Command | Examples |
|---------|----------|
| Set mood | `set mood to mischievous`, `beboa be happy` |
| Status | `how are you feeling`, `personality status` |

**🎉 Fun Commands:**
| Command | Examples |
|---------|----------|
| Bonk | `bonk @user`, `send @user to horny jail` |
| Shame | `shame @user`, `expose @user`, `blast @user` |
| Praise | `praise @user`, `hype @user`, `gas up @user` |
| Roast | `roast @user`, `destroy @user`, `drag @user` |
| Simp check | `simp check @user`, `is @user a simp` |
| Crown/Dethrone | `crown @user`, `dethrone @user` |
| Fortune | `fortune @user`, `predict @user's future` |
| Ship | `ship @user1 x @user2`, `compatibility @user1 @user2` |
| Wheel of Fate | `spin wheel for @user`, `wheel of fate @user` |

#### Smart Intent Parsing

Jarvis Mode uses a 5-stage parsing pipeline:

1. **Pattern Matching** - Regex-based exact matching
2. **Intent Analysis** - Keyword scoring with 25+ synonym mappings
3. **Entity Extraction** - Automatic user/amount/text detection
4. **AI Fallback** - Chain-of-thought parsing for complex requests
5. **Context Substitution** - "give them 50 more" uses previous user

**Features:**
- Conversation context (remembers who you were talking about)
- Word number recognition ("fifty" = 50)
- Fuzzy typo tolerance
- Clarification questions when confidence is low
- Synonym support: yoink, yeet, bless, nuke, etc.

## Project Structure

```
beboa-bot/
├── src/
│   ├── index.js              # Entry point
│   ├── config.js             # Environment config
│   ├── database.js           # SQLite database
│   ├── commands/
│   │   ├── checkin.js
│   │   ├── balance.js
│   │   ├── leaderboard.js
│   │   ├── shop.js
│   │   ├── chat.js           # AI chat command
│   │   ├── summarize.js      # Channel summarization
│   │   └── admin.js          # All admin commands
│   ├── handlers/
│   │   ├── commandHandler.js
│   │   ├── buttonHandler.js
│   │   └── messageHandler.js # @mention handler + context
│   ├── migrations/
│   │   ├── runner.js
│   │   ├── index.js
│   │   ├── 001_initial_schema.js
│   │   ├── 002_add_beboa_notes.js
│   │   ├── 003_add_chat_history.js
│   │   ├── 004_add_memory_system.js
│   │   └── 005_add_personality_system.js
│   ├── services/
│   │   ├── openrouter.js     # OpenRouter API client
│   │   ├── embedding.js      # Vector embeddings
│   │   ├── memory.js         # Semantic memory system
│   │   ├── personality.js    # Dynamic personality
│   │   ├── tools.js          # AI tool framework
│   │   ├── channelContext.js # Channel awareness
│   │   └── adminCommands.js  # Jarvis-style commands
│   └── utils/
│       ├── beboa-persona.js  # AI personality & prompts
│       ├── rewards.js
│       ├── messages.js
│       └── time.js
├── data/
│   └── beboa.db              # SQLite database
├── .env.example
├── package.json
└── README.md
```

## Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User data, bebits, streaks, notes |
| `redemptions` | Reward redemption history |
| `chat_history` | Persistent conversation history |
| `semantic_memories` | Long-term memories with embeddings |
| `memory_embeddings` | Vector embeddings for semantic search |
| `tool_usage` | Tool invocation logs |
| `personality_state` | Current personality traits and mood |
| `personality_evolution` | Trait change history |
| `user_relationships` | Per-user relationship data |
| `mood_history` | Mood change history |
| `admin_permissions` | Jarvis permission grants |
| `user_interactions` | Detailed interaction tracking |
| `_migrations` | Applied migrations |

## Reward Tiers

| Reward | Cost |
|--------|------|
| A Bite From Bebe | 1 Bebit |
| Praise From Bebe | 2 Bebits |
| Degradation From Bebe | 5 Bebits |
| Simple Task/Punishment | 25 Bebits |
| Bebe Scam | 50 Bebits |
| Control Toy (5 min) | 100 Bebits |
| Voice Message (1-2 min) | 120 Bebits |
| 15 Minutes of Fame | 150 Bebits |
| Control Toy (15 min) | 200 Bebits |
| Voice Message (5-10 min) | 360 Bebits |
| GF For A Day | 500 Bebits |

## Deployment

### Railway

1. Connect your GitHub repository to Railway
2. Add environment variables in the Railway dashboard
3. Deploy

### VPS / DigitalOcean

```bash
# Clone and setup
git clone https://github.com/CMLKevin/beboa_evo.git
cd beboa_evo
npm install --production

# Use PM2 for process management
npm install -g pm2
pm2 start src/index.js --name beboa
pm2 save
pm2 startup
```

### Backup

```bash
cp data/beboa.db backups/beboa_$(date +%Y%m%d).db
```

## License

ISC
