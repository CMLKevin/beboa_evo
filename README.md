# Beboa Bot

A Discord loyalty/engagement bot for BubbleBebe's community server. Beboa is a sadistic snake companion who tracks daily check-ins, awards "Bebits" currency, and allows users to redeem rewards.

## Features

- **Daily Check-ins** - Users earn 1 Bebit per day with `/checkin`
- **Streak System** - 72-hour grace period to maintain streaks (cosmetic only)
- **Leaderboard** - Top 10 users ranked by Bebits
- **Reward Shop** - 11 reward tiers from 1 to 500 Bebits
- **Admin Tools** - Add/remove/set Bebits, reset streaks, view stats

## Quick Start

### Prerequisites

- Node.js 20 or higher
- A Discord bot application with a token

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd beboa-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your Discord credentials:
   ```env
   DISCORD_TOKEN=your_bot_token
   CLIENT_ID=your_application_client_id
   GUILD_ID=your_server_id
   CHECKIN_CHANNEL_ID=your_checkin_channel_id
   NOTIFICATION_CHANNEL_ID=your_notification_channel_id
   ADMIN_ROLE_ID=role_to_ping_for_redemptions
   ```

4. Start the bot:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

### Getting Discord IDs

1. Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
2. Right-click on channels, roles, or the server to copy their IDs

### Bot Permissions

When inviting the bot, ensure it has these permissions:
- Send Messages
- Use Application Commands
- Embed Links
- Mention Everyone (for pinging the admin role)

Invite URL format:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2147485696&scope=bot%20applications.commands
```

## Commands

### User Commands

| Command | Description | Channel |
|---------|-------------|---------|
| `/checkin` | Daily check-in to earn 1 Bebit | #log-in only |
| `/balance` | Check your Bebits and streak | Any |
| `/leaderboard` | View top 10 users | Any |
| `/shop` | Browse and redeem rewards | Any |

### Admin Commands

| Command | Description |
|---------|-------------|
| `/admin bebits add @user <amount>` | Add Bebits to a user |
| `/admin bebits remove @user <amount>` | Remove Bebits from a user |
| `/admin bebits set @user <amount>` | Set a user's Bebits balance |
| `/admin streak reset @user` | Reset a user's streak |
| `/admin stats` | View server statistics |

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

## Mechanics

### Check-in Rules

- **Cooldown:** 24 hours between check-ins
- **Grace Period:** 72 hours to maintain streak
- **Bebits on Reset:** Kept (only streak resets)

### Streak Logic

| Time Since Last Check-in | Result |
|--------------------------|--------|
| < 24 hours | Cooldown - wait |
| 24-72 hours | Streak continues (+1) |
| > 72 hours | Streak resets to 1 |

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
│   │   └── admin.js
│   ├── handlers/
│   │   ├── commandHandler.js
│   │   └── buttonHandler.js
│   └── utils/
│       ├── rewards.js
│       ├── messages.js
│       └── time.js
├── data/
│   └── beboa.db              # SQLite database (created at runtime)
├── .env
├── .env.example
├── package.json
└── README.md
```

## Database

The bot uses SQLite stored in `data/beboa.db`. The database is created automatically on first run.

### Backup

To backup the database:
```bash
cp data/beboa.db backups/beboa_$(date +%Y%m%d).db
```

### Tables

- `users` - User data (bebits, streak, check-ins)
- `redemptions` - Reward redemption history

## Deployment

### Railway

1. Connect your GitHub repository to Railway
2. Add environment variables in the Railway dashboard
3. Deploy

### VPS / DigitalOcean

1. Clone the repository to your server
2. Install Node.js 20+
3. Run `npm install --production`
4. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start src/index.js --name beboa
   pm2 save
   pm2 startup
   ```

## License

ISC
