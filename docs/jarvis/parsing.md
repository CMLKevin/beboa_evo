# Intent Parsing Deep Dive

How Jarvis Mode interprets natural language commands.

## The 5-Stage Pipeline

```
User Input
    │
    ▼
┌─────────────────────┐
│ Stage 1: Patterns   │ ─── Exact match? Execute!
└──────────┬──────────┘
           │ No match
           ▼
┌─────────────────────┐
│ Stage 2: Intent     │ ─── High confidence? Execute!
│    Analysis         │
└──────────┬──────────┘
           │ Low confidence
           ▼
┌─────────────────────┐
│ Stage 3: Entity     │ ─── Extract users, amounts
│    Extraction       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Stage 4: AI         │ ─── AI interprets ambiguous
│    Fallback         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Stage 5: Context    │ ─── Use conversation history
│    Substitution     │
└─────────────────────┘
```

## Stage 1: Pattern Matching

Regex patterns for common command formats:

```javascript
const patterns = {
    give_bebits: [
        /give\s+(?:<@!?)?(\d+)>?\s+(\d+)\s*(?:bebits?|points?)/i,
        /award\s+(?:<@!?)?(\d+)>?\s+(\d+)/i,
        /(?:bless|grant)\s+(?:<@!?)?(\d+)>?\s+(?:with\s+)?(\d+)/i
    ],
    remove_bebits: [
        /(?:remove|take|yoink|deduct)\s+(\d+)\s*(?:bebits?|points?)?\s*from\s+(?:<@!?)?(\d+)>?/i
    ],
    user_info: [
        /(?:user\s*info|info|who\s*is|tell\s*me\s*about)\s+(?:<@!?)?(\d+)>?/i
    ]
    // ... more patterns
};
```

### Pattern Matching Flow

```javascript
function tryPatternMatch(message) {
    for (const [command, patterns] of Object.entries(commandPatterns)) {
        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) {
                return {
                    command,
                    matches: match,
                    confidence: 1.0  // Exact match
                };
            }
        }
    }
    return null;
}
```

## Stage 2: Intent Analysis

Keyword-based scoring for command intent:

```javascript
const intentKeywords = {
    give_bebits: ['give', 'award', 'grant', 'add', 'bless', 'bebits', 'points'],
    remove_bebits: ['remove', 'take', 'deduct', 'yoink', 'steal', 'minus'],
    user_info: ['info', 'about', 'who', 'tell', 'user', 'stats'],
    server_stats: ['server', 'stats', 'statistics', 'overview', 'total'],
    bonk: ['bonk', 'bonked', 'hammer'],
    roast: ['roast', 'burn', 'destroy', 'flame'],
    // ... more commands
};
```

### Scoring Algorithm

```javascript
function analyzeIntent(message) {
    const lower = message.toLowerCase();
    const scores = {};

    for (const [command, keywords] of Object.entries(intentKeywords)) {
        let score = 0;
        for (const keyword of keywords) {
            if (lower.includes(keyword)) {
                // Longer keywords get higher scores
                score += keyword.length;
            }
        }
        if (score > 0) {
            scores[command] = score;
        }
    }

    // Find best match
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
        const [bestCommand, bestScore] = sorted[0];
        const confidence = Math.min(bestScore / 20, 1.0);
        return { command: bestCommand, confidence };
    }

    return { command: null, confidence: 0 };
}
```

### Confidence Thresholds

| Confidence | Action |
|------------|--------|
| > 0.8 | Execute immediately |
| 0.5 - 0.8 | Execute with soft confirmation |
| 0.3 - 0.5 | Try AI fallback |
| < 0.3 | Ask for clarification |

## Stage 3: Entity Extraction

Identify parameters from the message:

```javascript
function extractEntities(message) {
    const entities = {};

    // Extract user mentions
    const userMentions = message.match(/<@!?(\d+)>/g);
    if (userMentions) {
        entities.users = userMentions.map(m => m.replace(/[<@!>]/g, ''));
    }

    // Extract numbers
    const numbers = message.match(/\b\d+\b/g);
    if (numbers) {
        entities.amounts = numbers.map(Number);
    }

    // Extract text in quotes
    const quoted = message.match(/"([^"]+)"/g);
    if (quoted) {
        entities.quoted = quoted.map(q => q.replace(/"/g, ''));
    }

    return entities;
}
```

