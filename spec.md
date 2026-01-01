# Beboa Bot v2 - Technical Specification

## Overview

Beboa is a Discord loyalty/engagement bot for BubbleBebe's community server. It tracks daily check-ins, awards "Bebits" currency, and allows users to redeem rewards. The bot persona is a sadistic snake companion named Beboa.

**Key Design Philosophy:** Simple, persistent, crash-resistant. All data syncs to database so streaks/bebits survive bot restarts.

---

## Tech Stack

- **Runtime:** Node.js 20+
- **Discord Library:** discord.js v14
- **Database:** SQLite3 (via better-sqlite3 for sync operations)
- **Command Style:** Slash commands exclusively

### Why This Stack
- discord.js v14 is mature, well-documented, handles slash commands natively
- SQLite requires no external services, single file backup, perfect for small-medium communities
- better-sqlite3 is synchronous which simplifies the mental model for simple CRUD operations

---

## Database Schema

```sql
CREATE TABLE users (
    discord_id TEXT PRIMARY KEY,
    bebits INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    last_checkin TEXT,  -- ISO8601 timestamp
    total_checkins INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT NOT NULL,
    reward_id TEXT NOT NULL,
    reward_name TEXT NOT NULL,
    cost INTEGER NOT NULL,
    redeemed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discord_id) REFERENCES users(discord_id)
);

CREATE INDEX idx_users_bebits ON users(bebits DESC);
CREATE INDEX idx_users_streak ON users(current_streak DESC);
CREATE INDEX idx_redemptions_user ON redemptions(discord_id);
```

---

## Core Mechanics

### Bebit Earning

- **Rate:** 1 Bebit per successful check-in
- **Frequency:** Once per 24-hour period
- **No multipliers:** Streak does NOT affect earning rate
- **Admin override:** Admins can manually add/remove Bebits

### Streak System

The streak is **cosmetic only** - it's for bragging rights and leaderboard flex, not for earning more Bebits.

**Streak Logic:**
```
current_time = now()
time_since_last = current_time - last_checkin

if time_since_last < 24 hours:
    → "Already checked in today! Come back in X hours."
    
elif time_since_last <= 72 hours:
    → Streak continues (+1)
    → Award 1 Bebit
    → "Streak recovered! You're on a {streak} day streak!"
    
else (time_since_last > 72 hours):
    → Streak resets to 1
    → Bebits are KEPT (not reset)
    → Award 1 Bebit
    → "Your streak reset, but your {bebits} Bebits are safe!"
```

**Important:** When streak resets, Bebits balance is untouched. Users only lose bragging rights, not currency.

---

## Slash Commands

### User Commands

#### `/checkin`
**Description:** Daily check-in to earn 1 Bebit
**Allowed Channels:** `#log-in` only
**Cooldown:** 24 hours per user
**Response:** Ephemeral initially, then public confirmation

**Response Scenarios:**

*Success (streak continues):*
```
🐍 Sssalutations, {username}! Beboa has marked your presence...

+1 Bebit earned!
Current Balance: {bebits} Bebits
Streak: {streak} days 🔥

Hehehe... another day closer to your rewards, little mortal~
```

*Success (streak recovered within 72h):*
```
🐍 Hisss... cutting it close, aren't we {username}?

Beboa will let it slide THIS time. Your streak lives... barely.

+1 Bebit earned!
Current Balance: {bebits} Bebits  
Streak: {streak} days (recovered!)

Don't test my patience again~ 🐍
```

*Success (streak reset):*
```
🐍 Oh my, oh my... look who finally remembered Beboa exists!

Your streak of {old_streak} days has turned to dust. Pathetic~
But Beboa is feeling generous... your {bebits} Bebits remain.

+1 Bebit earned!
Current Balance: {bebits} Bebits
Streak: 1 day (reset)

Start crawling again, little one~ 🐍
```

*Already checked in:*
```
🐍 Patience, greedy one!

You've already claimed your Bebit today. 
Come back in {hours}h {minutes}m.

Current Balance: {bebits} Bebits
Streak: {streak} days

Beboa doesn't do charity~ 🐍
```

---

#### `/balance`
**Description:** Check your Bebits balance and streak
**Allowed Channels:** Any
**Response:** Ephemeral

```
🐍 *Beboa checks the ledger*

Bebits: {bebits}
Streak: {streak} days
Total Check-ins: {total_checkins}

{conditional_message}
```

Conditional messages based on balance:
- 0-10: "Just getting started? How adorable~"
- 11-50: "Hm, showing some dedication I see..."
- 51-100: "Beboa is mildly impressed. Mildly."
- 101-200: "Oho~ Someone's been a good little pet!"
- 201-500: "Now THIS is commitment! Bebe will be pleased~"
- 500+: "...You actually did it. Beboa bows to your obsession. 🐍"

