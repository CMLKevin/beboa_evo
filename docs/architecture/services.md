# Services Architecture

Deep dive into the service layer modules.

## Overview

Services contain business logic, separated from Discord event handling.

```
┌────────────────────────────────────────────────────┐
│                   Event Handlers                    │
│         (commands/, events/)                       │
└────────────────────────┬───────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────┐
│                   Services Layer                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ database │ │openrouter│ │   chat   │           │
│  └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  memory  │ │personality│ │  tools   │           │
│  └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────────────────────────────────┐         │
│  │          adminCommands               │         │
│  └──────────────────────────────────────┘         │
└────────────────────────────────────────────────────┘
```

## database.js

SQLite database operations.

### Key Functions

```javascript
// User operations
export function getUser(userId)
export function createUser(userId, username)
export function updateUser(userId, data)
export function deleteUser(userId)

// Bebits operations
export function addBebits(userId, amount)
export function removeBebits(userId, amount)
export function setBebits(userId, amount)
export function transferBebits(fromId, toId, amount)

// Check-in operations
export function performCheckin(userId)
export function getStreak(userId)
export function resetStreak(userId)

// Leaderboard
export function getLeaderboard(limit = 10)
export function getUserRank(userId)

// Relationships
export function getRelationship(userId)
export function updateTrust(userId, delta)
export function setRelationshipStage(userId, stage)
```

### Connection Management

```javascript
import Database from 'better-sqlite3';

const db = new Database('data/beboa.db');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Graceful shutdown
process.on('exit', () => db.close());
```

---

## openrouter.js

OpenRouter API client.

### Key Functions

```javascript
// Chat completion
export async function generateResponse(messages, options = {})

// Embeddings
export async function generateEmbedding(text)

// Image generation
export async function generateImage(prompt, options = {})
```

### API Call Structure

```javascript
export async function generateResponse(messages, options = {}) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/CMLKevin/beboa_evo',
            'X-Title': 'Beboa Discord Bot'
        },
        body: JSON.stringify({
            model: options.model || process.env.OPENROUTER_MODEL,
            messages,
            max_tokens: options.maxTokens || parseInt(process.env.OPENROUTER_MAX_TOKENS),
            temperature: options.temperature || parseFloat(process.env.OPENROUTER_TEMPERATURE),
            tools: options.tools || undefined
        })
    });

    return response.json();
}
```

---

## chat.js

Chat processing and context management.

### Key Functions

```javascript
// Main chat handler
export async function handleChat(message, context = {})

// Context building
export async function buildContext(userId, channelId)

// History management
export function addToHistory(userId, role, content)
export function getHistory(userId, limit)
export function clearHistory(userId)
```

### Chat Processing Flow

```javascript
export async function handleChat(message, context = {}) {
    const userId = message.author.id;

    // 1. Check cooldown
    if (isOnCooldown(userId)) {
        return message.reply("Slow down!");
    }

    // 2. Build context
    const chatContext = await buildContext(userId, message.channel.id);

    // 3. Get personality/mood
    const personality = await getPersonality();
    const mood = await getCurrentMood();

    // 4. Retrieve relevant memories
    const memories = await searchMemories(userId, message.content, 5);

    // 5. Build messages array
    const messages = [
        { role: 'system', content: buildSystemPrompt(personality, mood, memories) },
        ...chatContext.history,
        { role: 'user', content: message.content }
    ];

    // 6. Generate response
    const response = await generateResponse(messages, {
        tools: getEnabledTools()
    });

    // 7. Handle tool calls if present
    if (response.choices[0].message.tool_calls) {
        await handleToolCalls(response, message);
    }

    // 8. Send response
    await message.reply(response.choices[0].message.content);

    // 9. Post-process (memory extraction, mood update)
    await postProcess(userId, message.content, response);
}
```

---

## memory.js

Semantic memory system.

### Key Functions

