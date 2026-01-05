# Beboa Bot Documentation

> 🐍 An AI-powered Discord companion with evolving personality, semantic memory, and natural language admin commands.

## What is Beboa?

Beboa is a magical talking snake companion for bebe.blu's Discord server (BubbleBebe community). She's the guardian of the HeartB Crystal - a bratty, snarky, secretly caring AI with a dynamic personality that evolves through interactions.

## Key Features

### 🎯 Engagement System
- **Daily Check-ins** - Users earn Bebits currency
- **Streak Tracking** - 72-hour grace period
- **Leaderboard** - Competitive rankings
- **Reward Shop** - 11 reward tiers

### 🧠 AI Evolution
- **14 Personality Traits** - Big Five + custom traits
- **12 Dynamic Moods** - Affect behavior in real-time
- **Relationship Stages** - Stranger → Family progression
- **Semantic Memory** - Vector-based long-term memory
- **Context Awareness** - Sees past 20 messages

### 🎛️ Jarvis Mode 2.0
Natural language admin commands for server owners with:
- 25+ commands across 6 categories
- Smart 5-stage intent parsing
- AI fallback for complex requests
- Conversation context memory

## Quick Links

- [Installation Guide](installation.md)
- [Configuration Reference](configuration.md)
- [Commands Reference](commands/user.md)
- [Jarvis Mode](jarvis/overview.md)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Framework | discord.js v14 |
| Database | SQLite (better-sqlite3) |
| AI | OpenRouter API |
| Embeddings | OpenAI text-embedding-3-small |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Discord Gateway                       │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  Message Handler                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │ Commands    │ │ @Mentions   │ │ Jarvis Mode         ││
│  │ Handler     │ │ Handler     │ │ (Admin NLP)         ││
│  └─────────────┘ └─────────────┘ └─────────────────────┘│
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    Services Layer                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │OpenRouter│ │ Memory   │ │Personality│ │  Tools     │ │
│  │   API    │ │ Service  │ │  System   │ │ Framework  │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              SQLite Database (better-sqlite3)            │
│  users │ memories │ personality │ relationships │ ...   │
└─────────────────────────────────────────────────────────┘
```

## Support

- **GitHub**: [CMLKevin/beboa_evo](https://github.com/CMLKevin/beboa_evo)
- **Issues**: Report bugs or request features on GitHub

---

*Beboa is a cat in a snake costume who INSISTS she's a real snake. This is her one consistent bit.*