---

#### `/leaderboard`
**Description:** View top users by Bebits
**Allowed Channels:** Any
**Response:** Public embed

```
🐍 BEBOA'S LEADERBOARD OF DEVOTION 🐍

🥇 {user1} - {bebits} Bebits ({streak} day streak)
🥈 {user2} - {bebits} Bebits ({streak} day streak)  
🥉 {user3} - {bebits} Bebits ({streak} day streak)
4. {user4} - {bebits} Bebits
5. {user5} - {bebits} Bebits
6. {user6} - {bebits} Bebits
7. {user7} - {bebits} Bebits
8. {user8} - {bebits} Bebits
9. {user9} - {bebits} Bebits
10. {user10} - {bebits} Bebits

Your Rank: #{rank} with {your_bebits} Bebits

Who will prove their devotion to Bebe? Hehehehe~ 🐍
```

---

#### `/shop`
**Description:** View available rewards and redeem
**Allowed Channels:** Any channel (but notifications go to #beboas-command-center)
**Response:** Interactive embed with buttons

**Initial Display:**
```
🐍 BEBOA'S REWARD EMPORIUM 🐍

⚠️ DISCLAIMER: PLEASE READ THE GUIDE OF WHAT YOU GET WITH EACH REWARD! 
So that it's clear to you! You get what you get..... no refunds ⚠️

Your Balance: {bebits} Bebits

━━━━━━━━━━━━━━━━━━━━━━━━

🦷 A Bite From Bebe — 1 Bebit
✨ Praise From Bebe — 2 Bebits
😈 Degradation From Bebe — 5 Bebits
📋 Simple Task/Punishment — 25 Bebits
🎰 Bebe Scam — 50 Bebits
🎮 Control Toy (5 min) — 100 Bebits
🎤 Voice Message (1-2 min) — 120 Bebits
⭐ 15 Minutes of Fame — 150 Bebits
🎮 Control Toy (15 min) — 200 Bebits
🎤 Voice Message (5-10 min) — 360 Bebits
💕 GF For A Day — 500 Bebits

━━━━━━━━━━━━━━━━━━━━━━━━

Select a reward below to redeem~
```

**Buttons:** One button per reward tier, disabled if user lacks funds

**Confirmation Flow:**
When user clicks a reward button:
```
🐍 Confirm Redemption?

You are about to redeem:
{reward_name} for {cost} Bebits

Your balance after: {remaining} Bebits

This action cannot be undone!
```
[Confirm] [Cancel]

---

### Admin Commands

#### `/admin bebits add`
**Options:** 
- `user` (User, required): Target user
- `amount` (Integer, required): Bebits to add
**Permissions:** Administrator only
**Response:** Ephemeral to admin

```
✅ Added {amount} Bebits to {user}
New balance: {new_balance} Bebits
```

---

#### `/admin bebits remove`
**Options:**
- `user` (User, required): Target user  
- `amount` (Integer, required): Bebits to remove
**Permissions:** Administrator only
**Response:** Ephemeral to admin

```
✅ Removed {amount} Bebits from {user}
New balance: {new_balance} Bebits
```

---

#### `/admin bebits set`
**Options:**
- `user` (User, required): Target user
- `amount` (Integer, required): New Bebit balance
**Permissions:** Administrator only
**Response:** Ephemeral to admin

```
✅ Set {user}'s balance to {amount} Bebits
Previous balance: {old_balance} Bebits
```

---

#### `/admin streak reset`
**Options:**
- `user` (User, required): Target user
**Permissions:** Administrator only
**Response:** Ephemeral to admin

```
✅ Reset {user}'s streak to 0
Previous streak: {old_streak} days
(Bebits untouched: {bebits})
```

---

#### `/admin stats`
**Permissions:** Administrator only
**Response:** Ephemeral embed

```
📊 BEBOA SERVER STATISTICS

Total Users: {count}
Total Bebits in Circulation: {sum}
Total Redemptions: {redemption_count}

Top Earner: {user} ({bebits} Bebits)
Longest Streak: {user} ({streak} days)

Redemption Breakdown:
- Bites: {count}
- Praise: {count}
- Degradation: {count}
...etc
```

---

## Reward Redemption System

### Reward Definitions

```javascript
const REWARDS = [
    {
        id: 'bite',
        name: 'A Bite From Bebe',
        cost: 1,
        emoji: '🦷',
        notification: '@bebebebebebe a reward has been claimed by {user}! Time to bite them brutally!'
    },
    {
        id: 'praise', 
        name: 'Praise From Bebe',
        cost: 2,
        emoji: '✨',
        notification: '@bebebebebebe a reward has been claimed by {user}! Aww this puppy wants to be praised!'
    },
    {
        id: 'degrade',
        name: 'Degradation From Bebe', 
        cost: 5,
        emoji: '😈',
        notification: "@bebebebebebe a reward has been claimed by {user}! Time to degrade them! Hehe don't hold back on this loser, Bebe!"
    },
    {
        id: 'task',
        name: 'Simple Task/Punishment',
        cost: 25,
        emoji: '📋',
        notification: '@bebebebebebe a reward has been claimed by {user}! Hahaha this doggy wants a treat, I wonder what you will come up with, Bebe!'
    },
    {
        id: 'scam',
        name: 'Bebe Scam',
        cost: 50,
        emoji: '🎰',
        description: 'You get nothing, get scammed, nerd.... I will laugh at you super hard',
        notification: '@bebebebebebe a reward has been claimed by {user}! HAHAHAHA BEBE LOOK! THIS DORK JUST WASTED THEIR TIME!!! AHAHAHA!!!'
    },
    {
        id: 'toy_5',
        name: 'Control Toy (5 min)',
        cost: 100,
        emoji: '🎮',
        notification: '@bebebebebebe a reward has been claimed by {user}! Ohh wow...A very patient one... Hehe I hope you enjoy, Bebe!'
    },
    {
        id: 'voice_short',
        name: 'Voice Message (1-2 min)',
        cost: 120,
        emoji: '🎤',
        notification: '@bebebebebebe a reward has been claimed by {user}! Heheh not bad, dork! I am even impressed! Bebe! Look!'
    },
    {
        id: 'fame',
        name: '15 Minutes of Fame',
        cost: 150,
        emoji: '⭐',
        notification: "@bebebebebebe a reward has been claimed by {user}! Tsk...attention from Bebe!? Yeah..yeah whatever... I guess you earned it, dork...."
    },
    {
        id: 'toy_15',
        name: 'Control Toy (15 min)',
        cost: 200,
        emoji: '🎮',
        notification: '@bebebebebebe a reward has been claimed by {user}! 15 minutes with Bebe\'s toy!?!? WHAT??!?!?'
    },
    {
        id: 'voice_long',
        name: 'Voice Message (5-10 min)',
        cost: 360,
        emoji: '🎤',
        notification: "@bebebebebebe a reward has been claimed by {user}! 5 more days and you spent a whole year on this.....do you have anything else to do with your life? AHAHA you earned it! Bebe! You have a really loyal pet here!"
    },
    {
        id: 'gf_day',
        name: 'GF For A Day',
        cost: 500,
        emoji: '💕',
        notification: '@bebebebebebe a reward has been claimed by {user}! CODE RED!! I REPEAT!!! BEBE....WE HAVE CODE RED!!! WAKE UP!!!! THIS NERD ALMOST SPENT TWO YEARS TO BE YOUR DOG!!!! HOLY SHIT!!!'
    }
];
```

### Redemption Flow

1. User clicks reward button in `/shop`
2. Bot checks if user has sufficient Bebits
3. Confirmation modal appears
4. On confirm:
   - Deduct Bebits from user balance
   - Log redemption to `redemptions` table
   - Send notification to `#beboas-command-center`
   - Send confirmation to user (ephemeral)

### Notification Format (to #beboas-command-center)

```
━━━━━━━━━━━━━━━━━━━━━━━━
🐍 REWARD CLAIMED 🐍
━━━━━━━━━━━━━━━━━━━━━━━━

{custom_notification_message}

Reward: {reward_name}
Cost: {cost} Bebits
User: {user_mention} ({user_tag})
Remaining Balance: {new_balance} Bebits

━━━━━━━━━━━━━━━━━━━━━━━━
```

The `@bebebebebebe` mention should ping her actual admin role.

---

## Channel Configuration

The bot needs channel IDs configured in environment:

```env
DISCORD_TOKEN=xxx
GUILD_ID=xxx
CHECKIN_CHANNEL_ID=xxx          # #log-in
NOTIFICATION_CHANNEL_ID=xxx      # #beboas-command-center  
ADMIN_ROLE_ID=xxx               # Role to ping for redemptions
```

### Channel Restrictions

| Command | Allowed Channels | Response Visibility |
|---------|------------------|---------------------|
| `/checkin` | #log-in only | Public |
| `/balance` | Any | Ephemeral |
| `/leaderboard` | Any | Public |
| `/shop` | Any | Ephemeral (notifications go to #beboas-command-center) |
| `/admin *` | Any | Ephemeral |

---

## Beboa Personality Guide

Beboa is Bebe's sadistic snake companion. Personality traits:

- **Tone:** Playful cruelty, teasing, condescending affection
- **Speech patterns:** Uses "~" at end of sentences, "Hehehe", "Hisss", snake puns
- **Attitude toward users:** Treats them as "pets", "mortals", "little ones"
- **Loyalty:** Utterly devoted to Bebe, always refers users back to her
- **Catchphrases:** 
  - "Sssalutations~"
  - "Beboa sees all~"
  - "Don't test my patience~"
  - "How adorable~"
  - "Pathetic, but entertaining~"

All bot responses should be written in Beboa's voice.

---

## Project Structure

```
beboa-bot/
├── src/
│   ├── index.js              # Entry point, client setup
│   ├── database.js           # SQLite setup and queries
│   ├── commands/
│   │   ├── checkin.js
│   │   ├── balance.js
│   │   ├── leaderboard.js
│   │   ├── shop.js
│   │   └── admin.js
│   ├── handlers/
│   │   ├── commandHandler.js
│   │   └── buttonHandler.js
│   ├── utils/
│   │   ├── rewards.js        # Reward definitions
│   │   ├── messages.js       # Beboa response templates
│   │   └── time.js           # Time calculation helpers
│   └── config.js             # Environment config
├── data/
│   └── beboa.db              # SQLite database file
├── .env
├── .env.example
├── package.json
└── README.md
```

---

## Error Handling

### User-Facing Errors

All errors should maintain Beboa's personality:

**Database Error:**
```
🐍 Hisss... something went wrong in Beboa's lair.

Try again in a moment, little one. If this persists, 
poke the mortals in charge~
```

**Insufficient Bebits:**
```
🐍 Oh? Trying to buy what you can't afford?

You need {cost} Bebits but only have {balance}.
Keep checking in, greedy one~
```

**Wrong Channel:**
```
🐍 Not here, foolish mortal!

Use this command in {correct_channel}.
Beboa has rules~
```

### Logging

- Log all transactions to console with timestamps
- Log errors with full stack traces
- Consider adding a simple log file rotation for production

---

## Deployment Notes

### Development
```bash
npm install
cp .env.example .env
# Fill in .env values
npm run dev  # nodemon for hot reload
```

### Production
```bash
npm install --production
npm start
```

### Recommended Hosting
- Railway.app (free tier works, auto-restart)
- DigitalOcean droplet ($4-6/mo)
- Any VPS with Node.js 20+

### Database Backup
SQLite file at `data/beboa.db` - recommend daily backup via cron:
```bash
cp data/beboa.db backups/beboa_$(date +%Y%m%d).db
```

---

## Future Enhancement Ideas (Not in MVP)

- [ ] Weekly/monthly leaderboard snapshots
- [ ] Bebit decay for very long inactivity (>30 days)
- [ ] Special event double-Bebit days
- [ ] Streak milestones with bonus Bebits
- [ ] Trade Bebits between users
- [ ] Gacha/random reward option
- [ ] Integration with other server leveling bots

---

## MVP Checklist

### Phase 1: Core
- [ ] Project setup (Node, discord.js, SQLite)
- [ ] Database schema creation
- [ ] Bot login and basic event handling
- [ ] Slash command registration

### Phase 2: Check-in System
- [ ] `/checkin` command
- [ ] 24-hour cooldown logic
- [ ] 72-hour grace period logic
- [ ] Streak tracking
- [ ] Channel restriction to #log-in

### Phase 3: User Commands
- [ ] `/balance` command
- [ ] `/leaderboard` command

### Phase 4: Shop System
- [ ] `/shop` command with interactive buttons
- [ ] Confirmation flow
- [ ] Bebit deduction
- [ ] Notification to #beboas-command-center
- [ ] Redemption logging

### Phase 5: Admin
- [ ] `/admin bebits add`
- [ ] `/admin bebits remove`
- [ ] `/admin bebits set`
- [ ] `/admin streak reset`
- [ ] `/admin stats`

### Phase 6: Polish
- [ ] All Beboa personality messages
- [ ] Error handling with personality
- [ ] Testing with alt account
- [ ] Documentation/README

---

## Quick Reference

| Mechanic | Value |
|----------|-------|
| Bebits per check-in | 1 |
| Check-in cooldown | 24 hours |
| Streak grace period | 72 hours |
| Streak affects earnings? | No (cosmetic only) |
| Bebits reset on streak loss? | No |
| Max reward cost | 500 Bebits |
| Min reward cost | 1 Bebit |
