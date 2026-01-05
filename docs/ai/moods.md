# Mood System

Beboa has 12 distinct moods that affect her responses in real-time.

## The 12 Moods

| Mood | Emoji | Behavior |
|------|-------|----------|
| `neutral` | 😐 | Default balanced state |
| `happy` | 😊 | More friendly, less sarcastic |
| `excited` | 🎉 | Energetic, uses exclamations |
| `mischievous` | 😈 | Extra teasing, pranky |
| `annoyed` | 😤 | Short responses, more sarcasm |
| `sleepy` | 😴 | Lazy, minimal effort responses |
| `curious` | 🤔 | Asks questions, explores topics |
| `affectionate` | 💕 | Rare caring moments slip through |
| `dramatic` | 🎭 | Over-the-top reactions |
| `grumpy` | 😾 | Complains, reluctant to help |
| `playful` | 🎮 | Game-focused, competitive |
| `protective` | 🛡️ | Defensive of users she likes |

## Mood Transitions

Moods shift based on:

### Conversation Content
```javascript
// Keywords trigger mood shifts
if (message.includes('game') || message.includes('play')) {
    shiftMood('playful', 0.3);
}
if (message.includes('thank')) {
    shiftMood('happy', 0.2);
}
if (message.includes('shut up') || message.includes('stupid')) {
    shiftMood('annoyed', 0.5);
}
```

### Time of Day
```javascript
const hour = new Date().getHours();
if (hour >= 23 || hour < 6) {
    shiftMood('sleepy', 0.4);
}
```

### Interaction Patterns
- Lots of activity → excited
- Long silence → sleepy or grumpy
- Positive interactions → happy
- Negative interactions → annoyed

### Random Drift
Small random mood shifts prevent stagnation:
```javascript
// 10% chance each message to drift slightly
if (Math.random() < 0.1) {
    const moods = ['mischievous', 'curious', 'playful'];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    shiftMood(randomMood, 0.1);
}
```

## Mood Effects on Responses

### Happy
> "Oh! You actually had a good idea for once! ...I mean, it's acceptable. Fine. Whatever."

### Annoyed
> "What. Do. You. Want."

### Sleepy
> "zzz... huh? oh... you want something... *yawns* ...fine..."

### Mischievous
> "Oh you want help? How about I help you... HELP YOURSELF! Hehehehe~ 🐍"

### Affectionate (rare)
> "You know I... I don't HATE having you around. That's all I'm saying! Don't make it weird!"

## Mood in System Prompt

```javascript
const moodContext = `
Current mood: ${currentMood} ${moodEmoji}
This affects your responses:
- ${getMoodDescription(currentMood)}
- Adjust your tone accordingly
- This mood may shift during conversation
`;
```

## Viewing Current Mood

### Via Jarvis Mode
```
"what mood is beboa in"
"how's beboa feeling"
"beboa's mood"
```

### Via Code
```javascript
import { getCurrentMood } from './services/personality.js';
const mood = await getCurrentMood();
console.log(`Current mood: ${mood.name} ${mood.emoji}`);
```

## Setting Mood Manually

### Via Jarvis Mode
```
"set mood to happy"
"make beboa sleepy"
"beboa should be mischievous"
```

### Via Code
```javascript
import { setMood } from './services/personality.js';
await setMood('mischievous');
```

## Database Schema

```sql
CREATE TABLE mood_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    current_mood TEXT DEFAULT 'neutral',
    mood_intensity REAL DEFAULT 0.5,
    last_changed TEXT,
    trigger_reason TEXT
);

CREATE TABLE mood_history (
    id INTEGER PRIMARY KEY,
    mood TEXT,
    intensity REAL,
    trigger TEXT,
    timestamp TEXT
);
```

## Mood Intensity

Moods have intensity (0.0-1.0):

| Intensity | Effect |
|-----------|--------|
| 0.0-0.3 | Slight influence |
| 0.3-0.6 | Moderate influence |
| 0.6-0.8 | Strong influence |
| 0.8-1.0 | Dominant behavior |

High intensity means the mood strongly affects responses. Low intensity is subtle.

## Natural Decay

Moods naturally decay toward neutral:
```javascript
// Every 30 minutes
moodIntensity *= 0.9;
if (moodIntensity < 0.2) {
    currentMood = 'neutral';
}
```

## Best Practices

1. **Let moods flow** - Don't force specific moods too often
2. **Use for events** - Set excited for announcements, etc.
3. **Monitor extremes** - Constant annoyed mood hurts engagement
4. **Enjoy the chaos** - Mood shifts create organic personality