```javascript
// Memory CRUD
export async function addMemory(userId, content, type, importance)
export async function getMemories(userId, limit)
export async function searchMemories(userId, query, limit)
export async function deleteMemory(memoryId)

// Embedding operations
export async function generateEmbedding(text)
export function cosineSimilarity(a, b)

// Auto-extraction
export async function extractMemories(userId, conversation)
```

### Semantic Search

```javascript
export async function searchMemories(userId, query, limit = 5) {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Get all user memories
    const memories = db.prepare(`
        SELECT * FROM memories
        WHERE user_id = ?
    `).all(userId);

    // Compute similarities
    const scored = memories.map(memory => ({
        ...memory,
        embedding: deserializeEmbedding(memory.embedding),
        similarity: cosineSimilarity(queryEmbedding, deserializeEmbedding(memory.embedding))
    }));

    // Filter and sort
    return scored
        .filter(m => m.similarity >= 0.7)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
}
```

---

## personality.js

Personality and mood management.

### Key Functions

```javascript
// Personality
export async function getPersonality()
export async function updateTrait(trait, value)
export async function resetPersonality()
export async function evolveTrait(trait, delta)

// Mood
export async function getCurrentMood()
export async function setMood(mood, intensity)
export async function shiftMood(mood, amount)

// Relationships
export async function getRelationshipStage(userId)
export async function updateRelationship(userId, interaction)
```

### Trait Evolution

```javascript
export async function evolveTrait(trait, delta) {
    const current = await getPersonality();
    let newValue = current[trait] + delta;

    // Clamp between 0.1 and 0.9
    newValue = Math.max(0.1, Math.min(0.9, newValue));

    db.prepare(`
        UPDATE personality SET ${trait} = ?, last_updated = ?
        WHERE id = 1
    `).run(newValue, new Date().toISOString());

    return newValue;
}
```

---

## tools.js

Tool call framework.

### Key Functions

```javascript
// Tool definitions
export function getToolDefinitions()
export function getEnabledTools()

// Tool execution
export async function executeToolCall(name, args)
export async function handleToolCalls(response, message)
```

### Tool Registry

```javascript
const toolRegistry = {
    generate_image: {
        definition: { /* JSON Schema */ },
        handler: handleImageGeneration,
        enabled: () => process.env.IMAGE_GEN_ENABLED === 'true'
    },
    roll_dice: {
        definition: { /* JSON Schema */ },
        handler: handleDiceRoll,
        enabled: () => true
    }
    // Add more tools here
};

export function getEnabledTools() {
    return Object.values(toolRegistry)
        .filter(tool => tool.enabled())
        .map(tool => tool.definition);
}
```

---

## adminCommands.js

Jarvis Mode implementation.

### Key Functions

```javascript
// Main entry point
export async function parseAndExecuteAdminCommand(message, context)

// Parsing stages
export function tryPatternMatch(message)
export function analyzeIntent(message)
export function extractEntities(message)
export async function aiInterpret(message, context)

// Command execution
export async function executeCommand(command, params, context)

// Utilities
export function getAvailableAdminCommands()
export function isConfirmationPending(userId)
```

### Command Registration

```javascript
const commands = {
    give_bebits: {
        patterns: [/* regex patterns */],
        keywords: ['give', 'award', 'grant', 'add', 'bless'],
        execute: async (params, context) => {
            const { target, amount } = params;
            await addBebits(target, amount);
            return `Gave ${amount} bebits to <@${target}>!`;
        },
        requiresConfirmation: (params) => params.amount > 500
    },
    // ... more commands
};
```

---

## Service Dependencies

```
database.js         (standalone - no dependencies)
       ↑
       │
openrouter.js       (standalone - no dependencies)
       ↑
       │
┌──────┴──────┐
│             │
memory.js     personality.js
    ↑              ↑
    │              │
    └──────┬───────┘
           │
        chat.js
           ↑
           │
    adminCommands.js
```

## Best Practices

1. **Keep services focused** - One responsibility per module
2. **Avoid circular dependencies** - Use dependency injection if needed
3. **Handle errors gracefully** - Return meaningful error objects
4. **Log important operations** - For debugging and monitoring
5. **Use transactions** - For multi-table operations
