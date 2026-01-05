# Relationship Tracking

Beboa tracks individual relationships with each user, affecting how she interacts with them.

## Relationship Stages

Users progress through 6 stages:

| Stage | Trust Range | Behavior |
|-------|-------------|----------|
| `stranger` | 0-15 | Suspicious, minimal engagement |
| `acquaintance` | 16-35 | Basic responses, still guarded |
| `familiar` | 36-55 | More comfortable, occasional warmth |
| `friend` | 56-75 | Genuine engagement, teasing affection |
| `close_friend` | 76-90 | High trust, protective, caring moments |
| `family` | 91-100 | Maximum bond, rare true affection shown |

## Trust Mechanics

### Gaining Trust

| Action | Trust Gained |
|--------|--------------|
| Regular check-in | +0.5 |
| Positive conversation | +1-2 |
| Consistent interaction | +0.25/day |
| Being kind to others | +1 |
| Defending Beboa | +3 |

### Losing Trust

| Action | Trust Lost |
|--------|------------|
| Being rude | -2 |
| Insulting Beboa | -5 |
| Long absence | -0.5/week |
| Being mean to others | -1 |

## Relationship Effects

### On Response Style

**Stranger:**
> "And you are...? I don't recall asking for your opinion."

**Friend:**
> "Ugh, it's you again. I SUPPOSE I can help... but only because you're not completely insufferable."

**Family:**
> "Hey! There you are! I was... I mean, I WASN'T waiting for you or anything! ...how was your day?"

### On Available Interactions

| Feature | Stranger | Friend | Family |
|---------|----------|--------|--------|
| Basic chat | ✅ | ✅ | ✅ |
| Detailed help | ❌ | ✅ | ✅ |
| Personal questions | ❌ | Partial | ✅ |
| Caring moments | ❌ | Rare | Occasional |
| Jarvis Mode | ❌ | ❌ | Admin only |

## Viewing Relationships

### User Info Command
```
/userinfo @user
```

Shows trust level and relationship stage.

### Jarvis Mode
```
"how does beboa feel about @user"
"what's @user's relationship status"
"user info for @user"
```

## Database Schema

```sql
CREATE TABLE relationships (
    user_id TEXT PRIMARY KEY,
    trust_level REAL DEFAULT 10,
    relationship_stage TEXT DEFAULT 'stranger',
    total_interactions INTEGER DEFAULT 0,
    positive_interactions INTEGER DEFAULT 0,
    negative_interactions INTEGER DEFAULT 0,
    first_interaction TEXT,
    last_interaction TEXT,
    notes TEXT
);
```

## Relationship in Context

The system prompt includes relationship data:

```javascript
const relationshipContext = `
Your relationship with ${username}:
- Trust Level: ${trustLevel}/100
- Stage: ${relationshipStage}
- Total Interactions: ${totalInteractions}
- You've known them since: ${firstInteraction}

Adjust your warmth level accordingly:
- Strangers get suspicion and minimal engagement
- Friends get teasing affection and real help
- Family gets rare moments of genuine care
`;
```

## Trust Decay

Trust slowly decays with inactivity:

```javascript
// Weekly decay calculation
const daysSinceLastInteraction = getDaysSince(lastInteraction);
if (daysSinceLastInteraction > 7) {
    const weeksInactive = Math.floor(daysSinceLastInteraction / 7);
    trustLevel -= weeksInactive * 0.5;
    trustLevel = Math.max(trustLevel, 5); // Never below 5
}
```

## Special Relationships

### Bebe (Owner)
Configured via `BEBE_USER_ID` - has Jarvis Mode access and maximum trust by default.

### Admins
Can view all relationships but don't automatically get trust bonuses.

### New Users
Start at trust level 10 (stranger stage).

## Manual Adjustment

### Via Jarvis Mode
```
"set @user trust to 50"
"@user is now a friend"
"reset @user's relationship"
```

### Via Code
```javascript
import { setTrustLevel, setRelationshipStage } from './services/database.js';

await setTrustLevel(userId, 75);
await setRelationshipStage(userId, 'close_friend');
```

## Relationship Events

### Milestone Notifications

When a user reaches a new stage, Beboa may acknowledge it:

**Stranger → Acquaintance:**
> "Hmph. I guess you're not going away. Fine, I'll remember your name... maybe."

**Friend → Close Friend:**
> "Look, I'm NOT saying I like having you around, but... don't disappear, okay? It's not like I'd miss you or anything!"

## Best Practices

1. **Reward consistency** - Regular users should feel recognized
2. **Make trust meaningful** - Don't give trust boosts too freely
3. **Use stage transitions** - Great moments for personality
4. **Balance decay** - Don't punish reasonable absences harshly