### Entity Resolution

```javascript
// "give the top person 50 bebits"
async function resolveEntities(entities, context) {
    // Resolve "top person" to actual user
    if (entities.raw?.includes('top')) {
        const leaderboard = await getLeaderboard(1);
        entities.users = [leaderboard[0].userId];
    }

    // Resolve "them" from context
    if (entities.raw?.match(/\b(them|they|that\s+user)\b/i)) {
        if (context.lastMentionedUser) {
            entities.users = [context.lastMentionedUser];
        }
    }

    return entities;
}
```

## Stage 4: AI Fallback

For ambiguous requests, use AI interpretation:

```javascript
async function aiInterpret(message, context) {
    const prompt = `
You are interpreting admin commands for a Discord bot.
Available commands: ${Object.keys(intentKeywords).join(', ')}

User said: "${message}"
Context: ${JSON.stringify(context)}

Return JSON:
{
    "intent": "command_name or null",
    "confidence": 0.0-1.0,
    "parameters": { ... },
    "reasoning": "brief explanation"
}`;

    const response = await callAI(prompt);
    return JSON.parse(response);
}
```

### AI Interpretation Examples

**Input:** "make cooluser rich"
```json
{
    "intent": "give_bebits",
    "confidence": 0.7,
    "parameters": {
        "user": "cooluser",
        "amount": 500
    },
    "reasoning": "'make rich' implies giving a large amount of bebits"
}
```

**Input:** "yeet some points at everyone"
```json
{
    "intent": "mass_give_bebits",
    "confidence": 0.8,
    "parameters": {
        "target": "all",
        "amount": 50
    },
    "reasoning": "'yeet points at' means give, 'everyone' means mass distribution"
}
```

## Stage 5: Context Substitution

Use conversation history for follow-up commands:

```javascript
const conversationContext = {
    lastMentionedUser: null,
    lastAmount: null,
    lastCommand: null,
    lastTimestamp: null
};

function applyContext(command, entities, context) {
    // "give them 50 more" - use last user
    if (!entities.users?.length && context.lastMentionedUser) {
        entities.users = [context.lastMentionedUser];
    }

    // "same amount" - use last amount
    if (command.message?.includes('same amount') && context.lastAmount) {
        entities.amounts = [context.lastAmount];
    }

    // "again" - repeat last command
    if (command.message?.match(/\bagain\b/i) && context.lastCommand) {
        return context.lastCommand;
    }

    return { ...command, entities };
}
```

### Context Flow Example

```
Message 1: "give @user 100 bebits"
→ Context: { lastMentionedUser: @user, lastAmount: 100 }

Message 2: "give them 50 more"
→ Resolves "them" to @user from context
→ Executes: give_bebits(@user, 50)

Message 3: "actually take 25 back"
→ Resolves implicit user from context
→ Executes: remove_bebits(@user, 25)
```

## Debugging Intent Parsing

Enable debug logging:

```javascript
const DEBUG_PARSING = process.env.DEBUG_JARVIS === 'true';

function logParsing(stage, data) {
    if (DEBUG_PARSING) {
        console.log(`[JARVIS:${stage}]`, JSON.stringify(data, null, 2));
    }
}
```

Debug output:
```
[JARVIS:PATTERN] No pattern match
[JARVIS:INTENT] { command: "give_bebits", confidence: 0.65 }
[JARVIS:ENTITIES] { users: ["123456"], amounts: [100] }
[JARVIS:RESOLVED] Executing give_bebits with @User, 100
```

## Customizing the Parser

### Add New Keywords

```javascript
intentKeywords.custom_command = ['custom', 'special', 'my', 'keyword'];
```

### Add New Patterns

```javascript
patterns.custom_command = [
    /do\s+something\s+special\s+for\s+(?:<@!?)?(\d+)>?/i
];
```

### Adjust Confidence Thresholds

```javascript
const CONFIDENCE_THRESHOLD = {
    EXECUTE: 0.8,
    SOFT_CONFIRM: 0.5,
    AI_FALLBACK: 0.3,
    CLARIFY: 0
};
```
